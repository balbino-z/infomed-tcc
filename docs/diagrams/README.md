# Diagramas do InfoMed

> Gerado por `node scripts/gerar-diagramas.mjs`. Não editar à mão: edite os arquivos `.md` desta pasta e rode o script de novo.

Cada diagrama existe em **SVG** (vetorial: melhor para o Word/PDF do TCC, não perde qualidade) e **PNG** (para slides). Os arquivos estão em [`imagens/`](imagens/). O código-fonte Mermaid de cada um está no `.md` indicado.

## Sumário

| # | Diagrama | Seção | Fonte | Arquivos |
|---|---|---|---|---|
| 1 | Casos de uso | Casos de uso | [`casos-de-uso.md`](casos-de-uso.md) | [SVG](imagens/casos-de-uso-01-casos-de-uso.svg) · [PNG](imagens/casos-de-uso-01-casos-de-uso.png) |
| 2 | Visão geral | Arquitetura e implantação | [`arquitetura.md`](arquitetura.md) | [SVG](imagens/arquitetura-01-visao-geral.svg) · [PNG](imagens/arquitetura-01-visao-geral.png) |
| 3 | Camadas do front-end | Arquitetura e implantação | [`arquitetura.md`](arquitetura.md) | [SVG](imagens/arquitetura-02-camadas-do-front-end.svg) · [PNG](imagens/arquitetura-02-camadas-do-front-end.png) |
| 4 | Implantação (onde cada parte roda) | Arquitetura e implantação | [`arquitetura.md`](arquitetura.md) | [SVG](imagens/arquitetura-03-implantacao-onde-cada-parte-roda.svg) · [PNG](imagens/arquitetura-03-implantacao-onde-cada-parte-roda.png) |
| 5 | Mapa de navegação (telas e rotas) | Mapa de navegação | [`navegacao.md`](navegacao.md) | [SVG](imagens/navegacao-01-mapa-de-navegacao-telas-e-rotas.svg) · [PNG](imagens/navegacao-01-mapa-de-navegacao-telas-e-rotas.png) |
| 6 | Diagrama de classes do domínio | Classes do domínio e repositórios | [`classes-dominio.md`](classes-dominio.md) | [SVG](imagens/classes-dominio-01-diagrama-de-classes-do-dominio.svg) · [PNG](imagens/classes-dominio-01-diagrama-de-classes-do-dominio.png) |
| 7 | Repositórios (interfaces) | Classes do domínio e repositórios | [`classes-dominio.md`](classes-dominio.md) | [SVG](imagens/classes-dominio-02-repositorios-interfaces.svg) · [PNG](imagens/classes-dominio-02-repositorios-interfaces.png) |
| 8 | Modelo de dados (ER) | Modelo de dados (ER) | [`modelo-er.md`](modelo-er.md) | [SVG](imagens/modelo-er-01-modelo-de-dados-er.svg) · [PNG](imagens/modelo-er-01-modelo-de-dados-er.png) |
| 9 | Repository (ADR-003) | Padrões de projeto | [`padroes-de-projeto.md`](padroes-de-projeto.md) | [SVG](imagens/padroes-de-projeto-01-repository-adr-003.svg) · [PNG](imagens/padroes-de-projeto-01-repository-adr-003.png) |
| 10 | Factory (ADR-011) | Padrões de projeto | [`padroes-de-projeto.md`](padroes-de-projeto.md) | [SVG](imagens/padroes-de-projeto-02-factory-adr-011.svg) · [PNG](imagens/padroes-de-projeto-02-factory-adr-011.png) |
| 11 | Observer (ADR-012) | Padrões de projeto | [`padroes-de-projeto.md`](padroes-de-projeto.md) | [SVG](imagens/padroes-de-projeto-03-observer-adr-012.svg) · [PNG](imagens/padroes-de-projeto-03-observer-adr-012.png) |
| 12 | Observer (ADR-012) | Padrões de projeto | [`padroes-de-projeto.md`](padroes-de-projeto.md) | [SVG](imagens/padroes-de-projeto-04-observer-adr-012.svg) · [PNG](imagens/padroes-de-projeto-04-observer-adr-012.png) |
| 13 | Strategy (ADR-013) | Padrões de projeto | [`padroes-de-projeto.md`](padroes-de-projeto.md) | [SVG](imagens/padroes-de-projeto-05-strategy-adr-013.svg) · [PNG](imagens/padroes-de-projeto-05-strategy-adr-013.png) |
| 14 | Chain of Responsibility: assistente (ADR-016) | Padrões de projeto | [`padroes-de-projeto.md`](padroes-de-projeto.md) | [SVG](imagens/padroes-de-projeto-06-chain-of-responsibility-assistente-adr-016.svg) · [PNG](imagens/padroes-de-projeto-06-chain-of-responsibility-assistente-adr-016.png) |
| 15 | Chain of Responsibility: assistente (ADR-016) | Padrões de projeto | [`padroes-de-projeto.md`](padroes-de-projeto.md) | [SVG](imagens/padroes-de-projeto-07-chain-of-responsibility-assistente-adr-016.svg) · [PNG](imagens/padroes-de-projeto-07-chain-of-responsibility-assistente-adr-016.png) |
| 16 | 1. Agendar uma consulta (Factory + regras no banco + notificação) | Diagramas de sequência | [`sequencias.md`](sequencias.md) | [SVG](imagens/sequencias-01-1-agendar-uma-consulta-factory-regras-no-banco-not.svg) · [PNG](imagens/sequencias-01-1-agendar-uma-consulta-factory-regras-no-banco-not.png) |
| 17 | 2. Triagem por IA (sintoma para especialidade) | Diagramas de sequência | [`sequencias.md`](sequencias.md) | [SVG](imagens/sequencias-02-2-triagem-por-ia-sintoma-para-especialidade.svg) · [PNG](imagens/sequencias-02-2-triagem-por-ia-sintoma-para-especialidade.png) |
| 18 | 3. Assistente: "Onde tem Losartana?" | Diagramas de sequência | [`sequencias.md`](sequencias.md) | [SVG](imagens/sequencias-03-3-assistente-onde-tem-losartana.svg) · [PNG](imagens/sequencias-03-3-assistente-onde-tem-losartana.png) |
| 19 | 4. Painel de BI (só administrador) | Diagramas de sequência | [`sequencias.md`](sequencias.md) | [SVG](imagens/sequencias-04-4-painel-de-bi-so-administrador.svg) · [PNG](imagens/sequencias-04-4-painel-de-bi-so-administrador.png) |
| 20 | 5. Aviso "Hora do remédio" (Observer) | Diagramas de sequência | [`sequencias.md`](sequencias.md) | [SVG](imagens/sequencias-05-5-aviso-hora-do-remedio-observer.svg) · [PNG](imagens/sequencias-05-5-aviso-hora-do-remedio-observer.png) |
| 21 | Fluxo de autenticação e consentimento | Cadastro com LGPD | [`fluxo-autenticacao.md`](fluxo-autenticacao.md) | [SVG](imagens/fluxo-autenticacao-01-fluxo-de-autenticacao-e-consentimento.svg) · [PNG](imagens/fluxo-autenticacao-01-fluxo-de-autenticacao-e-consentimento.png) |
| 22 | Estados de uma consulta | Estados e atividades | [`estados-e-atividades.md`](estados-e-atividades.md) | [SVG](imagens/estados-e-atividades-01-estados-de-uma-consulta.svg) · [PNG](imagens/estados-e-atividades-01-estados-de-uma-consulta.png) |
| 23 | Estados de um lembrete | Estados e atividades | [`estados-e-atividades.md`](estados-e-atividades.md) | [SVG](imagens/estados-e-atividades-02-estados-de-um-lembrete.svg) · [PNG](imagens/estados-e-atividades-02-estados-de-um-lembrete.png) |
| 24 | Atividade: agendamento completo | Estados e atividades | [`estados-e-atividades.md`](estados-e-atividades.md) | [SVG](imagens/estados-e-atividades-03-atividade-agendamento-completo.svg) · [PNG](imagens/estados-e-atividades-03-atividade-agendamento-completo.png) |
| 25 | Atividade: cadastro e entrada | Estados e atividades | [`estados-e-atividades.md`](estados-e-atividades.md) | [SVG](imagens/estados-e-atividades-04-atividade-cadastro-e-entrada.svg) · [PNG](imagens/estados-e-atividades-04-atividade-cadastro-e-entrada.png) |
| 26 | Pipeline de treino (feito no computador, por script) | IA: triagem | [`ia-triagem.md`](ia-triagem.md) | [SVG](imagens/ia-triagem-01-pipeline-de-treino-feito-no-computador-por-script.svg) · [PNG](imagens/ia-triagem-01-pipeline-de-treino-feito-no-computador-por-script.png) |
| 27 | Uso no app (no aparelho, a cada pergunta) | IA: triagem | [`ia-triagem.md`](ia-triagem.md) | [SVG](imagens/ia-triagem-02-uso-no-app-no-aparelho-a-cada-pergunta.svg) · [PNG](imagens/ia-triagem-02-uso-no-app-no-aparelho-a-cada-pergunta.png) |
| 28 | Como o Naive Bayes decide (fórmula) | IA: triagem | [`ia-triagem.md`](ia-triagem.md) | [SVG](imagens/ia-triagem-03-como-o-naive-bayes-decide-formula.svg) · [PNG](imagens/ia-triagem-03-como-o-naive-bayes-decide-formula.png) |
| 29 | Fluxo de dados do painel de BI (ADR-015) | BI e segurança | [`bi-e-seguranca.md`](bi-e-seguranca.md) | [SVG](imagens/bi-e-seguranca-01-fluxo-de-dados-do-painel-de-bi-adr-015.svg) · [PNG](imagens/bi-e-seguranca-01-fluxo-de-dados-do-painel-de-bi-adr-015.png) |
| 30 | Camadas de segurança (defesa em profundidade) | BI e segurança | [`bi-e-seguranca.md`](bi-e-seguranca.md) | [SVG](imagens/bi-e-seguranca-02-camadas-de-seguranca-defesa-em-profundidade.svg) · [PNG](imagens/bi-e-seguranca-02-camadas-de-seguranca-defesa-em-profundidade.png) |
| 31 | Como o RLS decide (exemplo: listar consultas) | BI e segurança | [`bi-e-seguranca.md`](bi-e-seguranca.md) | [SVG](imagens/bi-e-seguranca-03-como-o-rls-decide-exemplo-listar-consultas.svg) · [PNG](imagens/bi-e-seguranca-03-como-o-rls-decide-exemplo-listar-consultas.png) |
| 32 | Correção de escalada de privilégio (db/08_bi.sql) | BI e segurança | [`bi-e-seguranca.md`](bi-e-seguranca.md) | [SVG](imagens/bi-e-seguranca-04-correcao-de-escalada-de-privilegio-db-08-bi-sql.svg) · [PNG](imagens/bi-e-seguranca-04-correcao-de-escalada-de-privilegio-db-08-bi-sql.png) |
| 33 | Pipeline completo | Integração e entrega contínua | [`ci-cd.md`](ci-cd.md) | [SVG](imagens/ci-cd-01-pipeline-completo.svg) · [PNG](imagens/ci-cd-01-pipeline-completo.png) |
| 34 | Ciclo de uma mudança | Integração e entrega contínua | [`ci-cd.md`](ci-cd.md) | [SVG](imagens/ci-cd-02-ciclo-de-uma-mudanca.svg) · [PNG](imagens/ci-cd-02-ciclo-de-uma-mudanca.png) |
| 35 | Arquitetura proposta | Proposta de IoT (não implementada) | [`iot-proposta.md`](iot-proposta.md) | [SVG](imagens/iot-proposta-01-arquitetura-proposta.svg) · [PNG](imagens/iot-proposta-01-arquitetura-proposta.png) |
| 36 | Sequência proposta | Proposta de IoT (não implementada) | [`iot-proposta.md`](iot-proposta.md) | [SVG](imagens/iot-proposta-02-sequencia-proposta.svg) · [PNG](imagens/iot-proposta-02-sequencia-proposta.png) |

