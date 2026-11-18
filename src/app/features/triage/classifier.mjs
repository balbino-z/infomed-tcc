// Classificador Naive Bayes multinomial em JavaScript puro.
// Usado pelo app (no aparelho, sem enviar dados a terceiros) e pelo script de treino
// (scripts/treinar-triagem.mjs). Não tem dependências.

const STOPWORDS = new Set(
  (
    'a o e as os um uma uns umas de do da dos das no na nos nas em por para pra pro com sem que se ' +
    'eu me mim meu minha meus minhas ele ela eles elas lhe ao aos ja tem ter tenho tive esta estou esta ' +
    'estar estava ta to muito muita mais menos bem mal tambem so isso esse essa este esta aqui ali la ' +
    'faz fazem hoje ontem dia dias desde quando como qual quais quem onde sim nao foi era ser sou ' +
    'fica ficou sinto sentindo sentir senti acho anda andou umas vez vezes pouco bastante algum alguma ' +
    'depois antes durante sempre nunca agora ainda'
  ).split(/\s+/),
);

// "não" entra como stopword: sozinho ele quase não ajuda a separar especialidades.

const SUFFIXES = ['mente', 'coes', 'cao', 'ndo', 'ados', 'adas', 'idos', 'idas', 'ado', 'ada', 'ido', 'ida', 'ar', 'er', 'ir', 'es', 's'];

/** Remove acentos e deixa em minúsculas. */
export function normalize(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

/** Raiz simples: corta um sufixo comum se sobrar uma palavra com pelo menos 4 letras. */
export function stem(word) {
  for (const s of SUFFIXES) {
    if (word.endsWith(s) && word.length - s.length >= 4) return word.slice(0, -s.length);
  }
  return word;
}

/** Palavras (raízes) e bigramas de palavras vizinhas. */
export function tokenize(text) {
  const words = normalize(text)
    .split(/[^a-z]+/)
    .filter((w) => w.length > 1 && !STOPWORDS.has(w))
    .map(stem);
  const bigrams = [];
  for (let i = 0; i + 1 < words.length; i++) bigrams.push(`${words[i]}_${words[i + 1]}`);
  return words.concat(bigrams);
}

/**
 * Treina o modelo. `docs` é uma lista de { text, label }.
 * Guarda só contagens (o modelo fica legível em JSON e o cálculo é refeito na previsão).
 */
export function train(docs, alpha = 1) {
  const classes = [...new Set(docs.map((d) => d.label))].sort();
  const docCount = Object.fromEntries(classes.map((c) => [c, 0]));
  const tokenTotal = Object.fromEntries(classes.map((c) => [c, 0]));
  const counts = {}; // token -> { classe: contagem }
  for (const { text, label } of docs) {
    docCount[label]++;
    for (const t of tokenize(text)) {
      counts[t] ??= {};
      counts[t][label] = (counts[t][label] ?? 0) + 1;
      tokenTotal[label]++;
    }
  }
  return { version: 1, alpha, classes, docCount, tokenTotal, vocabSize: Object.keys(counts).length, counts };
}

/**
 * Probabilidade de cada classe para o texto, da maior para a menor.
 * `allowed` (opcional) restringe as classes consideradas; as probabilidades são renormalizadas.
 */
export function predict(model, text, allowed) {
  const classes = allowed ? model.classes.filter((c) => allowed.includes(c)) : model.classes;
  const totalDocs = classes.reduce((s, c) => s + model.docCount[c], 0);
  const tokens = tokenize(text).filter((t) => model.counts[t]); // palavras desconhecidas não ajudam
  const logs = classes.map((c) => {
    let lp = Math.log(model.docCount[c] / totalDocs);
    const denom = model.tokenTotal[c] + model.alpha * model.vocabSize;
    for (const t of tokens) lp += Math.log(((model.counts[t][c] ?? 0) + model.alpha) / denom);
    return lp;
  });
  const max = Math.max(...logs);
  const exps = logs.map((l) => Math.exp(l - max));
  const sum = exps.reduce((a, b) => a + b, 0);
  return classes
    .map((label, i) => ({ label, probability: exps[i] / sum }))
    .sort((a, b) => b.probability - a.probability)
    .map((r) => ({ ...r, knownTokens: tokens.length }));
}

/** Lê um CSV simples "texto;especialidade" (com cabeçalho). */
export function parseCsv(content) {
  return String(content)
    .split(/\r?\n/)
    .slice(1)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const i = l.lastIndexOf(';');
      return { text: l.slice(0, i).trim(), label: l.slice(i + 1).trim() };
    });
}
