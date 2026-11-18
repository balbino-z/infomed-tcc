# ADR-009: PWA instalável e hospedagem na Vercel

- **Status:** Aceita
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Programação Multi Plataforma, Computação em Nuvem, Integração e Entrega Contínua

## Contexto

O InfoMed foi construído como aplicação web com layout de celular. Para atender à disciplina de Programação Multi Plataforma, o mesmo código precisa funcionar como aplicativo em dispositivos móveis. O protótipo exportado do Figma Make exibia uma moldura de iPhone ao redor do app, adequada apenas para demonstração em computador. Também era necessário publicar o sistema na internet para que a banca e os usuários de teste (pesquisa SUS) o acessem por um link.

## Decisão

1. Transformar o aplicativo em um **PWA (Progressive Web App)** com o plugin `vite-plugin-pwa`:
   - manifesto (`manifest.webmanifest`) com nome, ícones, cores e `display: standalone`;
   - *service worker* gerado automaticamente, com atualização automática (`registerType: autoUpdate`), que guarda em cache apenas o "esqueleto" do app (HTML, JS, CSS e imagens);
   - dados do Supabase **nunca** ficam em cache: sempre vêm da rede.
2. Exibir a moldura de iPhone **somente em telas largas** (computador). Em celulares o app ocupa a tela inteira (`100dvh`).
3. Hospedar na **Vercel** (plano gratuito), com deploy automático a cada `push` na branch `main` do GitHub, e variáveis de ambiente do Supabase cadastradas no painel da Vercel (ver ADR-007).
4. Empacotamento em APK com Capacitor fica como **trabalho opcional** (bônus). Distribuição em iOS fica fora do escopo, por exigir Mac e conta de desenvolvedor paga; será registrada como limitação.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Capacitor (APK) como entrega principal | Exige Android Studio e mais etapas; o PWA já demonstra o requisito com menos risco no prazo |
| React Native / Flutter | Exigiria reescrever o front-end |
| Netlify ou Cloudflare Pages | Equivalentes técnicos; a Vercel foi escolhida pela integração direta com Vite e GitHub |
| Hospedar em servidor próprio | Custo e manutenção desnecessários |

## Consequências

**Positivas**
- Um único código atende navegador, celular (instalável pela tela inicial) e computador.
- Publicação automática e link público para testes e para a banca.
- Atende, na prática, à parte de entrega contínua (CD); os testes automáticos entram no CI do GitHub Actions (ADR-006).

**Negativas / riscos**
- No iPhone, notificações em PWA têm limitações e a instalação é manual ("Adicionar à Tela de Início").
- O app depende de internet para dados (somente a interface é guardada em cache).
- **Limitação do plano gratuito da Vercel:** em repositórios privados, o plano Hobby não aceita deploys de commits feitos por outras contas (colaboradores). Como o projeto é feito em dupla, é preciso escolher uma das saídas: (a) tornar o repositório público (não há segredos no código; o `.env` fica fora do Git), (b) deixar que só a conta dona do projeto na Vercel faça os commits que vão para `main`, ou (c) migrar a hospedagem para outro serviço gratuito.

## Evidências

- `vite.config.ts` (configuração do PWA) e arquivos em `public/` (ícones)
- Print do app instalado na tela inicial do celular
- Print do painel da Vercel com o deploy concluído e o link público
- Print do Lighthouse (aba PWA/Instalável) no Chrome, se desejado
