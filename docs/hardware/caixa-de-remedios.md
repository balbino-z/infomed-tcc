# Caixa de remédios inteligente: montagem, gravação e uso

Guia passo a passo do protótipo. Siga na ordem e confira cada etapa antes de seguir.
Arquivos envolvidos:

| O quê | Onde |
|---|---|
| Banco (tabelas, funções, segurança) | `db/10_caixa.sql`, `db/11_caixa_demo.sql` (modo demo, sensor e toques) e testes em `db/ci/tests_caixa.sql` |
| Firmware da caixa (ESP32) | `firmware/caixa-infomed/` |
| Sketch para testar as peças | `firmware/teste-leds-sensor/teste-leds-sensor.ino` (manual: `teste-leds-sensor.md`) |
| Gera o `config.h` do firmware | `scripts/caixa-config.mjs` |
| Simulador da caixa (plano B) | `scripts/simulador-caixa.mjs` |
| Telas | Perfil → Minha caixa de remédios (`/perfil/caixa`), Lembretes (selos de hoje), Painel de BI |

---

## 1. Peças

| Peça | Qtd. | Observação |
|---|---|---|
| ESP32 comum (DevKit / **ESP32-WROOM-32**) | 1 | Confira o nome na tampinha de metal. **Não serve** ESP32-S2, S3 ou C3: o toque delas funciona ao contrário |
| Cabo micro-USB ou USB-C **de dados** | 1 | Cabo só de carga não grava. Se o PC não "vê" a placa, troque o cabo primeiro |
| LED 5 mm | 10 | 2 por compartimento: **HORA** (amarelo) e **TOMADO** (azul) = 6. Avisos: 1 **vermelho** (sensor), 2 **amarelos** (umidade e temperatura), 1 **verde** (Wi-Fi). O de status é o azul que já vem na placa (GPIO 2) |
| Resistor 220 Ω a 330 Ω | 10 | 220 Ω = vermelho-vermelho-marrom · 330 Ω = laranja-laranja-marrom |
| Sensor DHT11 (azul) ou DHT22 (branco) | 1 | Se for DHT22, troque `DHT11` por `DHT22` em `hardware.h` e no sketch de teste |
| Resistor 10 kΩ | 1 | **Só** se o sensor for o "pelado" de 4 pernas (sem plaquinha). Marrom-preto-laranja |
| Jumpers | ~20 | Macho-fêmea são os mais práticos |
| Protoboard | 1 | Opcional, mas facilita |
| Papel-alumínio ou fita de cobre | 3 pedaços de ~3 × 3 cm | Viram as "teclas" de toque |
| Fita adesiva transparente | — | Para prender e cobrir o alumínio |
| Caixa com 3 divisórias (caixa de ovos, organizador de remédios) | 1 | O corpo do aparelho |
| Carregador de celular 5 V ou power bank | 1 | Alimentação pelo USB |

## 2. Esquema de ligação

```
                    ESP32 DevKit V1 30 pinos (vista de cima, USB para baixo)
                   ┌───────────────────────────────┐
                   │ EN                        D23 │──[R]──▶|── 🟢 Wi-Fi
                   │ VP                        D22 │──[R]──▶|── 🔵 TOMADO noite
                   │ VN                        TX0 │
                   │ D34                       RX0 │
                   │ D35                       D21 │──[R]──▶|── 🔵 TOMADO tarde
   toque MANHÃ ────│ D32                       D19 │──[R]──▶|── 🔵 TOMADO manhã
   toque TARDE ────│ D33                       D18 │──[R]──▶|── 🟡 HORA manhã
 🟡 HORA noite ◀───│ D25                        D5 │
 🟡 HORA tarde ◀───│ D26        ESP32      TX2(17) │──[R]──▶|── 🟡 Temperatura
   toque NOITE ────│ D27                   RX2(16) │──[R]──▶|── 🟡 Umidade
                   │ D14                        D4 │──────────── dados do sensor
                   │ D12                        D2 │ (LED azul da placa: status)
 🔴 Sensor ◀───────│ D13                       D15 │
                   │ GND                       GND │──── trilho  –  (GND)
                   │ VIN                       3V3 │──── trilho  +  (sensor)
                   └───────────[ USB ]─────────────┘

 [R] = resistor 220–330 Ω   ▶| = LED (perna LONGA do lado do resistor)
 Os LEDs do lado esquerdo também têm resistor: D25 → [R] → perna longa.
 Perna CURTA de TODOS os LEDs → trilho – (GND)
```

