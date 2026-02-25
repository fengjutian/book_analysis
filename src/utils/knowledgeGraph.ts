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
  /[\u4e00-\u9fa5]{2,4}(?=说|道|认为|表示|指出|强调|提到|发现|发明|创造|建立|创建|提出|研究|分析)/g,
  /(?<=作者|学者|教授|博士|先生|女士|老师|专家|经理|总监|总裁|董事长)[\u4e00-\u9fa5]{2,4}/g,
];

const CHINESE_ORG_PATTERNS = [
  /[\u4e00-\u9fa5]{2,10}(公司|集团|企业|机构|大学|学院|研究所|研究院|医院|政府|部门|组织|协会|学会|银行|基金|中心|实验室)/g,
];

const CHINESE_LOCATION_PATTERNS = [
  /[\u4e00-\u9fa5]{2,10}(省|市|县|区|镇|村|岛|山|河|湖|海|洋|洲|国|地区|半岛|高原|盆地|平原)/g,
  /(?<=位于|在|来自|前往|到达|去|到|离开|回到|出生于|居住于|生活在|前往|访问)[\u4e00-\u9fa5]{2,10}/g,
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
  '佛山', '东莞', '常州', '温州', '泉州', '南通', '徐州', '潍坊', '绍兴', '嘉兴',
  '墨西哥', '西班牙', '荷兰', '瑞士', '瑞典', '挪威', '丹麦', '芬兰', '波兰', '希腊',
  '庐山', '武夷山', '黄果树瀑布', '青海湖', '纳木错', '喀纳斯湖', '天山', '昆仑山', '祁连山', '大兴安岭',
  '亚马逊河', '尼罗河', '密西西比河', '多瑙河', '莱茵河', '泰晤士河', '塞纳河', '伏尔加河', '恒河', '湄公河',
  // 更多中国城市
  '唐山', '秦皇岛', '邯郸', '邢台', '保定', '张家口', '承德', '沧州', '廊坊', '衡水',
  '大同', '阳泉', '长治', '晋城', '朔州', '晋中', '运城', '忻州', '临汾', '吕梁',
  '鞍山', '抚顺', '本溪', '丹东', '锦州', '营口', '阜新', '辽阳', '盘锦', '铁岭', '朝阳', '葫芦岛',
  '吉林', '四平', '辽源', '通化', '白山', '松原', '白城', '延边',
  '齐齐哈尔', '鸡西', '鹤岗', '双鸭山', '大庆', '伊春', '佳木斯', '七台河', '牡丹江', '黑河', '绥化', '大兴安岭地区',
  '徐州', '连云港', '淮安', '盐城', '扬州', '镇江', '泰州', '宿迁',
  '湖州', '金华', '衢州', '舟山', '台州', '丽水',
  '芜湖', '蚌埠', '淮南', '马鞍山', '淮北', '铜陵', '安庆', '黄山', '滁州', '阜阳', '宿州', '六安', '亳州', '池州', '宣城',
  '莆田', '三明', '漳州', '南平', '龙岩', '宁德',
  '景德镇', '萍乡', '九江', '新余', '鹰潭', '赣州', '吉安', '宜春', '抚州', '上饶',
  '枣庄', '东营', '烟台', '潍坊', '济宁', '泰安', '威海', '日照', '莱芜', '临沂', '德州', '聊城', '滨州', '菏泽',
  '洛阳', '平顶山', '安阳', '鹤壁', '新乡', '焦作', '濮阳', '许昌', '漯河', '三门峡', '南阳', '商丘', '信阳', '周口', '驻马店',
  '黄石', '十堰', '宜昌', '襄阳', '鄂州', '荆门', '孝感', '荆州', '黄冈', '咸宁', '随州', '恩施',
  '株洲', '湘潭', '衡阳', '邵阳', '岳阳', '常德', '张家界', '益阳', '郴州', '永州', '怀化', '娄底', '湘西',
  '韶关', '珠海', '汕头', '佛山', '江门', '湛江', '茂名', '肇庆', '惠州', '梅州', '汕尾', '河源', '阳江', '清远', '东莞', '中山', '潮州', '揭阳', '云浮',
  '柳州', '桂林', '梧州', '北海', '防城港', '钦州', '贵港', '玉林', '百色', '贺州', '河池', '来宾', '崇左',
  '自贡', '攀枝花', '泸州', '德阳', '绵阳', '广元', '遂宁', '内江', '乐山', '南充', '眉山', '宜宾', '广安', '达州', '雅安', '巴中', '资阳', '阿坝', '甘孜', '凉山',
  '贵阳', '六盘水', '遵义', '安顺', '毕节', '铜仁', '黔西南', '黔东南', '黔南',
  '曲靖', '玉溪', '保山', '昭通', '丽江', '普洱', '临沧', '楚雄', '红河', '文山', '西双版纳', '大理', '德宏', '怒江', '迪庆',
  '拉萨', '昌都', '山南', '日喀则', '那曲', '阿里', '林芝',
  '铜川', '宝鸡', '咸阳', '渭南', '延安', '汉中', '榆林', '安康', '商洛',
  '嘉峪关', '金昌', '白银', '天水', '武威', '张掖', '平凉', '酒泉', '庆阳', '定西', '陇南', '临夏', '甘南',
  '西宁', '海东', '海北', '黄南', '海南', '果洛', '玉树', '海西',
  '银川', '石嘴山', '吴忠', '固原', '中卫',
  '乌鲁木齐', '克拉玛依', '吐鲁番', '哈密', '昌吉', '博尔塔拉', '巴音郭楞', '阿克苏', '克孜勒苏', '喀什', '和田', '伊犁', '塔城', '阿勒泰',
  // 更多世界国家
  '埃及', '南非', '尼日利亚', '肯尼亚', '埃塞俄比亚', '摩洛哥', '阿尔及利亚', '坦桑尼亚', '加纳', '乌干达',
  '阿根廷', '智利', '秘鲁', '哥伦比亚', '委内瑞拉', '厄瓜多尔', '玻利维亚', '乌拉圭', '巴拉圭',
  '沙特阿拉伯', '伊朗', '土耳其', '以色列', '阿联酋', '卡塔尔', '科威特', '阿曼', '约旦', '黎巴嫩', '叙利亚', '伊拉克',
  '印度尼西亚', '菲律宾', '缅甸', '柬埔寨', '老挝', '蒙古', '尼泊尔', '斯里兰卡', '孟加拉国', '巴基斯坦', '阿富汗',
  '新西兰', '斐济', '巴布亚新几内亚', '萨摩亚', '汤加', '瓦努阿图',
  '爱尔兰', '葡萄牙', '比利时', '奥地利', '捷克', '匈牙利', '罗马尼亚', '保加利亚', '塞尔维亚', '克罗地亚', '斯洛文尼亚', '斯洛伐克', '乌克兰', '白俄罗斯',
  // 世界著名城市
  '纽约', '洛杉矶', '芝加哥', '休斯顿', '费城', '凤凰城', '圣安东尼奥', '圣地亚哥', '达拉斯', '旧金山',
  '伦敦', '曼彻斯特', '伯明翰', '利物浦', '爱丁堡', '格拉斯哥', '都柏林', '贝尔法斯特',
  '巴黎', '马赛', '里昂', '图卢兹', '尼斯', '南特', '斯特拉斯堡', '蒙彼利埃', '波尔多', '里尔',
  '柏林', '汉堡', '慕尼黑', '科隆', '法兰克福', '斯图加特', '多特蒙德', '杜塞尔多夫', '不来梅', '汉诺威',
  '罗马', '米兰', '那不勒斯', '都灵', '巴勒莫', '热那亚', '博洛尼亚', '佛罗伦萨', '威尼斯', '维罗纳',
  '莫斯科', '圣彼得堡', '新西伯利亚', '叶卡捷琳堡', '下诺夫哥罗德', '喀山', '萨马拉', '鄂木斯克', '车里雅宾斯克', '顿河畔罗斯托夫',
  '东京', '大阪', '名古屋', '横滨', '京都', '神户', '福冈', '札幌', '广岛', '仙台',
  '首尔', '釜山', '仁川', '大邱', '大田', '光州', '蔚山', '水原',
  '悉尼', '墨尔本', '布里斯班', '珀斯', '阿德莱德', '黄金海岸', '堪培拉', '霍巴特',
  '多伦多', '温哥华', '蒙特利尔', '卡尔加里', '埃德蒙顿', '渥太华', '温尼伯', '魁北克市',
  '圣保罗', '里约热内卢', '巴西利亚', '萨尔瓦多', '福塔雷萨', '贝洛奥里藏特', '库里蒂巴', '马瑙斯',
  '墨西哥城', '瓜达拉哈拉', '蒙特雷', '普埃布拉', '蒂华纳', '莱昂', '华雷斯城', '托卢卡',
  '新德里', '孟买', '加尔各答', '班加罗尔', '金奈', '海德拉巴', '艾哈迈达巴德', '浦那', '苏拉特', '斋浦尔',
  // 更多自然景观
  '阿尔卑斯山', '落基山脉', '安第斯山脉', '喜马拉雅山', '乞力马扎罗山', '富士山', '维苏威火山', '埃特纳火山', '马特洪峰', '勃朗峰',
  '贝加尔湖', '维多利亚湖', '坦噶尼喀湖', '马拉维湖', '大熊湖', '大奴湖', '温尼伯湖', '安大略湖', '伊利湖', '休伦湖', '密歇根湖', '苏必利尔湖',
  '死海', '里海', '黑海', '地中海', '红海', '阿拉伯海', '孟加拉湾', '墨西哥湾', '加勒比海', '波罗的海', '北海', '英吉利海峡',
  '科罗拉多大峡谷', '大堡礁', '伊瓜苏瀑布', '维多利亚瀑布', '尼亚加拉瀑布', '安赫尔瀑布', '棉花堡', '卡帕多奇亚', '马丘比丘', '复活节岛',
  '撒哈拉沙漠', '戈壁沙漠', '阿拉伯沙漠', '卡拉哈里沙漠', '塔克拉玛干沙漠', '阿塔卡马沙漠', '纳米布沙漠', '莫哈韦沙漠',
  '亚马孙雨林', '刚果雨林', '婆罗洲雨林', '苏门答腊雨林', '巴布亚新几内亚雨林', '马达加斯加雨林',
  // 著名建筑和历史遗迹
  '埃菲尔铁塔', '自由女神像', '金字塔', '狮身人面像', '泰姬陵', '斗兽场', '比萨斜塔', '圣家族大教堂', '白金汉宫', '克里姆林宫',
  '吴哥窟', '婆罗浮屠', '佩特拉', '马丘比丘', '奇琴伊察', '特奥蒂瓦坎', '复活节岛石像', '巨石阵', '雅典卫城', '帕特农神庙',
  '布达拉宫', '莫高窟', '云冈石窟', '龙门石窟', '大足石刻', '承德避暑山庄', '曲阜孔庙', '武当山古建筑群', '平遥古城', '丽江古城',
  '黄鹤楼', '岳阳楼', '滕王阁', '鹳雀楼', '大雁塔', '小雁塔', '雷峰塔', '六和塔', '虎丘塔', '应县木塔',
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
  
  const docEntities = entities.filter(e => e.documentIds.includes(documentId));
  if (docEntities.length >= 2 && relations.length === 0) {
    console.log('No sentence-level relations found, creating document-level relations');
    for (let i = 0; i < docEntities.length; i++) {
      for (let j = i + 1; j < docEntities.length; j++) {
        const source = docEntities[i];
        const target = docEntities[j];
        const relationId = `${source.id}-${RelationType.Related}-${target.id}-${documentId}-doc`;
        
        relations.push({
          id: relationId,
          sourceId: source.id,
          targetId: target.id,
          type: RelationType.Related,
          documentId,
          context: '同文档关联'
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
  console.log('analyzeDocument - documentId:', documentId, 'textContent:', textContent.substring(0, 200));

  const newEntities = extractEntities(textContent, documentId);
  console.log('newEntities:', newEntities.map(e => ({ name: e.name, type: e.type })));
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
