# Montagem de teste: LEDs, toque, sensor e Wi-Fi

Guia passo a passo da montagem de teste da caixa (10 LEDs, 3 teclas de toque, sensor e Wi-Fi).
Siga na ordem e confira cada etapa antes de seguir.

| O quê | Onde |
|---|---|
| Sketch desta montagem | `firmware/teste-leds-sensor/teste-leds-sensor.ino` |
| Guia completo da caixa (firmware, pareamento, app) | `docs/hardware/caixa-de-remedios.md` |

---

## 1. Peças

| Peça | Qtd. | Observação |
|---|---|---|
| ESP32 DevKit V1 de 30 pinos (**ESP32-WROOM-32**) | 1 | Confira o nome na tampinha de metal. Se estiver escrito **WROVER**, os pinos 16 e 17 não servem: avise para trocarmos |
| Cabo USB **de dados** | 1 | Cabo só de carga não grava |
| LED amarelo 5 mm | 5 | 3 de **HORA** (manhã, tarde, noite) + 1 de **umidade** + 1 de **temperatura** |
| LED azul 5 mm | 3 | **TOMADO** (manhã, tarde, noite) |
| LED vermelho 5 mm | 1 | **Falha do sensor** |
| LED verde 5 mm | 1 | **Wi-Fi** |
| Resistor 220 Ω a 330 Ω | 10 | Um para cada LED. 220 Ω = vermelho-vermelho-marrom · 330 Ω = laranja-laranja-marrom |
| Sensor DHT11 (azul) ou DHT22 (branco) | 1 | Se for DHT22, troque `DHT11` por `DHT22` no começo do sketch |
| Resistor 10 kΩ | 1 | **Só** se o sensor for o "pelado" de 4 pernas. Marrom-preto-laranja |
| Papel-alumínio ou fita de cobre | 3 pedaços de ~3 × 3 cm | Teclas de toque |
| Protoboard | 1 ou 2 | A ESP32 de 30 pinos é larga: duas lado a lado dão mais espaço |
| Jumpers | ~20 | |

## 2. O que cada LED faz

| LED | Cor | Comportamento |
|---|---|---|
| HORA manhã / tarde / noite | 🟡 amarelo | Acendem um de cada vez, **5 segundos** cada, na ordem manhã → tarde → noite. Tocar no alumínio apaga o amarelo daquele compartimento até o fim do ciclo; no ciclo seguinte volta ao normal |
| TOMADO manhã / tarde / noite | 🔵 azul | Só acendem **enquanto** você encosta no alumínio do compartimento |
| Sensor | 🔴 vermelho | **Aceso fixo** quando o sensor fica sem sinal (3 leituras seguidas, ~6 s). Apaga quando volta ao normal |
| Umidade | 🟡 amarelo | **Pisca 1x por segundo** se a umidade estiver acima de 75% ou abaixo de 30% |
| Temperatura | 🟡 amarelo | **Pisca 2x por segundo** se a temperatura estiver acima de 30 °C ou abaixo de 15 °C |
| Wi-Fi | 🟢 verde | **Piscando** = conectando · **fixo** = conectado · **apagado** = desconectado |

As faixas boas ficam no começo do sketch (`TEMP_MIN`, `TEMP_MAX`, `UMID_MIN`, `UMID_MAX`) e podem ser ajustadas.

## 3. Tabela de pinos

| Função | Pino na placa | Ligação |
|---|---|---|
| LED HORA manhã 🟡 | D18 | D18 → resistor → perna longa; perna curta → GND |
| LED HORA tarde 🟡 | D26 | igual |
| LED HORA noite 🟡 | D25 | igual |
| LED TOMADO manhã 🔵 | D19 | igual |
| LED TOMADO tarde 🔵 | D21 | igual |
| LED TOMADO noite 🔵 | D22 | igual |
| LED sensor 🔴 | D13 | igual |
| LED umidade 🟡 | RX2 (GPIO 16) | igual |
| LED temperatura 🟡 | TX2 (GPIO 17) | igual |
| LED Wi-Fi 🟢 | D23 | igual |
| Toque manhã | D32 | jumper até o alumínio da manhã |
| Toque tarde | D33 | jumper até o alumínio da tarde |
| Toque noite | D27 | jumper até o alumínio da noite |
| Sensor: dados | D4 | pino `OUT` / `DATA` / `S` do sensor |
| Sensor: alimentação | 3V3 e GND | `+`/`VCC` no **3V3** (nunca no VIN/5 V), `-` no GND |

