export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  documentIds: string[];
  frequency: number;
}

export interface Relation {
  id: string;
  sourceId: string;
  targetId: string;
  type: RelationType;
  documentId: string;
  context?: string;
}

export interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

export interface GraphNode {
  id: string;
  name: string;
  type: EntityType;
  val: number;
  color: string;
  documentIds: string[];
}

export interface GraphLink {
  source: string;
  target: string;
  type: RelationType;
  context?: string;
}

export enum EntityType {
  Person = 'Person',
  Organization = 'Organization',
  Location = 'Location',
  Concept = 'Concept',
  Event = 'Event',
  Date = 'Date',
  Unknown = 'Unknown'
}

export enum RelationType {
  Related = 'Related',
  PartOf = 'PartOf',
  HasProperty = 'HasProperty',
  Causes = 'Causes',
  Created = 'Created',
  Located = 'Located',
  Participated = 'Participated',
  Similar = 'Similar',
  Opposite = 'Opposite'
}

const ENTITY_COLORS: Record<EntityType, string> = {
  [EntityType.Person]: '#FF6B6B',
  [EntityType.Organization]: '#4ECDC4',
  [EntityType.Location]: '#45B7D1',
  [EntityType.Concept]: '#96CEB4',
  [EntityType.Event]: '#FFEAA7',
  [EntityType.Date]: '#DDA0DD',
  [EntityType.Unknown]: '#CCCCCC'
};

export function getEntityColor(type: EntityType): string {
  return ENTITY_COLORS[type] || ENTITY_COLORS[EntityType.Unknown];
}

const CHINESE_PERSON_PATTERNS = [
  /[\u4e00-\u9fa5]{2,4}(?=说|道|认为|表示|指出|强调|提到|发现|发明|创造|建立|创建)/g,
  /(?<=作者|学者|教授|博士|先生|女士|老师|专家)[\u4e00-\u9fa5]{2,4}/g,
];

const CHINESE_ORG_PATTERNS = [
  /[\u4e00-\u9fa5]+(公司|集团|企业|机构|大学|学院|研究所|研究院|医院|政府|部门|组织|协会|学会|银行|基金)/g,
];

const CHINESE_LOCATION_PATTERNS = [
  /[\u4e00-\u9fa5]+(省|市|县|区|镇|村|岛|山|河|湖|海|洋|洲|国|地区)/g,
  /(?<=位于|在|来自|前往|到达|去|到|离开|回到|来自|出生于|居住于|生活在)[\u4e00-\u9fa5]{2,10}/g,
  /[\u4e00-\u9fa5]{2,10}(?=地区|一带|附近|周边|境内)/g,
];

const COMMON_LOCATIONS = [
  '北京', '上海', '广州', '深圳', '杭州', '南京', '苏州', '成都', '重庆', '武汉',
  '西安', '天津', '青岛', '大连', '厦门', '宁波', '无锡', '长沙', '郑州', '济南',
  '福州', '哈尔滨', '沈阳', '长春', '昆明', '贵阳', '南宁', '海口', '兰州', '银川',
  '西宁', '乌鲁木齐', '拉萨', '呼和浩特', '石家庄', '太原', '合肥', '南昌', '台北',
  '香港', '澳门', '中国', '美国', '日本', '韩国', '英国', '法国', '德国', '意大利',
  '俄罗斯', '加拿大', '澳大利亚', '巴西', '印度', '新加坡', '泰国', '越南', '马来西亚',
  '长城', '故宫', '天坛', '颐和园', '圆明园', '兵马俑', '敦煌', '泰山', '华山', '黄山',
  '峨眉山', '九寨沟', '张家界', '桂林', '丽江', '三亚', '西湖', '太湖', '洞庭湖', '鄱阳湖',
  '长江', '黄河', '珠江', '松花江', '淮河', '汉江', '湘江', '赣江', '闽江', '钱塘江',
];

const CHINESE_DATE_PATTERNS = [
  /\d{4}年\d{1,2}月\d{1,2}日/g,
  /\d{4}年\d{1,2}月/g,
  /\d{1,2}月\d{1,2}日/g,
];

