# Feature: Triagem por IA (qual especialista procurar)

- **Requisito atendido (RF/RNF):** RF - O usuário pode descrever o que sente e receber a sugestão da especialidade, com acesso direto ao agendamento. RNF - Os dados de saúde digitados não saem do aparelho.
- **Disciplinas relacionadas:** Inteligência Artificial e Aprendizado de Máquina; Segurança e Defesa Cibernética (LGPD)
- **Padrão ou tecnologia usada e por quê:** Naive Bayes multinomial em JavaScript puro, no aparelho (ADR-014); regras de alerta antes do modelo.
- **Arquivos principais:**
  - `src/app/features/triage/classifier.mjs` (modelo), `rules.mjs` (regra da Pediatria), `emergency.ts` (sinais de alerta), `triage.ts` (`analyzeSymptoms`), `model.json`, `triage.test.tsx`
  - `src/app/components/screens/Triage.tsx` (rota `/triagem`); cartão na Home e atalho em Agendar
  - `data/triagem/treino.csv`, `data/triagem/teste.csv`, `scripts/treinar-triagem.mjs`, `docs/ml/avaliacao-triagem.md`
- **Como testar:**
  1. Home → "Não sabe qual especialista?" (ou Agendar → "Não sabe qual escolher?").
  2. Digite "dor de dente que piora à noite" → Odontologia, compatibilidade alta.
  3. "Estou com febre e tosse" → Clínico Geral; "meu filho está com febre e tosse" → Pediatria.
  4. "Dor forte no peito" → cartão vermelho com SAMU 192 e Bombeiros 193, sem botão de agendar.
  5. "Não sei explicar" → Clínico Geral "por precaução", compatibilidade baixa.
  6. Na sugestão, "Agendar com ..." abre a escolha do médico daquela especialidade.
  7. Retreinar: `node scripts/treinar-triagem.mjs` (imprime alfa, validação cruzada e teste).
  8. `npm test`: 18 testes da triagem.
- **Evidência (print ou diagrama):** prints em `docs/evidence/`; métricas em `docs/ml/avaliacao-triagem.md`.
- **Observações / dificuldades encontradas:** os dados são sintéticos (validação cruzada ~83%, teste separado ~98%; a validação cruzada é a medida honesta). Em relatos reais o desempenho será menor. Não é diagnóstico.