## Casos de uso

### 1. Casos de uso

![Casos de uso](imagens/casos-de-uso-01-casos-de-uso.svg)

## Arquitetura e implantação

### 2. Visão geral

![Visão geral](imagens/arquitetura-01-visao-geral.svg)

### 3. Camadas do front-end

![Camadas do front-end](imagens/arquitetura-02-camadas-do-front-end.svg)

### 4. Implantação (onde cada parte roda)

![Implantação (onde cada parte roda)](imagens/arquitetura-03-implantacao-onde-cada-parte-roda.svg)

## Mapa de navegação

### 5. Mapa de navegação (telas e rotas)

![Mapa de navegação (telas e rotas)](imagens/navegacao-01-mapa-de-navegacao-telas-e-rotas.svg)

## Classes do domínio e repositórios

### 6. Diagrama de classes do domínio

![Diagrama de classes do domínio](imagens/classes-dominio-01-diagrama-de-classes-do-dominio.svg)

### 7. Repositórios (interfaces)

![Repositórios (interfaces)](imagens/classes-dominio-02-repositorios-interfaces.svg)

## Modelo de dados (ER)

### 8. Modelo de dados (ER)

![Modelo de dados (ER)](imagens/modelo-er-01-modelo-de-dados-er.svg)

## Padrões de projeto

