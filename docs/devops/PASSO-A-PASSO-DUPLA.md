# Esteira CI/CD: passo a passo da dupla (para quem nunca usou Git)

> Siga **na ordem**. Cada passo diz **quem faz**, **o que digitar ou clicar**, **como saber se deu certo** e **qual print tirar**.
> Nomes usados aqui:
> - **BALBINO** = dono do repositório, conta GitHub `balbino-z` (desenvolvedor).
> - **PABLO** = colaborador, conta GitHub `Pablo-Casagrande` (revisor e documentação).
>
> Se o grupo tiver mais alguém, ele segue os mesmos passos do PABLO.

## Sumário

- [Antes de começar: 5 conceitos em 1 minuto](#antes-de-começar-5-conceitos-em-1-minuto)
- [Onde salvar os prints e onde registrar tudo](#onde-salvar-os-prints-e-onde-registrar-tudo)
- [Etapa 1 – Preparar o computador (os dois)](#etapa-1--preparar-o-computador-os-dois)
- [Etapa 2 – Configurar GitHub, Vercel e Supabase (BALBINO)](#etapa-2--configurar-github-vercel-e-supabase-balbino)
- [Etapa 3 – Baixar o projeto (PABLO)](#etapa-3--baixar-o-projeto-pablo)
- [Etapa 4 – Rodada 1: PABLO desenvolve, BALBINO revisa](#etapa-4--rodada-1-pablo-desenvolve-balbino-revisa)
- [Etapa 5 – Rodada 2: BALBINO desenvolve, PABLO revisa](#etapa-5--rodada-2-balbino-desenvolve-pablo-revisa)
- [Etapa 6 – Rodada 3: mostrar o CI barrando um erro (PABLO)](#etapa-6--rodada-3-mostrar-o-ci-barrando-um-erro-pablo)
- [Etapa 7 – Release: levar para produção (BALBINO abre, PABLO aprova)](#etapa-7--release-levar-para-produção-balbino-abre-pablo-aprova)
- [Etapa 8 – Subir os prints e fechar o registro (PABLO)](#etapa-8--subir-os-prints-e-fechar-o-registro-pablo)
- [Etapa 9 – Roteiro da apresentação ao professor](#etapa-9--roteiro-da-apresentação-ao-professor)
- [Quando algo dá errado](#quando-algo-dá-errado)

---

## Antes de começar: 5 conceitos em 1 minuto

| Palavra | O que é, em português simples |
|---|---|
| **Repositório** | A pasta do projeto guardada no GitHub, com todo o histórico |
| **Branch** | Uma "cópia de trabalho" do projeto. `main` é a versão oficial (produção); `develop` é a versão de teste (homologação); cada tarefa ganha uma branch própria |
| **Commit** | Um "salvar com descrição": registra o que mudou, quem mudou e quando |
| **Push / Pull** | *Push* envia seus commits para o GitHub; *pull* traz para o seu computador o que os outros enviaram |
| **Pull Request (PR)** | Um pedido no GitHub: "revise minha branch e junte na `develop`". O colega lê, testa e **aprova**; só então dá para juntar (*merge*) |

**A regra de ouro da esteira:** ninguém mexe direto na `main` nem na `develop`. Tudo entra por PR, com o CI (testes automáticos) verde e a aprovação do **outro** integrante.

**Sobre o que já foi feito:** os PRs #1, #2 e #3 foram abertos e mesclados pela mesma pessoa, direto na `main`, sem revisão. Eles ficam no histórico como **"antes da esteira"**. A esteira válida começa no PR #4, nesta sequência.

---

## Onde salvar os prints e onde registrar tudo

### Prints
- Cada um salva os próprios prints numa pasta qualquer do computador durante as etapas (ex.: `Área de Trabalho\prints-devops`).
- Use **exatamente o nome indicado** em cada 📸 (ex.: `D07-pr-aprovado.png`). Para tirar print no Windows: **Win + Shift + S** → selecione a área → abra o Paint (ou a Ferramenta de Captura) → **Ctrl + V** → **Arquivo → Salvar como → PNG**.
- **Antes de salvar, confira que não aparece senha, chave ou o conteúdo do `.env`.**
- No fim (Etapa 8), o PABLO junta todos os prints na pasta `docs/evidence/devops/` do projeto e envia por PR.

### Registro
| O que registrar | Onde | Quem | Quando |
|---|---|---|---|
| Papéis de cada um e tabela de PRs (quem desenvolveu, quem abriu, quem revisou, data) | `docs/devops/MANUAL-DEVOPS.md`, **seção 9** | PABLO cria na Rodada 1 e completa na Etapa 8 | Rodada 1 e Etapa 8 |
| Os prints | `docs/evidence/devops/` | PABLO | Etapa 8 |
| Resumo da sessão de trabalho | `docs/PROGRESSO.md` (nova "Sessão") | PABLO | Etapa 8 |
| Instruções de deploy e branches (o professor pede no README) | `README.md`, seção "Esteira DevOps e deploy" | **Já está pronta** | — |
| Manual com todos os comandos | `docs/devops/MANUAL-DEVOPS.md` | **Já está pronto** | — |

### Anote durante as etapas
Deixe um bloco de notas aberto e anote, a cada PR: **número do PR, nome da branch, quem desenvolveu, quem abriu, quem aprovou, data**. Você vai usar isso na Etapa 8.

---

## Etapa 1 – Preparar o computador (os dois)

### 1.1 Instalar (pule o que já tiver)
1. **Git**: https://git-scm.com/download/win → instalar com as opções padrão (só clicar em *Next*).
2. **Node.js 22 LTS**: https://nodejs.org → instalar com as opções padrão.
3. **VS Code**: https://code.visualstudio.com.

### 1.2 Abrir o terminal
No VS Code: menu **Terminal → New Terminal**. Aparece um painel embaixo: é ali que se digitam os comandos.
**Digite um comando por vez e aperte Enter.**

### 1.3 Conferir e se identificar no Git
```bash
git --version
```
```bash
node -v
```
✅ Deu certo se aparecerem números de versão (o Node precisa ser 22 ou maior).

Agora diga ao Git quem você é (troque pelos seus dados; **use o mesmo e-mail da sua conta do GitHub**, senão o GitHub não mostra seus commits como seus):
```bash
git config --global user.name "Seu Nome Completo"
```
```bash
git config --global user.email "email-da-sua-conta-github"
```

> Dica: se não quiser expor o e-mail, use o e-mail privado do GitHub: em github.com → foto → **Settings → Emails**, aparece um endereço `...@users.noreply.github.com`.

---

## Etapa 2 – Configurar GitHub, Vercel e Supabase (BALBINO)

### 2.1 Conferir o colaborador
github.com/balbino-z/infomed-tcc → **Settings → Collaborators**. O `Pablo-Casagrande` já aparece. Se aparecer "Pending", o PABLO precisa aceitar o convite no e-mail ou em github.com/notifications.

📸 **B01-colaboradores.png** — a tela de Collaborators com os dois nomes.

### 2.2 Atualizar a `develop`
A `develop` ficou para trás da `main`. No terminal do VS Code, dentro da pasta `C:\projetos\InfoMed`:
```bash
git checkout develop
```
```bash
git pull origin develop
```
```bash
git merge origin/main
```
```bash
git push origin develop
```
✅ Deu certo se o último comando terminar com algo como `develop -> develop`.

### 2.3 Proteger a `main` e a `develop` (a parte mais importante)
github.com/balbino-z/infomed-tcc → **Settings → Rules → Rulesets → New ruleset → New branch ruleset**.

Preencha:
1. **Ruleset Name:** `protege-main`
2. **Enforcement status:** **Active**
3. **Bypass list:** deixe **vazia** (assim nem o dono pode pular a revisão).
4. **Target branches → Add target → Include by pattern:** digite `main`.
5. Marque:
   - ✅ **Restrict deletions**
   - ✅ **Require a pull request before merging** → em *Required approvals* escolha **1** → marque **Dismiss stale pull request approvals when new commits are pushed**
   - ✅ **Require status checks to pass** → clique **Add checks** → digite `App` e escolha **App (types, tests, build)** → digite `Database` e escolha **Database (schema, RLS and rules)**
   - ✅ **Block force pushes**
6. **Create**.

Repita tudo criando outro ruleset chamado `protege-develop`, com o padrão `develop`.

✅ Deu certo se, em **Settings → Rules → Rulesets**, aparecerem os dois como **Active**.

📸 **B02-rulesets.png** — a lista com os dois rulesets ativos.
📸 **B03-ruleset-main.png** — a tela do `protege-main` mostrando as opções marcadas (role a página e tire 2 prints se precisar: `B03a`, `B03b`).

### 2.4 Configurar os ambientes na Vercel
vercel.com → abra o projeto do InfoMed.

1. **Settings → Git → Production Branch:** `main` → **Save**.
2. **Settings → Environment Variables:** as duas variáveis (`VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`) devem existir para **Production**. Clique nos três pontinhos de cada uma → **Edit** → em *Environments* marque também **Preview** e, no campo de branch, escolha **develop** → **Save**.
   - Resultado: produção e homologação usam o banco; as previews de PR rodam em modo Mock, sem tocar em dados reais.
3. **Settings → Domains → Add:** digite um nome livre, por exemplo `infomed-hml.vercel.app` (se estiver ocupado, tente outro) → depois de adicionar, clique em **Edit** no domínio e, em **Git Branch**, escolha `develop` → **Save**. Esse passa a ser o endereço de **homologação**.
4. **Settings → Deployment Protection:** se *Vercel Authentication* estiver ligado, **desligue** (deixe *Disabled*) e salve. Sem isso, o PABLO precisaria de conta na Vercel para abrir os links de Preview.
5. Anote os dois endereços: **produção** (o domínio principal) e **homologação** (o que você criou).

📸 **B04-vercel-git.png** — Production Branch = main.
📸 **B05-vercel-variaveis.png** — a lista de variáveis com os ambientes (**os valores devem estar escondidos**, como `••••`).
📸 **B06-vercel-dominios.png** — os domínios, com o de homologação ligado à `develop`.

### 2.5 Liberar o endereço de homologação no Supabase
supabase.com → projeto → **Authentication → URL Configuration → Redirect URLs → Add URL** → cole o endereço de homologação com `/**` no fim (ex.: `https://infomed-hml.vercel.app/**`) → **Save**.

---

## Etapa 3 – Baixar o projeto (PABLO)

No terminal do VS Code:
```bash
mkdir C:\projetos
```
```bash
cd C:\projetos
```
```bash
git clone https://github.com/balbino-z/infomed-tcc.git InfoMed
```
```bash
cd InfoMed
```
```bash
npm ci
```
Depois, no VS Code: **File → Open Folder → `C:\projetos\InfoMed`** (abra um novo terminal depois disso).

Teste se roda:
```bash
npm run dev
```
Abra http://localhost:5173 no navegador. O app abre em **modo Mock** (sem banco), e qualquer e-mail e senha servem para entrar. Para parar: clique no terminal e aperte **Ctrl + C**.

📸 **P01-npm-run-dev.png** — o terminal com `npm run dev` rodando e o app aberto no navegador.

---

## Etapa 4 – Rodada 1: PABLO desenvolve, BALBINO revisa

**Tarefa:** preencher a seção 9 do manual com os papéis da dupla.

### 4.1 PABLO cria a branch da tarefa
```bash
git checkout develop
```
```bash
git pull origin develop
```
```bash
git checkout -b docs/papeis-do-grupo
```
✅ No canto inferior esquerdo do VS Code aparece `docs/papeis-do-grupo`.

### 4.2 PABLO faz a alteração
Abra `docs/devops/MANUAL-DEVOPS.md`, vá até **"## 9. Papéis do grupo"** e preencha a primeira tabela com os nomes reais:

| Integrante | Usuário GitHub | Papel na esteira | Atividades |
|---|---|---|---|
| (nome do Balbino) | `balbino-z` | Dono do repositório e desenvolvedor | Configurou GitHub Actions, rulesets, Vercel e Supabase; desenvolveu o código; abriu PRs; revisou e aprovou os PRs do Pablo; fez a release e a tag |
| (nome do Pablo) | `Pablo-Casagrande` | Revisor e documentação | Desenvolveu as tarefas de documentação; abriu PRs; revisou e aprovou os PRs do Balbino testando o link de Preview; registrou as evidências |

Apague a linha "(nome) | (usuário) | (preencher)" se não houver terceiro integrante. Salve (**Ctrl + S**).

### 4.3 PABLO testa e registra (commit)
```bash
npm run typecheck
```
```bash
npm test
```
✅ Deve terminar com `Tests 104 passed` (ou mais).
```bash
git status
```
✅ Aparece `modified: docs/devops/MANUAL-DEVOPS.md` em vermelho.
```bash
git add docs/devops/MANUAL-DEVOPS.md
```
```bash
git commit -m "docs: papéis da dupla na esteira DevOps"
```
```bash
git push -u origin docs/papeis-do-grupo
```
> Na primeira vez, abre uma janela pedindo login no GitHub: escolha **Sign in with your browser** e autorize.

📸 **P02-comandos-commit-push.png** — o terminal mostrando `git add`, `git commit` e `git push`.

### 4.4 PABLO abre o Pull Request
1. Abra github.com/balbino-z/infomed-tcc. Aparece uma faixa amarela **"docs/papeis-do-grupo had recent pushes"** → **Compare & pull request**.
2. **Muito importante:** no topo, troque **base: main** para **base: develop**. Deve ficar: `base: develop ← compare: docs/papeis-do-grupo`.
3. O texto do PR já vem com um modelo. Preencha "O que muda", marque **docs** e o checklist.
4. À direita, em **Reviewers**, clique na engrenagem e escolha **balbino-z**.
5. **Create pull request**.
6. Anote o **número do PR** (ex.: #4).

✅ Embaixo aparecem os checks rodando (bolinha amarela) e, depois de 1 a 2 minutos, ✅ verdes. A Vercel comenta com um link de **Preview**.
✅ O botão de merge fica **bloqueado** com "Review required": é a regra funcionando.

📸 **P03-pr-aberto.png** — o PR com base `develop`, o revisor e os checks.
📸 **P04-merge-bloqueado.png** — a mensagem "Review required" / "Merging is blocked".

### 4.5 BALBINO revisa e aprova
1. github.com → **Pull requests** → abra o PR do Pablo.
2. Aba **Files changed**: leia a mudança. Para comentar uma linha, passe o mouse e clique no **+** azul.
3. Abra o link de **Preview** da Vercel e veja se o app abre.
4. Botão **Review changes** (canto superior direito) → escolha **Approve** → escreva "Revisado: tabela de papéis conferida." → **Submit review**.

📸 **B07-files-changed.png** — a aba Files changed.
📸 **B08-aprovacao.png** — a aba Conversation mostrando "balbino-z approved these changes".

### 4.6 PABLO junta na `develop` (merge)
No PR: **Squash and merge** → **Confirm squash and merge** → **Delete branch**.

No terminal do PABLO, para atualizar e limpar:
```bash
git checkout develop
```
```bash
git pull origin develop
```
```bash
git branch -D docs/papeis-do-grupo
```
> O `-D` maiúsculo é necessário porque o *squash* junta os commits num só; o Git local não reconhece a branch como "mesclada".

📸 **P05-pr-mesclado.png** — o PR roxo "Merged".

Depois de 1 a 2 minutos a Vercel publica a `develop` no endereço de **homologação**.

---

## Etapa 5 – Rodada 2: BALBINO desenvolve, PABLO revisa

**Tarefa (real, do Relatório de Segurança, achado V04):** adicionar cabeçalhos de segurança HTTP no site.

### 5.1 BALBINO cria a branch
```bash
git checkout develop
```
```bash
git pull origin develop
```
```bash
git checkout -b fix/cabecalhos-seguranca
```

### 5.2 BALBINO altera o `vercel.json`
Abra `vercel.json` na raiz do projeto, apague tudo e cole:
```json
{
  "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }],
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "geolocation=(self), camera=(), microphone=()" }
      ]
    }
  ]
}
```
Salve (**Ctrl + S**).

### 5.3 BALBINO testa, registra e envia
```bash
npm run typecheck
```
```bash
npm test
```
```bash
npm run build
```
```bash
git add vercel.json
```
```bash
git commit -m "fix: cabeçalhos de segurança HTTP na Vercel (achado V04)"
```
```bash
git push -u origin fix/cabecalhos-seguranca
```

### 5.4 BALBINO abre o PR
Igual à 4.4: **Compare & pull request** → **base: develop** → modelo preenchido (tipo **fix**) → **Reviewers: Pablo-Casagrande** → **Create pull request**. Anote o número.

📸 **B09-pr-balbino.png** — o PR aberto com o revisor Pablo e os checks.

### 5.5 PABLO revisa de verdade
1. Abra o PR → **Files changed** → leia o `vercel.json`.
2. Abra o link de **Preview** → o app deve abrir normalmente e o mapa de Postos deve carregar.
3. Confira os cabeçalhos: no navegador, com a Preview aberta, aperte **F12** → aba **Network (Rede)** → recarregue a página (**F5**) → clique na primeira linha (o documento) → **Headers** → em *Response Headers* devem aparecer `x-frame-options: DENY` e `x-content-type-options: nosniff`.
4. **Review changes → Approve** → "Testado na Preview: cabeçalhos presentes e app funcionando." → **Submit review**.

📸 **P06-cabecalhos-na-preview.png** — o F12 mostrando os cabeçalhos.
📸 **P07-aprovacao-pablo.png** — "Pablo-Casagrande approved these changes".

### 5.6 BALBINO faz o merge
**Squash and merge** → **Confirm** → **Delete branch**. Depois:
```bash
git checkout develop
```
```bash
git pull origin develop
```

---

## Etapa 6 – Rodada 3: mostrar o CI barrando um erro (PABLO)

Serve para provar que o CI **impede** código quebrado de entrar. **Este PR será fechado, não mesclado.**

```bash
git checkout develop
```
```bash
git pull origin develop
```
```bash
git checkout -b test/demonstra-ci-vermelho
```
Abra `src/app/features/profile/profile.test.tsx`, procure a linha:
```
expect(formatPhone('19999998888')).toBe('(19) 99999-8888');
```
e troque o resultado esperado para `'(19) 0000-0000'` (um erro de propósito). Salve.
```bash
npm test
```
✅ Agora deve aparecer **1 failed** em vermelho. É o esperado.
```bash
git add src/app/features/profile/profile.test.tsx
```
```bash
git commit -m "test: erro proposital para demonstrar o CI"
```
```bash
git push -u origin test/demonstra-ci-vermelho
```
Abra o PR para **base: develop** com o título "demonstração: CI barrando teste quebrado".

✅ O check **App (types, tests, build)** fica ❌ vermelho e o merge fica bloqueado.

📸 **P08-ci-vermelho.png** — o PR com o ❌ e o merge bloqueado.
📸 **P09-log-do-erro.png** — clique em **Details** ao lado do ❌ → o log mostrando o teste que falhou.

Agora desfaça o erro: volte a linha para `'(19) 99999-8888'`, salve e:
```bash
git add src/app/features/profile/profile.test.tsx
```
```bash
git commit -m "test: corrige o teste"
```
```bash
git push
```
✅ O check volta a ficar verde sozinho.

📸 **P10-ci-verde-de-novo.png**.

Como essa branch não tem mudança útil, feche sem mesclar: no PR → **Close pull request** (embaixo). Depois:
```bash
git checkout develop
```
```bash
git branch -D test/demonstra-ci-vermelho
```

---

## Etapa 7 – Release: levar para produção (BALBINO abre, PABLO aprova)

### 7.1 Conferir a homologação (os dois)
Abram o endereço de **homologação** e façam o teste rápido: a tela inicial abre, entrar com uma conta de teste, Postos e mapa carregam, **F5** em `/postos` continua funcionando.

📸 **B10-homologacao.png** — o app aberto no endereço de homologação (a barra de endereço aparecendo).

### 7.2 BALBINO abre o PR de release
github.com → **Pull requests → New pull request** → **base: main ← compare: develop** → **Create pull request**.
- Título: `release: v1.1.0`
- Texto: liste os PRs que entram (os números das rodadas 1 e 2).
- **Reviewers:** Pablo-Casagrande.

### 7.3 PABLO aprova
**Files changed** → conferir → **Review changes → Approve** → "Homologação testada, liberado para produção." → **Submit review**.

📸 **P11-release-aprovada.png**.

### 7.4 BALBINO mescla (sem squash) e cria a versão
No PR, clique na **setinha** ao lado do botão verde e escolha **Create a merge commit** → **Confirm merge**. **Não apague a branch `develop`.**

No terminal:
```bash
git checkout main
```
```bash
git pull origin main
```
```bash
git tag -a v1.1.0 -m "v1.1.0: esteira DevOps e cabeçalhos de segurança"
```
```bash
git push origin v1.1.0
```
No GitHub: **Releases** (coluna da direita) → **Draft a new release** → **Choose a tag: v1.1.0** → **Generate release notes** → **Publish release**.

📸 **B11-terminal-tag.png** — os comandos da tag no terminal.
📸 **B12-release.png** — a página da release v1.1.0.

### 7.5 Conferir o deploy de produção (BALBINO)
vercel.com → projeto → **Deployments**. Deve aparecer um deploy **Production** da `main` (bolinha verde "Ready").

📸 **B13-vercel-deployments.png** — a lista com deploys **Production** (main), da `develop` e de **Preview** (branches dos PRs).
📸 **B14-producao-no-ar.png** — o app aberto no endereço de produção.

Volte para a `develop` para as próximas tarefas (ela já contém tudo que foi para a `main`):
```bash
git checkout develop
```
```bash
git pull origin develop
```

---

## Etapa 8 – Subir os prints e fechar o registro (PABLO)

### 8.1 Juntar os prints
O BALBINO envia os prints dele (B01 a B14) para o PABLO (WhatsApp, Drive...). Antes, **confiram de novo que nenhum mostra senha, chave ou valor de variável**.

### 8.2 Criar a branch e copiar os prints
```bash
git checkout develop
```
```bash
git pull origin develop
```
```bash
git checkout -b docs/evidencias-devops
```
```bash
mkdir docs\evidence\devops
```
Copie todos os prints (B01…, P01…) para `C:\projetos\InfoMed\docs\evidence\devops` pelo Explorador de Arquivos.

### 8.3 Completar o registro de PRs
Em `docs/devops/MANUAL-DEVOPS.md`, seção 9, **"Registro de pull requests"**, apague as linhas de exemplo e preencha com o que você anotou:

| PR | Branch → destino | Tarefa | Desenvolveu | Abriu o PR | Revisou e aprovou | Data | Resultado |
|---|---|---|---|---|---|---|---|
| #1–#3 | várias → `main` | Antes da esteira | balbino-z | balbino-z | — (sem revisão) | 20/11/2026 | Mesclados antes das regras |
| #(nº) | `docs/papeis-do-grupo` → `develop` | Papéis da dupla | Pablo | Pablo | Balbino | (data) | Mesclado |
| #(nº) | `fix/cabecalhos-seguranca` → `develop` | Cabeçalhos de segurança | Balbino | Balbino | Pablo | (data) | Mesclado |
| #(nº) | `test/demonstra-ci-vermelho` → `develop` | Demonstração do CI | Pablo | Pablo | — | (data) | Fechado (CI barrou) |
| #(nº) | `develop` → `main` | Release v1.1.0 | — | Balbino | Pablo | (data) | Mesclado + tag v1.1.0 |
| #(nº) | `docs/evidencias-devops` → `develop` | Evidências | Pablo | Pablo | Balbino | (data) | (este PR) |

### 8.4 Escrever o diário
No fim de `docs/PROGRESSO.md`, troque o "Sessão 12 — (a preencher)" por um resumo, por exemplo:
```
### Sessão 12 — (data) — Balbino e Pablo
**Tarefa:** esteira DevOps (Programação Multiplataforma)
**Feito:** rulesets em main e develop (PR + 1 aprovação + CI); ambientes na Vercel (produção = main, homologação = develop, preview = PRs em Mock); rodadas de PR com revisão cruzada; demonstração do CI barrando teste quebrado; release v1.1.0.
**Evidências:** docs/evidence/devops/
```

### 8.5 Enviar e abrir o último PR
```bash
git add docs/evidence/devops docs/devops/MANUAL-DEVOPS.md docs/PROGRESSO.md
```
```bash
git commit -m "docs: evidências e registro da esteira DevOps"
```
```bash
git push -u origin docs/evidencias-devops
```
PR com **base: develop**, revisor **balbino-z** → BALBINO aprova → PABLO faz **Squash and merge**.

> Se quiserem que os prints apareçam também na `main`, façam depois uma nova release `develop → main` (pode ser `v1.1.1`), igual à Etapa 7.

---

## Etapa 9 – Roteiro da apresentação ao professor

Tempo: cerca de 8 minutos. Deixem abertos antes: o repositório no GitHub, a Vercel e o VS Code com o terminal.

1. **README** (github.com/balbino-z/infomed-tcc): mostrar a seção "Esteira DevOps e deploy" com branches, ambientes e comandos de deploy.
2. **Branches** (GitHub → Branches): `main`, `develop` e as tarefas.
3. **Regras** (Settings → Rules): PR obrigatório, 1 aprovação e CI.
4. **Ao vivo:** um de vocês cria uma branch, muda uma linha de texto, faz `git add`, `git commit`, `git push` e abre o PR para `develop`. Mostrar os checks rodando e o merge bloqueado.
5. **Revisão:** o outro aprova pelo celular ou outro computador → merge.
6. **Actions:** mostrar os jobs App e Database e o run vermelho da Etapa 6.
7. **Vercel → Deployments:** Preview do PR, homologação (`develop`) e produção (`main`).
8. **Releases:** a v1.1.0.
9. **Manual:** abrir `docs/devops/MANUAL-DEVOPS.md` e mostrar a tabela de quem fez o quê.

---

## Quando algo dá errado

| Mensagem ou situação | O que significa | O que fazer |
|---|---|---|
| `git` não é reconhecido como comando | O Git não está instalado ou o VS Code foi aberto antes de instalar | Instalar o Git, **fechar e abrir** o VS Code |
| Janela pedindo login ao dar `push` | Primeiro acesso ao GitHub nesse computador | **Sign in with your browser** e autorizar |
| `remote: Permission to ... denied (403)` | Conta sem acesso ao repositório | O PABLO precisa aceitar o convite de colaborador |
| `! [rejected] ... (fetch first)` ou `non-fast-forward` | Alguém enviou algo antes de você | `git pull` e depois `git push` de novo |
| `push declined due to repository rule violations` | Você tentou enviar direto para `main` ou `develop` | Normal! Crie uma branch (`git checkout -b ...`) e abra um PR |
| `Your local changes would be overwritten` ao trocar de branch | Você tem alterações não salvas no Git | Faça o commit antes (`git add` + `git commit`) |
| `CONFLICT (content): Merge conflict in ...` | Os dois mudaram a mesma linha | Abrir o arquivo no VS Code, clicar em **Accept Current/Incoming/Both**, salvar, `git add <arquivo>` e `git commit` |
| O terminal mostra `:` ou `(END)` e não sai | O Git abriu uma lista longa | Apertar **q** |
| O terminal abriu um editor estranho ao dar `git commit` | Faltou o `-m "mensagem"` | Digitar `:q!` e Enter, e repetir com `-m "mensagem"` |
| Não aparece o botão **Approve** | Quem abriu o PR não pode aprovar o próprio PR | O **outro** integrante aprova |
| A lista de checks não mostra `App` ou `Database` no ruleset | O CI ainda não rodou com esse nome | Digite o nome e escolha a opção sugerida; se não aparecer, faça um PR primeiro e volte para configurar |
| Link de Preview pede login da Vercel | Proteção de deploy ligada | Etapa 2.4, item 4 |
| Qualquer outra coisa | — | Tire print do erro e do comando digitado e mande no grupo |
