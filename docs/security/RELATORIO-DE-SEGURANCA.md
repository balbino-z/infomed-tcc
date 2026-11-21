<!-- CAPA -->
[NOME DA INSTITUIÇÃO DE ENSINO]
CURSO SUPERIOR DE TECNOLOGIA EM ANÁLISE E DESENVOLVIMENTO DE SISTEMAS (PROGRAMA AMS)

[NOME DO INTEGRANTE 1]
[NOME DO INTEGRANTE 2]

RELATÓRIO DE SEGURANÇA DA INFORMAÇÃO DO SISTEMA INFOMED:
análise de ameaças, controles, testes e conformidade com a LGPD

[CIDADE]
2026

<!-- FOLHA DE ROSTO -->
Relatório técnico apresentado à disciplina de Segurança e Defesa Cibernética do Curso Superior de Tecnologia em Análise e Desenvolvimento de Sistemas, como parte do Trabalho de Conclusão de Curso (Projeto Integrador II).

Professor(a): [NOME DO(A) PROFESSOR(A)]

<!-- FIM DOS ELEMENTOS PRÉ-TEXTUAIS DE IDENTIFICAÇÃO -->

# RESUMO

Este relatório documenta a análise de segurança da informação do InfoMed, aplicativo web progressivo (PWA) de saúde pública para o município de Santa Bárbara d'Oeste (SP), que reúne consulta de medicamentos por unidade, localização de Unidades Básicas de Saúde, agendamento de consultas, lembretes de medicação, triagem por inteligência artificial e um painel de indicadores. Por tratar dados pessoais e dados pessoais sensíveis de saúde, o sistema foi projetado segundo os princípios de defesa em profundidade, privilégio mínimo e privacidade desde a concepção. A metodologia combinou inventário e classificação de ativos, modelagem de ameaças com o método STRIDE, revisão de código, testes automatizados de segurança do banco de dados executados em integração contínua, testes por mutação, auditoria de dependências, varredura de segredos no histórico do repositório e mapeamento para o OWASP Top 10 e para a Lei Geral de Proteção de Dados Pessoais (LGPD). O principal controle é o Row Level Security (RLS) do PostgreSQL, que restringe cada usuário às próprias linhas diretamente no banco, verificado por 52 asserções automáticas a cada alteração do código. A análise identificou 13 achados: uma vulnerabilidade de escalada de privilégio foi corrigida, um segredo versionado foi removido, e os demais foram classificados por risco com plano de tratamento. Conclui-se que o sistema atende aos requisitos de segurança para o seu propósito acadêmico e de demonstração, e que a operação em produção real depende principalmente da implementação dos direitos do titular, de cabeçalhos de segurança HTTP, da separação de ambientes e de monitoramento.

**Palavras-chave:** segurança da informação; LGPD; Row Level Security; modelagem de ameaças; saúde digital.

# ABSTRACT

This report documents the information security analysis of InfoMed, a public health progressive web app (PWA) for the city of Santa Bárbara d'Oeste, Brazil, which offers medicine availability by health unit, a map of primary care units, appointment booking, medication reminders, AI-based triage and an indicator dashboard. Since it processes personal and sensitive health data, the system was designed following defense in depth, least privilege and privacy by design. The methodology combined asset inventory and classification, STRIDE threat modeling, code review, automated database security tests in continuous integration, mutation testing, dependency auditing, secret scanning of the repository history and mapping to the OWASP Top 10 and to the Brazilian General Data Protection Law (LGPD). The main control is PostgreSQL Row Level Security, which restricts each user to their own rows inside the database and is verified by 52 automated assertions on every change. The analysis produced 13 findings: a privilege escalation flaw was fixed, a versioned secret was removed, and the remaining findings were risk-rated with a treatment plan.

**Keywords:** information security; LGPD; Row Level Security; threat modeling; digital health.

# SUMÁRIO

[SUMÁRIO]

# 1 INTRODUÇÃO

O InfoMed é um sistema de informação em saúde pública desenvolvido como Trabalho de Conclusão de Curso. O aplicativo permite que o cidadão consulte a disponibilidade de medicamentos nas Unidades Básicas de Saúde (UBS), localize as unidades em um mapa, agende consultas, receba lembretes de medicação e descubra qual especialidade procurar a partir da descrição dos sintomas. Um painel de Business Intelligence (BI) oferece ao gestor indicadores agregados de uso.

Sistemas de saúde estão entre os alvos mais visados por ataques cibernéticos, e os dados que tratam — consultas, medicamentos e sintomas — são classificados pela LGPD como dados pessoais sensíveis (BRASIL, 2018, art. 5º, II). Por isso a segurança foi tratada como requisito desde o início do projeto, e não como uma etapa final.

## 1.1 Objetivo geral

Documentar e avaliar a segurança da informação do InfoMed, demonstrando os controles implementados, as evidências de verificação, os riscos remanescentes e a conformidade com a LGPD.

## 1.2 Objetivos específicos

a) inventariar e classificar os ativos de informação do sistema;
b) identificar ameaças por meio do método STRIDE;
c) descrever os controles técnicos implementados e relacioná-los ao OWASP Top 10;
d) apresentar os testes de segurança automatizados e seus resultados;
e) registrar as vulnerabilidades encontradas, seu tratamento e o risco residual;
f) avaliar a aderência do sistema aos princípios e direitos previstos na LGPD.

