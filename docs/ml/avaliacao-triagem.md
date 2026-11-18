# Avaliação do classificador de triagem

> Gerado automaticamente por `node scripts/treinar-triagem.mjs`. Não editar à mão.

## Dados

- **Sintéticos**, escritos pela equipe para a demonstração (não são relatos reais de pacientes).
- Treino: 224 frases (Clínico Geral: 56, Ginecologia: 56, Odontologia: 56, Pediatria: 56).
- Teste separado: 56 frases (Clínico Geral: 14, Ginecologia: 14, Odontologia: 14, Pediatria: 14), nunca usadas no treino nem na escolha do alfa.
- Arquivos: `data/triagem/treino.csv` e `data/triagem/teste.csv` (`texto;especialidade`).

## Modelo

- Naive Bayes multinomial em JavaScript puro, executado no aparelho (`src/app/features/triage/classifier.mjs`).
- Texto: minúsculas, sem acentos, sem stopwords, raiz simples (corte de sufixos) e bigramas.
- Regra de domínio: a Pediatria só é considerada quando a frase menciona criança, bebê, filho(a) etc.; as demais probabilidades são renormalizadas.
- Vocabulário: 977 termos (palavras e bigramas).
- Suavização de Laplace (alfa) escolhida por validação cruzada estratificada com 5 dobras.

## Validação cruzada (5 dobras, só no conjunto de treino)

| Alfa | Acurácia média | Desvio padrão |
|---|---|---|
| 0.1 | 79,5% | 4,6% |
| 0.25 | 81,3% | 5,9% |
| 0.5 | 83,5% | 4,4% |
| 1 (escolhido) | 83,5% | 3,0% |
| 2 | 83,5% | 3,0% |

**Medida principal: 83,5% (± 3,0%)** de acurácia na validação cruzada com alfa = 1.

## Teste separado

**Acurácia: 98,2%** (55 de 56).

| Especialidade | Precisão | Revocação | Frases |
|---|---|---|---|
| Clínico Geral | 100,0% | 92,9% | 14 |
| Ginecologia | 93,3% | 100,0% | 14 |
| Odontologia | 100,0% | 100,0% | 14 |
| Pediatria | 100,0% | 100,0% | 14 |

### Matriz de confusão (linhas = correta, colunas = prevista)

| | Clínico Geral | Ginecologia | Odontologia | Pediatria |
|---|---|---|---|---|
| **Clínico Geral** | 13 | 1 | 0 | 0 |
| **Ginecologia** | 0 | 14 | 0 | 0 |
| **Odontologia** | 0 | 0 | 14 | 0 |
| **Pediatria** | 0 | 0 | 0 | 14 |

### Limiar de confiança (0,6)

Abaixo do limiar o app recomenda **Clínico Geral** "por precaução" em vez da especialidade prevista.
No teste, 3 de 56 frases ficaram abaixo do limiar; 0 delas eram erros do modelo.

## Limitações

- Os dados são sintéticos, curtos e bem comportados. O desempenho em relatos reais (erros de digitação, gírias, vários sintomas misturados) será **pior** que o medido.
- A acurácia no teste separado tende a ser otimista porque as frases de teste foram escritas pelas mesmas pessoas e no mesmo estilo do treino; por isso a **validação cruzada é a medida mais honesta**.
- Só 4 especialidades (as que existem no banco). Sintomas de outras áreas caem na mais parecida ou em Clínico Geral.
- Sinais de alerta (dor no peito, falta de ar, desmaio etc.) **não passam pelo modelo**: são tratados por regras revisáveis em `emergency.ts`, que mandam ligar para o SAMU 192.
- O resultado é uma sugestão de encaminhamento, não diagnóstico.
