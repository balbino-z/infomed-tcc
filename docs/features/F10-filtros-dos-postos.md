# Feature: Filtros e ordenação dos postos

- **Requisito atendido (RF/RNF):** RF - O usuário deve poder filtrar os postos por horário, distância, serviços e medicamento, e ordená-los.
- **Disciplinas relacionadas:** Modelagem de Padrões de Projetos (Strategy); Programação Multi Plataforma
- **Padrão ou tecnologia usada e por quê:** Strategy (ADR-013); geolocalização do navegador somente no aparelho.
- **Arquivos principais:**
  - `src/app/features/units/filters/types.ts`, `strategies.ts`, `applyFilters.ts`, `filters.test.tsx`
  - `src/app/components/screens/MapFilters.tsx` e `PostosList.tsx`
  - `HealthUnitRepository.unitIdsWithMedication` (Mock e Supabase)
- **Como testar:**
  1. Postos → Filtros: ligue "Aberto agora", escolha "Até 3 km" (o app pede a localização), marque um serviço e um medicamento; toque em Aplicar.
  2. A lista mostra só os postos que atendem a **todos** os filtros, com "N postos com os filtros escolhidos" e o contador no botão.
  3. "Limpar filtros" na lista ou na tela de filtros restaura tudo.
  4. Em "Ordenar por", escolha Distância: a lista fica do mais perto ao mais longe.
  5. Fora do horário comercial, "Aberto agora" deve esconder todas as UBS que já fecharam.
  6. `npm test`: 13 testes dos filtros devem passar.
- **Evidência (print ou diagrama):** prints em `docs/evidence/`; diagrama em `docs/diagrams/padroes-de-projeto.md`.
- **Observações / dificuldades encontradas:** a distância é em linha reta; sem permissão de localização o filtro por distância não exclui nenhum posto.