## 1.3 Escopo

Estão no escopo: o front-end PWA (React e TypeScript), o banco de dados PostgreSQL e a autenticação no Supabase, os scripts de banco de dados (`db/01` a `db/09`), a esteira de integração contínua (GitHub Actions) e a hospedagem (Vercel). Estão fora do escopo: a infraestrutura interna dos provedores de nuvem, testes de intrusão externos (pentest) e a proposta de dispositivo IoT, ainda não implementada.

## 1.4 Estrutura do relatório

A seção 2 apresenta a fundamentação teórica; a seção 3, a metodologia; a seção 4 descreve o sistema e seus ativos; a seção 5, a modelagem de ameaças; a seção 6, os controles implementados; a seção 7, os testes; a seção 8, os achados; a seção 9, a conformidade com a LGPD; a seção 10, a matriz de riscos e o plano de ação; a seção 11, o plano de resposta a incidentes; e a seção 12, as considerações finais.

# 2 FUNDAMENTAÇÃO TEÓRICA

## 2.1 Pilares da segurança da informação

A segurança da informação busca preservar a confidencialidade (acesso apenas por quem é autorizado), a integridade (dados corretos e não adulterados) e a disponibilidade (acesso quando necessário) da informação (ABNT, 2022a). No InfoMed, a confidencialidade protege os dados de saúde, a integridade garante que um agendamento não seja forjado ou alterado indevidamente e a disponibilidade assegura que o cidadão consiga consultar postos e medicamentos.

## 2.2 Princípios de projeto seguro

Foram adotados três princípios. **Defesa em profundidade**: várias camadas independentes de proteção, de forma que a falha de uma não exponha os dados. **Privilégio mínimo**: cada papel recebe apenas as permissões estritamente necessárias. **Privacidade desde a concepção** (*privacy by design*): o tratamento de dados é minimizado já no desenho da funcionalidade, como na triagem executada no próprio aparelho.

## 2.3 Row Level Security

O Row Level Security (RLS) é um recurso do PostgreSQL que aplica políticas de acesso por linha: mesmo que uma consulta solicite todos os registros de uma tabela, o banco devolve apenas as linhas que satisfazem a política associada ao usuário (POSTGRESQL GLOBAL DEVELOPMENT GROUP, 2024). No Supabase, a identidade do usuário chega ao banco por um token JWT e é obtida pela função `auth.uid()` (SUPABASE, 2026). Assim, a autorização não depende do código do aplicativo, que pode ser inspecionado e manipulado pelo usuário no navegador.

## 2.4 OWASP Top 10

O OWASP Top 10 é uma lista de referência das categorias de risco mais críticas em aplicações web, mantida pela OWASP Foundation (OWASP FOUNDATION, 2021). Neste relatório, os controles do InfoMed são mapeados para a edição de 2021, que tem o controle de acesso quebrado (A01) como principal categoria.

## 2.5 Modelagem de ameaças STRIDE

O método STRIDE classifica ameaças em seis categorias: falsificação de identidade (*Spoofing*), adulteração (*Tampering*), repúdio (*Repudiation*), divulgação de informação (*Information disclosure*), negação de serviço (*Denial of service*) e elevação de privilégio (*Elevation of privilege*) (SHOSTACK, 2014).

## 2.6 Lei Geral de Proteção de Dados Pessoais

A LGPD (Lei nº 13.709/2018) regula o tratamento de dados pessoais no Brasil. Dados referentes à saúde são dados pessoais sensíveis (art. 5º, II) e só podem ser tratados nas hipóteses do art. 11, entre elas o consentimento específico e destacado do titular. A lei exige a observância de princípios como finalidade, necessidade e segurança (art. 6º), garante direitos ao titular, como acesso, correção e eliminação (art. 18), e determina a comunicação de incidentes de segurança à Autoridade Nacional de Proteção de Dados (ANPD) e aos titulares (art. 48) (BRASIL, 2018).

# 3 METODOLOGIA

A análise foi conduzida ao longo do desenvolvimento, entre outubro e novembro de 2026, em sete etapas:

a) **inventário e classificação de ativos**: levantamento das tabelas, funções, segredos e serviços, com classificação dos dados em públicos, pessoais e sensíveis;
b) **modelagem de ameaças**: aplicação do STRIDE a cada fluxo de dados do sistema;
c) **revisão de código e de configuração**: leitura dos scripts SQL, dos repositórios de acesso a dados, do fluxo de autenticação e dos arquivos de configuração;
d) **testes automatizados de segurança**: 52 asserções em `db/ci/tests.sql`, executadas em PostgreSQL 16 a cada *push* e *pull request* pelo GitHub Actions;
e) **testes por mutação**: os controles críticos foram removidos propositalmente de uma cópia do banco para confirmar que os testes falham quando a proteção deixa de existir;
f) **auditoria de dependências e varredura de segredos**: execução de `npm audit` e busca de chaves e senhas no histórico completo do Git (`git log -p --all`);
g) **avaliação de risco**: cada achado recebeu probabilidade e impacto em escala de 1 a 3, e o risco resultou do produto entre eles.

