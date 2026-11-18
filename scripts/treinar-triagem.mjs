// Treina o classificador de triagem (Naive Bayes) e gera:
//   - src/app/features/triage/model.json  (modelo usado pelo app, no aparelho)
//   - docs/ml/avaliacao-triagem.md        (validação cruzada, teste separado, matriz de confusão)
//
// Uso: node scripts/treinar-triagem.mjs
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseCsv, predict, train } from '../src/app/features/triage/classifier.mjs';
import { allowedClasses, GENERAL } from '../src/app/features/triage/rules.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => parseCsv(readFileSync(join(root, p), 'utf8'));

const trainSet = read('data/triagem/treino.csv');
const testSet = read('data/triagem/teste.csv');
const ALPHAS = [0.1, 0.25, 0.5, 1, 2];
const K = 5;
const THRESHOLD = 0.6;

// Embaralhamento determinístico (mesmo resultado a cada execução)
function seeded(seed) {
  let s = seed;
  return () => ((s = (s * 1103515245 + 12345) % 2147483648) / 2147483648);
}
function shuffle(list, seed) {
  const rnd = seeded(seed);
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Dobras estratificadas: cada dobra tem a mesma proporção de cada classe
function folds(data, k) {
  const out = Array.from({ length: k }, () => []);
  const byClass = {};
  for (const d of shuffle(data, 42)) (byClass[d.label] ??= []).push(d);
  for (const items of Object.values(byClass)) items.forEach((d, i) => out[i % k].push(d));
  return out;
}

const classify = (model, text) => predict(model, text, allowedClasses(model.classes, text))[0];

function evaluate(model, data) {
  const classes = model.classes;
  const matrix = Object.fromEntries(classes.map((c) => [c, Object.fromEntries(classes.map((p) => [p, 0]))]));
  let hits = 0;
  let lowConfidence = 0;
  let lowConfidenceErrors = 0;
  for (const d of data) {
    const top = classify(model, d.text);
    matrix[d.label][top.label]++;
    if (top.label === d.label) hits++;
    if (top.probability < THRESHOLD) {
      lowConfidence++;
      if (top.label !== d.label) lowConfidenceErrors++;
    }
  }
  return { accuracy: hits / data.length, matrix, lowConfidence, lowConfidenceErrors, n: data.length };
}

function crossValidate(alpha) {
  const parts = folds(trainSet, K);
  const accs = parts.map((testFold, i) => {
    const trainFold = parts.filter((_, j) => j !== i).flat();
    return evaluate(train(trainFold, alpha), testFold).accuracy;
  });
  const mean = accs.reduce((a, b) => a + b, 0) / accs.length;
  const sd = Math.sqrt(accs.reduce((s, a) => s + (a - mean) ** 2, 0) / (accs.length - 1));
  return { alpha, mean, sd, accs };
}

const cv = ALPHAS.map(crossValidate);
// Maior acurácia média; em empate, o de menor desvio (mais estável)
const best = cv.reduce((a, b) => (b.mean > a.mean + 1e-9 || (Math.abs(b.mean - a.mean) < 1e-9 && b.sd < a.sd) ? b : a));
const model = train(trainSet, best.alpha);
const test = evaluate(model, testSet);

mkdirSync(join(root, 'docs/ml'), { recursive: true });
writeFileSync(join(root, 'src/app/features/triage/model.json'), JSON.stringify(model));

const pct = (x) => `${(x * 100).toFixed(1).replace('.', ',')}%`;
const perClass = (r) =>
  model.classes.map((c) => {
    const row = r.matrix[c];
    const tp = row[c];
    const actual = Object.values(row).reduce((a, b) => a + b, 0);
    const predicted = model.classes.reduce((s, x) => s + r.matrix[x][c], 0);
    const precision = predicted ? tp / predicted : 0;
    const recall = actual ? tp / actual : 0;
    return `| ${c} | ${pct(precision)} | ${pct(recall)} | ${actual} |`;
  });
const count = (data) => model.classes.map((c) => `${c}: ${data.filter((d) => d.label === c).length}`).join(', ');

const report = `# Avaliação do classificador de triagem

> Gerado automaticamente por \`node scripts/treinar-triagem.mjs\`. Não editar à mão.

## Dados

- **Sintéticos**, escritos pela equipe para a demonstração (não são relatos reais de pacientes).
- Treino: ${trainSet.length} frases (${count(trainSet)}).
- Teste separado: ${testSet.length} frases (${count(testSet)}), nunca usadas no treino nem na escolha do alfa.
- Arquivos: \`data/triagem/treino.csv\` e \`data/triagem/teste.csv\` (\`texto;especialidade\`).

## Modelo

- Naive Bayes multinomial em JavaScript puro, executado no aparelho (\`src/app/features/triage/classifier.mjs\`).
- Texto: minúsculas, sem acentos, sem stopwords, raiz simples (corte de sufixos) e bigramas.
- Regra de domínio: a Pediatria só é considerada quando a frase menciona criança, bebê, filho(a) etc.; as demais probabilidades são renormalizadas.
- Vocabulário: ${model.vocabSize} termos (palavras e bigramas).
- Suavização de Laplace (alfa) escolhida por validação cruzada estratificada com ${K} dobras.

## Validação cruzada (${K} dobras, só no conjunto de treino)

| Alfa | Acurácia média | Desvio padrão |
|---|---|---|
${cv.map((r) => `| ${r.alpha}${r.alpha === best.alpha ? ' (escolhido)' : ''} | ${pct(r.mean)} | ${pct(r.sd)} |`).join('\n')}

**Medida principal: ${pct(best.mean)} (± ${pct(best.sd)})** de acurácia na validação cruzada com alfa = ${best.alpha}.

## Teste separado

**Acurácia: ${pct(test.accuracy)}** (${Math.round(test.accuracy * test.n)} de ${test.n}).

| Especialidade | Precisão | Revocação | Frases |
|---|---|---|---|
${perClass(test).join('\n')}

### Matriz de confusão (linhas = correta, colunas = prevista)

| | ${model.classes.join(' | ')} |
|---|${model.classes.map(() => '---').join('|')}|
${model.classes.map((c) => `| **${c}** | ${model.classes.map((p) => test.matrix[c][p]).join(' | ')} |`).join('\n')}

### Limiar de confiança (${String(THRESHOLD).replace('.', ',')})

Abaixo do limiar o app recomenda **${GENERAL}** "por precaução" em vez da especialidade prevista.
No teste, ${test.lowConfidence} de ${test.n} frases ficaram abaixo do limiar; ${test.lowConfidenceErrors} delas eram erros do modelo.

## Limitações

- Os dados são sintéticos, curtos e bem comportados. O desempenho em relatos reais (erros de digitação, gírias, vários sintomas misturados) será **pior** que o medido.
- A acurácia no teste separado tende a ser otimista porque as frases de teste foram escritas pelas mesmas pessoas e no mesmo estilo do treino; por isso a **validação cruzada é a medida mais honesta**.
- Só 4 especialidades (as que existem no banco). Sintomas de outras áreas caem na mais parecida ou em Clínico Geral.
- Sinais de alerta (dor no peito, falta de ar, desmaio etc.) **não passam pelo modelo**: são tratados por regras revisáveis em \`emergency.ts\`, que mandam ligar para o SAMU 192.
- O resultado é uma sugestão de encaminhamento, não diagnóstico.
`;

writeFileSync(join(root, 'docs/ml/avaliacao-triagem.md'), report);
console.log(`alfa=${best.alpha} | validação cruzada ${pct(best.mean)} ± ${pct(best.sd)} | teste ${pct(test.accuracy)} | vocabulário ${model.vocabSize}`);