> A ordem dos pinos muda um pouco entre fabricantes. **Confie no nome impresso ao lado de cada pino**, não na posição do desenho.

| Função | Pino do ESP32 | Ligação |
|---|---|---|
| Toque manhã | GPIO 32 (T9) | jumper até o alumínio do compartimento 1 |
| Toque tarde | GPIO 33 (T8) | jumper até o alumínio do compartimento 2 |
| Toque noite | GPIO 27 (T7) | jumper até o alumínio do compartimento 3 |
| LED **HORA** manhã | GPIO 18 | GPIO 18 → resistor → perna longa do LED; perna curta → GND |
| LED **HORA** tarde | GPIO 26 | igual |
| LED **HORA** noite | GPIO 25 | igual |
| LED **TOMADO** manhã | GPIO 19 | igual |
| LED **TOMADO** tarde | GPIO 21 | igual |
| LED **TOMADO** noite | GPIO 22 | igual |
| LED **SENSOR** (vermelho) | GPIO 13 | igual |
| LED **UMIDADE** (amarelo) | GPIO 16 (RX2) | igual |
| LED **TEMPERATURA** (amarelo) | GPIO 17 (TX2) | igual |
| LED **WI-FI** (verde) | GPIO 23 | igual |

| LED de status | GPIO 2 | já vem na placa, não precisa ligar nada |
| Sensor: dados | GPIO 4 | pino `OUT`/`DATA`/`S` do sensor |
| Sensor: alimentação | 3V3 e GND | `+`/`VCC` no 3V3, `-` no GND. **Nunca no 5 V/VIN** |

Cada compartimento tem **2 LEDs**:
- **HORA** (amarelo): aceso = está na hora de tomar; piscando = atrasado.
- **TOMADO** (azul): aceso **só enquanto o paciente encosta no alumínio** (igual ao sketch de teste, nos dois modos). A confirmação da dose aparece no app.

E mais **4 LEDs de aviso**, que funcionam em qualquer estado (até sem Wi-Fi ou sem pareamento):
- 🔴 **SENSOR**: aceso fixo quando o sensor fica sem sinal (3 leituras seguidas, ~15 s). Apaga sozinho quando volta.
- 🟡 **UMIDADE**: pisca **1x por segundo** se a umidade passar de 75% ou ficar abaixo de 30%.
- 🟡 **TEMPERATURA**: pisca **2x por segundo** se a temperatura passar de 30 °C ou ficar abaixo de 15 °C.
- 🟢 **WI-FI**: **piscando** = conectando · **fixo** = conectado · **apagado** = desconectado (ou em configuração).

As faixas ficam em `hardware.h` (`TEMP_MINIMA`, `TEMP_MAXIMA`, `UMID_MINIMA`, `UMID_MAXIMA`). Os pinos 16 e 17 servem na placa comum (**WROOM**); na **WROVER** é preciso trocá-los.

Os pinos 0, 2, 12 e 15 interferem na inicialização da placa: por isso nenhum toque foi colocado neles.

### Sensor de temperatura

- **Com plaquinha (3 pinos)**: `+` → 3V3 · `OUT` → GPIO 4 · `-` → GND. O resistor já está na placa.
- **Pelado (4 pernas)**, com a grade virada para você e as pernas para baixo, da esquerda para a direita:
  `1 VCC` → 3V3 · `2 DATA` → GPIO 4 · `3` não liga · `4 GND` → GND.
  Coloque o resistor de **10 kΩ entre a perna 1 e a perna 2**.

## 3. Montagem passo a passo

