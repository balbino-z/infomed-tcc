// Pinos, LEDs, toque e sensor. Ligação explicada em docs/hardware/caixa-de-remedios.md
#pragma once
#include <Arduino.h>
#include <DHT.h>

// ---- Ajuste aqui se o seu sensor for o DHT22 (branco) ----
#define TIPO_SENSOR DHT11

const char FIRMWARE_VERSAO[] = "1.3.7";

// Compartimentos: 0 = manhã, 1 = tarde, 2 = noite
// Cada compartimento tem 2 LEDs (cada um: pino -> resistor 220-330 Ω -> LED -> GND):
//   HORA   (amarelo) = aceso: está na hora de tomar (piscando: atrasado)
//   TOMADO (azul)    = aceso enquanto você encosta no alumínio (nos dois modos, igual ao teste)
const uint8_t PINO_TOQUE[3]      = {32, 33, 27};  // T9, T8, T7 (sensores de toque do ESP32)
const uint8_t PINO_LED_HORA[3]   = {18, 26, 25};
const uint8_t PINO_LED_TOMADO[3] = {19, 21, 22};
const uint8_t PINO_STATUS        = 2;             // LED azul que já vem na placa
const uint8_t PINO_SENSOR        = 4;             // dados do DHT11/DHT22
const uint8_t PINO_BOTAO_BOOT    = 0;             // botão BOOT da placa: segurar 5 s = apagar Wi-Fi e pareamento

// LEDs de aviso (cada um: pino -> resistor 220-330 Ω -> LED -> GND)
//   SENSOR      (vermelho) = aceso fixo: sensor sem sinal; apaga quando normaliza
//   UMIDADE     (amarelo)  = pisca 1x/s: umidade alta ou baixa demais
//   TEMPERATURA (amarelo)  = pisca 2x/s: temperatura alta ou baixa demais
//   WI-FI       (verde)    = piscando: conectando | aceso: conectado | apagado: desconectado
// Os pinos 16 e 17 servem na placa comum (ESP32-WROOM-32). Na WROVER eles são da memória: troque-os.
const uint8_t PINO_LED_SENSOR = 13;
const uint8_t PINO_LED_UMID   = 16;  // "RX2" na placa
const uint8_t PINO_LED_TEMP   = 17;  // "TX2" na placa
const uint8_t PINO_LED_WIFI   = 23;

// Faixa boa para guardar remédios (a maioria das bulas pede 15 a 30 °C)
const float TEMP_MINIMA = 15.0, TEMP_MAXIMA = 30.0;  // °C
const float UMID_MINIMA = 30.0, UMID_MAXIMA = 75.0;  // %
const uint32_t INTERVALO_SENSOR_MS = 5000;           // lê o sensor a cada 5 s
const uint8_t FALHAS_PARA_ALERTA = 3;                // 3 leituras seguidas sem sinal (~15 s) = sensor com falha

const char* const NOME_COMPARTIMENTO[3] = {"manha", "tarde", "noite"};

// ---------------------------------------------------------------- LEDs
extern volatile bool demoLigado;  // definido mais abaixo

enum class ModoLed : uint8_t { Apagado, Aceso, Piscando };
enum class PadraoStatus : uint8_t { PiscaRapido, PiscaLento, Batimento, Fixo, Alerta };

class Leds {
 public:
  void iniciar() {
    for (uint8_t p : saidas()) {
      pinMode(p, OUTPUT);
      digitalWrite(p, LOW);
    }
    pinMode(PINO_STATUS, OUTPUT);
    digitalWrite(PINO_STATUS, LOW);
  }

  void definirHora(uint8_t i, ModoLed m) { hora[i] = m; }
  void definirTomado(uint8_t i, ModoLed m) { tomado[i] = m; }
  void apagarTudo() {
    for (uint8_t i = 0; i < 3; i++) hora[i] = tomado[i] = ModoLed::Apagado;
  }
  void definirAvisos(bool sensorFalhou, bool umidRuim, bool tempRuim) {
    sensorFalha = sensorFalhou;
    umidade = umidRuim;
    temperatura = tempRuim;
  }
  void definirWifi(ModoLed m) { wifi = m; }