As ferramentas utilizadas foram: PostgreSQL 16, Supabase, GitHub Actions, Vitest, npm audit e Git, com a lista OWASP Top 10 como guia de revisão.

# 4 DESCRIÇÃO DO SISTEMA E ATIVOS

## 4.1 Arquitetura

O InfoMed segue uma arquitetura cliente-servidor sem servidor de aplicação próprio. O cliente é um PWA servido pela Vercel. O PWA se comunica por HTTPS com o Supabase, que oferece autenticação, uma API REST gerada automaticamente e o banco PostgreSQL hospedado na região de São Paulo. As telas do aplicativo não acessam o banco diretamente: utilizam interfaces do padrão Repository, que possuem uma implementação real (Supabase) e uma simulada (Mock), usada em testes. Os diagramas completos estão em `docs/diagrams/` (arquitetura, implantação, modelo de dados e camadas de segurança).

## 4.2 Inventário e classificação de ativos

O Quadro 1 relaciona os ativos de informação do sistema e a classificação de cada um.

Quadro 1 – Inventário e classificação dos ativos de informação

| Ativo | Exemplo de conteúdo | Classificação | Proprietário |
|---|---|---|---|
| `profiles` | Nome, telefone, nascimento, data do aceite da LGPD, papel de administrador | Pessoal | Titular |
| `appointments` | Consulta, especialidade, médico, horário, motivo de cancelamento | **Sensível (saúde)** | Titular |
| `reminders` | Nome do medicamento, horários, observações | **Sensível (saúde)** | Titular |
| `notifications` | Avisos de consultas e medicamentos | **Sensível (saúde)** | Titular |
| `auth.users` | E-mail e senha (armazenada como hash pelo Supabase) | Pessoal / credencial | Supabase |
| Catálogo (`medications`, `health_units`, `doctors`, `specialties`, `unit_medications`) | Dados de unidades reais; médicos e estoque simulados | Público | Equipe |
| Texto da triagem e do assistente | Sintomas descritos pelo usuário | **Sensível (saúde)**, não armazenado | Titular |
| Chave *publishable* do Supabase | Identifica o projeto para o cliente | Pública por concepção | Equipe |
| Senha do banco e chave *service_role* | Acesso administrativo total | **Secreto** | Dono do projeto |
| Código-fonte e histórico Git | Aplicação, scripts e documentação | Interno | Equipe |

Fonte: elaborado pelos autores (2026).

## 4.3 Fluxos de dados pessoais

Os dados pessoais trafegam apenas entre o aparelho do usuário e o Supabase, sempre por HTTPS e acompanhados do token JWT da sessão. O texto digitado na triagem e no assistente é processado pelo classificador executado no próprio aparelho e não é enviado nem gravado. O mapa carrega imagens dos servidores do OpenStreetMap, que recebem o endereço IP do usuário, mas não a sua localização, pois a geolocalização do recurso "Perto de mim" é calculada no aparelho. O painel de BI recebe somente contagens agregadas.

# 5 MODELAGEM DE AMEAÇAS

O Quadro 2 apresenta as principais ameaças identificadas pelo método STRIDE e os controles correspondentes.

Quadro 2 – Ameaças STRIDE e controles

| Categoria | Ameaça | Controle no InfoMed |
|---|---|---|
| S – Falsificação | Usuário se passar por outro para ver consultas alheias | Supabase Auth com JWT assinado; `auth.uid()` vem do token, não de parâmetros do cliente |
| S – Falsificação | Inserir consulta em nome de outra pessoa | Política RLS `with check (user_id = auth.uid())` |
| T – Adulteração | Alterar horário ou status de uma consulta pelo console do navegador | Gatilho `validate_appointment`: o paciente só pode cancelar |
| T – Adulteração | Criar notificação falsa | Sem permissão de `insert` para o usuário; notificações criadas apenas por gatilho no servidor |
| T – Adulteração | Agendar fora das regras (passado, fim de semana, fora do expediente, horário duplicado) | Regras repetidas no banco (gatilho e índices únicos), além do app |
| R – Repúdio | Negar ter aceitado o tratamento de dados | `lgpd_consent_at` gravado no cadastro e protegido contra alteração pelo titular |
| I – Divulgação | Listar dados pessoais de outros usuários | RLS por usuário em todas as tabelas pessoais; papel `anon` sem acesso |
| I – Divulgação | Descobrir quem marcou um horário | Função `booked_slots` devolve apenas os horários ocupados |
| I – Divulgação | Reidentificar pacientes pelo painel de BI | `bi_dashboard` devolve só agregados, sem ids, nomes ou e-mails |
| I – Divulgação | Vazamento dos sintomas digitados | Triagem e assistente executados no aparelho, sem envio ou gravação |
| D – Negação de serviço | Excesso de requisições à API | Limites de taxa do Supabase Auth; validação de período no BI (1 a 365 dias) |
| E – Elevação de privilégio | Usuário se promover a administrador | `GRANT UPDATE` restrito às colunas nome, nascimento e telefone (achado V01, corrigido) |
| E – Elevação de privilégio | Usar a chave *service_role* no cliente | Chave nunca usada no front-end nem versionada (ADR-007) |