1. **Placa na protoboard.** Encaixe o ESP32 atravessando o vão central. Se ele for largo demais e não sobrar furo dos dois lados, use duas protoboards lado a lado ou jumpers fêmea direto nos pinos.
2. **Terra comum.** Ligue um jumper do `GND` da placa até a fileira azul (−) da protoboard. Todos os GND vão nessa fileira.
3. **Os 10 LEDs.** HORA 🟡: GPIO 18 (manhã), 26 (tarde), 25 (noite). TOMADO 🔵: GPIO 19 (manhã), 21 (tarde), 22 (noite). Avisos: SENSOR 🔴 GPIO 13, UMIDADE 🟡 GPIO 16 (RX2), TEMPERATURA 🟡 GPIO 17 (TX2), WI-FI 🟢 GPIO 23. Para cada um: jumper do GPIO até uma fileira livre; resistor dessa fileira até outra; perna **longa** do LED nessa outra fileira; perna **curta** na fileira do GND. Sem o resistor o LED pode queimar ou estragar o pino.
4. **Sensor.** Conforme a seção acima, com alimentação no **3V3**.
5. **Teclas de toque.** Para cada compartimento: dobre o alumínio em um quadrado de ~3 × 3 cm, prenda a ponta **metálica** do jumper (macho) no alumínio com fita, bem firme. Ligue a outra ponta no GPIO 32 (manhã), 33 (tarde) ou 27 (noite).
   - Jumpers **curtos** e sem cruzar uns por cima dos outros: fio comprido = toque falso.
   - Cubra o alumínio com fita transparente: o toque funciona através da fita e o alumínio não oxida.
6. **Teste das peças** (seção 5) **antes** de colar qualquer coisa na caixa.
7. **Caixa física.**
   - Escreva **Manhã / Tarde / Noite** nos compartimentos, da esquerda para a direita.
   - Cole cada alumínio no **fundo** ou na **borda** do seu compartimento (onde o dedo encosta ao pegar o comprimido).
   - Fure a tampa ao lado de cada compartimento e passe os **2 LEDs** por baixo (a cabeça fica para fora): HORA de um lado, TOMADO do outro. Escreva "hora" e "ok" ao lado de cada um.
   - O sensor fica **dentro** da caixa, que é onde o remédio fica.
   - A placa pode ficar num canto da caixa ou do lado de fora, com o cabo USB saindo por um furo.
8. **Energia.** Carregador de celular 5 V no USB. Power bank também serve, mas alguns desligam sozinhos quando o consumo é baixo: teste antes.

## 4. Preparar o computador (uma vez)

1. Instale a **Arduino IDE 2** (arduino.cc).
2. `Arquivo → Preferências → URLs adicionais para Gerenciadores de Placas`, cole:
   `https://espressif.github.io/arduino-esp32/package_esp32_index.json`
3. `Ferramentas → Placa → Gerenciador de Placas`: procure **esp32** e instale **esp32 by Espressif Systems**.
4. `Ferramentas → Gerenciar Bibliotecas`, instale:
   - **ArduinoJson** (Benoit Blanchon), **versão 7.x**
   - **DHT sensor library** (Adafruit), e aceite instalar junto a **Adafruit Unified Sensor**
5. Ligue a placa no USB. Em `Ferramentas → Placa` escolha **ESP32 Dev Module** e em `Ferramentas → Porta` a porta COM que apareceu.
   - Não apareceu porta? Instale o driver do chip USB da placa (está escrito perto do USB): **CP2102** (Silicon Labs) ou **CH340**. E confira se o cabo é de dados.

## 5. Testar as peças (sketch de teste)

1. Abra `firmware/teste-hardware/teste-hardware.ino` na Arduino IDE.
2. Clique em **Carregar** (seta). Se ficar parado em `Connecting.....`, segure o botão **BOOT** da placa até começar a gravar.
3. Abra o **Monitor Serial** (lupa no canto) em **115200**.
4. Confira:
   - os 6 LEDs acendem um de cada vez (HORA manhã, TOMADO manhã, HORA tarde, TOMADO tarde, HORA noite, TOMADO noite) e depois o azul da placa;
   - os números do toque ficam parados sem encostar e **caem bastante** (menos da metade) quando você encosta no alumínio, e o LED **TOMADO** daquele compartimento acende;
   - a temperatura e a umidade aparecem com números (se aparecer `nan`, revise o sensor).

Para testar também os 4 LEDs de aviso e o Wi-Fi, use `firmware/teste-leds-sensor/teste-leds-sensor.ino` (manual em `docs/hardware/teste-leds-sensor.md`).

Só siga quando tudo funcionar aqui.

