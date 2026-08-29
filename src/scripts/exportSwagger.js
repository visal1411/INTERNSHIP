require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { swaggerSpec } = require('../config/swagger');

const jsonPath = path.join(__dirname, '../../swagger.json');
fs.writeFileSync(jsonPath, JSON.stringify(swaggerSpec, null, 2), 'utf8');
console.log(`✅ Exported OpenAPI JSON specification to ${jsonPath}`);

// Simple helper to convert JSON object to YAML string
function jsonToYaml(obj, indent = 0) {
  const spaces = '  '.repeat(indent);
  if (obj === null) return 'null';
  if (typeof obj === 'boolean' || typeof obj === 'number') return String(obj);
  if (typeof obj === 'string') {
    if (obj.includes('\n')) {
      const lines = obj.split('\n').map(l => `${spaces}  ${l}`).join('\n');
      return `|\n${lines}`;
    }
    if (obj.includes(':') || obj.includes('#') || obj.includes('"') || obj.includes('\'') || obj === '') {
      return JSON.stringify(obj);
    }
    return obj;
  }
  if (Array.isArray(obj)) {
    if (obj.length === 0) return '[]';
    return '\n' + obj.map(item => {
      if (typeof item === 'object' && item !== null) {
        const itemYaml = jsonToYaml(item, indent + 1);
        const trimmed = itemYaml.startsWith('\n') ? itemYaml.substring(1) : itemYaml;
        return `${spaces}- ${trimmed.replace(/^\s+/, '')}`;
      }
      return `${spaces}- ${jsonToYaml(item, indent + 1)}`;
    }).join('\n');
  }
  if (typeof obj === 'object') {
    const keys = Object.keys(obj);
    if (keys.length === 0) return '{}';
    return '\n' + keys.map(key => {
      const val = obj[key];
      const valYaml = jsonToYaml(val, indent + 1);
      if (typeof val === 'object' && val !== null && !Array.isArray(val) && Object.keys(val).length > 0) {
        return `${spaces}${key}:${valYaml}`;
      }
      if (Array.isArray(val) && val.length > 0) {
        return `${spaces}${key}:${valYaml}`;
      }
      return `${spaces}${key}: ${valYaml}`;
    }).join('\n');
  }
  return String(obj);
}

try {
  const yamlContent = jsonToYaml(swaggerSpec).trim();
  const yamlPath = path.join(__dirname, '../../swagger.yaml');
  fs.writeFileSync(yamlPath, yamlContent, 'utf8');
  console.log(`✅ Exported OpenAPI YAML specification to ${yamlPath}`);
} catch (err) {
  console.warn('⚠️ YAML export skipped:', err.message);
}