Fonte: elaborado pelos autores (2026).

# 6 CONTROLES IMPLEMENTADOS

## 6.1 Autenticação

A autenticação é delegada ao Supabase Auth, que armazena as senhas com função de *hash* e emite tokens JWT de curta duração com renovação automática. O cadastro exige senha de no mínimo oito caracteres, em linha com o comprimento mínimo recomendado pelo NIST (2017) para segredos memorizados. O aceite dos termos é obrigatório e registrado com data e hora. As mensagens de erro do Supabase são traduzidas para mensagens genéricas ("E-mail ou senha incorretos"), sem revelar se o e-mail existe.

## 6.2 Autorização no banco de dados

A autorização combina duas camadas obrigatórias, pois no PostgreSQL o `GRANT` libera o acesso à tabela e o RLS filtra as linhas:

a) **GRANT por papel**: o papel `anon` (visitante) lê somente o catálogo; o papel `authenticated` acessa as tabelas pessoais com as operações estritamente necessárias (por exemplo, consultas sem `delete`; notificações sem `insert`);
b) **RLS em todas as nove tabelas**: as tabelas pessoais têm políticas `user_id = (select auth.uid())`; o catálogo tem apenas política de leitura.

## 6.3 Regras de negócio no servidor

Toda regra crítica existe também no banco, de forma que um cliente adulterado não consiga burlá-la: gatilho de validação do agendamento (horário futuro, até 60 dias, dias úteis, grade de 30 minutos, expediente da unidade, transições de status permitidas), índices únicos contra horário duplicado por médico e por paciente, restrições `CHECK` nos lembretes e no perfil (telefone com 10 ou 11 dígitos, data de nascimento entre 1900 e a data atual, nome com até 120 caracteres).

## 6.4 Funções privilegiadas controladas

Três funções executam com privilégio do dono (`security definer`) por necessidade, todas com `search_path` vazio, o que impede o sequestro de objetos por outro esquema: `booked_slots` (devolve apenas instantes ocupados), `is_admin` (informa somente se o próprio usuário é administrador) e `bi_dashboard` (recusa quem não é administrador com o erro 42501, valida o período e devolve um único JSON agregado).

## 6.5 Proteção de dados e privacidade

O consentimento é coletado em caixa de seleção específica e destacada, que menciona expressamente dados de saúde. O texto da triagem e do assistente não sai do aparelho. O painel de BI aplica minimização: apenas contagens. O perfil permite ao titular visualizar e corrigir seus dados. Dados de demonstração usam domínio reservado (`@infomed.invalid`) e são removíveis por script.

## 6.6 Gestão de segredos e configuração

As variáveis de ambiente ficam no arquivo `.env`, ignorado pelo Git; o repositório contém apenas o modelo `.env.example`. O front-end usa somente a URL do projeto e a chave *publishable*, que é pública por concepção, pois a proteção dos dados é feita pelo RLS. A chave *service_role*, que ignora o RLS, nunca é utilizada no cliente.

## 6.7 Segurança no transporte

Todo o tráfego entre o aplicativo, a Vercel e o Supabase ocorre por HTTPS (TLS). O *service worker* do PWA armazena em cache apenas a interface; os dados do Supabase são sempre buscados pela rede, para não ficarem gravados no cache do dispositivo.

## 6.8 Integridade da cadeia de software

As dependências são instaladas com `npm ci`, que respeita exatamente o arquivo de travamento `package-lock.json`. A esteira de integração contínua executa verificação de tipos, 104 testes de aplicação, o *build* de produção e os testes de segurança do banco a cada alteração, e a partir da versão 1.1.0 nenhuma alteração entra nas branches `main` e `develop` sem *pull request* revisado por outro integrante.

## 6.9 Mapeamento para o OWASP Top 10

Quadro 3 – Controles do InfoMed por categoria do OWASP Top 10:2021

| Categoria OWASP | Situação | Controles e observações |
|---|---|---|
| A01 Quebra de controle de acesso | Atendido | RLS em todas as tabelas, GRANT mínimo, regras no servidor, 52 testes automatizados |
| A02 Falhas criptográficas | Atendido | HTTPS em todo o tráfego; senhas com *hash* no Supabase Auth |
| A03 Injeção | Atendido | Acesso pela API do Supabase com parâmetros, sem montagem de SQL no cliente; React escapa o conteúdo exibido |
| A04 Design inseguro | Atendido | Modelagem STRIDE, regras duplicadas no banco, triagem local |
| A05 Configuração incorreta | Parcial | Cabeçalhos de segurança HTTP aplicados, exceto a CSP (V04); confirmação de e-mail desligada (V05) |
| A06 Componentes vulneráveis | Parcial | 0 vulnerabilidades em dependências de produção; 9 em dependências de desenvolvimento (V03) |
| A07 Falhas de identificação e autenticação | Atendido | Supabase Auth, senha mínima de 8, mensagens genéricas |
| A08 Falhas de integridade de software e dados | Atendido | `npm ci` com lockfile, CI obrigatório, revisão de PR |
| A09 Falhas de registro e monitoramento | Parcial | Sem trilha de auditoria própria nem alertas (V11) |
| A10 Falsificação de requisição do lado do servidor (SSRF) | Não se aplica | Não há servidor de aplicação próprio que faça requisições a URLs informadas pelo usuário |

