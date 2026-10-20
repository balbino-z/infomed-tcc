# Feature: Lista e busca de medicamentos

- **Requisito atendido (RF/RNF):** RF - O usuário deve poder consultar medicamentos e a disponibilidade em estoque.
- **Disciplina relacionada:** Modelagem de Padrões de Projetos
- **Padrão ou tecnologia usada e por quê:** Repository (ver ADR-003), para separar a tela da origem dos dados.
- **Arquivos principais:**
  - `src/app/domain/medication.ts`
  - `src/app/repositories/MedicationRepository.ts`
  - `src/app/repositories/mock/MockMedicationRepository.ts`
  - `src/app/components/screens/MedicationList.tsx`
- **Como testar:** abrir a aba Medicamentos e digitar "met" na busca; deve aparecer apenas a Metformina.
- **Evidência (print ou diagrama):** (colar print em `docs/evidence/`)
- **Observações / dificuldades encontradas:** o código exportado do Figma Make trazia a lista fixa dentro da tela; foi extraída para o repositório (ver ADR-002).
