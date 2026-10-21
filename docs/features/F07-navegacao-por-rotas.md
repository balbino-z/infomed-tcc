# Feature: Navegação por rotas (botão voltar e links diretos)

- **Requisito atendido (RF/RNF):** RNF - Usabilidade: navegação previsível em dispositivos móveis; RNF - Multiplataforma (comportamento de aplicativo no PWA).
- **Disciplinas relacionadas:** Programação Multi Plataforma; Modelagem de Padrões de Projetos
- **Padrão ou tecnologia usada e por quê:** react-router 7 com adaptador que preserva o contrato `navigate(tela, dados)` das telas (ver ADR-010).
- **Arquivos principais:**
  - `src/app/features/navigation/routes.ts`, `types.ts`, `AppData.tsx`, `useAppNavigate.ts`, `AppRoutes.tsx`
  - `src/app/App.tsx` (BrowserRouter e layout)
  - `src/app/components/shared/Header.tsx` (botão voltar)
  - `vercel.json`
  - `src/app/features/navigation/navigation.test.tsx` (8 testes)
- **Como testar:**
  1. Navegue Início → Postos → um posto. Toque no botão voltar do celular (ou do navegador): deve voltar à lista, e depois ao início.
  2. Na barra de endereço, observe URLs como `/postos` e `/postos/<id>`.
  3. Copie a URL de um posto, abra em uma aba nova (logado): deve abrir direto no posto.
  4. Recarregue a página (F5) em `/postos`: deve continuar na tela, sem voltar às boas-vindas.
  5. Saia da conta e tente abrir `/postos`: deve ir para `/entrar`.
  6. Faça login e toque em voltar: não deve voltar à tela de login.
  7. Rode `npm test`: 19 testes devem passar.
- **Evidência (print ou diagrama):** prints em `docs/evidence/`.
- **Observações / dificuldades encontradas:** a versão mais recente do react-router exige React 19, por isso foi fixada a série 7. Na Vercel foi necessário o arquivo `vercel.json` para que links diretos funcionem.
