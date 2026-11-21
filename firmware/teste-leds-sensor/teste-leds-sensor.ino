// Teste da Caixa InfoMed: LEDs + toque no alumínio + sensor + avisos de ambiente + Wi-Fi.
//
// O QUE CADA LED FAZ
//   Amarelos HORA (manhã/tarde/noite): acendem um por vez, 5 segundos cada, em sequência.
//                                      Tocar no alumínio apaga o amarelo daquele compartimento
//                                      até o fim do ciclo; no ciclo seguinte volta ao normal.
//   Azuis TOMADO (manhã/tarde/noite):  só acendem ENQUANTO você encosta no alumínio do compartimento.
//   Vermelho SENSOR:     aceso fixo enquanto o sensor estiver sem sinal; apaga quando volta ao normal.
//   Amarelo UMIDADE:     pisca 1x por segundo se a umidade estiver alta OU baixa demais.
//   Amarelo TEMPERATURA: pisca 2x por segundo se a temperatura estiver alta OU baixa demais.
//   Verde WI-FI:         piscando = conectando | aceso fixo = conectado | apagado = desconectado.
//
// LIGAÇÃO (cada LED: GPIO -> resistor 220~330 ohm -> perna longa; perna curta no GND)
//   LED HORA   (amarelo) manhã -> GPIO 18 | tarde -> GPIO 26 | noite -> GPIO 25
//   LED TOMADO (azul)    manhã -> GPIO 19 | tarde -> GPIO 21 | noite -> GPIO 22
//   Alumínio (toque)     manhã -> GPIO 32 | tarde -> GPIO 33 | noite -> GPIO 27
//   LED SENSOR (vermelho) -> GPIO 13
//   LED UMIDADE (amarelo) -> GPIO 16  (na placa: "RX2")
//   LED TEMPERATURA (amarelo) -> GPIO 17  (na placa: "TX2")
//   LED WI-FI (verde)     -> GPIO 23
//   DHT VCC -> 3V3 | DATA -> GPIO 4 | GND -> GND
//
// IMPORTANTE: não encoste no alumínio nos 2 primeiros segundos (o ESP32 está calibrando o toque).
//
// Bibliotecas: "DHT sensor library" (Adafruit) + "Adafruit Unified Sensor". WiFi.h já vem com o ESP32.
// Usa DHT22? Troque TIPO_SENSOR para DHT22.

#include <WiFi.h>
#include <DHT.h>

// ---------------------------------------------------------------- Wi-Fi
// O nome e a senha ficam no arquivo senha_wifi.h, nesta mesma pasta (ele não vai para o GitHub).
// Crie o senha_wifi.h com estas duas linhas, trocando pelos dados da sua rede 2,4 GHz:
//   #define WIFI_REDE_LOCAL  "NOME_DA_REDE"
//   #define WIFI_SENHA_LOCAL "SENHA_DA_REDE"
#if __has_include("senha_wifi.h")
#include "senha_wifi.h"
#else
#define WIFI_REDE_LOCAL  "NOME_DA_REDE"
#define WIFI_SENHA_LOCAL "SENHA_DA_REDE"
#endif
const char* WIFI_REDE  = WIFI_REDE_LOCAL;
const char* WIFI_SENHA = WIFI_SENHA_LOCAL;
const unsigned long WIFI_TEMPO_TENTATIVA_MS = 15000;  // desiste da tentativa depois de 15 s
const unsigned long WIFI_ESPERA_NOVA_MS     = 10000;  // tenta de novo 10 s depois

// ---------------------------------------------------------------- pinos
const uint8_t PINO_LED_HORA[3]   = {18, 26, 25};  // manhã, tarde, noite (amarelos)
const uint8_t PINO_LED_TOMADO[3] = {19, 21, 22};  // manhã, tarde, noite (azuis)
const uint8_t PINO_TOQUE[3]      = {32, 33, 27};  // manhã, tarde, noite (alumínio)
const char* NOME[3] = {"manha", "tarde", "noite"};

