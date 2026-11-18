# ADR-005: Leaflet e OpenStreetMap para mapas

- **Status:** Aceita (implementada em 20/10/2026)
- **Data:** 20/10/2026
- **Disciplinas relacionadas:** Programação Multi Plataforma, Sistemas de Informação e Tecnologias Emergentes

## Contexto

As telas de postos de saúde precisam exibir a localização das unidades em um mapa e permitir ao usuário abrir a rota até elas. O projeto não deve depender de cartão de crédito ou de chaves de API pagas, e o aplicativo precisa carregar rápido em celulares.

## Decisão

1. Usar a biblioteca **Leaflet 1.9** por meio do **react-leaflet 4.2** (a versão 5 exige React 19, e o projeto usa React 18), com mapas base do **OpenStreetMap** (`tile.openstreetmap.org`).
2. Guardar `lat` e `lng` de cada unidade na tabela `health_units` (obtidas pelo script `scripts/geocode-unidades.mjs`, via Nominatim, e conferidas manualmente).
3. Carregar o mapa sob demanda (*lazy loading*): o componente `UnitsMap` vira um pacote separado (~156 kB) que só é baixado quando o usuário abre o mapa ou o detalhe de um posto.
4. Marcadores criados com HTML e CSS (`divIcon`) em vez dos ícones de imagem padrão do Leaflet, que costumam quebrar com ferramentas de build. Verde indica unidade aberta e cinza, fechada.
5. Na tela de detalhe, o mapa é **compacto** (sem arrastar ou dar zoom), para não atrapalhar a rolagem da página no celular. O botão "Como chegar" abre a rota no aplicativo de mapas do aparelho por link externo.
6. **Localização do usuário** pela API do navegador (`navigator.geolocation`), solicitada somente quando a pessoa toca em "Perto de mim". A posição é usada apenas no aparelho, para ordenar os postos por distância (fórmula de Haversine), e **não é enviada nem armazenada** em servidor.
7. Exibir a atribuição "© OpenStreetMap" no mapa e nas telas, conforme a licença ODbL.

## Alternativas consideradas

| Alternativa | Por que não foi escolhida |
|---|---|
| Google Maps | Exige conta de faturamento e chave de API |
| Mapbox | Exige chave de API e tem limites de uso gratuito |
| Mapa estático (imagem) | Não permite interação nem marcadores |
| react-leaflet 5 | Exige React 19; o projeto usa React 18 |

## Consequências

**Positivas**
- Gratuito e sem chave de API; dados abertos, coerentes com o tema de saúde pública.
- Pacote do mapa separado: a tela inicial continua leve.
- Privacidade: a localização do usuário não sai do aparelho.

**Negativas / riscos**
- Menos recursos prontos (rotas internas, trânsito) do que o Google Maps; a rota é delegada a um aplicativo externo.
- Os servidores públicos de tiles do OpenStreetMap têm política de uso justo, adequada para o TCC e testes, mas não para tráfego intenso; em produção seria necessário um provedor de tiles próprio.
- O mapa depende de internet (os tiles não ficam em cache offline).
- A distância mostrada é em linha reta, não pelo trajeto.

## Evidências

- `src/app/features/units/UnitsMap.tsx`
- Print do mapa com os marcadores das UBS de Santa Bárbara d'Oeste
- Print da tela de detalhe com o mapa compacto e o botão "Como chegar"
- Print da lista ordenada por distância após tocar em "Perto de mim"