  // todos os 10 LEDs juntos (usado no reset)
  void todos(bool aceso) {
    for (uint8_t p : saidas()) digitalWrite(p, aceso ? HIGH : LOW);
  }

  // Piscada curta no LED de HORA, com prioridade sobre o modo (1 vez = toque sem dose pendente)
  void piscar(uint8_t i, uint8_t vezes) {
    animInicio[i] = millis();
    animVezes[i] = vezes;
  }

  void desenhar(uint32_t agora, PadraoStatus padrao) {
    for (uint8_t i = 0; i < 3 && !demoLigado; i++) {  // modo demo: a tarefa do toque desenha estes
      bool aceso;
      uint32_t t = agora - animInicio[i];
      if (animVezes[i] > 0 && t < animVezes[i] * 300UL) {
        aceso = (t % 300) < 150;
      } else {
        animVezes[i] = 0;
        aceso = ligado(hora[i], agora, 500);
      }
      digitalWrite(PINO_LED_HORA[i], aceso ? HIGH : LOW);
    }

    digitalWrite(PINO_LED_SENSOR, sensorFalha ? HIGH : LOW);                                   // fixo
    digitalWrite(PINO_LED_UMID, umidade && (agora / 500) % 2 == 0 ? HIGH : LOW);               // 1x por segundo
    digitalWrite(PINO_LED_TEMP, temperatura && (agora / 250) % 2 == 0 ? HIGH : LOW);           // 2x por segundo
    digitalWrite(PINO_LED_WIFI, ligado(wifi, agora, 300) ? HIGH : LOW);

    bool s = false;
    switch (padrao) {
      case PadraoStatus::PiscaRapido: s = (agora / 100) % 2 == 0; break;   // configuração
      case PadraoStatus::PiscaLento:  s = (agora / 600) % 2 == 0; break;   // conectando
      case PadraoStatus::Batimento:   s = (agora % 10000) < 80; break;     // tudo ok: sinal de vida
      case PadraoStatus::Fixo:        s = true; break;                     // offline
      case PadraoStatus::Alerta: {                                         // temperatura/umidade
        uint32_t t = agora % 2000;
        s = t < 900 && (t % 300) < 150;  // 3 piscadas e pausa
        break;
      }
    }
    digitalWrite(PINO_STATUS, s ? HIGH : LOW);
  }

 private:
  static const uint8_t (&saidas())[10] {
    static const uint8_t lista[10] = {
      PINO_LED_HORA[0], PINO_LED_HORA[1], PINO_LED_HORA[2],
      PINO_LED_TOMADO[0], PINO_LED_TOMADO[1], PINO_LED_TOMADO[2],
      PINO_LED_SENSOR, PINO_LED_UMID, PINO_LED_TEMP, PINO_LED_WIFI};
    return lista;
  }

  static bool ligado(ModoLed m, uint32_t agora, uint32_t meioPeriodo) {
    return m == ModoLed::Aceso || (m == ModoLed::Piscando && (agora / meioPeriodo) % 2 == 0);
  }

  ModoLed hora[3] = {ModoLed::Apagado, ModoLed::Apagado, ModoLed::Apagado};
  ModoLed tomado[3] = {ModoLed::Apagado, ModoLed::Apagado, ModoLed::Apagado};
  ModoLed wifi = ModoLed::Apagado;
  bool sensorFalha = false, umidade = false, temperatura = false;
  uint32_t animInicio[3] = {0, 0, 0};
  uint8_t animVezes[3] = {0, 0, 0};
};