const uint8_t PINO_LED_SENSOR = 13;  // vermelho
const uint8_t PINO_LED_UMID   = 16;  // amarelo
const uint8_t PINO_LED_TEMP   = 17;  // amarelo
const uint8_t PINO_LED_WIFI   = 23;  // verde

#define PINO_SENSOR 4
#define TIPO_SENSOR DHT11

// ---------------------------------------------------------------- limites
const unsigned long TEMPO_LED_MS = 5000;  // cada amarelo HORA fica aceso 5 s
const unsigned long INTERVALO_SENSOR_MS = 2000;  // DHT11 não lê mais rápido que 1x/s
const float LIMIAR_TOQUE = 0.6;  // tocou = valor caiu abaixo de 60% do valor sem toque (igual à caixa)
const int FALHAS_PARA_ALERTA = 3; // 3 leituras seguidas sem sinal (~6 s) = sensor com falha

// Faixa boa para guardar remédios (a maioria das bulas pede 15 a 30 °C)
const float TEMP_MIN = 15.0, TEMP_MAX = 30.0;  // °C
const float UMID_MIN = 30.0, UMID_MAX = 75.0;  // %  (75% é o mesmo limite do alerta do app)

DHT dht(PINO_SENSOR, TIPO_SENSOR);

// ---------------------------------------------------------------- estado
int ledAtual = -1;
bool tomadoNoCiclo[3] = {false, false, false};  // tocou no alumínio neste ciclo manhã/tarde/noite
uint16_t baseToque[3];
bool tocando[3] = {false, false, false};

void marcarTomado(int c);

int falhasSeguidas = 0;
bool sensorComFalha = false;
bool umidForaDaFaixa = false;
bool tempForaDaFaixa = false;
float tempMin = 1000, tempMax = -1000, umidMin = 1000, umidMax = -1000;
unsigned long leituras = 0, falhas = 0;

enum EstadoWifi { WIFI_CONECTANDO, WIFI_CONECTADO, WIFI_DESCONECTADO };
EstadoWifi estadoWifi = WIFI_DESCONECTADO;
unsigned long wifiDesde = 0;

/** Pisca sem delay(): true na primeira metade de cada período */
bool piscando(unsigned long periodoMs) {
  return (millis() % periodoMs) < periodoMs / 2;
}

// ---------------------------------------------------------------- toque
/** Média de várias leituras de toque (o valor oscila um pouco) */
uint16_t lerToque(uint8_t pino) {
  uint32_t soma = 0;
  for (int i = 0; i < 4; i++) soma += touchRead(pino);
  return soma / 4;
}

void calibrarToque() {
  Serial.println(F("Calibrando o toque... NAO encoste no aluminio."));
  for (int c = 0; c < 3; c++) {
    uint32_t soma = 0;
    for (int i = 0; i < 20; i++) { soma += lerToque(PINO_TOQUE[c]); delay(20); }
    baseToque[c] = soma / 20;
    Serial.printf("  %s (GPIO %d): valor sem toque = %u, conta como toque abaixo de %u\n",
                  NOME[c], PINO_TOQUE[c], baseToque[c], (unsigned)(baseToque[c] * LIMIAR_TOQUE));
  }
}

void verificarToque() {
  for (int c = 0; c < 3; c++) {
    uint16_t valor = lerToque(PINO_TOQUE[c]);
    bool agora = valor < baseToque[c] * LIMIAR_TOQUE;
    if (agora == tocando[c]) continue;
    tocando[c] = agora;
    digitalWrite(PINO_LED_TOMADO[c], agora ? HIGH : LOW);
    Serial.printf("[%6lus] %s %s -> LED TOMADO (azul) %s (valor do toque: %u)\n",
                  millis() / 1000, agora ? "TOQUE na" : "Soltou a", NOME[c], agora ? "ACESO" : "apagado", valor);
    if (agora) marcarTomado(c);
  }
}

