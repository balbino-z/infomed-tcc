# Feature: Postos de saúde reais com lista, detalhe e mapa

- **Requisito atendido (RF/RNF):** RF - O usuário deve poder localizar postos de saúde, ver horário, serviços e medicamentos, e chegar até eles; RNF - Privacidade da localização.
- **Disciplinas relacionadas:** Modelagem de Padrões de Projetos; Programação Multi Plataforma; Computação em Nuvem
- **Padrão ou tecnologia usada e por quê:** Repository (`HealthUnitRepository`, com Mock e Supabase), Leaflet e OpenStreetMap (ADR-005), carregamento sob demanda do mapa.
- **Arquivos principais:**
  - `src/app/domain/health-unit.ts`
  - `src/app/repositories/HealthUnitRepository.ts`, `mock/MockHealthUnitRepository.ts`, `supabase/SupabaseHealthUnitRepository.ts`
  - `src/app/features/units/unitUtils.ts` (aberto/fechado, distância, link de rota)
  - `src/app/features/units/UnitsMap.tsx`, `useUserLocation.ts`
  - `src/app/components/screens/PostosList.tsx`, `PostoDetail.tsx`
  - `src/app/features/units/units.test.tsx` (7 testes)
- **Como testar:**
  1. Abrir Postos: devem aparecer as 15 UBS de Santa Bárbara d'Oeste, com "Aberto" ou "Fechado" conforme o horário atual.
  2. Buscar por nome ou bairro.
  3. Tocar em "Perto de mim", permitir a localização e conferir a ordenação por distância.
  4. Tocar em "Mapa": marcadores verdes (abertas) e cinzas (fechadas); tocar em um marcador e em "Ver detalhes".
  5. No detalhe: telefone clicável, "Como chegar" abre a rota, serviços e medicamentos da unidade com o aviso de que o estoque é simulado.
  6. Rodar `npm test`: 11 testes devem passar.
- **Evidência (print ou diagrama):** prints em `docs/evidence/` (lista, mapa, detalhe).
- **Observações / dificuldades encontradas:**
  - O horário de abertura vem do banco, mas a fonte não informa os dias; assumiu-se atendimento de segunda a sexta (premissa registrada em `unitUtils.ts`).
  - O cálculo de "aberto agora" usa o fuso de São Paulo, independentemente do fuso do aparelho.
  - Unidades sem farmácia mostram uma mensagem explicativa em vez de lista de medicamentos.