// ---------------------------------------------------------------- Toque
// Igual ao sketch de teste (teste-leds-sensor), que funcionou bem:
//   - calibra uma vez ao ligar (NÃO encoste no alumínio nessa hora);
//   - média de 4 leituras; tocando = valor abaixo de 60% do valor sem toque;
//   - o toque conta no momento em que encosta.
// A leitura roda numa tarefa própria (a cada 10 ms) para nunca esperar a internet:
// as chamadas HTTPS travam o loop por 1-3 s e era isso que deixava o azul "estranho".
class Toque {
 public:
  static constexpr float LIMIAR = 0.6f;

  void calibrar() {
    Serial.println("[toque] calibrando... NAO encoste no aluminio.");
    for (uint8_t c = 0; c < 3; c++) {
      uint32_t soma = 0;
      for (uint8_t i = 0; i < 20; i++) {
        soma += ler(c);
        delay(20);
      }
      base[c] = soma / 20;
      Serial.printf("[toque] %s (GPIO %d): valor sem toque = %lu, conta como toque abaixo de %lu\n",
                    NOME_COMPARTIMENTO[c], PINO_TOQUE[c], (unsigned long)base[c],
                    (unsigned long)(base[c] * LIMIAR));
      if (base[c] < 10) Serial.println("[toque] AVISO: valor muito baixo. O jumper está encostando em algo?");
    }
  }

  // Chamado só pela tarefa do toque
  void atualizar() {
    for (uint8_t c = 0; c < 3; c++) {
      uint32_t valor = ler(c);
      bool agora = valor < base[c] * LIMIAR;
      if (agora == tocando[c]) continue;
      tocando[c] = agora;
      Serial.printf("[toque] %s %s (valor do toque: %lu)\n", agora ? "TOQUE na" : "Soltou a",
                    NOME_COMPARTIMENTO[c], (unsigned long)valor);
      // O azul segue o dedo na hora. Já o "toque" (dose/app) ignora repetições em menos de 1,5 s:
      // um encostar pode oscilar e virar 2 toques, e o 2º faria o amarelo piscar à toa.
      uint32_t ms = millis();
      if (agora && ms - ultimoEvento[c] >= 1500) {
        ultimoEvento[c] = ms;
        novoToque[c] = true;  // para o loop (dose / app)
        novoDemo[c] = true;   // para o modo demo (apaga o amarelo)
      }
    }
  }

  // true uma única vez por toque
  bool tocou(uint8_t c) {
    bool t = novoToque[c];
    novoToque[c] = false;
    return t;
  }
  bool tocouDemo(uint8_t c) {
    bool t = novoDemo[c];
    novoDemo[c] = false;
    return t;
  }
  bool encostado(uint8_t c) const { return tocando[c]; }

 private:
  uint32_t base[3] = {0, 0, 0};
  volatile bool tocando[3] = {false, false, false};
  volatile bool novoToque[3] = {false, false, false};
  volatile bool novoDemo[3] = {false, false, false};
  uint32_t ultimoEvento[3] = {0, 0, 0};

  static uint32_t ler(uint8_t c) {
    uint32_t soma = 0;
    for (int i = 0; i < 4; i++) soma += touchRead(PINO_TOQUE[c]);
    return soma / 4;
  }
};

// ---------------------------------------------------------------- Modo demo + toque (tarefa)
// Modo demonstração, igual ao sketch de teste:
//   HORA (amarelo): manhã -> tarde -> noite, 5 s cada. Tocar no alumínio apaga o amarelo
//                   daquele compartimento até o fim do ciclo; o ciclo seguinte volta ao normal.
//   TOMADO (azul):  aceso enquanto você encosta no alumínio.
// Fora do modo demo, os amarelos ficam com o loop (lembretes reais); os azuis são sempre desta tarefa.
const uint32_t TEMPO_DEMO_MS = 5000;
Toque toque;
volatile bool demoLigado = false;  // o loop liga/desliga conforme o botão do app

