# Feature: Aplicativo instalável (PWA) e publicação na nuvem

- **Requisito atendido (RF/RNF):** RNF - Multiplataforma (web e celular a partir de um único código); RNF - Disponibilidade por link público.
- **Disciplinas relacionadas:** Programação Multi Plataforma; Computação em Nuvem; Integração e Entrega Contínua
- **Padrão ou tecnologia usada e por quê:** PWA com `vite-plugin-pwa` e hospedagem na Vercel com deploy automático (ver ADR-009).
- **Arquivos principais:**
  - `vite.config.ts` (plugin PWA e manifesto)
  - `index.html` (metadados de tema e ícone para iOS e Android)
  - `public/` (ícones 192, 512, maskable, apple-touch e favicon)
  - `src/app/App.tsx` (moldura de iPhone só no computador; tela cheia no celular)
- **Como testar:**
  1. Abrir o link da Vercel no celular.
  2. Android (Chrome): menu ⋮ → "Instalar app" ou "Adicionar à tela inicial". iPhone (Safari): botão Compartilhar → "Adicionar à Tela de Início".
  3. Abrir pelo ícone: deve abrir em tela cheia, sem barra do navegador e sem a moldura de iPhone.
  4. Fazer um `git push` na `main` e verificar que a Vercel publica a nova versão sozinha.
- **Evidência (print ou diagrama):** prints do app instalado, do painel da Vercel e do deploy em `docs/evidence/`.
- **Observações / dificuldades encontradas:** a moldura de iPhone do protótipo precisou ser ocultada em telas pequenas; o cache do service worker guarda só a interface para que os dados do banco nunca fiquem desatualizados.
