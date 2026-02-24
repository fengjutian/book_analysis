import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import ForceGraph3D from 'react-force-graph-3d';
import SpriteText from 'three-spritetext';
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

// 辅助函数：调整颜色亮度
const adjustColor = (color: string, amount: number): string => {
  // 处理十六进制颜色（带或不带alpha）
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    let r, g, b, a = 255;
    
    if (hex.length === 6) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
    } else if (hex.length === 8) {
      r = parseInt(hex.slice(0, 2), 16);
      g = parseInt(hex.slice(2, 4), 16);
      b = parseInt(hex.slice(4, 6), 16);
      a = parseInt(hex.slice(6, 8), 16);
    } else if (hex.length === 3) {
      r = parseInt(hex[0] + hex[0], 16);
      g = parseInt(hex[1] + hex[1], 16);
      b = parseInt(hex[2] + hex[2], 16);
    } else {
      return color;
    }
    
    r = Math.max(0, Math.min(255, r + amount));
    g = Math.max(0, Math.min(255, g + amount));
    b = Math.max(0, Math.min(255, b + amount));
    
    const rHex = r.toString(16).padStart(2, '0');
    const gHex = g.toString(16).padStart(2, '0');
    const bHex = b.toString(16).padStart(2, '0');
    const aHex = a.toString(16).padStart(2, '0');
    
    return hex.length === 8 ? `#${rHex}${gHex}${bHex}${aHex}` : `#${rHex}${gHex}${bHex}`;
  }
  return color;
};

// 辅助函数：为十六进制颜色添加透明度
const addAlpha = (color: string, alpha: number): string => {
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    let r, g, b;
    
    if (hex.length === 6) {
      r = hex.slice(0, 2);
      g = hex.slice(2, 4);
      b = hex.slice(4, 6);
    } else if (hex.length === 3) {
      r = hex[0] + hex[0];
      g = hex[1] + hex[1];
      b = hex[2] + hex[2];
    } else {
      return color;
    }
    
    const aHex = Math.round(alpha * 255).toString(16).padStart(2, '0');
    return `#${r}${g}${b}${aHex}`;
  }
  return color;
};

// Canvas roundRect polyfill
if (!CanvasRenderingContext2D.prototype.roundRect) {
  CanvasRenderingContext2D.prototype.roundRect = function(x: number, y: number, w: number, h: number, r: number) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    this.beginPath();
    this.moveTo(x + r, y);
    this.arcTo(x + w, y, x + w, y + h, r);
    this.arcTo(x + w, y + h, x, y + h, r);
    this.arcTo(x, y + h, x, y, r);
    this.arcTo(x, y, x + w, y, r);
    this.closePath();
    return this;
  };
}

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

