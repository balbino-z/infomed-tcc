/*
 * InfoMed - TESTE DO HARDWARE (antes do firmware de verdade)
 *
 * Grave este sketch e abra o Monitor Serial em 115200.
 *  1. Os 6 LEDs acendem um de cada vez: HORA manhã, TOMADO manhã, HORA tarde,
 *     TOMADO tarde, HORA noite, TOMADO noite. Depois o azul da placa.
 *  2. A cada meio segundo aparece o valor de cada toque. Encoste no alumínio:
 *     o número tem que CAIR bem (ex.: de 60 para 15). Ao tocar, o LED TOMADO
 *     daquele compartimento acende.
 *  3. A cada 3 s aparece a temperatura e a umidade. "nan" = sensor mal ligado.
 *
 * Bibliotecas: "DHT sensor library" (Adafruit) + "Adafruit Unified Sensor".
 */
#include <DHT.h>

#define TIPO_SENSOR DHT11  // troque para DHT22 se o seu sensor for o branco

// ordem: manhã, tarde, noite
const uint8_t PINO_TOQUE[3] = {32, 33, 27};
const uint8_t PINO_LED_HORA[3] = {18, 26, 25};    // aceso = hora de tomar
const uint8_t PINO_LED_TOMADO[3] = {19, 21, 22};  // aceso = dose tomada
const uint8_t PINO_STATUS = 2;
const uint8_t PINO_SENSOR = 4;
const char* NOME[3] = {"manha", "tarde", "noite"};

DHT dht(PINO_SENSOR, TIPO_SENSOR);
float repouso[3];

void acenderUm(uint8_t pino, const char* nome) {
  Serial.printf("  %s (GPIO %d)\n", nome, pino);
  digitalWrite(pino, HIGH);
  delay(700);
  digitalWrite(pino, LOW);
}

void setup() {
  Serial.begin(115200);
  delay(300);
  Serial.println("\n=== Teste do hardware da caixa InfoMed ===");
  for (uint8_t i = 0; i < 3; i++) {
    pinMode(PINO_LED_HORA[i], OUTPUT);
    pinMode(PINO_LED_TOMADO[i], OUTPUT);
  }
  pinMode(PINO_STATUS, OUTPUT);
  dht.begin();

  Serial.println("LEDs: um de cada vez...");
  for (uint8_t i = 0; i < 3; i++) {
    char nome[24];
    snprintf(nome, sizeof(nome), "HORA %s", NOME[i]);
    acenderUm(PINO_LED_HORA[i], nome);
    snprintf(nome, sizeof(nome), "TOMADO %s", NOME[i]);
    acenderUm(PINO_LED_TOMADO[i], nome);
  }
  acenderUm(PINO_STATUS, "status (azul da placa)");

  Serial.println("Calibrando o toque (nao encoste)...");
  for (uint8_t i = 0; i < 3; i++) {
    uint32_t s = 0;
    for (uint8_t k = 0; k < 20; k++) { s += touchRead(PINO_TOQUE[i]); delay(10); }
    repouso[i] = s / 20.0;
  }
  Serial.printf("Repouso: manha=%.0f tarde=%.0f noite=%.0f\n", repouso[0], repouso[1], repouso[2]);
}

void loop() {
  static uint32_t ultimoSensor = 0;
  Serial.print("Toque: ");
  for (uint8_t i = 0; i < 3; i++) {
    uint16_t v = touchRead(PINO_TOQUE[i]);
    bool tocando = v < repouso[i] * 0.6;
    digitalWrite(PINO_LED_TOMADO[i], tocando ? HIGH : LOW);
    Serial.printf("%s=%3u%s  ", NOME[i], v, tocando ? " [TOCANDO]" : "          ");
  }
  Serial.println();

  if (millis() - ultimoSensor > 3000) {
    ultimoSensor = millis();
    Serial.printf("Sensor: %.1f C, %.0f%%\n", dht.readTemperature(), dht.readHumidity());
  }
  delay(500);
}