Fonte: elaborado pelos autores (2026).

# 7 TESTES E VERIFICAÇÃO

## 7.1 Testes automatizados de segurança do banco de dados

O arquivo `db/ci/tests.sql` contém 52 asserções executadas pelo job "Database" do GitHub Actions em um PostgreSQL 16 criado do zero a cada execução. O cenário cria dois usuários (Maria e João) e verifica, entre outros pontos: que o visitante não lê dados pessoais; que um usuário não vê nem altera consultas, lembretes ou perfil do outro; que não é possível inserir consulta ou notificação em nome de terceiros; que as regras de agendamento são aplicadas pelo banco; que o usuário comum não consegue se promover a administrador nem apagar o aceite da LGPD; e que o painel de BI recusa usuários comuns e não devolve identificadores, e-mails ou nomes. A relação completa está no Apêndice A.

## 7.2 Testes por mutação

Para confirmar que os testes realmente detectam falhas de segurança, quatro controles foram removidos propositalmente de uma cópia do banco. O Quadro 4 mostra que todas as mutações foram detectadas.

Quadro 4 – Resultado dos testes por mutação

| Mutação aplicada | Teste que falhou | Resultado |
|---|---|---|
| Remover a restrição de `GRANT UPDATE` por coluna em `profiles` | Usuário comum conseguiu definir `is_admin = true` | Detectada |
| Remover a verificação de administrador em `bi_dashboard` | Usuário comum conseguiu executar o painel | Detectada |
| Incluir identificadores de usuários na resposta do painel | "Painel não devolve ids, e-mails nem nomes" | Detectada |
| Remover a validação de telefone | Telefone "123" foi aceito | Detectada |

Fonte: elaborado pelos autores (2026).

## 7.3 Testes da aplicação

A aplicação possui 104 testes automatizados (Vitest e Testing Library), que incluem: bloqueio do cadastro sem aceite da LGPD; redirecionamento de telas protegidas para o login; acesso negado ao painel de BI para usuário comum; validação do perfil com as mesmas regras do banco; e a garantia de que o texto digitado no assistente não é gravado no armazenamento do navegador.

## 7.4 Auditoria de dependências

A execução de `npm audit` em 20/11/2026 apresentou o resultado do Quadro 5.

Quadro 5 – Resultado da auditoria de dependências

| Escopo | Críticas | Altas | Moderadas | Baixas | Total |
|---|---|---|---|---|---|
| Produção (`npm audit --omit=dev`) | 0 | 0 | 0 | 0 | 0 |
| Desenvolvimento (inclui ferramentas de teste e build) | 2 | 1 | 5 | 1 | 9 |

Fonte: elaborado pelos autores a partir do `npm audit` (2026).

As vulnerabilidades de desenvolvimento estão em `vitest` e `tinypool` (críticas), `vite` (alta) e em dependências indiretas de `vite-plugin-pwa`. Elas afetam o ambiente do desenvolvedor e da integração contínua, não o aplicativo publicado, e são tratadas no achado V03.

## 7.5 Varredura de segredos

A busca por chaves e senhas no histórico completo do repositório encontrou um arquivo com a senha do banco de dados versionado (achado V02). Não foram encontradas chaves *service_role* nem tokens JWT.

## 7.6 Verificação de isolamento no ambiente real

Os 27 casos de teste manuais de `docs/security/testes-rls.md` repetem, no Supabase real e com duas contas, as verificações automatizadas. A coluna de resultado deve ser preenchida pela equipe com as evidências (capturas de tela) antes da apresentação.

# 8 ACHADOS E TRATAMENTO

A severidade foi atribuída pelo risco (probabilidade × impacto, escala de 1 a 9): Alta (6 a 9), Média (3 a 4) e Baixa (1 a 2). Achados sem risco direto foram classificados como Informativos.

Quadro 6 – Achados de segurança