type ViewMode = '2d' | '3d';

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
  const [viewMode, setViewMode] = useState<ViewMode>('2d');

  useEffect(() => {
    let allEntities: Entity[] = [];
    let allRelations: Relation[] = [];

    for (const md of markdowns) {
      if (md.content && md.content.length > 10) {
        const docId = `doc-${md.id}`;
        const result = analyzeDocument(md.content, docId, allEntities, allRelations);
        allEntities = result.entities;
        allRelations = result.relations;
        console.log('Analyzed doc:', docId, 'entities:', result.entities.length, 'relations:', result.relations.length);
      }
    }

    console.log('Total entities:', allEntities.length, 'Total relations:', allRelations.length);
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
    if (graphRef.current && node && typeof node.x === 'number' && typeof node.y === 'number' && isFinite(node.x) && isFinite(node.y)) {
      graphRef.current.centerAt(node.x, node.y, 1000);
      graphRef.current.zoom(2, 1000);
    }
  }, []);

  const paintNode = useCallback((node: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    // 检查节点坐标是否有效
    if (typeof node.x !== 'number' || typeof node.y !== 'number' || !isFinite(node.x) || !isFinite(node.y)) {
      return;
    }
    
    // 确保globalScale为正数
    const safeGlobalScale = globalScale > 0 ? globalScale : 1;
    
    const size = Math.max(2, (node.val || 1) * 2); // 最小大小为2
    const fontSize = 12 / safeGlobalScale;
    const isHovered = hoverNode === node;
    const nodeColor = node.color || '#94a3b8';

    // 检查size是否有效
    if (!isFinite(size) || size <= 0) {
      return;
    }
    
    // 创建节点渐变背景
    const gradient = ctx.createRadialGradient(
      node.x - size * 0.3,
      node.y - size * 0.3,
      0,
      node.x,
      node.y,
      size
    );
    gradient.addColorStop(0, nodeColor);
    gradient.addColorStop(1, adjustColor(nodeColor, -30));

    // 绘制节点阴影
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = isHovered ? 15 : 8;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = isHovered ? 4 : 2;

    // 绘制节点主体
    ctx.beginPath();
    ctx.arc(node.x, node.y, size, 0, 2 * Math.PI);
    ctx.fillStyle = gradient;
    ctx.fill();

    // 绘制节点边框
    if (isHovered) {
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 2.5;
      ctx.stroke();
      
      // 内发光效果
      ctx.beginPath();
      ctx.arc(node.x, node.y, size - 1, 0, 2 * Math.PI);
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 绘制标签
    if (showLabels && safeGlobalScale > 0.5) {
      ctx.fillStyle = isHovered ? '#1e293b' : '#334155';
      ctx.font = `${fontSize}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      // 标签背景
      if (isHovered) {
        const textWidth = ctx.measureText(node.name).width;
        const padding = 6;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(
          node.x - textWidth / 2 - padding,
          node.y + size + 2 - padding / 2,
          textWidth + padding * 2,
          fontSize + padding,
          6
        );
        ctx.fill();
        ctx.fillStyle = '#1e293b';
      }
      
      ctx.fillText(node.name, node.x, node.y + size + 2);
    }
  }, [hoverNode, showLabels]);

  const paintLink = useCallback((link: any, ctx: CanvasRenderingContext2D, globalScale: number) => {
    const start = link.source;
    const end = link.target;

    // 检查节点坐标是否有效
    if (!start || !end || 
        typeof start.x !== 'number' || typeof start.y !== 'number' || 
        typeof end.x !== 'number' || typeof end.y !== 'number' ||
        !isFinite(start.x) || !isFinite(start.y) || 
        !isFinite(end.x) || !isFinite(end.y)) {
      return;
    }

    const isHovered = hoverNode && (hoverNode.id === start.id || hoverNode.id === end.id);
    const linkWidth = isHovered ? 3.5 : 1.8;
    const alpha = isHovered ? 0.9 : 0.6;

    // 创建链接渐变
    const gradient = ctx.createLinearGradient(start.x, start.y, end.x, end.y);
    const startColor = start.color || '#94a3b8';
    const endColor = end.color || '#cbd5e1';
    gradient.addColorStop(0, addAlpha(adjustColor(startColor, 20), alpha));
    gradient.addColorStop(1, addAlpha(adjustColor(endColor, 20), alpha));

    // 绘制链接阴影
    if (isHovered) {
      ctx.shadowColor = 'rgba(59, 130, 246, 0.5)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 0;
      ctx.shadowOffsetY = 0;
    }

    // 绘制链接线
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.strokeStyle = gradient;
    ctx.lineWidth = linkWidth;
    ctx.lineCap = 'round';
    ctx.stroke();

    // 重置阴影
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;

    // 绘制链接箭头（在较大缩放级别时）
    if (globalScale > 0.7) {
      const dx = end.x - start.x;
      const dy = end.y - start.y;
      const length = Math.sqrt(dx * dx + dy * dy);
      if (length > 0 && isFinite(length)) {
        const unitX = dx / length;
        const unitY = dy / length;
        const arrowLength = 8 / globalScale;
        const arrowWidth = 6 / globalScale;
        
        // 箭头位置（从终点向起点偏移一点）
        const arrowX = end.x - unitX * ((end.val || 1) * 2 + 5);
        const arrowY = end.y - unitY * ((end.val || 1) * 2 + 5);
        
        // 检查箭头坐标是否有效
        if (isFinite(arrowX) && isFinite(arrowY)) {
          // 绘制箭头
          ctx.beginPath();
          ctx.moveTo(arrowX, arrowY);
          ctx.lineTo(
            arrowX - unitX * arrowLength + unitY * arrowWidth,
            arrowY - unitY * arrowLength - unitX * arrowWidth
          );
          ctx.lineTo(
            arrowX - unitX * arrowLength - unitY * arrowWidth,
            arrowY - unitY * arrowLength + unitX * arrowWidth
          );
          ctx.closePath();
          
          ctx.fillStyle = isHovered ? '#3b82f6' : '#94a3b8';
          ctx.fill();
        }
      }
    }

    // 绘制链接类型标签（在较大缩放级别时）
    if (globalScale > 1.2 && link.type && link.type !== 'Related') {
      const midX = (start.x + end.x) / 2;
      const midY = (start.y + end.y) / 2;
      
      // 检查中点坐标是否有效
      if (isFinite(midX) && isFinite(midY)) {
        // 标签背景
        const label = link.type;
        ctx.font = `${10 / globalScale}px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif`;
        const textWidth = ctx.measureText(label).width;
        const padding = 4 / globalScale;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.beginPath();
        ctx.roundRect(
          midX - textWidth / 2 - padding,
          midY - (10 / globalScale) / 2 - padding,
          textWidth + padding * 2,
          10 / globalScale + padding * 2,
          4 / globalScale
        );
        ctx.fill();
        
        // 标签文字
        ctx.fillStyle = isHovered ? '#1e293b' : '#475569';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, midX, midY);
      }
    }
  }, [hoverNode]);

  const handleNodeClick3D = useCallback((node: any) => {
    if (!node) return;
    if (onNodeClick) {
      onNodeClick(node);
    }
    if (graphRef.current && 
        typeof node.x === 'number' && typeof node.y === 'number' && typeof node.z === 'number' &&
        isFinite(node.x) && isFinite(node.y) && isFinite(node.z)) {
      const distance = 120;
      const hypot = Math.hypot(node.x, node.y, node.z);
      if (isFinite(hypot) && hypot !== 0) {
        const distRatio = 1 + distance / hypot;
        graphRef.current.cameraPosition(
          { x: node.x * distRatio, y: node.y * distRatio, z: node.z * distRatio },
          node,
          2000
        );
      }
    }
  }, [onNodeClick]);

  const render3DNode = useCallback((node: any) => {
    const sprite = new SpriteText(node.name || '');
    sprite.color = '#1e293b'; // 深色文字提高可读性
    sprite.textHeight = 7;
    sprite.backgroundColor = addAlpha(node.color || '#94a3b8', 0.85);
    sprite.padding = 6;
    sprite.borderRadius = 8;
    sprite.borderColor = '#ffffff';
    sprite.borderWidth = 1;
    sprite.fontFace = '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, sans-serif';
    sprite.fontWeight = '600';
    sprite.textAlign = 'center';
    
    return sprite;
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

        <div className="control-group view-toggle">
          <button
            className={`toggle-btn ${viewMode === '2d' ? 'active' : ''}`}
            onClick={() => setViewMode('2d')}
          >
            2D
          </button>
          <button
            className={`toggle-btn ${viewMode === '3d' ? 'active' : ''}`}
            onClick={() => setViewMode('3d')}
          >
            3D
          </button>
        </div>

        {viewMode === '2d' && (
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
        )}
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
          viewMode === '2d' ? (
            <ForceGraph2D
              ref={graphRef}
              graphData={graphData}
              nodeCanvasObject={paintNode}
              linkCanvasObject={paintLink}
              onNodeClick={handleNodeClick}
              onNodeHover={handleNodeHover}
              nodeRelSize={6}
              linkDirectionalArrowLength={4}
              linkDirectionalArrowRelPos={1}
              linkDirectionalArrowColor={() => '#94a3b8'}
              linkCurvature={0.1}
              d3AlphaDecay={0.02}
              d3VelocityDecay={0.3}
              warmupTicks={100}
              cooldownTicks={100}
            />
          ) : (
            <ForceGraph3D
              ref={graphRef}
              graphData={graphData}
              nodeThreeObject={render3DNode}
              onNodeClick={handleNodeClick3D}
              nodeRelSize={8}
              linkWidth={link => link.type === 'Related' ? 1.5 : 2}
              linkOpacity={0.7}
              linkColor={link => {
                const sourceColor = link.source.color || '#94a3b8';
                const targetColor = link.target.color || '#cbd5e1';
                return addAlpha(adjustColor(sourceColor, 20), 0.7);
              }}
              linkDirectionalParticles={3}
              linkDirectionalParticleWidth={1.2}
              linkDirectionalParticleColor={link => link.source.color || '#3b82f6'}
              linkDirectionalParticleSpeed={0.005}
              backgroundColor="#f8fafc"
              showNavInfo={false}
              d3AlphaDecay={0.025}
              d3VelocityDecay={0.4}
              warmupTicks={120}
              cooldownTicks={120}
            />
          )
        ) : (
          <div className="no-data">
            <p>暂无数据</p>
            <p>请先创建并编辑文档，系统将自动分析并生成知识图谱</p>
          </div>
        )}
      </div>

      {hoverNode && viewMode === '2d' && (
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