## 6. Preparar o banco (uma vez, uma pessoa só)

1. No Supabase: **SQL Editor** → cole todo o `db/10_caixa.sql` → **Run** (depois do 09).
2. Depois, **New query** → cole todo o `db/11_caixa_demo.sql` → **Run**. Ele cria o modo demonstração, o status do sensor e o registro dos toques. Se algum dia rodar o 10 de novo, rode o 11 logo em seguida.
3. CI: no `.github/workflows/ci.yml`, inclua `db/10_caixa.sql` e `db/11_caixa_demo.sql` no fim da lista de scripts e adicione um passo
   `psql -v ON_ERROR_STOP=1 -f db/ci/tests_caixa.sql` depois do `tests.sql`.

## 7. Gravar o firmware da caixa

1. Na pasta do projeto (terminal do VS Code), com o `.env` preenchido:
   ```
   node scripts/caixa-config.mjs
   ```
   Ele cria `firmware/caixa-infomed/config.h` com o endereço, a chave publishable e o **certificado raiz** do Supabase (a caixa só conversa com o servidor verdadeiro). Esse arquivo não vai para o Git.
2. Se usar DHT22, troque `#define TIPO_SENSOR DHT11` por `DHT22` em `firmware/caixa-infomed/hardware.h`.
3. Abra `firmware/caixa-infomed/caixa-infomed.ino` na Arduino IDE (as outras abas abrem junto) e clique em **Carregar**.
4. Abra o Monitor Serial em 115200. Deve aparecer `=== InfoMed - caixa de remédios 1.0.0 ===` e `[estado] - -> CONFIGURACAO`.
   **Não encoste nos compartimentos nos primeiros 2 segundos**: é a calibração do toque.

## 8. Parear (primeira vez)

1. No app: **Perfil → Minha caixa de remédios → Parear caixa**. Aparece um código de 6 dígitos que vale 10 minutos.
2. A caixa sem configuração pisca o LED azul **rápido** e cria a rede Wi-Fi **InfoMed-Caixa**.
3. No celular, conecte nessa rede. A página da caixa abre sozinha (se não abrir, acesse `192.168.4.1`).
4. Escolha o Wi-Fi de casa, digite a senha dele e o código. Toque em **Conectar e parear**.
5. A caixa sai da rede dela, entra no seu Wi-Fi (LED azul piscando **devagar**) e envia o código.
6. No app aparece **Caixa pareada ✅** (o app confere a cada 3 segundos).

Se algo der errado, o LED volta a piscar rápido: conecte de novo na rede **InfoMed-Caixa** e a página mostra o motivo (senha errada, código expirado, sem internet).

> Use rede **2,4 GHz** e **sem página de login**. Na faculdade, use o roteador do celular (teste no dia anterior).

## 9. Uso no dia a dia

Cada horário de lembrete vai para o compartimento do seu período: **antes de 12h = manhã, 12h às 18h = tarde, depois = noite**. Dois remédios no mesmo período ficam no mesmo compartimento e **um toque confirma os dois**.

| Momento (lembrete das 08:00) | Caixa | App |
|---|---|---|
| 07:30 a 08:00 | nada aceso, mas o toque já vale | ⏳ pendente |
| 08:00 | LED **HORA** da manhã **acende** | ⏳ pendente + aviso "Hora do remédio" |
| Toque às 08:04 | **TOMADO** acende enquanto encosta; ao tocar, HORA apaga | em até 10 s a linha fica verde, pisca em destaque com "📦 Caixa confirmou: Losartana das 08:00" e mostra ✅ tomada às 08:04 · 📦 pela caixa |
| 08:30 sem toque | HORA **pisca** | ⚠️ atrasada + aviso "Você tomou a Losartana das 08:00?" |
| 10:00 sem toque | HORA apaga | ❌ esquecida |
| Toque sem dose pendente | HORA pisca **1 vez** | nada muda |
| Dose confirmada pelo botão "Tomei" no app | HORA apaga na próxima sincronização (até 15 s) | ✅ tomada |

O LED **TOMADO** não fica aceso depois do toque (firmware 1.3.6 em diante): ele só mostra que o alumínio está sendo tocado.

