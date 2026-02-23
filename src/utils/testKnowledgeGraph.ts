import {
  extractEntities,
  extractRelations,
  analyzeDocument,
  EntityType,
  RelationType
} from './knowledgeGraph';

const testContent = `张三在北京创建了华为公司。华为公司位于深圳市。
李四参与了这次活动。张三和李四都是著名的学者。
上海是中国最大的城市之一。`;

console.log('=== 测试文本内容 ===');
console.log(testContent);

console.log('\n=== 提取实体 ===');
const entities = extractEntities(testContent, 'test-doc');
console.log('实体数量:', entities.length);
entities.forEach(e => {
  console.log(`  - ${e.name} (${e.type})`);
});

console.log('\n=== 提取关系 ===');
const relations = extractRelations(testContent, entities, 'test-doc');
console.log('关系数量:', relations.length);
relations.forEach(r => {
  const source = entities.find(e => e.id === r.sourceId);
  const target = entities.find(e => e.id === r.targetId);
  console.log(`  - ${source?.name} --[${r.type}]--> ${target?.name}`);
});

console.log('\n=== 测试完成 ===');