### 9. Repository (ADR-003)

![Repository (ADR-003)](imagens/padroes-de-projeto-01-repository-adr-003.svg)

### 10. Factory (ADR-011)

![Factory (ADR-011)](imagens/padroes-de-projeto-02-factory-adr-011.svg)

### 11. Observer (ADR-012)

![Observer (ADR-012)](imagens/padroes-de-projeto-03-observer-adr-012.svg)

### 12. Observer (ADR-012)

![Observer (ADR-012)](imagens/padroes-de-projeto-04-observer-adr-012.svg)

### 13. Strategy (ADR-013)

![Strategy (ADR-013)](imagens/padroes-de-projeto-05-strategy-adr-013.svg)

### 14. Chain of Responsibility: assistente (ADR-016)

![Chain of Responsibility: assistente (ADR-016)](imagens/padroes-de-projeto-06-chain-of-responsibility-assistente-adr-016.svg)

### 15. Chain of Responsibility: assistente (ADR-016)

![Chain of Responsibility: assistente (ADR-016)](imagens/padroes-de-projeto-07-chain-of-responsibility-assistente-adr-016.svg)

## Diagramas de sequência

### 16. 1. Agendar uma consulta (Factory + regras no banco + notificação)

![1. Agendar uma consulta (Factory + regras no banco + notificação)](imagens/sequencias-01-1-agendar-uma-consulta-factory-regras-no-banco-not.svg)

