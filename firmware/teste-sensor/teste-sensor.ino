// Teste do sensor de temperatura e umidade da Caixa InfoMed.
// Mostra as leituras no Monitor Serial do Arduino IDE (115200 baud).
//
// Ligação (igual à caixa):
//   DHT  VCC  -> 3V3 do ESP32
//   DHT  DATA -> GPIO 4  (módulo de 3 pinos já tem resistor; sensor "solto" de 4 pinos: 10k entre DATA e 3V3)
//   DHT  GND  -> GND
//
// Biblioteca: "DHT sensor library" (Adafruit) + "Adafruit Unified Sensor".
// Usa DHT22? Troque TIPO_SENSOR para DHT22.

#include <DHT.h>

#define PINO_SENSOR 4
#define TIPO_SENSOR DHT11

const float LIMITE_TEMP = 30.0;  // mesmos limites do alerta do app
const float LIMITE_UMID = 75.0;
const unsigned long INTERVALO_MS = 2000;  // DHT11 não lê mais rápido que 1x/s

DHT dht(PINO_SENSOR, TIPO_SENSOR);

float tempMin = 1000, tempMax = -1000, umidMin = 1000, umidMax = -1000;
unsigned long leituras = 0, falhas = 0;

void setup() {
  Serial.begin(115200);
  delay(500);
  dht.begin();
  Serial.println();
  Serial.println(F("=== Caixa InfoMed - teste do sensor de temperatura e umidade ==="));
  Serial.printf("Sensor: %s no GPIO %d | alerta acima de %.0f C ou %.0f%%\n",
                TIPO_SENSOR == DHT11 ? "DHT11" : "DHT22", PINO_SENSOR, LIMITE_TEMP, LIMITE_UMID);
  Serial.println(F("Dica: segure o sensor com os dedos ou assopre nele para ver os valores subirem."));
  Serial.println();
}

void loop() {
  static unsigned long ultima = 0;
  if (millis() - ultima < INTERVALO_MS) return;
  ultima = millis();

  float umid = dht.readHumidity();
  float temp = dht.readTemperature();

  if (isnan(umid) || isnan(temp)) {
    falhas++;
    Serial.printf("[%6lus] ERRO: sem leitura (%lu falhas). Confira VCC/GND, o fio no GPIO %d e o tipo do sensor.\n",
                  millis() / 1000, falhas, PINO_SENSOR);
    return;
  }

  leituras++;
  tempMin = min(tempMin, temp); tempMax = max(tempMax, temp);
  umidMin = min(umidMin, umid); umidMax = max(umidMax, umid);
  float sensacao = dht.computeHeatIndex(temp, umid, false);

  bool quente = temp > LIMITE_TEMP;
  bool umido = umid > LIMITE_UMID;
  const char* situacao = quente && umido ? "ALERTA: quente e umido"
                        : quente          ? "ALERTA: muito quente"
                        : umido           ? "ALERTA: muito umido"
                                          : "OK para remedios";

  Serial.printf("[%6lus] Temp: %5.1f C | Umid: %5.1f %% | Sensacao: %5.1f C | %s\n",
                millis() / 1000, temp, umid, sensacao, situacao);

  if (leituras % 10 == 0) {
    Serial.printf("         -- min/max  Temp: %.1f / %.1f C | Umid: %.1f / %.1f %% | leituras: %lu, falhas: %lu --\n",
                  tempMin, tempMax, umidMin, umidMax, leituras, falhas);
  }
}