const CHINESE_EVENT_PATTERNS = [
  /[\u4e00-\u9fa5]+(会议|大会|活动|比赛|战争|革命|运动|事件|事故|灾难|发明|发现)/g,
];

const CONCEPT_PATTERNS = [
  /[\u4e00-\u9fa5]{2,8}(?=理论|概念|原理|方法|技术|模式|系统|框架|模型)/g,
  /(?<=理论|概念|原理|方法|技术|模式|系统|框架|模型)[\u4e00-\u9fa5]{2,8}/g,
];

const KEYWORD_PATTERNS: Record<EntityType, RegExp[]> = {
  [EntityType.Person]: CHINESE_PERSON_PATTERNS,
  [EntityType.Organization]: CHINESE_ORG_PATTERNS,
  [EntityType.Location]: CHINESE_LOCATION_PATTERNS,
  [EntityType.Date]: CHINESE_DATE_PATTERNS,
  [EntityType.Event]: CHINESE_EVENT_PATTERNS,
  [EntityType.Concept]: CONCEPT_PATTERNS,
  [EntityType.Unknown]: [],
};

export function extractEntities(text: string, documentId: string): Entity[] {
  const entityMap = new Map<string, Entity>();

  for (const [type, patterns] of Object.entries(KEYWORD_PATTERNS)) {
    for (const pattern of patterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const name = match[0].trim();
        if (name.length < 2 || name.length > 20) continue;

        const entityId = `${type}-${name}`;
        const existing = entityMap.get(entityId);

        if (existing) {
          existing.frequency++;
          if (!existing.documentIds.includes(documentId)) {
            existing.documentIds.push(documentId);
          }
        } else {
          entityMap.set(entityId, {
            id: entityId,
            name,
            type: type as EntityType,
            documentIds: [documentId],
            frequency: 1
          });
        }
      }
    }
  }

  for (const location of COMMON_LOCATIONS) {
    if (text.includes(location)) {
      const entityId = `${EntityType.Location}-${location}`;
      const existing = entityMap.get(entityId);

      if (existing) {
        existing.frequency++;
        if (!existing.documentIds.includes(documentId)) {
          existing.documentIds.push(documentId);
        }
      } else {
        entityMap.set(entityId, {
          id: entityId,
          name: location,
          type: EntityType.Location,
          documentIds: [documentId],
          frequency: 1
        });
      }
    }
  }

  return Array.from(entityMap.values());
}

const RELATION_KEYWORDS: Record<RelationType, string[]> = {
  [RelationType.PartOf]: ['属于', '包含', '组成', '部分', '成员'],
  [RelationType.HasProperty]: ['具有', '拥有', '特点是', '特征是', '属性'],
  [RelationType.Causes]: ['导致', '引起', '造成', '产生', '引发'],
  [RelationType.Created]: ['创建', '建立', '发明', '发现', '提出'],
  [RelationType.Located]: ['位于', '在', '存在于', '地点'],
  [RelationType.Participated]: ['参与', '参加', '出席', '加入'],
  [RelationType.Similar]: ['相似', '类似', '相同', '一样', '同等'],
  [RelationType.Opposite]: ['相反', '对立', '矛盾', '不同'],
  [RelationType.Related]: ['相关', '关联', '联系', '关系'],
};

