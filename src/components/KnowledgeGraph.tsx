import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import {
  GraphData,
  GraphNode,
  Entity,
  Relation,
  EntityType,
  analyzeDocument,
  buildGraphData,
  getEntityColor
} from '../utils/knowledgeGraph';

interface Markdown {
  id: number;
  title: string;
  content: string;
}

interface KnowledgeGraphProps {
  markdowns: Markdown[];
  selectedDocId: string | null;
  onNodeClick?: (node: GraphNode) => void;
}

const ENTITY_TYPE_LABELS: Record<EntityType, string> = {
  [EntityType.Person]: '人物',
  [EntityType.Organization]: '组织',
  [EntityType.Location]: '地点',
  [EntityType.Concept]: '概念',
  [EntityType.Event]: '事件',
  [EntityType.Date]: '日期',
  [EntityType.Unknown]: '未知'
};

const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({
  markdowns,
  selectedDocId,
  onNodeClick
}) => {
  const graphRef = useRef<any>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [entities, setEntities] = useState<Entity[]>([]);
  const [relations, setRelations] = useState<Relation[]>([]);
  const [hoverNode, setHoverNode] = useState<GraphNode | null>(null);
  const [filterType, setFilterType] = useState<EntityType | 'all'>('all');
  const [showLabels, setShowLabels] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    let allEntities: Entity[] = [];
    let allRelations: Relation[] = [];

    for (const md of markdowns) {
      if (md.content && md.content.length > 10) {
        const docId = `doc-${md.id}`;
        const result = analyzeDocument(md.content, docId, allEntities, allRelations);
        allEntities = result.entities;
        allRelations = result.relations;
      }
    }

    setEntities(allEntities);
    setRelations(allRelations);
  }, [markdowns]);

  useEffect(() => {
    let filteredEntities = entities;
    let filteredRelations = relations;

    if (selectedDocId) {
      filteredEntities = entities.filter(e => e.documentIds.includes(selectedDocId));
      const entityIds = new Set(filteredEntities.map(e => e.id));
      filteredRelations = relations.filter(
        r => entityIds.has(r.sourceId) && entityIds.has(r.targetId)
      );
    }

    if (filterType !== 'all') {
      filteredEntities = filteredEntities.filter(e => e.type === filterType);
      const entityIds = new Set(filteredEntities.map(e => e.id));
      filteredRelations = filteredRelations.filter(
        r => entityIds.has(r.sourceId) && entityIds.has(r.targetId)
      );
    }

    if (searchTerm) {
      filteredEntities = filteredEntities.filter(e =>
        e.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const entityIds = new Set(filteredEntities.map(e => e.id));
      filteredRelations = filteredRelations.filter(
        r => entityIds.has(r.sourceId) && entityIds.has(r.targetId)
      );
    }

    const data = buildGraphData(filteredEntities, filteredRelations);
    setGraphData(data);
  }, [entities, relations, selectedDocId, filterType, searchTerm]);

  const handleNodeClick = useCallback((node: any) => {
    if (onNodeClick) {
      onNodeClick(node);
    }
  }, [onNodeClick]);

  const handleNodeHover = useCallback((node: any) => {
    setHoverNode(node);
    if (graphRef.current) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const size = node.val * 2;
    const fontSize = 12 / globalScale;

    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = node.color;
    ctx.fill();

    if (hoverNode === node) {
      ctx.strokeStyle = '#333';
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    if (showLabels && globalScale > 0.5) {
      ctx.fillStyle = '#333';
      ctx.font = `${fontSize}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText(node.name, node.x, node.y + size + 2);
    }
  }, [hoverNode, showLabels]);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D) => {
    const start = link.source;
    const end = link.target;

    if (!start || !end || !start.x || !end.x) return;

    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = 'rgba(100, 100, 100, 0.3)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }, []);

  const stats = useMemo(() => {
    const typeCounts: Record<EntityType, number> = {
      [EntityType.Person]: 0,
      [EntityType.Organization]: 0,
      [EntityType.Location]: 0,
      [EntityType.Concept]: 0,
      [EntityType.Event]: 0,
      [EntityType.Date]: 0,
      [EntityType.Unknown]: 0
    };

    for (const entity of entities) {
      typeCounts[entity.type]++;
    }

    return typeCounts;
  }, [entities]);

  return (
    <div className="knowledge-graph-container">
      <div className="graph-controls">
        <div className="control-group">
          <input
            type="text"
            placeholder="搜索实体..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>

        <div className="control-group">
          <label>过滤类型:</label>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as EntityType | 'all')}
            className="filter-select"
          >
            <option value="all">全部</option>
            {Object.entries(ENTITY_TYPE_LABELS).map(([type, label]) => (
              <option key={type} value={type}>{label}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label>
            <input
              type="checkbox"
              checked={showLabels}
              onChange={(e) => setShowLabels(e.target.checked)}
            />
            显示标签
          </label>
        </div>
      </div>

      <div className="graph-stats">
        {Object.entries(stats).map(([type, count]) => (
          count > 0 && (
            <span
              key={type}
              className="stat-item"
              style={{ backgroundColor: getEntityColor(type as EntityType) }}
            >
              {ENTITY_TYPE_LABELS[type as EntityType]}: {count}
            </span>
          )
        ))}
      </div>

      <div className="graph-canvas">
        {graphData.nodes.length > 0 ? (
          <ForceGraph2D
            ref={graphRef}
            graphData={graphData}
            nodeCanvasObject={paintNode}
            linkCanvasObject={paintLink}
            onNodeClick={handleNodeClick}
            onNodeHover={handleNodeHover}
            nodeRelSize={6}
            linkDirectionalParticles={2}
            linkDirectionalParticleWidth={1}
            d3AlphaDecay={0.02}
            d3VelocityDecay={0.3}
            warmupTicks={100}
            cooldownTicks={100}
          />
        ) : (
          <div className="no-data">
            <p>暂无数据</p>
            <p>请先创建并编辑文档，系统将自动分析并生成知识图谱</p>
          </div>
        )}
      </div>

      {hoverNode && (
        <div className="node-tooltip">
          <h4>{hoverNode.name}</h4>
          <p>类型: {ENTITY_TYPE_LABELS[hoverNode.type]}</p>
          <p>出现次数: {hoverNode.val}</p>
          <p>文档数: {hoverNode.documentIds.length}</p>
        </div>
      )}
    </div>
  );
};

export default KnowledgeGraph;
