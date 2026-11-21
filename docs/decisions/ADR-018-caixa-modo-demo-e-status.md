# ADR-018: Modo demonstração, status do sensor e toques da caixa no app

- **Status:** aceito
- **Data:** 2026-11-20
- **Relacionado:** ADR-017 (caixa de remédios IoT)

## Contexto

A bancada precisava mostrar o funcionamento da caixa sem esperar o horário real de um lembrete: LEDs de HORA em ciclo de 5 s, toque no alumínio apagando o LED e acendendo o azul. Também era preciso levar ao app o que os LEDs novos mostram: falha do sensor, temperatura/umidade fora da faixa (alta **e** baixa) e os toques nos compartimentos.

## Decisão

1. **Um firmware só, com o modo escolhido pelo app.** A coluna `devices.demo_mode` é ligada/desligada pelo dono com a função `definir_modo_demo` (só o dono, só caixa não revogada). A caixa recebe o valor no JSON de `caixa_agenda` (campo `demo`), que passou a ser buscado a cada **15 s**. Sem gravar o ESP32 de novo, sem senha nova, sem endpoint novo para a caixa ler.
2. **O modo só muda o desenho dos LEDs.** Nos dois modos o toque registra a dose **se** houver lembrete aberto no período e é enviado como toque. No modo demo um toque sem lembrete aberto não vira dose: a adesão (dado de saúde, BI) não recebe dado inventado.
3. **Sensor sem sinal = leitura com temperatura e umidade nulas.** `caixa_leitura` manteve a mesma assinatura (evita sobrecarga ambígua no PostgREST); leitura toda nula marca `devices.sensor_ok = false` e apaga a última temperatura/umidade, para o app não mostrar valor velho.
4. **Toques numa tabela própria** (`device_touches`), gravada só pela função `caixa_toque` (papel anon, validada pelo token), lida pelo dono via RLS, com retenção de 7 dias. A hora enviada pela caixa só é aceita se plausível (até 1 dia atrás, nunca no futuro).
5. **Faixa boa única** em banco, firmware e app: 15–30 °C e 30–75% de umidade. Notificação no máximo uma de cada tipo a cada 6 h.

## Consequências

- O app funciona mesmo se o `db/11` ainda não foi executado: a lista da caixa cai para as colunas antigas, toques voltam vazios e o botão explica que falta rodar o script.
- Rodar o `db/10` de novo sobrescreve `caixa_agenda`/`caixa_leitura`; por isso o `db/11` deve ser executado em seguida (avisado no cabeçalho dos dois arquivos e no guia).
- Buscar a agenda a cada 15 s aumenta as chamadas da caixa (4 por minuto), aceitável para o protótipo.
- Os toques ficam só na memória da caixa até serem enviados (no máximo 10); são informativos, ao contrário das doses, que ficam na fila em flash.
