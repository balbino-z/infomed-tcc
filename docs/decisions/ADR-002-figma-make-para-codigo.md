# ADR-002: Do protótipo do Figma Make para código de produção

- **Status:** Aceita
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Projeto Integrador II, Modelagem de Padrões de Projetos, Sistemas de Informação e Tecnologias Emergentes

## Contexto

O protótipo do InfoMed foi gerado no Figma Make, ferramenta de geração de interfaces com apoio de inteligência artificial, a partir de um prompt que descrevia 17 telas e os fluxos de navegação. O resultado exportado contém 20 telas em React e TypeScript com Tailwind, porém com características de protótipo, não de produto.

Uma análise do código exportado identificou os seguintes problemas:

| Achado | Impacto |
|---|---|
| `package.json` com entradas no formato `pacote@versão` próprias do ambiente do Figma | `npm install` falhava fora do Figma (erro `EINVALIDPACKAGENAME`) |
| Imports com versão no nome (ex.: `lucide-react@0.487.0`) em dezenas de arquivos | Build falhava fora do Figma |
| Dependências sem uso (MUI, emotion, react-slick, react-dnd, entre outras) | Peso desnecessário e instalação lenta |
| Navegação feita por estado (`useState`), sem rotas | Botão voltar e links diretos não funcionam; prejudica o PWA |
| Dados fixos dentro de cada tela | Sem camada de dados, impossibilita a persistência e o uso de padrões de projeto |
| Uso de `any` e ausência de `tsconfig.json` | Sem verificação de tipos |
| Moldura de iPhone envolvendo a aplicação | Inadequada para uso em dispositivo real |
| Textos fixos (nome do usuário, mês, contador de notificações) | Não refletem dados reais |
| Ausência de controle de versão, testes e integração contínua | Não atende à disciplina de entrega contínua |

## Decisão

Tratar o código exportado como **ponto de partida de interface**, e não como arquitetura final. Foi adotado um processo de refatoração em etapas:

1. Limpar dependências e corrigir imports para que o projeto execute fora do Figma.
2. Versionar o projeto no GitHub.
3. Configurar o TypeScript e eliminar erros de tipo.
4. Introduzir camadas de domínio e repositório (ver ADR-003).
5. Substituir a navegação por estado por rotas.
6. Remover a moldura de iPhone em dispositivos móveis.
7. Substituir dados fixos por dados vindos do backend (ver ADR-004).

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Reescrever o front-end do zero | Desperdiçaria o protótipo validado e consumiria o prazo |
| Usar o código exportado sem alterações | Resultaria em produto sem persistência, segurança ou testabilidade |

## Consequências

**Positivas**
- Ganho de velocidade na interface, com foco do esforço na lógica e na arquitetura.
- Processo documentado, útil como discussão sobre o uso de IA generativa no desenvolvimento de software.

**Negativas / riscos**
- Código gerado exige revisão cuidadosa.
- Parte do código de interface (componentes de UI não utilizados) permanece até a limpeza final.

## Evidências

- Mensagens de erro do `npm install` antes da correção
- Histórico de commits do repositório
- Comparação do `package.json` antes e depois