## 4. Layout da protoboard

ESP32 DevKit V1 de 30 pinos, vista de cima, USB para baixo, atravessando o vão central.

```
                    LADO ESQUERDO            LADO DIREITO
                   ┌───────────────────────────────┐
                   │ EN                        D23 │──[R]──▶|── 🟢 Wi-Fi
                   │ VP                        D22 │──[R]──▶|── 🔵 Tomado noite
                   │ VN                        TX0 │
                   │ D34                       RX0 │
                   │ D35                       D21 │──[R]──▶|── 🔵 Tomado tarde
 Alumínio manhã ───│ D32                       D19 │──[R]──▶|── 🔵 Tomado manhã
 Alumínio tarde ───│ D33                       D18 │──[R]──▶|── 🟡 Hora manhã
 🟡 Hora noite ◀───│ D25                        D5 │
 🟡 Hora tarde ◀───│ D26        ESP32      TX2(17) │──[R]──▶|── 🟡 Temperatura
 Alumínio noite ───│ D27                   RX2(16) │──[R]──▶|── 🟡 Umidade
                   │ D14                        D4 │──────────── DATA do DHT
                   │ D12                        D2 │
 🔴 Sensor ◀───────│ D13                       D15 │
                   │ GND                       GND │──── trilho  –  (azul)
                   │ VIN                       3V3 │──── trilho  +  (vermelho)
                   └───────────[ USB ]─────────────┘

 [R] = resistor 220–330 Ω     ▶| = LED (perna LONGA do lado do resistor)
 Os LEDs do lado esquerdo também têm resistor: D25 → [R] → perna longa.
 Perna CURTA de TODOS os LEDs → trilho  –  (GND)
 DHT: VCC → trilho +  ·  GND → trilho –  ·  DATA → D4
```

> A ordem dos pinos muda um pouco entre fabricantes. **Confie no nome impresso ao lado de cada pino**, não na posição do desenho.

## 5. Montagem passo a passo

1. **Placa na protoboard.** Encaixe a ESP32 atravessando o vão central. Se não sobrar furo dos dois lados, use duas protoboards lado a lado.
2. **Trilhos.** Ligue o `GND` da placa no trilho **–** e o `3V3` no trilho **+**. Se usar os trilhos dos dois lados, ligue os dois **–** entre si (e os dois **+**) com um jumper.
3. **LEDs, um de cada vez.** Para cada LED: jumper do pino até uma fileira livre → resistor dessa fileira até outra → perna **longa** do LED nessa outra fileira → perna **curta** no trilho **–**. Sem resistor o LED pode queimar ou estragar o pino.
4. **Organize por lado.** Direito: Wi-Fi, os 3 azuis, Hora manhã, temperatura e umidade. Esquerdo: Hora tarde, Hora noite e o vermelho do sensor.
5. **Sensor.**
   - Com plaquinha (3 pinos): `+` → trilho + · `OUT` → D4 · `-` → trilho –.
   - Pelado (4 pernas), grade virada para você: `1 VCC` → trilho + · `2 DATA` → D4 · `3` não liga · `4 GND` → trilho –. Resistor de **10 kΩ entre a perna 1 e a 2**.
6. **Teclas de toque.** Prenda bem a ponta metálica de um jumper em cada quadrado de alumínio e ligue em D32 (manhã), D33 (tarde) e D27 (noite).
   - Fios do alumínio **curtos** e **longe** dos fios dos LEDs: fio comprido ou cruzado = toque falso.
   - Pode cobrir o alumínio com fita transparente: o toque funciona através dela.

## 6. Preparar o computador (uma vez)

1. Arduino IDE 2 com a placa **esp32 by Espressif Systems** instalada (veja o guia completo, seção 4).
2. `Ferramentas → Gerenciar Bibliotecas`: **DHT sensor library** (Adafruit) + **Adafruit Unified Sensor**.
3. `Ferramentas → Placa`: **ESP32 Dev Module** · `Ferramentas → Porta`: a COM que apareceu.

