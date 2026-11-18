# ADR-014: Triagem por IA no aparelho (sintoma para especialidade)

- **Status:** Aceita (implementada em 18/11/2026)
- **Data:** 18/11/2026
- **Disciplinas relacionadas:** Inteligência Artificial e Aprendizado de Máquina; Segurança e Defesa Cibernética (LGPD)

## Contexto

O TCC precisa de uma funcionalidade simples de IA. A ideia original (fila T11) era uma Edge Function chamando um modelo de linguagem. Porém a equipe não tem chave de API nem Supabase CLI, chamadas a um LLM têm custo por uso, e mandar a descrição de sintomas para um terceiro é tratamento de **dado sensível de saúde** (LGPD, art. 11), o que exigiria contrato e consentimento específicos.

## Decisão

1. **Classificador Naive Bayes multinomial** escrito em JavaScript puro (`src/app/features/triage/classifier.mjs`), executado **no aparelho**. O mesmo arquivo é usado pelo app e pelo script de treino, então não há divergência entre o que foi avaliado e o que roda.
2. Pré-processamento: minúsculas, sem acentos, sem stopwords, raiz simples (corte de sufixos) e bigramas. Suavização de Laplace com alfa escolhido por **validação cruzada estratificada de 5 dobras**.
3. Dados **sintéticos** (`data/triagem/treino.csv` e `teste.csv`), 4 classes: as especialidades existentes no banco (Clínico Geral, Pediatria, Ginecologia, Odontologia).
4. `scripts/treinar-triagem.mjs` gera `model.json` (contagens, legível) e `docs/ml/avaliacao-triagem.md` (validação cruzada, teste separado, matriz de confusão). Um teste automatizado falha se o `model.json` não corresponder ao CSV de treino.
5. **Camadas de segurança** em volta do modelo (`triage.ts`):
   - Sinais de alerta são verificados **antes** do modelo por regras revisáveis (`emergency.ts`): dor no peito, falta de ar, desmaio, convulsão, AVC, hemorragia, acidente grave, intoxicação, reação alérgica grave → SAMU 192 e Bombeiros 193, **sem** oferecer agendamento. Risco à vida → CVV 188 e SAMU 192.
   - Regra de domínio: Pediatria só é considerada quando a frase menciona criança, bebê, filho(a) etc.; senão é removida e as demais probabilidades são renormalizadas.
   - Limiar de confiança 0,6: abaixo dele o app recomenda **Clínico Geral "por precaução"**.
   - A confiança aparece como "compatibilidade alta, média ou baixa", nunca em percentual (evita falsa precisão).
6. Aviso fixo na tela: não é diagnóstico e não substitui profissional de saúde. O texto digitado **não é enviado nem gravado**.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| LLM via Edge Function (plano original) | Custo por chamada, exige chave e CLI, envia dado de saúde a terceiro |
| Biblioteca de ML (TensorFlow.js, natural) | Dependência grande para um problema de 4 classes; Naive Bayes cabe em ~80 linhas e é explicável no TCC |
| Palavras-chave fixas | Não "aprende" com dados, não demonstra a disciplina de Aprendizado de Máquina |
| Regressão logística / SVM | Ganho pequeno com tão poucos dados; Naive Bayes é o modelo clássico de classificação de texto e mais fácil de explicar |

## Consequências

**Positivas**
- Custo zero, funciona offline (PWA) e nenhum dado de saúde sai do aparelho.
- Modelo pequeno (~33 kB) e auditável; resultados reproduzíveis com um comando.
- O mesmo `analyzeSymptoms` é reaproveitado pelo assistente (chatbot).

**Negativas / riscos**
- Dados sintéticos: o desempenho em relatos reais será pior que o medido (ver `docs/ml/avaliacao-triagem.md`).
- Regras de alerta por expressão regular podem deixar passar formas de escrever não previstas; por isso o aviso "se piorar, ligue 192" aparece também nas sugestões.
- Só 4 especialidades.

## Evidências

- `src/app/features/triage/` (classificador, regras, alerta, tela e 18 testes)
- `docs/ml/avaliacao-triagem.md`
- Prints: sugestão com compatibilidade, alerta de emergência, agendamento aberto a partir da sugestão
