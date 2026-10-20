// Remove o sufixo de versão dos imports (ex.: "lucide-react@0.487.0" -> "lucide-react")
import { readdirSync, readFileSync, writeFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.(tsx?|jsx?)$/.test(name)) fix(p);
  }
}
function fix(file) {
  const src = readFileSync(file, 'utf8');
  const out = src.replace(/(from\s+['"])((?:@[^/'"@]+\/)?[^/'"@]+)@\d[^'"]*(['"])/g, '$1$2$3');
  if (out !== src) { writeFileSync(file, out); console.log('corrigido:', file); }
}
walk('src');