export function extractRelations(
  text: string,
  entities: Entity[],
  documentId: string
): Relation[] {
  const relations: Relation[] = [];
  const sentences = text.split(/[。！？；\n]+/);
  
  console.log('extractRelations - text length:', text.length, 'sentences:', sentences.length, 'entities:', entities.length);

  for (const sentence of sentences) {
    if (sentence.trim().length < 2) continue;
    
    const sentenceEntities = entities.filter(e =>
      sentence.includes(e.name) && e.documentIds.includes(documentId)
    );

    if (sentenceEntities.length >= 2) {
      console.log('Found sentence with', sentenceEntities.length, 'entities:', sentence.substring(0, 50));
    }

    if (sentenceEntities.length < 2) continue;

    for (let i = 0; i < sentenceEntities.length; i++) {
      for (let j = i + 1; j < sentenceEntities.length; j++) {
        const source = sentenceEntities[i];
        const target = sentenceEntities[j];

        let relationType = RelationType.Related;
        for (const [type, keywords] of Object.entries(RELATION_KEYWORDS)) {
          if (keywords.some(kw => sentence.includes(kw))) {
            relationType = type as RelationType;
            break;
          }
        }

        const relationId = `${source.id}-${relationType}-${target.id}-${documentId}`;
        
        console.log('Creating relation:', source.name, '->', target.name, 'type:', relationType);

        relations.push({
          id: relationId,
          sourceId: source.id,
          targetId: target.id,
          type: relationType,
          documentId,
          context: sentence.substring(0, 100)
        });
      }
    }
  }
  
  console.log('Total relations extracted:', relations.length);

  return relations;
}

export function buildGraphData(
  entities: Entity[],
  relations: Relation[]
): GraphData {
  const nodes: GraphNode[] = entities.map(entity => ({
    id: entity.id,
    name: entity.name,
    type: entity.type,
    val: Math.sqrt(entity.frequency) * 2 + 3,
    color: getEntityColor(entity.type),
    documentIds: entity.documentIds
  }));

  const links: GraphLink[] = relations.map(relation => ({
    source: relation.sourceId,
    target: relation.targetId,
    type: relation.type,
    context: relation.context
  }));

  return { nodes, links };
}

export function mergeEntities(existingEntities: Entity[], newEntities: Entity[]): Entity[] {
  const entityMap = new Map<string, Entity>();

  for (const entity of existingEntities) {
    entityMap.set(entity.id, { ...entity });
  }

  for (const entity of newEntities) {
    const existing = entityMap.get(entity.id);
    if (existing) {
      existing.frequency += entity.frequency;
      for (const docId of entity.documentIds) {
        if (!existing.documentIds.includes(docId)) {
          existing.documentIds.push(docId);
        }
      }
    } else {
      entityMap.set(entity.id, { ...entity });
    }
  }

  return Array.from(entityMap.values());
}

export function mergeRelations(existingRelations: Relation[], newRelations: Relation[]): Relation[] {
  const relationMap = new Map<string, Relation>();

  for (const relation of existingRelations) {
    relationMap.set(relation.id, { ...relation });
  }

  for (const relation of newRelations) {
    if (!relationMap.has(relation.id)) {
      relationMap.set(relation.id, { ...relation });
    }
  }

  return Array.from(relationMap.values());
}

export function analyzeDocument(
  content: string,
  documentId: string,
  existingEntities: Entity[] = [],
  existingRelations: Relation[] = []
): { entities: Entity[]; relations: Relation[] } {
  const textContent = extractTextContent(content);

  const newEntities = extractEntities(textContent, documentId);
  const entities = mergeEntities(existingEntities, newEntities);

  const newRelations = extractRelations(textContent, entities, documentId);
  const relations = mergeRelations(existingRelations, newRelations);

  return { entities, relations };
}

function extractTextContent(content: string): string {
  try {
    const snapshot = JSON.parse(content);
    return extractTextFromSnapshot(snapshot);
  } catch {
    return content;
  }
}

function extractTextFromSnapshot(snapshot: any): string {
  const texts: string[] = [];

  function extractFromBlock(block: any) {
    if (block.props?.text?.['$blocksuite:internal:text$']) {
      const delta = block.props.text.delta;
      if (Array.isArray(delta)) {
        for (const d of delta) {
          if (d.insert) {
            texts.push(d.insert);
          }
        }
      }
    }

    if (block.props?.title?.['$blocksuite:internal:text$']) {
      const delta = block.props.title.delta;
      if (Array.isArray(delta)) {
        for (const d of delta) {
          if (d.insert) {
            texts.push(d.insert);
          }
        }
      }
    }

    if (Array.isArray(block.children)) {
      for (const child of block.children) {
        extractFromBlock(child);
      }
    }
  }

  if (snapshot.blocks) {
    extractFromBlock(snapshot.blocks);
  }

  return texts.join(' ');
}
