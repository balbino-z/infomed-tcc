# ADR-010: Navegação por rotas com react-router

- **Status:** Aceita (implementada em 20/10/2026)
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Programação Multi Plataforma, Modelagem de Padrões de Projetos, Segurança e Defesa Cibernética

## Contexto

O protótipo exportado do Figma Make controlava a tela atual por uma variável de estado (`useState<Screen>`), sem alterar o endereço (URL) do navegador. Consequências (já registradas no ADR-002):

- o botão **voltar** do celular ou do navegador fechava o aplicativo em vez de voltar à tela anterior;
- não era possível abrir uma tela diretamente por link (por exemplo, o detalhe de um posto);
- recarregar a página levava sempre à tela de boas-vindas;
- como PWA instalado, a experiência de navegação ficava diferente da esperada em um aplicativo.

## Decisão

1. Adotar o **react-router 7** (compatível com React 18; a versão 8 exige React 19) com `BrowserRouter`.
2. Manter o **mesmo contrato** que as 20 telas já usavam, `navigate('tela', dados)`, por meio de um adaptador (`useAppNavigate`). Assim as telas não precisaram ser reescritas: o adaptador guarda os dados e troca a URL.
3. Centralizar o mapa de telas e endereços em `features/navigation/routes.ts`, com URLs em português (`/postos`, `/postos/:id`, `/medicamentos/:id`, `/agendar`, `/lembretes/novo`, entre outras).
4. **Detalhes por identificador na URL:** `/postos/:id` e `/medicamentos/:id` buscam o item pelo repositório quando a pessoa chega por link ou recarrega a página, mantendo o padrão Repository (ADR-003).
5. **Proteção de rotas no cliente:** telas internas redirecionam para `/entrar` sem login; telas de entrada redirecionam para `/inicio` quando já há sessão.
6. **Botão voltar do aplicativo:** o componente `Header` volta no histórico quando existe página anterior dentro do app, e usa o destino indicado pela tela como alternativa (ex.: primeiro acesso por link direto). Ao entrar no app após o login, o histórico é **substituído** (e não empilhado), evitando voltar à tela de login.
7. **Hospedagem:** `vercel.json` com regra de reescrita para `index.html`, de modo que links diretos e recarregamentos funcionem na Vercel (SPA fallback). O service worker do PWA já usa `index.html` como fallback de navegação.
8. Os tipos `Screen` e `AppState` passaram a ficar em `features/navigation/types.ts`, reexportados por `App.tsx` para não alterar os imports das telas.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Manter a navegação por estado | Não atende ao botão voltar, links diretos nem recarregamento |
| Reescrever as telas para usar `<Link>` e `useParams` em cada uma | Muito retrabalho para o prazo; o adaptador entrega o mesmo resultado com poucas alterações |
| TanStack Router / Next.js | Troca de ferramenta sem necessidade para o escopo do TCC |
| react-router 8 | Exige React 19 e Node 22 |

## Consequências

**Positivas**
- O botão voltar do celular funciona; cada tela tem endereço próprio e pode ser aberta por link.
- Menos risco: as telas continuam com a mesma interface de navegação.
- Testes automatizados da navegação, das proteções e do botão voltar (8 testes).

**Negativas / riscos**
- Os dados que passam entre telas dos fluxos ainda ficam em memória (`AppData`); se a pessoa recarregar no meio do agendamento, perde a escolha. No agendamento (ADR-011), as rotas de cada passo redirecionam para o início do fluxo quando faltam os dados da escolha anterior; a consulta em si só existe depois de gravada no banco.
- A proteção de rotas no cliente **não é segurança por si só**: os dados continuam protegidos pelo RLS no banco (ADR-004).
- Rotas dinâmicas e fixas competem (`/postos/filtros` e `/postos/:id`); a ordem de resolução está testada.

## Evidências

- `src/app/features/navigation/` (rotas, adaptador, proteção) e `vercel.json`
- Print do botão voltar do celular funcionando
- Print de um link direto (por exemplo, `/postos/<id>`) aberto em aba nova
- Resultado de `npm test` (19 testes)