Regra de cada dose (igual no banco, no app, no firmware e no simulador):
**no horário** = de 30 min antes até 30 min depois · **atrasada** = até 2 h depois · **esquecida** = depois de 2 h.

LED azul da placa (status):

| Padrão | Significado |
|---|---|
| Pisca rápido | Configuração: conecte na rede InfoMed-Caixa |
| Pisca devagar | Conectando / sincronizando |
| Apagado, com um piscar curto a cada 10 s | Tudo ok (sinal de vida) |
| Aceso fixo | Sem internet: continua acendendo os LEDs e guarda até 50 doses para enviar depois |
| 3 piscadas e pausa | Temperatura ou umidade fora da faixa (o 🟡 de umidade ou de temperatura também pisca; acima de 30 °C ou 75% o app também avisa) |

**Resetar a caixa** (apagar Wi-Fi e pareamento): segure o botão **BOOT** da placa (ao lado do USB) por **5 segundos**. Os LEDs piscam e ela volta para a configuração. (Até a versão 1.3.0 era segurando o toque da manhã, o que podia resetar a caixa sozinha com o Wi-Fi ligado.)

**Roubaram/perdeu?** No app, **Desparear caixa**: o token é revogado e ela para de funcionar. Se ainda estiver ligada, volta sozinha para a configuração.

### Modo demonstração (botão no app)

No app, **Perfil → Minha caixa de remédios**, há a chave **Modo demonstração**. A caixa recebe a mudança em até **15 segundos**, sem gravar o firmware de novo.

| | Modo demonstração **ligado** | Modo demonstração **desligado** (uso real) |
|---|---|---|
| 🟡 HORA | manhã → tarde → noite, **5 s cada**, sem parar | acende no horário dos lembretes; pisca se atrasar |
| Tocar no alumínio | o 🟡 daquele compartimento apaga até o fim do ciclo; no ciclo seguinte volta | registra a dose; o 🟡 apaga |
| 🔵 TOMADO | aceso **enquanto** encosta | aceso depois da dose confirmada (piscando enquanto envia) |
| Dose de lembrete | registra **só** se houver lembrete aberto naquele período | registra se houver lembrete aberto |
| 🔴 sensor, 🟡 umidade, 🟡 temperatura, 🟢 Wi-Fi | iguais nos dois modos | iguais nos dois modos |

O que o app mostra na tela da caixa, nos dois modos:
- **Online/offline** (Wi-Fi da caixa) e versão do firmware;
- **Sensor**: funcionando, sem sinal ou aguardando a primeira leitura;
- **Temperatura e umidade** com aviso de **alta demais** ou **baixa demais** (faixa boa: 15–30 °C e 30–75%);
- **Toques nos compartimentos**: o mais novo aparece em destaque ("👆 Toque agora: Manhã") e a lista mostra se o toque registrou dose, foi demonstração ou não tinha dose pendente.

Notificações: temperatura/umidade fora da faixa (alta **ou** baixa) e sensor sem sinal, no máximo uma de cada tipo a cada 6 horas.

## 10. Simulador (sem hardware, plano B da apresentação)

Faz exatamente o papel da caixa, chamando as mesmas funções do banco.

```
node scripts/simulador-caixa.mjs parear 123456
node scripts/simulador-caixa.mjs
```

Teclas: `1` `2` `3` tocam nos compartimentos · `t` liga/desliga o "calor" (32,5 °C) · `f` liga/desliga a falha do sensor · `o` simula queda da internet (fila offline) · `s` status · `q` sai.
Para desfazer: `node scripts/simulador-caixa.mjs esquecer`.

## 11. Roteiro da demonstração (3 minutos)