// ---------------------------------------------------------------- LEDs HORA
// Cada amarelo fica aceso 5 s (manhã -> tarde -> noite). Tocar no alumínio = "remédio tomado":
// o amarelo daquele compartimento apaga e fica apagado até o fim do ciclo.
// Quando o ciclo recomeça (volta para a manhã), todos voltam ao normal.
void acenderHoraAtual() {
  digitalWrite(PINO_LED_HORA[ledAtual], tomadoNoCiclo[ledAtual] ? LOW : HIGH);
}

void proximoLedHora() {
  if (ledAtual >= 0) digitalWrite(PINO_LED_HORA[ledAtual], LOW);
  ledAtual = (ledAtual + 1) % 3;
  if (ledAtual == 0) {
    bool algumTomado = tomadoNoCiclo[0] || tomadoNoCiclo[1] || tomadoNoCiclo[2];
    tomadoNoCiclo[0] = tomadoNoCiclo[1] = tomadoNoCiclo[2] = false;
    if (algumTomado) Serial.printf("[%6lus] Novo ciclo: amarelos de volta ao normal\n", millis() / 1000);
  }
  acenderHoraAtual();
  if (tomadoNoCiclo[ledAtual])
    Serial.printf("[%6lus] Vez da %s: LED HORA (amarelo) fica APAGADO (ja tomado neste ciclo)\n", millis() / 1000, NOME[ledAtual]);
  else
    Serial.printf("[%6lus] LED HORA (amarelo) aceso: %s (GPIO %d) por %lu s\n",
                  millis() / 1000, NOME[ledAtual], PINO_LED_HORA[ledAtual], TEMPO_LED_MS / 1000);
}

void marcarTomado(int c) {
  if (tomadoNoCiclo[c]) return;
  tomadoNoCiclo[c] = true;
  if (c == ledAtual) acenderHoraAtual();  // apaga na hora
  Serial.printf("[%6lus] Remedio da %s TOMADO -> LED HORA (amarelo) da %s apagado ate o fim do ciclo\n",
                millis() / 1000, NOME[c], NOME[c]);
}

// ---------------------------------------------------------------- sensor
// Simulação pelo Monitor Serial (para testar os LEDs sem esquentar/molhar o sensor)
bool simFalha = false, simUmid = false, simTemp = false;

void lerComandos() {
  while (Serial.available()) {
    char c = tolower(Serial.read());
    if (c == 'f') simFalha = !simFalha;
    else if (c == 'u') simUmid = !simUmid;
    else if (c == 't') simTemp = !simTemp;
    else if (c == 'n') simFalha = simUmid = simTemp = false;
    else continue;  // ignora Enter e outras teclas
    Serial.printf(">>> SIMULACAO: falha do sensor %s | umidade alta %s | temperatura alta %s\n",
                  simFalha ? "LIGADA" : "desligada", simUmid ? "LIGADA" : "desligada", simTemp ? "LIGADA" : "desligada");
  }
}

void testeDosLedsDeAviso() {
  Serial.println(F("Teste das lampadas: os 4 LEDs de aviso (vermelho, 2 amarelos, verde) acesos por 3 s..."));
  const uint8_t avisos[] = {PINO_LED_SENSOR, PINO_LED_UMID, PINO_LED_TEMP, PINO_LED_WIFI};
  for (uint8_t p : avisos) digitalWrite(p, HIGH);
  delay(3000);
  for (uint8_t p : avisos) digitalWrite(p, LOW);
  Serial.println(F("Se algum NAO acendeu agora, o problema e a ligacao daquele LED (perna invertida, resistor ou pino errado)."));
}

