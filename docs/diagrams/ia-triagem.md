# IA: triagem por sintomas (ADR-014)

## Pipeline de treino (feito no computador, por script)

```mermaid
flowchart LR
  D1[(data/triagem/treino.csv<br/>224 frases sintéticas)] --> P
  D2[(data/triagem/teste.csv<br/>56 frases, separado)] --> AV
  subgraph P["Pré-processamento - tokenize"]
    direction TB
    P1[minúsculas e sem acentos] --> P2[remove stopwords] --> P3[raiz simples:<br/>corta sufixos] --> P4[palavras + bigramas]
  end
  P --> CV["Validação cruzada estratificada<br/>5 dobras × alfa 0,1 / 0,25 / 0,5 / 1 / 2"]
  CV --> BA["Escolhe o alfa de maior acurácia média<br/>(empate: menor desvio)"]
  BA --> TR[Treina com todo o treino<br/>Naive Bayes multinomial]
  TR --> MJ[(model.json<br/>contagens, ~33 kB)]
  TR --> AV[Avalia no teste separado]
  AV --> RP[docs/ml/avaliacao-triagem.md<br/>acurácia, precisão, revocação,<br/>matriz de confusão]
  CV --> RP
```

## Uso no app (no aparelho, a cada pergunta)

```mermaid
flowchart TD
  A[/Texto digitado pelo paciente/] --> B{Regras de alerta<br/>emergency.ts}
  B -- risco à vida --> B1[CVV 188 e SAMU 192]
  B -- emergência --> B2[SAMU 192 e Bombeiros 193<br/>sem agendamento]
  B -- nada --> C{Texto com 8+ letras?}
  C -- não --> C1[Pede mais detalhes]
  C -- sim --> D{Menciona criança?<br/>rules.mjs}
  D -- não --> D1[Remove Pediatria das opções]
  D -- sim --> E
  D1 --> E[Naive Bayes calcula a probabilidade<br/>de cada especialidade e renormaliza]
  E --> F{Maior probabilidade ≥ 0,6?}
  F -- não --> F1[Clínico Geral por precaução<br/>compatibilidade baixa]
  F -- sim --> G{≥ 0,85?}
  G -- sim --> G1[Especialidade sugerida<br/>compatibilidade alta]
  G -- não --> G2[Especialidade sugerida<br/>compatibilidade média]
  F1 --> H[Botão: Agendar com a especialidade]
  G1 --> H
  G2 --> H
```

## Como o Naive Bayes decide (fórmula)

Para cada especialidade *c* e as palavras *w* do texto:

`pontuação(c) = log P(c) + Σ log [ (contagem(w, c) + α) / (total de palavras de c + α · tamanho do vocabulário) ]`

A especialidade com maior pontuação vence; as pontuações são convertidas em probabilidades (softmax) para aplicar o limiar de 0,6.

```mermaid
flowchart LR
  T["'dor de dente forte'<br/>(sem criança: Pediatria sai)"] --> TK["dor · dente · forte ·<br/>dor_dente · dente_forte"]
  TK --> C1["Clínico Geral<br/>log = −33,3"]
  TK --> C2["Odontologia<br/>log = −27,8"]
  TK --> C3["Ginecologia<br/>log = −33,5"]
  C1 & C2 & C3 --> SM[softmax]
  SM --> R["Odontologia 0,992<br/>Clínico Geral 0,004<br/>Ginecologia 0,003<br/>→ compatibilidade alta"]
```

> Valores reais calculados com o `model.json` atual (alfa = 1). Se o modelo for retreinado com outros dados, eles mudam.
