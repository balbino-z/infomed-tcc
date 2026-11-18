# ADR-013: Padrão Strategy para filtros e ordenação dos postos

- **Status:** Aceita (implementada em 20/10/2026)
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Modelagem de Padrões de Projetos, Programação Multi Plataforma

## Contexto

A lista de postos precisa permitir filtrar por vários critérios (aberto agora, distância, serviços oferecidos e medicamento disponível) e ordenar por nome ou por distância. A tela de filtros do protótipo era apenas visual. Implementar tudo com uma sequência de `if` dentro da tela deixaria o código difícil de testar e de estender a cada novo critério.

## Decisão

1. Aplicar o padrão **Strategy**: cada critério é um objeto que implementa a mesma interface e pode ser combinado ou trocado sem alterar quem o utiliza.
   - `UnitFilterStrategy` (`matches(unit, ctx)`): `OpenNowFilter`, `ServicesFilter`, `MaxDistanceFilter`, `MedicationAvailableFilter`.
   - `UnitSortStrategy` (`compare(a, b, ctx)`): `NameSort` e `DistanceSort`.
2. `buildFilterStrategies` traduz as escolhas da tela (`UnitFilters`) em uma lista de estratégias; `filterUnits` aplica todas com E lógico e depois a ordenação. A tela só conhece essas duas funções.
3. As estratégias recebem um **contexto** (`FilterContext`) com o horário atual, a localização do usuário e as unidades que têm o medicamento, o que mantém as regras puras e testáveis com relógio simulado.
4. Regras definidas: serviços exigem **todos** os marcados; sem localização, o filtro de distância **não exclui ninguém** e a ordenação por distância cai para nome; enquanto o estoque do medicamento carrega, nenhuma unidade é excluída.
5. Os filtros ficam em memória na navegação (`AppData`) e são aplicados na lista; um contador no botão "Filtros" mostra quantos estão ativos. Quem escolhe filtrar por distância tem a localização solicitada automaticamente.
6. A lista de serviços da tela de filtros vem das próprias unidades, para só oferecer opções que existem.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| `if` encadeados na tela | Difícil de testar e de estender; mistura regra e interface |
| Filtrar no banco (consulta SQL) | As regras de horário e distância dependem do relógio e da localização do aparelho |
| Biblioteca de filtros | Dependência desnecessária para quatro regras simples |

## Consequências

**Positivas**
- Novo critério = nova classe e uma linha em `buildFilterStrategies`; nada muda nas telas.
- Cada estratégia é testada isoladamente, e a combinação também (13 testes).
- Demonstra o padrão pedido pela disciplina em uso real.

**Negativas / riscos**
- Os filtros somem ao recarregar a página (ficam em memória).
- O filtro por medicamento depende do estoque, que é simulado.

## Evidências

- `src/app/features/units/filters/` (tipos, estratégias, aplicação e testes)
- Diagrama em `docs/diagrams/padroes-de-projeto.md`
- Prints: tela de filtros, lista filtrada com o contador e a mensagem "N postos com os filtros escolhidos"