## 7. Wi-Fi

- O nome e a senha da rede ficam no arquivo **`senha_wifi.h`**, na mesma pasta do sketch (crie com as duas linhas indicadas no começo do `.ino`). Na Arduino IDE ele aparece como uma aba.
- A rede precisa ser **2,4 GHz** (o ESP32 não conecta em 5 GHz).
- Se não conectar em 15 s, o verde apaga e ele tenta de novo 10 s depois.
- O `senha_wifi.h` está no `.gitignore`: a senha do Wi-Fi não vai para o GitHub.

## 8. Gravar e abrir o Monitor Serial

1. Abra `firmware/teste-leds-sensor/teste-leds-sensor.ino`.
2. Clique em **Carregar**. Se parar em `Connecting.....`, segure o botão **BOOT** até começar a gravar.
3. Abra o **Monitor Serial** em **115200**.
4. **Não encoste no alumínio nos 2 primeiros segundos**: o ESP32 está medindo o valor "sem toque".

Exemplo do que aparece:

```
=== Caixa InfoMed - teste dos LEDs, toque, sensor e Wi-Fi ===
Calibrando o toque... NAO encoste no aluminio.
  manha (GPIO 32): valor sem toque = 62, conta como toque abaixo de 37
[     0s] Wi-Fi: conectando na rede "Glau"... (LED verde piscando)
[     0s] LED HORA (amarelo) aceso: manha (GPIO 18)
[     0s] Temp:  24.0 C | Umid:  55.0 % | Sensacao:  24.1 C | temperatura ok, umidade ok
[     3s] Wi-Fi: CONECTADO (LED verde fixo) | IP 192.168.0.42 | sinal -55 dBm
[     5s] TOQUE na manha -> LED TOMADO (azul) ACESO (valor do toque: 12)
[     6s] Soltou a manha -> LED TOMADO (azul) apagado (valor do toque: 61)
```

## 9. Checklist de teste

- [ ] **Amarelos HORA:** acendem 5 s cada, manhã → tarde → noite, sem parar.
- [ ] **Tocar no alumínio:** o amarelo daquele compartimento apaga (na hora, se for a vez dele) e não acende mais nesse ciclo. Quando volta para a manhã, tudo volta ao normal.
- [ ] **Azuis TOMADO:** encostar no alumínio da manhã acende só o azul da manhã; soltar apaga. Repetir para tarde e noite.
- [ ] **Wi-Fi:** o verde pisca e fica fixo; o Monitor mostra `CONECTADO` e o IP. Desligar o roteador apaga o verde.
- [ ] **Sensor:** temperatura e umidade aparecem a cada 2 s.
- [ ] **Falha do sensor:** tire o fio do D4 → em ~6 s o 🔴 acende. Recoloque → apaga.
- [ ] **Temperatura:** segure o sensor com a mão ou sopre ar quente → acima de 30 °C o 🟡 de temperatura pisca rápido (2x/s).
- [ ] **Umidade:** assopre no sensor → acima de 75% o 🟡 de umidade pisca devagar (1x/s).

## 10. Problemas comuns

| Sintoma | O que fazer |
|---|---|
| A mensagem do LED aparece no Monitor, mas o LED não acende | LED invertido (perna longa vai no resistor) ou fio no pino errado |
| Azul acende sozinho | Alguém encostou no alumínio durante a calibração. Aperte o reset (EN) sem tocar em nada |
| Azul não acende ao encostar | Fio do alumínio solto ou no pino errado. O valor ao encostar precisa ser bem menor que o "sem toque" |
| 🔴 aceso e `ERRO no sensor` no Monitor | Confira VCC no 3V3, GND, DATA no D4 e o tipo do sensor (DHT11/DHT22) |
| Verde nunca fica fixo | Confira nome e senha da rede, se ela é 2,4 GHz e se a placa está perto do roteador |
| Placa reinicia quando conecta no Wi-Fi | Falta de energia: troque o cabo USB ou ligue em outra porta / carregador |
| Não aparece porta COM | Cabo só de carga, ou falta o driver **CP2102** / **CH340** |
| Monitor mostra caracteres estranhos | Velocidade errada: escolha **115200** |