void lerSensor() {
  // força uma leitura nova (a biblioteca devolve a anterior se passaram menos de 2 s)
  float temp = dht.readTemperature(false, true);
  float umid = dht.readHumidity();
  if (simFalha) temp = umid = NAN;
  if (!isnan(temp) && simTemp) temp = 35.0;
  if (!isnan(umid) && simUmid) umid = 85.0;

  if (isnan(umid) || isnan(temp)) {
    falhas++;
    falhasSeguidas++;
    Serial.printf("[%6lus] ERRO no sensor: sem leitura (%d de %d seguidas para acender o vermelho, %lu no total). Confira VCC/GND, o fio no GPIO %d e o tipo do sensor.\n",
                  millis() / 1000, falhasSeguidas, FALHAS_PARA_ALERTA, falhas, PINO_SENSOR);
    if (falhasSeguidas >= FALHAS_PARA_ALERTA && !sensorComFalha) {
      sensorComFalha = true;
      umidForaDaFaixa = tempForaDaFaixa = false;  // sem dado, não dá para avaliar o ambiente
      Serial.println(F("         >>> LED SENSOR (vermelho) ACESO: sensor sem sinal"));
    }
    return;
  }

  falhasSeguidas = 0;
  if (sensorComFalha) {
    sensorComFalha = false;
    Serial.println(F("         >>> LED SENSOR (vermelho) apagado: sensor voltou ao normal"));
  }

  leituras++;
  tempMin = min(tempMin, temp); tempMax = max(tempMax, temp);
  umidMin = min(umidMin, umid); umidMax = max(umidMax, umid);
  float sensacao = dht.computeHeatIndex(temp, umid, false);

  bool estavaUmid = umidForaDaFaixa, estavaTemp = tempForaDaFaixa;
  umidForaDaFaixa = umid < UMID_MIN || umid > UMID_MAX;
  tempForaDaFaixa = temp < TEMP_MIN || temp > TEMP_MAX;

  const char* textoUmid = umid > UMID_MAX ? "UMIDADE ALTA" : umid < UMID_MIN ? "UMIDADE BAIXA" : "umidade ok";
  const char* textoTemp = temp > TEMP_MAX ? "TEMPERATURA ALTA" : temp < TEMP_MIN ? "TEMPERATURA BAIXA" : "temperatura ok";

  Serial.printf("[%6lus] Temp: %5.1f C | Umid: %5.1f %% | Sensacao: %5.1f C | %s, %s\n",
                millis() / 1000, temp, umid, sensacao, textoTemp, textoUmid);

  if (umidForaDaFaixa != estavaUmid)
    Serial.printf("         >>> LED UMIDADE (amarelo) %s\n", umidForaDaFaixa ? "PISCANDO 1x/s" : "apagado");
  if (tempForaDaFaixa != estavaTemp)
    Serial.printf("         >>> LED TEMPERATURA (amarelo) %s\n", tempForaDaFaixa ? "PISCANDO 2x/s" : "apagado");

  if (leituras % 10 == 0) {
    Serial.printf("         -- min/max  Temp: %.1f / %.1f C | Umid: %.1f / %.1f %% | leituras: %lu, falhas: %lu --\n",
                  tempMin, tempMax, umidMin, umidMax, leituras, falhas);
  }
}

// ---------------------------------------------------------------- Wi-Fi
void conectarWifi() {
  Serial.printf("[%6lus] Wi-Fi: conectando na rede \"%s\"... (LED verde piscando)\n", millis() / 1000, WIFI_REDE);
  WiFi.disconnect();
  WiFi.begin(WIFI_REDE, WIFI_SENHA);
  estadoWifi = WIFI_CONECTANDO;
  wifiDesde = millis();
}