| ID | Achado | Severidade | Situação | Tratamento |
|---|---|---|---|---|
| V01 | Escalada de privilégio: o usuário podia alterar qualquer coluna do próprio perfil, inclusive o papel de administrador e a data do aceite da LGPD | Alta | **Corrigido** | `db/08_bi.sql` restringiu o `GRANT UPDATE` a nome, nascimento e telefone; teste automatizado e mutação comprovam |
| V02 | Senha do banco de dados versionada no repositório | Alta | **Parcial** | Arquivo removido do versionamento e ignorado; falta trocar a senha no Supabase, pois ela permanece no histórico |
| V03 | Nove vulnerabilidades em dependências de desenvolvimento (2 críticas) | Média | Aberto | Atualizar `vitest`, `vite` e `vite-plugin-pwa` dentro das versões compatíveis e repetir os testes |
| V04 | Ausência de cabeçalhos de segurança HTTP (Content-Security-Policy, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy) | Média | **Parcial** | `vercel.json` passou a enviar X-Content-Type-Options, X-Frame-Options, Referrer-Policy e Permissions-Policy (só geolocalização liberada); falta a Content-Security-Policy, liberando apenas Supabase e OpenStreetMap |
| V05 | Confirmação de e-mail desativada no Supabase | Média | Aceito (demonstração) | Reativar antes de uso real, para impedir cadastro com e-mail de terceiros |
| V06 | Direitos do titular incompletos: não há exclusão de conta nem exportação de dados pelo app; não há política de privacidade publicada | Média | Aberto | Funções de exclusão e exportação; publicar política (minuta no Apêndice B) |
| V07 | Homologação e produção compartilham o mesmo banco de dados | Média | Aberto | Criar um segundo projeto Supabase para homologação |
| V08 | Ausência de trilha de auditoria e de alertas de segurança | Média | Aberto | Registrar eventos sensíveis (cancelamentos, mudanças de papel) e revisar os logs do Supabase |
| V09 | Ausência de rotina de backup documentada pela equipe | Média | Aberto | Exportação periódica com `pg_dump` e teste de restauração |
| V10 | Sessão do usuário armazenada no `localStorage` do navegador | Baixa | Risco aceito | Padrão do Supabase para SPA; mitigado pela ausência de pontos de injeção de HTML com dados do usuário (o único uso de `dangerouslySetInnerHTML`, em `chart.tsx`, recebe apenas configuração de cores) |
| V11 | O endereço IP do usuário é enviado aos servidores do OpenStreetMap ao carregar o mapa | Baixa | Risco aceito | Mapa carregado só sob demanda; informar na política de privacidade |
| V12 | `.env.example` contém a URL e a chave *publishable* reais | Informativo | Aceito | A chave é pública por concepção; recomenda-se manter o modelo sem valores, coerente com o ADR-007 |
| V13 | Proteção de rotas e implementação Mock de autenticação existem apenas no cliente | Informativo | Por projeto | Não são controles de segurança: o controle efetivo é o RLS; o Mock só é ativado sem `.env` (testes e demonstração) |

Fonte: elaborado pelos autores (2026).

# 9 CONFORMIDADE COM A LGPD

## 9.1 Base legal

O tratamento de dados de saúde no InfoMed tem como base o consentimento específico e destacado do titular (BRASIL, 2018, art. 11, I). O aceite é obrigatório para o cadastro, menciona expressamente dados pessoais e de saúde e é registrado com data e hora em `profiles.lgpd_consent_at`, campo que o titular não pode alterar.

## 9.2 Princípios do art. 6º

Quadro 7 – Aderência aos princípios da LGPD

| Princípio | Como o InfoMed atende |
|---|---|
| Finalidade e adequação | Dados usados apenas para agendamento, lembretes e notificações do próprio titular |
| Necessidade (minimização) | Perfil com poucos campos; triagem sem envio do texto; BI apenas com agregados |
| Livre acesso | Titular visualiza perfil, consultas, lembretes e notificações (exportação pendente, V06) |
| Qualidade dos dados | Titular corrige nome, telefone e nascimento no Perfil, com validação |
| Transparência | Aviso no cadastro e na triagem; política de privacidade pendente (V06) |
| Segurança | RLS, GRANT mínimo, HTTPS, testes automatizados (seções 6 e 7) |
| Prevenção | Modelagem de ameaças e testes executados antes de cada integração |
| Não discriminação | Dados não são usados para perfilamento; a triagem apenas sugere especialidade |
| Responsabilização e prestação de contas | Decisões registradas em ADRs, testes e este relatório |

Fonte: elaborado pelos autores com base em Brasil (2018).

## 9.3 Direitos do titular (art. 18)

Quadro 8 – Atendimento aos direitos do titular

| Direito | Situação |
|---|---|
| Confirmação e acesso aos dados | Atendido pelas telas do app |
| Correção | Atendido (Perfil) |
| Anonimização, bloqueio ou eliminação | Pendente: exclusão da conta apenas pelo administrador do Supabase |
| Portabilidade | Pendente: sem exportação de dados |
| Informação sobre compartilhamento | Parcial: Supabase, Vercel e OpenStreetMap devem constar na política de privacidade |
| Revogação do consentimento | Pendente: depende da exclusão de conta |

Fonte: elaborado pelos autores com base em Brasil (2018).

## 9.4 Operadores e transferência internacional

Supabase (banco e autenticação, região de São Paulo) e Vercel (hospedagem do front-end, rede global de distribuição) atuam como operadores. Os dados pessoais ficam armazenados no Brasil; os arquivos estáticos do aplicativo, que não contêm dados pessoais, são distribuídos globalmente pela Vercel.

# 10 MATRIZ DE RISCOS E PLANO DE AÇÃO

## 10.1 Matriz de riscos

Quadro 9 – Matriz de riscos dos achados abertos (P = probabilidade, I = impacto, de 1 a 3)

| ID | P | I | Risco | Nível |
|---|---|---|---|---|
| V02 | 2 | 3 | 6 | Alto |
| V03 | 1 | 3 | 3 | Médio |
| V04 | 1 | 2 | 2 | Baixo |
| V05 | 2 | 2 | 4 | Médio |
| V06 | 2 | 2 | 4 | Médio |
| V07 | 2 | 2 | 4 | Médio |
| V08 | 2 | 2 | 4 | Médio |
| V09 | 1 | 3 | 3 | Médio |
| V10 | 1 | 2 | 2 | Baixo |
| V11 | 2 | 1 | 2 | Baixo |