1. App: Perfil → Minha caixa de remédios → **Parear** → aparece o código.
2. Celular na rede **InfoMed-Caixa** → Wi-Fi e código → **Caixa pareada ✅**.
2b. Ligar a chave **Modo demonstração** no app → em até 15 s os 🟡 de HORA entram no ciclo de 5 s. Tocar no alumínio → o 🟡 apaga, o 🔵 acende enquanto encosta e o toque aparece na tela ("👆 Toque agora"). Desligar a chave para seguir com os lembretes reais.
3. Criar um lembrete para **daqui a 2 minutos** (a caixa busca a agenda a cada 15 segundos) → o LED **HORA** do período acende.
4. Deixar a tela Lembretes aberta. Tocar no compartimento → HORA apaga, **TOMADO** acende → em até 10 s a linha fica verde e aparece "📦 Caixa confirmou".
5. Desligar o Wi-Fi do roteador (LED azul fixo), tocar em outro compartimento com dose aberta → **TOMADO fica piscando** (guardada na fila). Religar → ele fica fixo e a dose aparece no app (fila offline, sem duplicar).
6. Segurar o sensor na mão / soprar ar quente → passa de 30 °C → 🟡 de temperatura pisca 2x/s, alerta na tela da caixa e nas notificações. Tirar o fio do sensor → em ~15 s o 🔴 acende.
7. Painel de BI → adesão agregada por período (grupos com menos de 5 pacientes ficam ocultos).

Para a demo, os lembretes de teste podem ser de 15 em 15 minutos (como no dia 4 do cronograma).

## 12. Problemas comuns

| Sintoma | Causa provável | O que fazer |
|---|---|---|
| A IDE não acha a porta | cabo só de carga ou falta driver | trocar o cabo; instalar CP2102/CH340 |
| `Connecting.....` e não grava | placa não entrou em modo de gravação | segurar **BOOT** ao iniciar a gravação |
| `#error "Falta o config.h"` | não gerou o arquivo | `node scripts/caixa-config.mjs` |
| Erro com `JsonDocument` | ArduinoJson versão 6 | atualizar a biblioteca para a 7 |
| LED não acende | LED invertido ou sem GND | perna longa no resistor, curta no GND |
| Toque dispara sozinho | fio comprido, fios cruzados ou encostou durante a calibração | encurtar/afastar jumpers; reiniciar sem encostar |
| Toque não pega | alumínio pequeno ou mal preso ao jumper | alumínio maior e ponta metálica bem presa |
| Sensor `nan` / 🔴 aceso | ligação errada ou falta o 10 kΩ (pelado) | revisar a seção do sensor |
| 🟢 nunca fica fixo | rede 5 GHz, senha errada ou longe do roteador | usar 2,4 GHz e conferir o Monitor Serial |
| "Não conectei ao Wi-Fi" | rede 5 GHz, senha errada ou página de login | usar o roteador do celular em 2,4 GHz |
| "Código inválido ou expirado" | passou de 10 min, já usado, ou digitado errado | gerar outro no app |
| TOMADO fica piscando e não para | a dose não chega ao servidor (sem internet ou erro) | ver o Monitor Serial; quando a internet volta, ele fica fixo |
| Pareou, mas o LED HORA não acende no horário | lembrete criado há menos de 1 min, ou lembrete desligado | esperar 1 min; conferir o lembrete ativo |
| Erro de certificado no Monitor Serial | o Supabase trocou de certificado | rodar `node scripts/caixa-config.mjs` e gravar de novo |
| Volta sozinha para a configuração | a caixa foi despareada no app | parear de novo |

## 13. Segurança (resumo para o TCC)

- A caixa usa só a chave **publishable** e o banco libera para ela **apenas** as funções `parear_caixa`, `caixa_agenda`, `caixa_registrar_dose` e `caixa_leitura`. Nenhuma tabela.
- Token por caixa: 32 bytes aleatórios; o banco guarda só o **hash SHA-256**, como se faz com senhas. Nem o dono lê o hash.
- Código de pareamento: 6 dígitos, **10 minutos**, **uso único**, guardado só o hash. Depois de 10 erros em 1 minuto, novas tentativas ficam bloqueadas por 1 minuto.
- A senha da conta InfoMed nunca passa pela caixa. "Desparear" revoga o token na hora.
- HTTPS com o certificado raiz embutido no firmware.
- Adesão é dado de saúde (LGPD): RLS (cada paciente vê só a sua) e, no BI, só números agregados, escondendo grupos com menos de 5 pacientes.
- A agenda que a caixa recebe tem só horário, dias e nome do lembrete.

Limitações conhecidas: o limite de tentativas de pareamento é global (não por aparelho); lembretes desligados deixam de contar na adesão também para os dias anteriores; o horário da dose vem do relógio da caixa (NTP, ou a hora do servidor como plano B).
