# ADR-007: Variáveis de ambiente e gestão de chaves

- **Status:** Aceita
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Segurança e Defesa Cibernética, Integração e Entrega Contínua

## Contexto

Ao integrar o Supabase, o aplicativo precisa da URL do projeto e de uma chave de acesso. Segredos versionados no GitHub são uma falha de segurança comum e grave. Era necessário definir quais chaves podem estar no front-end, onde ficam as configurações e como evitar vazamentos.

## Decisão

1. Usar apenas a **chave publishable** (formato `sb_publishable_...`) e a **URL do projeto** no front-end. Essa chave é pública por natureza: sem sessão de usuário, as requisições assumem o papel `anon`, e o acesso é limitado pelo RLS (ver ADR-004).
2. **Nunca** usar no front-end, nem versionar, a chave **secret** (ou `service_role`), pois ela ignora o RLS.
3. Guardar as configurações em um arquivo **`.env`**, listado no `.gitignore`. O repositório contém somente o **`.env.example`**, com valores fictícios, como modelo.
4. No CI/CD (ver ADR-006), as variáveis serão cadastradas como **secrets** do GitHub e do serviço de hospedagem.
5. O código seleciona a implementação do repositório conforme a presença das variáveis: com `.env`, usa Supabase; sem ele, usa o Mock. Isso permite rodar testes e build sem credenciais.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Colocar as chaves diretamente no código | Vaza no repositório e no histórico do git |
| Usar a chave `service_role` no front-end | Ignora o RLS: qualquer visitante teria acesso total ao banco |
| Intermediar tudo por uma API própria | Complexidade desnecessária para o prazo |

## Consequências

**Positivas**
- Nenhum segredo no repositório.
- Separação clara entre configuração e código.
- O projeto roda em qualquer máquina sem credenciais, em modo Mock.

**Negativas / riscos**
- Cada ambiente (desenvolvimento, produção) precisa ser configurado manualmente.
- Variáveis do Vite com prefixo `VITE_` ficam visíveis no navegador, portanto nunca devem conter segredos de servidor.

## Evidências

- Arquivos `.env.example` e `.gitignore`
- Print do `git status` sem o `.env`
- Print do repositório no GitHub sem o arquivo `.env`