Fonte: elaborado pelos autores (2026).

## 10.2 Plano de ação

Quadro 10 – Plano de ação priorizado

| Prioridade | Ação | Achado | Esforço |
|---|---|---|---|
| 1 | Trocar a senha do banco no Supabase | V02 | 5 minutos |
| 2 | Atualizar dependências de desenvolvimento e repetir os testes | V03 | 1 hora |
| 3 | Adicionar a Content-Security-Policy no `vercel.json` (demais cabeçalhos já aplicados) | V04 | 1 hora |
| 4 | Publicar política de privacidade e criar exclusão e exportação de dados | V06 | 1 a 2 dias |
| 5 | Reativar a confirmação de e-mail para uso real | V05 | 5 minutos |
| 6 | Separar o banco de homologação | V07 | 2 horas |
| 7 | Rotina de backup com teste de restauração | V09 | 2 horas |
| 8 | Trilha de auditoria de eventos sensíveis | V08 | 1 dia |

Fonte: elaborado pelos autores (2026).

# 11 PLANO DE RESPOSTA A INCIDENTES

Em caso de suspeita de incidente de segurança (por exemplo, acesso indevido a dados ou vazamento de credenciais), a equipe adotará as seguintes etapas:

a) **detecção e registro**: anotar data, hora, sintomas e evidências (logs do Supabase e da Vercel);
b) **contenção**: revogar sessões e chaves comprometidas, trocar a senha do banco e, se necessário, retornar o aplicativo a uma versão anterior pelo recurso de *rollback* da Vercel;
c) **erradicação**: corrigir a causa em uma branch `hotfix/*`, com teste automatizado que reproduza a falha;
d) **recuperação**: publicar a correção pela esteira e restaurar dados a partir de backup, se houver perda;
e) **comunicação**: avaliar o risco aos titulares e, havendo risco ou dano relevante, comunicar a ANPD e os titulares, conforme o art. 48 da LGPD;
f) **lições aprendidas**: registrar o incidente e as melhorias em um ADR.

# 12 CONSIDERAÇÕES FINAIS

A análise mostrou que o InfoMed adota controles adequados à natureza sensível dos dados que trata. O principal acerto de projeto foi colocar a autorização no banco de dados, por meio de RLS, GRANT mínimo e regras em gatilhos, e não no código do aplicativo, que pode ser manipulado pelo usuário. Esse controle é verificado automaticamente por 52 asserções a cada alteração, e os testes por mutação comprovam que as proteções críticas não podem ser removidas sem que a esteira acuse a falha.

O processo também evidenciou o valor da revisão contínua: a escalada de privilégio no perfil (V01) só foi percebida ao se introduzir o papel de administrador, e foi corrigida com um teste que impede sua reincidência. A senha versionada (V02) reforça que segredos removidos do repositório continuam no histórico e precisam ser trocados.

Para o propósito acadêmico e de demonstração, o nível de segurança é satisfatório. Para operação real com cidadãos, recomenda-se executar o plano de ação da seção 10, com prioridade para a troca da senha, a atualização das dependências, os cabeçalhos de segurança e a implementação completa dos direitos do titular previstos na LGPD.

# REFERÊNCIAS

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **ABNT NBR ISO/IEC 27001**: segurança da informação, segurança cibernética e proteção à privacidade: sistemas de gestão da segurança da informação: requisitos. Rio de Janeiro: ABNT, 2022a.

ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. **ABNT NBR ISO/IEC 27002**: segurança da informação, segurança cibernética e proteção à privacidade: controles de segurança da informação. Rio de Janeiro: ABNT, 2022b.

BRASIL. Lei nº 13.709, de 14 de agosto de 2018. Lei Geral de Proteção de Dados Pessoais (LGPD). **Diário Oficial da União**: seção 1, Brasília, DF, 15 ago. 2018.

NATIONAL INSTITUTE OF STANDARDS AND TECHNOLOGY. **NIST Special Publication 800-63B**: digital identity guidelines: authentication and lifecycle management. Gaithersburg: NIST, 2017.

OWASP FOUNDATION. **OWASP Top 10:2021**. [S. l.]: OWASP Foundation, 2021. Disponível em: https://owasp.org/Top10/. Acesso em: 20 nov. 2026.

POSTGRESQL GLOBAL DEVELOPMENT GROUP. **PostgreSQL 16 documentation**: row security policies. [S. l.], 2024. Disponível em: https://www.postgresql.org/docs/16/ddl-rowsecurity.html. Acesso em: 20 nov. 2026.

SHOSTACK, Adam. **Threat modeling**: designing for security. Indianapolis: Wiley, 2014.

SUPABASE. **Row Level Security**. [S. l.], 2026. Disponível em: https://supabase.com/docs/guides/database/postgres/row-level-security. Acesso em: 20 nov. 2026.

# APÊNDICE A – VERIFICAÇÕES AUTOMATIZADAS DE SEGURANÇA DO BANCO DE DADOS