void tarefaToque(void*) {
  bool ativo = false;
  uint32_t inicio = 0;
  int8_t atual = -1;
  bool tomadoNoCiclo[3] = {false, false, false};

  for (;;) {
    toque.atualizar();
    uint32_t agora = millis();

    if (demoLigado) {
      if (!ativo) {
        ativo = true;
        inicio = agora;
        atual = -1;
        for (uint8_t c = 0; c < 3; c++) toque.tocouDemo(c);  // descarta toques antigos
      }
      int8_t i = ((agora - inicio) / TEMPO_DEMO_MS) % 3;
      if (i != atual) {
        if (i == 0) tomadoNoCiclo[0] = tomadoNoCiclo[1] = tomadoNoCiclo[2] = false;  // ciclo novo
        atual = i;
      }
      for (uint8_t c = 0; c < 3; c++) {
        if (toque.tocouDemo(c) && !tomadoNoCiclo[c]) {
          tomadoNoCiclo[c] = true;
          Serial.printf("[demo] %s tomado: LED amarelo apagado até o fim do ciclo\n", NOME_COMPARTIMENTO[c]);
        }
        digitalWrite(PINO_LED_HORA[c], (c == atual && !tomadoNoCiclo[c]) ? HIGH : LOW);
      }
    } else {
      ativo = false;
    }
    // Azul (TOMADO), nos dois modos: aceso só enquanto encosta no alumínio (igual ao teste)
    for (uint8_t c = 0; c < 3; c++) digitalWrite(PINO_LED_TOMADO[c], toque.encostado(c) ? HIGH : LOW);
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

// Prioridade maior que o loop (1): roda mesmo enquanto o loop espera a internet.
void iniciarTarefaToque() {
  xTaskCreatePinnedToCore(tarefaToque, "toque", 4096, nullptr, 2, nullptr, 1);
}

// ---------------------------------------------------------------- Sensor
class Sensor {
 public:
  float temp = NAN;
  float umid = NAN;

  void iniciar() { dht.begin(); }

  void atualizar(uint32_t agora) {
    if (lida && agora - ultima < INTERVALO_SENSOR_MS) return;  // DHT11 não gosta de leituras seguidas
    lida = true;
    ultima = agora;
    float t = dht.readTemperature();
    float h = dht.readHumidity();

    if (isnan(t) || isnan(h)) {
      if (falhasSeguidas < 255) falhasSeguidas++;
      Serial.printf("[sensor] falha na leitura (%u seguidas; confira a ligação no GPIO 4)\n", falhasSeguidas);
      if (falhasSeguidas == FALHAS_PARA_ALERTA) {
        temp = umid = NAN;  // não usa valor velho: sem sinal, não há o que avaliar nem enviar
        Serial.println("[sensor] SEM SINAL: LED vermelho aceso");
      }
      return;
    }

    if (comFalha()) Serial.println("[sensor] voltou ao normal: LED vermelho apagado");
    falhasSeguidas = 0;
    bool mudou = isnan(temp) || isnan(umid) || fabsf(t - temp) >= 0.5f || fabsf(h - umid) >= 1.0f;
    temp = t;
    umid = h;
    if (mudou) {
      Serial.printf("[sensor] %.1f °C, %.0f%%%s%s\n", temp, umid,
                    tempRuim() ? (temp > TEMP_MAXIMA ? " | TEMPERATURA ALTA" : " | TEMPERATURA BAIXA") : "",
                    umidRuim() ? (umid > UMID_MAXIMA ? " | UMIDADE ALTA" : " | UMIDADE BAIXA") : "");
    }
  }

  bool comFalha() const { return falhasSeguidas >= FALHAS_PARA_ALERTA; }
  bool tempRuim() const { return !isnan(temp) && (temp < TEMP_MINIMA || temp > TEMP_MAXIMA); }
  bool umidRuim() const { return !isnan(umid) && (umid < UMID_MINIMA || umid > UMID_MAXIMA); }
  bool foraDaFaixa() const { return tempRuim() || umidRuim(); }

 private:
  DHT dht{PINO_SENSOR, TIPO_SENSOR};
  uint32_t ultima = 0;
  bool lida = false;
  uint8_t falhasSeguidas = 0;
};
