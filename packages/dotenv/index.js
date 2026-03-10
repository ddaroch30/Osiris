const fs = require('fs');
const path = require('path');

function parse(content) {
  const out = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

function config(options = {}) {
  const envPath = options.path ? path.resolve(options.path) : path.resolve(process.cwd(), '.env');
  try {
    const text = fs.readFileSync(envPath, 'utf8');
    const parsed = parse(text);
    for (const [k, v] of Object.entries(parsed)) {
      if (process.env[k] === undefined) process.env[k] = v;
    }
    return { parsed };
  } catch (error) {
    return { error };
  }
}

module.exports = { config, parse };