Verificações executadas por `db/ci/tests.sql` a cada *push* e *pull request*. Cada linha falha a esteira se o resultado não for o esperado.

Quadro 11 – Verificações automatizadas executadas pela integração contínua

| Nº | Grupo | Verificação |
|---|---|---|
| 1 | Cadastro | Gatilho cria o perfil de cada usuário cadastrado |
| 2 | Cadastro | Data do aceite da LGPD gravada no perfil |
| 3 | Visitante | Não consegue inserir no catálogo |
| 4 | Visitante | Não lê consultas |
| 5 | Visitante | Não lê lembretes |
| 6 | Isolamento | Maria agenda e vê a própria consulta |
| 7 | Isolamento | João não vê a consulta da Maria |
| 8 | Isolamento | João não vê a consulta da Maria na view `my_appointments` |
| 9 | Isolamento | João vê o horário ocupado sem saber de quem é |
| 10 | Regras | Horário duplicado para o mesmo médico é recusado |
| 11 | Regras | Horário fora da grade de 30 minutos é recusado |
| 12–13 | Regras | Horários fora do expediente da unidade são recusados |
| 14 | Regras | Horário no passado é recusado |
| 15 | Regras | Fim de semana é recusado |
| 16 | Regras | Agendamento muito distante ou fora das regras é recusado |
| 17 | Falsificação | João não cria consulta em nome da Maria |
| 18 | Regras | Último horário do expediente é aceito |
| 19 | Adulteração | Paciente não muda o status para "concluída" |
| 20 | Adulteração | Paciente não muda o horário da consulta |
| 21 | Adulteração | Paciente não transfere a consulta para outro usuário |
| 22 | Integridade | Notificação de agendamento criada pelo servidor |
| 23 | Falsificação | Paciente não cria notificação |
| 24–26 | Integridade | Cancelamento próprio permitido, notificado e com liberação do horário |
| 27–31 | Validação | Lembrete válido aceito; horários, nome e dias inválidos recusados |
| 32 | Isolamento | Maria não vê o lembrete do João |
| 33 | Isolamento | Maria vê somente a própria consulta |
| 34 | Isolamento | Maria vê somente o próprio perfil |
| 35 | Perfil | Titular edita nome, telefone e nascimento |
| 36–40 | Perfil | Telefone, nascimento e nome inválidos recusados |
| 41 | Privilégio | Usuário comum não se promove a administrador |
| 42 | Privilégio | Usuário comum não apaga o aceite da LGPD |
| 43 | Privilégio | Usuário comum não é administrador |
| 44 | BI | Usuário comum não executa o painel |
| 45 | BI | Promoção manual de administrador surte efeito |
| 46 | BI | Administrador recebe os indicadores corretos |
| 47 | BI | Administrador recebe as séries do painel |
| 48 | BI / LGPD | Painel não devolve ids, e-mails nem nomes |
| 49–50 | BI | Período fora de 1 a 365 dias é recusado |
| 51 | BI | Outro usuário comum continua sem acesso ao painel |
| 52 | Isolamento | Usuário não enxerga o perfil nem o papel do administrador |

Fonte: elaborado pelos autores a partir de `db/ci/tests.sql` (2026).

# APÊNDICE B – MINUTA DE POLÍTICA DE PRIVACIDADE

**Observação:** minuta elaborada para fins acadêmicos. Antes de uso real, deve ser revisada e publicada no aplicativo.

**1. Quem somos.** O InfoMed é um aplicativo desenvolvido como Trabalho de Conclusão de Curso para facilitar o acesso a informações de saúde pública em Santa Bárbara d'Oeste (SP). Contato do encarregado: [E-MAIL DA EQUIPE].

**2. Quais dados coletamos.** Nome, e-mail, telefone e data de nascimento (opcionais, exceto nome e e-mail); consultas agendadas; lembretes de medicação; notificações; data do aceite desta política.

**3. Dados que não coletamos.** O texto digitado na triagem e no assistente é analisado no seu aparelho e não é enviado nem armazenado. Sua localização no recurso "Perto de mim" é usada apenas no aparelho.

**4. Para que usamos.** Para permitir o agendamento, enviar lembretes e notificações e exibir seu histórico. Indicadores de uso são gerados apenas de forma agregada, sem identificar pessoas.

**5. Base legal.** Consentimento específico e destacado (LGPD, arts. 7º, I, e 11, I).

**6. Com quem compartilhamos.** Supabase (armazenamento e autenticação, com dados no Brasil), Vercel (hospedagem do aplicativo) e OpenStreetMap (imagens do mapa, que recebem o endereço IP do aparelho). Não vendemos dados.

**7. Segurança.** Seus dados são protegidos por criptografia no transporte e por regras no banco de dados que impedem que outro usuário os acesse.

**8. Seus direitos.** Você pode acessar e corrigir seus dados no Perfil e solicitar a exclusão da conta, a portabilidade ou a revogação do consentimento pelo contato do item 1.

**9. Retenção.** Os dados são mantidos enquanto a conta estiver ativa e excluídos após a solicitação de exclusão.

**10. Alterações.** Mudanças nesta política serão informadas no aplicativo.
