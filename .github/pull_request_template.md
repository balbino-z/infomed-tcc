## O que muda
<!-- Descreva a tarefa em 1 a 3 frases. Ex.: "T12: tela de Perfil lendo do banco" -->

## Tipo
- [ ] feature (nova funcionalidade)
- [ ] fix / hotfix (correção)
- [ ] docs (documentação)
- [ ] chore (configuração, CI, dependências)

## Como testar
<!-- Passo a passo para o revisor conferir. Ex.: "abrir /perfil, editar telefone, salvar" -->
1.

## Checklist de quem abriu o PR
- [ ] `npm run typecheck` sem erros
- [ ] `npm test` passando
- [ ] `npm run build` concluído
- [ ] SQL novo em arquivo numerado (`db/NN_...sql`) e `db/ci/tests.sql` atualizado, se mexeu no banco
- [ ] Nenhuma senha, chave ou `.env` no commit
- [ ] ADR / ficha / PROGRESSO.md atualizados, se aplicável

## Checklist do revisor
- [ ] CI verde (jobs App e Database)
- [ ] Testei o link de Preview da Vercel
- [ ] Código segue as regras do `CONTEXTO-IA.md` (telas não acessam o Supabase direto, sem `any` novo)
