# Fontes dos dados das unidades de saúde (Santa Bárbara d'Oeste)

Dados levantados em 20/10/2026. **Estado de verificação: levantamento feito a partir de fontes oficiais; coordenadas e endereços ainda precisam de conferência manual pela dupla antes da apresentação.**

## Fontes consultadas

| Fonte | Endereço | Usada para |
|---|---|---|
| Prefeitura de Santa Bárbara d'Oeste, Secretaria de Saúde, página **Atenção Básica** | https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/ | Nome, endereço, telefone, horário e serviços de 14 UBS |
| Prefeitura, notícia **Santa Bárbara já aplicou 24,2 mil doses durante a vacinação contra a gripe** | https://www.santabarbara.sp.gov.br/portal/noticias/0/3/73556/santa-barbara-ja-aplicou-242-mil-doses-durante-a-vacinacao-contra-a-gripe | UBS Regional Zona Sul (endereço e telefones) e conferência de endereços |
| Prefeitura, página **Telefones** | https://www.santabarbara.sp.gov.br/portal/servicos/1026/telefones/ | Conferência de nomes e endereços |
| Prefeitura, página **Saúde** (A Cidade) | https://www.santabarbara.sp.gov.br/portal/servicos/1020/saude/ | Conferência de nomes e endereços |
| Jornal Correio (Grande Campinas), reportagem sobre a UBS Dr. Joel Lincoln May Keese | https://www.correiodamanha.com.br/nacional/sao-paulo/campinas/regiao-de-campinas/2026/07/306618-fechada-desde-2020-ubs-entra-em-fase-de-reforma-em-santa-barbara.html | Informação de que a UBS Vista Alegre está fechada |
| OpenStreetMap (Nominatim) | https://nominatim.openstreetmap.org | Latitude e longitude (script `scripts/geocode-unidades.mjs`) |

Dados do OpenStreetMap: © colaboradores do OpenStreetMap (licença ODbL). A atribuição deve aparecer no mapa do aplicativo.

## Decisões de inclusão

- **Incluídas (15):** as 14 UBS da página Atenção Básica (a página lista a UBS São Francisco duas vezes; contada uma vez), mais a UBS Regional Zona Sul.
- **Excluída: UBS Dr. Joel Lincoln May Keese (Vista Alegre).** Consta na página oficial, mas reportagem de 2026 informa que está **fechada desde o fim de 2020** e em processo de reforma. Os moradores passaram a depender da UBS Regional Zona Sul, que foi incluída.
- **Fora do escopo (por enquanto):** pronto-socorro (Dr. Afonso Ramos), Complexos Regionais de Saúde (Europa e Jardim Pérola) e a UBS do Grego/Furlan, que aparece em notícias de vacinação, mas não na página Atenção Básica. Podem entrar depois, se a dupla quiser.

## Divergências encontradas (conferir antes de apresentar)

| Unidade | Atenção Básica diz | Outra fonte diz |
|---|---|---|
| UBS José Wenceslau Júnior (Jd Esmeralda) | Rua do Centeio, 1591 (salão da Igreja N. Sra. Aparecida) | Rua Ribeirão Preto, 110 |
| UBS Célio Faria (Romano) | Rua Dr. Sebastião de Paula Coelho, 600 | Rua Profeta Jeremias, 140 |
| UBS José Togeiro de Andrade (Jd São Francisco) | Rua dos Tucanos, 406 | Rua Cariris, 400 |
| UBS Regional Zona Sul | (não consta na página) | Rua José Calixto, 100; horário não informado, foi assumido 07:00 às 16:30 |

Essas unidades estão com a observação "CONFERIR" na coluna `notes` do banco. A forma mais segura de resolver é ligar para o telefone da unidade (todos constam no JSON) ou ir ao Google Maps/OpenStreetMap e confirmar.

## Dados SIMULADOS (devem constar assim no TCC)

- **Estoque de medicamentos por unidade:** não existe fonte pública confiável por posto. Os status (disponível, atenção, indisponível) são gerados por um sorteio fixo (semente determinística) apenas para demonstração. Unidades sem farmácia na lista de serviços da fonte (Europa IV, Jardim Boa Vista e Planalto do Sol) ficam sem estoque.
- **Médicos:** nomes e registros (`SIM-0001`...) são fictícios; a quantidade e as especialidades seguem o que a fonte diz que cada unidade oferece (clínico geral, pediatra, ginecologista e dentista).
- **Medicamentos:** 6 exemplos de uso comum no SUS, com dosagens ilustrativas.

## Como reproduzir (para a banca)

1. `data/unidades-sbo.json`: dados levantados das fontes acima.
2. `node scripts/geocode-unidades.mjs`: obtém latitude e longitude no OpenStreetMap.
3. Conferência manual de cada ponto no mapa (o script imprime um link por unidade).
4. `node scripts/gerar-sql-unidades.mjs`: gera `db/05_postos_reais.sql`.
5. Executar o SQL no Supabase.
