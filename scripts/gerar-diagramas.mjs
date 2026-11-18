// Gera SVG e PNG de TODOS os diagramas Mermaid de docs/diagrams/*.md
// e o índice docs/diagrams/README.md (com as imagens embutidas).
//
// Uso (a primeira vez baixa o mermaid-cli, ~1 min):
//   node scripts/gerar-diagramas.mjs
//
// Usa o Chrome ou o Edge já instalados (não baixa navegador).
// Para usar outro navegador: defina PUPPETEER_EXECUTABLE_PATH.
// Para usar um mermaid-cli já instalado: defina MMDC com o caminho do executável.
import { execFile } from 'node:child_process';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const run = promisify(execFile);
const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const SRC = join(root, 'docs/diagrams');
const OUT = join(SRC, 'imagens');
const TMP = join(tmpdir(), 'infomed-diagramas');

// Ordem e título de cada arquivo no índice
const FILES = [
  ['casos-de-uso.md', 'Casos de uso'],
  ['arquitetura.md', 'Arquitetura e implantação'],
  ['navegacao.md', 'Mapa de navegação'],
  ['classes-dominio.md', 'Classes do domínio e repositórios'],
  ['modelo-er.md', 'Modelo de dados (ER)'],
  ['padroes-de-projeto.md', 'Padrões de projeto'],
  ['sequencias.md', 'Diagramas de sequência'],
  ['fluxo-autenticacao.md', 'Cadastro com LGPD'],
  ['estados-e-atividades.md', 'Estados e atividades'],
  ['ia-triagem.md', 'IA: triagem'],
  ['bi-e-seguranca.md', 'BI e segurança'],
  ['ci-cd.md', 'Integração e entrega contínua'],
  ['iot-proposta.md', 'Proposta de IoT (não implementada)'],
];

const slug = (s) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 50);

/** Blocos ```mermaid de um .md, com o título (##) mais próximo acima de cada um. */
function extract(file) {
  const lines = readFileSync(join(SRC, file), 'utf8').split(/\r?\n/);
  const blocks = [];
  let heading = lines.find((l) => l.startsWith('# '))?.slice(2) ?? file;
  let inBlock = false;
  let buf = [];
  for (const line of lines) {
    if (!inBlock && /^#{1,3} /.test(line)) heading = line.replace(/^#+ /, '');
    if (!inBlock && line.trim() === '```mermaid') { inBlock = true; buf = []; continue; }
    if (inBlock && line.trim() === '```') { inBlock = false; blocks.push({ heading, code: buf.join('\n') }); continue; }
    if (inBlock) buf.push(line);
  }
  return blocks.map((b, i) => ({ ...b, name: `${basename(file, '.md')}-${String(i + 1).padStart(2, '0')}-${slug(b.heading)}` }));
}

function browserPath() {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) return process.env.PUPPETEER_EXECUTABLE_PATH;
  const candidates = [
    'C:/Program Files/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
    'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
    'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
    '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
    '/usr/bin/chromium-browser',
  ];
  return candidates.find(existsSync);
}

async function main() {
  const exe = browserPath();
  if (!exe) throw new Error('Chrome/Edge não encontrado. Defina PUPPETEER_EXECUTABLE_PATH.');
  rmSync(TMP, { recursive: true, force: true });
  mkdirSync(TMP, { recursive: true });
  mkdirSync(OUT, { recursive: true });
  const puppeteerCfg = join(TMP, 'puppeteer.json');
  writeFileSync(puppeteerCfg, JSON.stringify({ executablePath: exe, args: ['--no-sandbox'] }));
  const mermaidCfg = join(TMP, 'mermaid.json');
  writeFileSync(mermaidCfg, JSON.stringify({
    theme: 'default',
    themeVariables: { fontFamily: 'Arial, Helvetica, sans-serif', primaryColor: '#E8F1FF', primaryBorderColor: '#0A73FF', lineColor: '#1A2B48' },
    flowchart: { htmlLabels: true, curve: 'basis' },
  }));

  const [cmd, baseArgs] = process.env.MMDC
    ? [process.env.MMDC, []]
    : [process.platform === 'win32' ? 'npx.cmd' : 'npx', ['--yes', '-p', '@mermaid-js/mermaid-cli@11.4.2', 'mmdc']];

  const all = FILES.flatMap(([file, title]) => extract(file).map((b) => ({ ...b, file, title })));
  for (const f of readdirSync(OUT)) rmSync(join(OUT, f)); // remove imagens antigas

  const render = async (d, ext) => {
    const input = join(TMP, `${d.name}.mmd`);
    writeFileSync(input, d.code);
    const args = [...baseArgs, '-i', input, '-o', join(OUT, `${d.name}.${ext}`), '-b', 'white', '-c', mermaidCfg, '-p', puppeteerCfg, '-q'];
    if (ext === 'png') args.push('-s', '2', '-w', '1400');
    // No Windows o npx/mmdc é um .cmd e precisa de shell: aspas protegem caminhos com espaço
    const win = process.platform === 'win32';
    const q = (a) => (win && /\s/.test(a) ? `"${a}"` : a);
    await run(q(cmd), args.map(q), { env: { ...process.env, PUPPETEER_SKIP_DOWNLOAD: '1' }, shell: win, maxBuffer: 1 << 24 });
  };

  // Poucas tarefas ao mesmo tempo para não abrir navegadores demais
  const jobs = all.flatMap((d) => [() => render(d, 'svg'), () => render(d, 'png')]);
  const failures = [];
  let next = 0;
  await Promise.all(Array.from({ length: 4 }, async () => {
    while (next < jobs.length) {
      const i = next++;
      const d = all[Math.floor(i / 2)];
      try {
        await jobs[i]();
        process.stdout.write('.');
      } catch (e) {
        failures.push(`${d.name}: ${String(e.stderr || e.message).split('\n').slice(0, 4).join(' ')}`);
      }
    }
  }));
  console.log();

  // Índice com todas as imagens
  let md = `# Diagramas do InfoMed\n\n> Gerado por \`node scripts/gerar-diagramas.mjs\`. Não editar à mão: edite os arquivos \`.md\` desta pasta e rode o script de novo.\n\n`;
  md += `Cada diagrama existe em **SVG** (vetorial: melhor para o Word/PDF do TCC, não perde qualidade) e **PNG** (para slides). Os arquivos estão em [\`imagens/\`](imagens/). O código-fonte Mermaid de cada um está no \`.md\` indicado.\n\n`;
  md += `## Sumário\n\n| # | Diagrama | Seção | Fonte | Arquivos |\n|---|---|---|---|---|\n`;
  all.forEach((d, i) => {
    md += `| ${i + 1} | ${d.heading} | ${d.title} | [\`${d.file}\`](${d.file}) | [SVG](imagens/${d.name}.svg) · [PNG](imagens/${d.name}.png) |\n`;
  });
  let current = '';
  all.forEach((d, i) => {
    if (d.title !== current) { md += `\n## ${d.title}\n`; current = d.title; }
    md += `\n### ${i + 1}. ${d.heading}\n\n![${d.heading}](imagens/${d.name}.svg)\n`;
  });
  writeFileSync(join(SRC, 'README.md'), md);

  console.log(`${all.length} diagramas, ${jobs.length - failures.length} imagens geradas em docs/diagrams/imagens/`);
  if (failures.length) {
    console.error(`\n${failures.length} falharam:\n` + failures.join('\n'));
    process.exitCode = 1;
  }
}

main().catch((e) => { console.error(e.message); process.exit(1); });