### 17. 2. Triagem por IA (sintoma para especialidade)

![2. Triagem por IA (sintoma para especialidade)](imagens/sequencias-02-2-triagem-por-ia-sintoma-para-especialidade.svg)

### 18. 3. Assistente: "Onde tem Losartana?"

![3. Assistente: "Onde tem Losartana?"](imagens/sequencias-03-3-assistente-onde-tem-losartana.svg)

### 19. 4. Painel de BI (só administrador)

![4. Painel de BI (só administrador)](imagens/sequencias-04-4-painel-de-bi-so-administrador.svg)

### 20. 5. Aviso "Hora do remédio" (Observer)

![5. Aviso "Hora do remédio" (Observer)](imagens/sequencias-05-5-aviso-hora-do-remedio-observer.svg)

## Cadastro com LGPD

### 21. Fluxo de autenticação e consentimento

![Fluxo de autenticação e consentimento](imagens/fluxo-autenticacao-01-fluxo-de-autenticacao-e-consentimento.svg)

## Estados e atividades

### 22. Estados de uma consulta

![Estados de uma consulta](imagens/estados-e-atividades-01-estados-de-uma-consulta.svg)

### 23. Estados de um lembrete

![Estados de um lembrete](imagens/estados-e-atividades-02-estados-de-um-lembrete.svg)

### 24. Atividade: agendamento completo

![Atividade: agendamento completo](imagens/estados-e-atividades-03-atividade-agendamento-completo.svg)

### 25. Atividade: cadastro e entrada

![Atividade: cadastro e entrada](imagens/estados-e-atividades-04-atividade-cadastro-e-entrada.svg)

## IA: triagem

### 26. Pipeline de treino (feito no computador, por script)

![Pipeline de treino (feito no computador, por script)](imagens/ia-triagem-01-pipeline-de-treino-feito-no-computador-por-script.svg)

### 27. Uso no app (no aparelho, a cada pergunta)

![Uso no app (no aparelho, a cada pergunta)](imagens/ia-triagem-02-uso-no-app-no-aparelho-a-cada-pergunta.svg)

### 28. Como o Naive Bayes decide (fórmula)

![Como o Naive Bayes decide (fórmula)](imagens/ia-triagem-03-como-o-naive-bayes-decide-formula.svg)

## BI e segurança

### 29. Fluxo de dados do painel de BI (ADR-015)

![Fluxo de dados do painel de BI (ADR-015)](imagens/bi-e-seguranca-01-fluxo-de-dados-do-painel-de-bi-adr-015.svg)

### 30. Camadas de segurança (defesa em profundidade)

![Camadas de segurança (defesa em profundidade)](imagens/bi-e-seguranca-02-camadas-de-seguranca-defesa-em-profundidade.svg)

### 31. Como o RLS decide (exemplo: listar consultas)

![Como o RLS decide (exemplo: listar consultas)](imagens/bi-e-seguranca-03-como-o-rls-decide-exemplo-listar-consultas.svg)

### 32. Correção de escalada de privilégio (db/08_bi.sql)

![Correção de escalada de privilégio (db/08_bi.sql)](imagens/bi-e-seguranca-04-correcao-de-escalada-de-privilegio-db-08-bi-sql.svg)

## Integração e entrega contínua

### 33. Pipeline completo

![Pipeline completo](imagens/ci-cd-01-pipeline-completo.svg)

### 34. Ciclo de uma mudança

![Ciclo de uma mudança](imagens/ci-cd-02-ciclo-de-uma-mudanca.svg)

## Proposta de IoT (não implementada)

### 35. Arquitetura proposta

![Arquitetura proposta](imagens/iot-proposta-01-arquitetura-proposta.svg)

### 36. Sequência proposta

![Sequência proposta](imagens/iot-proposta-02-sequencia-proposta.svg)