void cuidarWifi() {
  bool conectado = WiFi.status() == WL_CONNECTED;
  unsigned long passou = millis() - wifiDesde;

  switch (estadoWifi) {
    case WIFI_CONECTANDO:
      if (conectado) {
        estadoWifi = WIFI_CONECTADO;
        Serial.printf("[%6lus] Wi-Fi: CONECTADO (LED verde fixo) | IP %s | sinal %d dBm\n",
                      millis() / 1000, WiFi.localIP().toString().c_str(), WiFi.RSSI());
      } else if (passou > WIFI_TEMPO_TENTATIVA_MS) {
        estadoWifi = WIFI_DESCONECTADO;
        wifiDesde = millis();
        WiFi.disconnect();
        Serial.printf("[%6lus] Wi-Fi: nao conectou (LED verde apagado). Confira nome/senha e se a rede e 2,4 GHz. Nova tentativa em %lu s.\n",
                      millis() / 1000, WIFI_ESPERA_NOVA_MS / 1000);
      }
      break;
    case WIFI_CONECTADO:
      if (!conectado) {
        estadoWifi = WIFI_DESCONECTADO;
        wifiDesde = millis();
        Serial.printf("[%6lus] Wi-Fi: DESCONECTADO (LED verde apagado). Nova tentativa em %lu s.\n",
                      millis() / 1000, WIFI_ESPERA_NOVA_MS / 1000);
      }
      break;
    case WIFI_DESCONECTADO:
      if (passou > WIFI_ESPERA_NOVA_MS) conectarWifi();
      break;
  }
}

// ---------------------------------------------------------------- LEDs de aviso
void atualizarLedsAviso() {
  digitalWrite(PINO_LED_SENSOR, sensorComFalha ? HIGH : LOW);
  digitalWrite(PINO_LED_UMID, umidForaDaFaixa && piscando(1000) ? HIGH : LOW);  // 1x por segundo
  digitalWrite(PINO_LED_TEMP, tempForaDaFaixa && piscando(500) ? HIGH : LOW);   // 2x por segundo
  bool verde = estadoWifi == WIFI_CONECTADO || (estadoWifi == WIFI_CONECTANDO && piscando(400));
  digitalWrite(PINO_LED_WIFI, verde ? HIGH : LOW);
}

// ---------------------------------------------------------------- principal
void setup() {
  Serial.begin(115200);
  delay(500);
  const uint8_t saidas[] = {18, 26, 25, 19, 21, 22, PINO_LED_SENSOR, PINO_LED_UMID, PINO_LED_TEMP, PINO_LED_WIFI};
  for (uint8_t p : saidas) { pinMode(p, OUTPUT); digitalWrite(p, LOW); }
  dht.begin();

  Serial.println();
  Serial.println(F("=== Caixa InfoMed - teste dos LEDs, toque, sensor e Wi-Fi ==="));
  testeDosLedsDeAviso();
  calibrarToque();
  Serial.println(F("Simular pelo Monitor Serial (digite e Enter): f = falha do sensor | u = umidade alta | t = temperatura alta | n = normal"));
  Serial.println(F("Amarelos HORA: 5 s cada (manha -> tarde -> noite); tocar no aluminio apaga o amarelo ate o fim do ciclo. Azuis: acesos enquanto encosta."));
  Serial.printf("Sensor: %s no GPIO %d | faixa boa: %.0f a %.0f C e %.0f a %.0f%% de umidade\n\n",
                TIPO_SENSOR == DHT11 ? "DHT11" : "DHT22", PINO_SENSOR, TEMP_MIN, TEMP_MAX, UMID_MIN, UMID_MAX);

  WiFi.mode(WIFI_STA);
  WiFi.setAutoReconnect(false);  // quem decide quando reconectar é o cuidarWifi()
  conectarWifi();
}

void loop() {
  // Sem delay(): LEDs, toque, sensor e Wi-Fi andam cada um no seu ritmo.
  static unsigned long ultimoLed = 0, ultimoSensor = 0;
  static bool primeiraVez = true;
  unsigned long agora = millis();

  verificarToque();  // o tempo todo, para o azul responder na hora
  cuidarWifi();
  lerComandos();

  if (primeiraVez || agora - ultimoLed >= TEMPO_LED_MS) {
    ultimoLed = agora;
    proximoLedHora();
  }
  if (primeiraVez || agora - ultimoSensor >= INTERVALO_SENSOR_MS) {
    ultimoSensor = agora;
    lerSensor();
  }
  primeiraVez = false;

  atualizarLedsAviso();
}
