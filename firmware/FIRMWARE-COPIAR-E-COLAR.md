# Firmware da caixa InfoMed (versão 1.3.7): copiar e colar

O firmware tem **várias abas**. Cada bloco abaixo é uma aba do Arduino IDE.

## Passo a passo

1. Arduino IDE → **Arquivo → Novo Sketch**. Salve com o nome **caixa-infomed** (Arquivo → Salvar como).
2. Apague tudo que vier na aba `caixa-infomed.ino` e cole o bloco **caixa-infomed.ino**.
3. Para cada outro arquivo: clique na **setinha ⋮ / ▼ à direita das abas → Nova aba** (ou **Ctrl+Shift+N**), digite o nome **exatamente** (ex.: `hardware.h`), Enter, e cole o bloco dele.
4. **config.h** (endereço e chave do Supabase):
   - **Jeito recomendado:** no terminal, na pasta do projeto InfoMed, rode `node scripts/caixa-config.mjs`. Ele cria o `firmware/caixa-infomed/config.h` certinho (com o certificado). Copie esse arquivo para a pasta do sketch.
   - **Jeito manual:** crie a aba `config.h`, cole o bloco **config.example.h** e troque o endereço e a chave **publishable** pelos do seu `.env` (`VITE_SUPABASE_URL` e a chave publishable). Nunca use a chave secret/service_role. Sem certificado a caixa funciona, mas não confere o servidor.
5. Bibliotecas (Ferramentas → Gerenciar Bibliotecas): **ArduinoJson 7.x**, **DHT sensor library** (Adafruit) e **Adafruit Unified Sensor**.
6. Placa **ESP32 Dev Module**, porta COM certa → **Carregar** → Monitor Serial em **115200**.

> Este arquivo é gerado a partir de `firmware/caixa-infomed/`. Se o código mudar, gere de novo.

---

## caixa-infomed.ino

_Arquivo principal (a aba que já abre com o sketch)_

```cpp
/*
 * InfoMed - Caixa de remédios inteligente (ESP32 comum: DevKit / WROOM)
 *
 * Três compartimentos (manhã, tarde, noite). Na hora do remédio o LED do
 * compartimento acende; o paciente toca no compartimento ao tomar e a caixa
 * envia a dose ao InfoMed (Supabase). Sem internet, guarda as doses e reenvia.
 *
 * O código fica nos arquivos .h desta pasta (abas na Arduino IDE):
 *   hardware.h  pinos, LEDs, toque e sensor
 *   nuvem.h     chamadas HTTPS às funções do banco (db/10_caixa.sql)
 *   agenda.h    horários, doses tomadas e fila offline
 *   portal.h    página de configuração (rede "InfoMed-Caixa")
 *   estados.h   máquina de estados (padrão de projeto State)
 *
 * Antes de compilar: gere o config.h com  node scripts/caixa-config.mjs
 * Passo a passo completo: docs/hardware/caixa-de-remedios.md
 */
#include "estados.h"

void setup() {
  caixa.iniciar();
}

void loop() {
  caixa.loop();
}
```

---

## hardware.h

_Pinos, LEDs, toque e sensor_

```cpp
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
```

---

## nuvem.h

_Conversa com a API (Supabase)_

```cpp
// Chamadas HTTPS às funções do banco (POST /rest/v1/rpc/<funcao>).
// A caixa usa só a chave publishable: o banco libera para ela apenas as
// funções parear_caixa, caixa_agenda, caixa_registrar_dose, caixa_leitura e caixa_toque.
#pragma once
#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <HTTPClient.h>

#if __has_include("config.h")
#include "config.h"
#else
#error "Falta o config.h. Na pasta do projeto rode: node scripts/caixa-config.mjs  (ou copie config.example.h para config.h)"
#endif

enum class Rede : uint8_t { Ok, SemRede, NaoAutorizada, Erro };

struct RespostaHttp {
  int status = -1;
  String corpo;
};

inline RespostaHttp chamarRpc(const char* funcao, const String& json) {
  RespostaHttp r;
  if (WiFi.status() != WL_CONNECTED) return r;

  WiFiClientSecure cliente;
  if (strlen(CERTIFICADO_RAIZ) > 100) {
    cliente.setCACert(CERTIFICADO_RAIZ);
  } else {
    static bool avisou = false;
    if (!avisou) Serial.println("[nuvem] AVISO: sem certificado raiz no config.h, o servidor NAO e conferido");
    avisou = true;
    cliente.setInsecure();
  }

  HTTPClient http;
  String url = String(SUPABASE_URL) + "/rest/v1/rpc/" + funcao;
  if (!http.begin(cliente, url)) return r;
  http.setTimeout(10000);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("apikey", SUPABASE_KEY);
  r.status = http.POST(json);
  if (r.status > 0) r.corpo = http.getString();
  http.end();

  if (r.status != 200) {
    Serial.printf("[nuvem] %s -> HTTP %d %s\n", funcao, r.status, r.corpo.substring(0, 160).c_str());
  }
  return r;
}

// Token revogado ("Desparear" no app) volta com o código 28000 do PostgreSQL.
inline Rede classificar(const RespostaHttp& r) {
  if (r.status == 200) return Rede::Ok;
  if (r.status <= 0) return Rede::SemRede;
  // só o código do erro (e não qualquer "28000" que apareça no texto)
  if (r.corpo.indexOf("\"code\":\"28000\"") >= 0) return Rede::NaoAutorizada;
  return Rede::Erro;
}
```

---

## agenda.h

_Horários, doses tomadas e fila offline_

```cpp
// Horários (agenda em cache), doses já tomadas e fila offline.
#pragma once
#include <Arduino.h>
#include <ArduinoJson.h>  // versão 7
#include <Preferences.h>
#include <time.h>

const int MAX_DOSES = 24;    // horários (lembrete × horário) guardados na caixa
const int MAX_TOMADAS = 48;  // doses já confirmadas (últimas ~26 h)
const int MAX_FILA = 50;     // doses esperando internet

// Janela da dose (igual ao banco: public.dose_status)
const long ANTES_SEG = 30 * 60;       // aceita toque 30 min antes
const long NO_HORARIO_SEG = 30 * 60;  // até 30 min depois = no horário (LED aceso)
const long LIMITE_SEG = 2 * 60 * 60;  // até 2 h depois = atrasada (LED piscando); depois = esquecida

struct Dose {
  char lembrete[37];
  char nome[41];
  uint8_t hora;
  uint8_t minuto;
  uint8_t dias;           // bit 0 = domingo ... bit 6 = sábado
  uint8_t compartimento;  // 0 manhã (< 12h), 1 tarde (12h-18h), 2 noite (>= 18h)
};

struct DoseTomada {
  char lembrete[37];
  uint32_t agendada;
  uint32_t ledAte;  // LED "tomado" fica aceso até este instante
};

// LED "tomado": aceso até o fim da janela da dose (2 h depois do horário) e,
// no mínimo, 5 minutos depois do toque.
const long LED_TOMADO_MINIMO_SEG = 5 * 60;

struct ItemFila {
  char lembrete[37];
  uint32_t agendada;  // horário previsto (epoch, segundos)
  uint32_t tomada;    // quando o paciente tocou
};

inline uint8_t compartimentoDoHorario(uint8_t hora) { return hora < 12 ? 0 : (hora < 18 ? 1 : 2); }

inline bool relogioOk() { return time(nullptr) > 1700000000; }

// Horário previsto (epoch) da dose no dia de hoje (+desloc dias). Preenche o dia da semana.
inline uint32_t ocorrencia(const Dose& d, time_t agora, int deslocDias, int& diaSemana) {
  struct tm t;
  localtime_r(&agora, &t);
  t.tm_mday += deslocDias;
  t.tm_hour = d.hora;
  t.tm_min = d.minuto;
  t.tm_sec = 0;
  t.tm_isdst = 0;
  time_t e = mktime(&t);  // normaliza a data e calcula tm_wday
  diaSemana = t.tm_wday;
  return (uint32_t)e;
}

class Agenda {
 public:
  Dose doses[MAX_DOSES];
  int n = 0;
  bool demo = false;  // modo demonstração, ligado/desligado pelo app

  // Lê o JSON de caixa_agenda. Devolve a hora do servidor (0 se inválido).
  uint32_t carregar(const String& json) {
    JsonDocument doc;
    if (deserializeJson(doc, json)) {
      Serial.println("[agenda] JSON inválido");
      return 0;
    }
    n = 0;
    nTomadas = 0;
    proxima = 0;  // sem isto, depois de algumas buscas a dose tomada ia para uma posição que
                  // jaTomada() não confere, e o amarelo voltava a acender
    for (JsonObject l : doc["lembretes"].as<JsonArray>()) {
      uint8_t dias = 0;
      for (JsonVariant d : l["dias"].as<JsonArray>()) {
        int x = d.as<int>();
        if (x >= 0 && x <= 6) dias |= (1 << x);
      }
      for (JsonVariant h : l["horarios"].as<JsonArray>()) {
        if (n >= MAX_DOSES) break;
        int hh, mm;
        const char* txt = h.as<const char*>();
        if (!txt || sscanf(txt, "%d:%d", &hh, &mm) != 2 || hh < 0 || hh > 23 || mm < 0 || mm > 59) continue;
        Dose& d = doses[n++];
        strlcpy(d.lembrete, l["id"] | "", sizeof(d.lembrete));
        strlcpy(d.nome, l["nome"] | "", sizeof(d.nome));
        d.hora = hh;
        d.minuto = mm;
        d.dias = dias;
        d.compartimento = compartimentoDoHorario(hh);
      }
    }
    for (JsonObject t : doc["tomadas"].as<JsonArray>()) {
      marcarTomada(t["lembrete"] | "", t["agendada"].as<uint32_t>());
    }
    bool demoNovo = doc["demo"] | false;
    if (demoNovo != demo) Serial.printf("[agenda] modo demonstração %s pelo app\n", demoNovo ? "LIGADO" : "desligado");
    demo = demoNovo;
    Serial.printf("[agenda] %d horários carregados%s\n", n, demo ? " (modo demo)" : "");
    return doc["agora"].as<uint32_t>();
  }

  bool jaTomada(const char* lembrete, uint32_t agendada) const {
    for (int i = 0; i < nTomadas; i++) {
      if (tomadas[i].agendada == agendada && strcmp(tomadas[i].lembrete, lembrete) == 0) return true;
    }
    return false;
  }

  // tomadaEm = 0 quando não se sabe a hora do toque (dose que veio do servidor)
  void marcarTomada(const char* lembrete, uint32_t agendada, uint32_t tomadaEm = 0) {
    if (jaTomada(lembrete, agendada)) return;
    DoseTomada& t = tomadas[proxima];
    strlcpy(t.lembrete, lembrete, sizeof(t.lembrete));
    t.agendada = agendada;
    t.ledAte = agendada + LIMITE_SEG;
    if (tomadaEm && tomadaEm + LED_TOMADO_MINIMO_SEG > t.ledAte) t.ledAte = tomadaEm + LED_TOMADO_MINIMO_SEG;
    proxima = (proxima + 1) % MAX_TOMADAS;
    if (nTomadas < MAX_TOMADAS) nTomadas++;
  }

  // Há dose tomada deste compartimento com o LED "tomado" ainda aceso? Devolve o lembrete/horário.
  const DoseTomada* tomadaRecente(uint8_t compartimento, time_t agora) const {
    for (int i = 0; i < nTomadas; i++) {
      const DoseTomada& t = tomadas[i];
      if ((uint32_t)agora >= t.ledAte) continue;
      time_t a = t.agendada;
      struct tm lt;
      localtime_r(&a, &lt);
      if (compartimentoDoHorario(lt.tm_hour) == compartimento) return &t;
    }
    return nullptr;
  }

 private:
  DoseTomada tomadas[MAX_TOMADAS];
  int nTomadas = 0;
  int proxima = 0;
};

// Fila de doses guardada na memória flash: sobrevive a falta de energia.
class Fila {
 public:
  ItemFila itens[MAX_FILA];
  int n = 0;

  void carregar(Preferences& p) {
    size_t tam = p.getBytesLength("fila");
    n = 0;
    if (tam > 0 && tam <= sizeof(itens) && tam % sizeof(ItemFila) == 0) {
      p.getBytes("fila", itens, tam);
      n = tam / sizeof(ItemFila);
    }
    if (n) Serial.printf("[fila] %d dose(s) esperando envio\n", n);
  }

  void salvar(Preferences& p) {
    if (n == 0) p.remove("fila");
    else p.putBytes("fila", itens, n * sizeof(ItemFila));
  }

  void adicionar(Preferences& p, const char* lembrete, uint32_t agendada, uint32_t tomada) {
    if (n >= MAX_FILA) {  // cheia: descarta a mais antiga
      memmove(&itens[0], &itens[1], (MAX_FILA - 1) * sizeof(ItemFila));
      n--;
    }
    ItemFila& it = itens[n++];
    strlcpy(it.lembrete, lembrete, sizeof(it.lembrete));
    it.agendada = agendada;
    it.tomada = tomada;
    salvar(p);
  }

  // A dose ainda está esperando para ir ao servidor?
  bool contem(const char* lembrete, uint32_t agendada) const {
    for (int i = 0; i < n; i++) {
      if (itens[i].agendada == agendada && strcmp(itens[i].lembrete, lembrete) == 0) return true;
    }
    return false;
  }

  void removerPrimeiro(Preferences& p) {
    if (n == 0) return;
    memmove(&itens[0], &itens[1], (n - 1) * sizeof(ItemFila));
    n--;
    salvar(p);
  }
};
```

---

## portal.h

_Página da rede InfoMed-Caixa_

```cpp
// Página de configuração. A caixa cria a rede "InfoMed-Caixa"; ao conectar o
// celular, a página abre sozinha (portal cativo) e pede o Wi-Fi de casa e o
// código de 6 dígitos que o app mostra. A senha da conta InfoMed nunca passa aqui.
#pragma once
#include <WiFi.h>
#include <WebServer.h>
#include <DNSServer.h>

const char NOME_REDE_CAIXA[] = "InfoMed-Caixa";

namespace portal {

WebServer servidor(80);
DNSServer dns;
bool ativo = false;
bool rotasProntas = false;
String opcoesRedes;
String erro;

// preenchidos quando a pessoa envia o formulário
bool recebido = false;
String ssid, senha, codigo;

String esc(const String& s) {
  String o;
  for (size_t i = 0; i < s.length(); i++) {
    char c = s[i];
    if (c == '<') o += "&lt;";
    else if (c == '>') o += "&gt;";
    else if (c == '&') o += "&amp;";
    else if (c == '"') o += "&quot;";
    else o += c;
  }
  return o;
}

const char CSS[] =
    "body{font-family:system-ui,sans-serif;background:#F7FAFF;color:#1A2B48;margin:0;padding:24px}"
    ".c{max-width:420px;margin:auto;background:#fff;border-radius:20px;padding:24px;border:1px solid #E8F1FF}"
    "h1{font-size:20px;margin:0 0 4px}p{color:#64748B;font-size:14px}"
    "label{display:block;font-size:14px;color:#64748B;margin-top:14px}"
    "input{width:100%;box-sizing:border-box;padding:12px;border:1px solid #D9E6F7;border-radius:12px;font-size:16px;margin-top:4px}"
    "button{width:100%;margin-top:20px;padding:14px;border:0;border-radius:12px;background:#0A73FF;color:#fff;font-size:16px}"
    ".e{background:#FF4D5E1A;color:#C6283A;padding:10px;border-radius:10px;font-size:14px}";

void paginaInicial() {
  String h;
  h.reserve(2500);
  h += F("<!doctype html><html lang=pt-BR><head><meta charset=utf-8>"
         "<meta name=viewport content='width=device-width,initial-scale=1'><title>Caixa InfoMed</title><style>");
  h += CSS;
  h += F("</style></head><body><div class=c><h1>Caixa de remédios InfoMed</h1>"
         "<p>No app: Perfil &rarr; Minha caixa de remédios &rarr; Parear. Digite abaixo o código que aparecer.</p>");
  if (erro.length()) h += "<p class=e>" + esc(erro) + "</p>";
  h += F("<form method=post action=/salvar>"
         "<label>Wi-Fi da sua casa<input name=ssid list=redes required maxlength=32 autocomplete=off></label>"
         "<datalist id=redes>");
  h += opcoesRedes;
  h += F("</datalist>"
         "<label>Senha do Wi-Fi<input name=senha type=password maxlength=64></label>"
         "<label>Código de 6 dígitos<input name=codigo inputmode=numeric pattern='[0-9]{6}' maxlength=6 required></label>"
         "<button>Conectar e parear</button></form>"
         "<p>Use uma rede 2,4 GHz sem página de login (o roteador do celular serve).</p></div></body></html>");
  servidor.send(200, "text/html; charset=utf-8", h);
}

void salvar() {
  String s = servidor.arg("ssid");
  String c = servidor.arg("codigo");
  s.trim();
  c.trim();
  bool codigoOk = c.length() == 6;
  for (size_t i = 0; i < c.length(); i++) codigoOk = codigoOk && isDigit(c[i]);
  if (s.length() == 0 || !codigoOk) {
    erro = "Preencha o nome do Wi-Fi e o código de 6 dígitos.";
    paginaInicial();
    return;
  }
  ssid = s;
  senha = servidor.arg("senha");
  codigo = c;
  recebido = true;
  String h = F("<!doctype html><html lang=pt-BR><head><meta charset=utf-8>"
               "<meta name=viewport content='width=device-width,initial-scale=1'><style>");
  h += CSS;
  h += F("</style></head><body><div class=c><h1>Conectando...</h1>"
         "<p>A caixa vai sair desta rede e entrar no seu Wi-Fi. Volte ao app InfoMed: "
         "em até 1 minuto deve aparecer <b>Caixa pareada</b>.</p>"
         "<p>Se a luz azul da placa voltar a piscar rápido, algo deu errado: conecte de novo na rede "
         "InfoMed-Caixa para ver o motivo.</p></div></body></html>");
  servidor.send(200, "text/html; charset=utf-8", h);
}

// Qualquer outro endereço (testes de internet do Android/iPhone) vai para a página.
void redirecionar() {
  servidor.sendHeader("Location", String("http://") + WiFi.softAPIP().toString() + "/", true);
  servidor.send(302, "text/plain", "");
}

void iniciar(const String& mensagemErro) {
  erro = mensagemErro;
  recebido = false;

  WiFi.mode(WIFI_AP_STA);
  int n = WiFi.scanNetworks();
  opcoesRedes = "";
  for (int i = 0; i < n && i < 15; i++) {
    opcoesRedes += "<option value=\"" + esc(WiFi.SSID(i)) + "\">";
  }
  WiFi.scanDelete();

  WiFi.softAP(NOME_REDE_CAIXA);
  delay(100);
  dns.start(53, "*", WiFi.softAPIP());
  if (!rotasProntas) {
    servidor.on("/", HTTP_GET, paginaInicial);
    servidor.on("/salvar", HTTP_POST, salvar);
    servidor.onNotFound(redirecionar);
    rotasProntas = true;
  }
  servidor.begin();
  ativo = true;
  Serial.printf("[portal] rede '%s' criada. Abra http://%s\n", NOME_REDE_CAIXA, WiFi.softAPIP().toString().c_str());
}

void atender() {
  if (!ativo) return;
  dns.processNextRequest();
  servidor.handleClient();
}

void parar() {
  if (!ativo) return;
  servidor.stop();
  dns.stop();
  WiFi.softAPdisconnect(true);
  ativo = false;
}

}  // namespace portal
```

---

## estados.h

_Comportamento da caixa (State) + modo demo_

```cpp
// Máquina de estados da caixa: PADRÃO DE PROJETO STATE.
//
// A classe Caixa (o "contexto") guarda os dados e delega o comportamento ao
// estado atual. Cada estado decide o padrão do LED de status e para qual
// estado ir. Trocar de estado = trocar o objeto, sem if/else espalhado.
//
//   CONFIGURACAO --(Wi-Fi + código ok)--> CONECTANDO --> SINCRONIZANDO --> OCIOSO <--> DOSE_PENDENTE
//   qualquer estado pareado --(sem Wi-Fi)--> OFFLINE --(voltou)--> SINCRONIZANDO
//   segurar o botão BOOT da placa por 5 s --> apaga tudo e volta para CONFIGURACAO
#pragma once
#include <Preferences.h>
#include <sys/time.h>
#include <esp_system.h>
#include "hardware.h"
#include "nuvem.h"
#include "agenda.h"
#include "portal.h"

const char FUSO_SAO_PAULO[] = "<-03>3";
const uint32_t INTERVALO_AGENDA = 15UL * 1000;       // busca horários e o modo demo a cada 15 s (o botão do app vale logo)
const int MAX_TOQUES = 10;                           // toques esperando para ir ao app (só na memória)
const uint32_t INTERVALO_LEITURA = 5UL * 60 * 1000;  // envia temperatura a cada 5 min
const uint32_t INTERVALO_FILA = 3000;                // tenta enviar a próxima dose da fila

class Caixa;

class Estado {
 public:
  virtual ~Estado() {}
  virtual const char* nome() const = 0;
  virtual PadraoStatus padrao(const Caixa& c) const = 0;
  virtual void entrar(Caixa& c) {}
  virtual void executar(Caixa& c) = 0;
  virtual void sair(Caixa& c) {}
  // LED verde do Wi-Fi: padrão = aceso se conectado, apagado se não
  virtual ModoLed ledWifi(const Caixa& c) const;
};

class EstadoConfiguracao : public Estado {
 public:
  const char* nome() const override { return "CONFIGURACAO"; }
  PadraoStatus padrao(const Caixa&) const override { return PadraoStatus::PiscaRapido; }
  ModoLed ledWifi(const Caixa&) const override { return ModoLed::Apagado; }  // rede própria da caixa, sem internet
  void entrar(Caixa& c) override;
  void executar(Caixa& c) override;
  void sair(Caixa& c) override;
 private:
  uint32_t recebidoEm = 0;
};

class EstadoConectando : public Estado {
 public:
  const char* nome() const override { return "CONECTANDO"; }
  PadraoStatus padrao(const Caixa&) const override { return PadraoStatus::PiscaLento; }
  ModoLed ledWifi(const Caixa&) const override { return ModoLed::Piscando; }
  void entrar(Caixa& c) override;
  void executar(Caixa& c) override;
 private:
  uint32_t inicio = 0;
};

class EstadoSincronizando : public Estado {
 public:
  const char* nome() const override { return "SINCRONIZANDO"; }
  PadraoStatus padrao(const Caixa&) const override { return PadraoStatus::PiscaLento; }
  void entrar(Caixa& c) override;
  void executar(Caixa& c) override;
 private:
  uint32_t inicio = 0;
  uint32_t ultimaTentativa = 0;
};

class EstadoOcioso : public Estado {
 public:
  const char* nome() const override { return "OCIOSO"; }
  PadraoStatus padrao(const Caixa& c) const override;
  void executar(Caixa& c) override;
};

class EstadoDosePendente : public Estado {
 public:
  const char* nome() const override { return "DOSE_PENDENTE"; }
  PadraoStatus padrao(const Caixa& c) const override;
  void executar(Caixa& c) override;
};

class EstadoOffline : public Estado {
 public:
  const char* nome() const override { return "OFFLINE"; }
  PadraoStatus padrao(const Caixa&) const override { return PadraoStatus::Fixo; }
  ModoLed ledWifi(const Caixa& c) const override;  // piscando enquanto tenta reconectar
  void entrar(Caixa& c) override;
  void executar(Caixa& c) override;
 private:
  uint32_t ultimaTentativa = 0;
  uint32_t reconectandoDesde = 0;  // 0 = não está tentando agora
};

EstadoConfiguracao configuracao;
EstadoConectando conectando;
EstadoSincronizando sincronizando;
EstadoOcioso ocioso;
EstadoDosePendente dosePendente;
EstadoOffline offline;

// =====================================================================
class Caixa {
 public:
  Preferences prefs;
  Leds leds;
  Sensor sensor;
  Agenda agenda;
  Fila fila;

  String ssid, senha, deviceId, token;
  String codigoPendente;  // código de pareamento digitado na página
  String erro;            // último erro, mostrado na página de configuração

  uint32_t ultimaAgenda = 0, ultimaLeitura = 0, ultimoEnvio = 0, ultimoToque = 0;
  bool agendaBuscada = false, leituraEnviada = false, alertaEnviado = false, falhaEnviada = false;

  // Toques nos compartimentos, para o app mostrar (perdem-se se a caixa desligar: são só informativos)
  struct ToqueApp { uint8_t compartimento; uint32_t quando; bool dose; bool demo; };
  ToqueApp toques[MAX_TOQUES];
  int nToques = 0;

  // Modo demonstração: quem desenha os LEDs é a tarefa do toque (hardware.h)
  bool demoAtivo = false;

  void iniciar() {
    Serial.begin(115200);
    delay(200);
    Serial.printf("\n=== InfoMed - caixa de remédios %s ===\n", FIRMWARE_VERSAO);
    Serial.printf("[caixa] motivo do último reinício: %s\n", motivoReinicio());
    pinMode(PINO_BOTAO_BOOT, INPUT_PULLUP);
    setenv("TZ", FUSO_SAO_PAULO, 1);
    tzset();

    leds.iniciar();
    sensor.iniciar();
    Serial.println("[toque] calibrando: não encoste nos compartimentos...");
    toque.calibrar();
    iniciarTarefaToque();  // toque + LEDs do modo demo, sem esperar a internet

    prefs.begin("infomed", false);
    ssid = prefs.getString("ssid", "");
    senha = prefs.getString("senha", "");
    deviceId = prefs.getString("device", "");
    token = prefs.getString("token", "");
    fila.carregar(prefs);
    String cache = prefs.getString("agenda", "");
    if (cache.length()) agenda.carregar(cache);  // funciona mesmo sem internet
    for (int i = 0; i < fila.n; i++) agenda.marcarTomada(fila.itens[i].lembrete, fila.itens[i].agendada, fila.itens[i].tomada);

    WiFi.persistent(false);
    if (pareado() && ssid.length()) mudarPara(conectando);
    else mudarPara(configuracao);
  }

  void loop() {
    uint32_t agora = millis();
    verificarReset(agora);
    sensor.atualizar(agora);  // em todos os estados: os LEDs de aviso funcionam até sem Wi-Fi
    estado->executar(*this);
    leds.definirAvisos(sensor.comFalha(), sensor.umidRuim(), sensor.tempRuim());
    leds.definirWifi(estado->ledWifi(*this));
    leds.desenhar(millis(), estado->padrao(*this));  // millis() de novo: o estado pode ter iniciado uma animação
    delay(10);
  }

  void mudarPara(Estado& novo) {
    if (estado == &novo) return;
    if (estado) estado->sair(*this);
    Serial.printf("[estado] %s -> %s\n", estado ? estado->nome() : "-", novo.nome());
    estado = &novo;
    estado->entrar(*this);
  }

  bool pareado() const { return deviceId.length() > 0 && token.length() > 0; }
  bool online() const { return WiFi.status() == WL_CONNECTED; }

  void salvarWifi(const String& s, const String& p) {
    ssid = s;
    senha = p;
    prefs.putString("ssid", s);
    prefs.putString("senha", p);
  }

  void esquecerPareamento(const char* motivo) {
    Serial.printf("[caixa] apagando pareamento: %s\n", motivo);
    deviceId = token = "";
    prefs.remove("device");
    prefs.remove("token");
    prefs.remove("agenda");
    fila.n = 0;
    fila.salvar(prefs);
    agenda.n = 0;
    demoAtivo = demoLigado = false;
    leds.apagarTudo();
    erro = motivo;
    mudarPara(configuracao);
  }

  // ------------------------------------------------------------- nuvem
  bool parear() {
    JsonDocument d;
    d["p_code"] = codigoPendente;
    d["p_name"] = "Caixa InfoMed " + WiFi.macAddress().substring(12);
    d["p_firmware"] = FIRMWARE_VERSAO;
    String corpo;
    serializeJson(d, corpo);
    RespostaHttp r = chamarRpc("parear_caixa", corpo);
    if (r.status != 200) {
      erro = "Não consegui falar com o servidor (HTTP " + String(r.status) + "). Confira a internet.";
      return false;
    }
    JsonDocument resp;
    if (deserializeJson(resp, r.corpo) || !(resp["ok"] | false)) {
      erro = String("Pareamento recusado: ") + (resp["erro"] | "resposta inválida") + ". Gere um código novo no app.";
      return false;
    }
    deviceId = resp["deviceId"] | "";
    token = resp["token"] | "";
    prefs.putString("device", deviceId);
    prefs.putString("token", token);
    codigoPendente = "";
    erro = "";
    Serial.println("[caixa] pareada com sucesso!");
    return true;
  }

  Rede buscarAgenda() {
    JsonDocument d;
    d["p_device"] = deviceId;
    d["p_token"] = token;
    String corpo;
    serializeJson(d, corpo);
    RespostaHttp r = chamarRpc("caixa_agenda", corpo);
    Rede res = classificar(r);
    ultimaAgenda = millis();
    if (res != Rede::Ok) return res;
    uint32_t horaServidor = agenda.carregar(r.corpo);
    if (horaServidor == 0) return Rede::Erro;
    for (int i = 0; i < fila.n; i++) agenda.marcarTomada(fila.itens[i].lembrete, fila.itens[i].agendada, fila.itens[i].tomada);
    if (r.corpo.length() < 3800) prefs.putString("agenda", r.corpo);
    // Plano B do relógio: se o NTP estiver bloqueado na rede, usa a hora do servidor.
    if (!relogioOk() || labs((long)time(nullptr) - (long)horaServidor) > 120) {
      struct timeval tv = {(time_t)horaServidor, 0};
      settimeofday(&tv, nullptr);
      Serial.println("[relogio] acertado pela hora do servidor");
    }
    agendaBuscada = true;
    recusas = 0;
    return Rede::Ok;
  }

  Rede enviarLeitura() {
    JsonDocument d;
    d["p_device"] = deviceId;
    d["p_token"] = token;
    if (isnan(sensor.temp)) d["p_temp"] = nullptr; else d["p_temp"] = round(sensor.temp * 10) / 10.0;
    if (isnan(sensor.umid)) d["p_umid"] = nullptr; else d["p_umid"] = round(sensor.umid);
    d["p_firmware"] = FIRMWARE_VERSAO;
    String corpo;
    serializeJson(d, corpo);
    ultimaLeitura = millis();
    leituraEnviada = true;
    alertaEnviado = sensor.foraDaFaixa();
    falhaEnviada = sensor.comFalha();  // temperatura e umidade nulas = sensor sem sinal (o app mostra)
    return classificar(chamarRpc("caixa_leitura", corpo));
  }

  void guardarToque(uint8_t c, uint32_t quando, bool dose, bool demo) {
    if (nToques >= MAX_TOQUES) {  // cheia: descarta o mais antigo
      memmove(&toques[0], &toques[1], (MAX_TOQUES - 1) * sizeof(ToqueApp));
      nToques--;
    }
    toques[nToques++] = {c, quando, dose, demo};
  }

  Rede enviarProximoToque() {
    ultimoToque = millis();
    const ToqueApp& t = toques[0];
    JsonDocument d;
    d["p_device"] = deviceId;
    d["p_token"] = token;
    d["p_compartimento"] = t.compartimento;
    d["p_tocado"] = t.quando;  // 0 = sem relógio: o servidor usa a hora dele
    d["p_dose"] = t.dose;
    d["p_demo"] = t.demo;
    String corpo;
    serializeJson(d, corpo);
    Rede res = classificar(chamarRpc("caixa_toque", corpo));
    if (res == Rede::Ok) {
      Serial.printf("[toque] enviado ao app: %s\n", NOME_COMPARTIMENTO[t.compartimento]);
      memmove(&toques[0], &toques[1], (nToques - 1) * sizeof(ToqueApp));
      nToques--;
    }
    return res;
  }

  Rede enviarProximaDaFila() {
    if (fila.n == 0) return Rede::Ok;
    ultimoEnvio = millis();
    const ItemFila& it = fila.itens[0];
    JsonDocument d;
    d["p_device"] = deviceId;
    d["p_token"] = token;
    d["p_reminder"] = it.lembrete;
    d["p_scheduled"] = it.agendada;
    d["p_taken"] = it.tomada;
    String corpo;
    serializeJson(d, corpo);
    RespostaHttp r = chamarRpc("caixa_registrar_dose", corpo);
    Rede res = classificar(r);
    // 200 = gravada, repetida (já estava lá) ou recusada pela regra: em todos os casos sai da fila
    if (res == Rede::Ok) {
      Serial.printf("[fila] enviada: %s\n", r.corpo.c_str());
      fila.removerPrimeiro(prefs);
    }
    return res;
  }

  // ------------------------------------------------------------- doses
  // Trata os toques e atualiza os LEDs dos compartimentos. Devolve true se há dose pendente.
  // Nos dois modos, o toque registra a dose se houver lembrete aberto e é enviado ao app.
  // Só o desenho dos LEDs muda: modo real = horário dos lembretes; modo demo = ciclo de 5 s.
  bool rotinaDoses() {
    bool tocou[3];
    for (uint8_t c = 0; c < 3; c++) tocou[c] = toque.tocou(c);

    bool pendente = false;
    bool relogio = relogioOk();  // sem hora certa não dá para registrar dose de lembrete
    time_t agora = relogio ? time(nullptr) : 0;
    ModoLed modo[3] = {ModoLed::Apagado, ModoLed::Apagado, ModoLed::Apagado};
    int registradas[3] = {0, 0, 0};

    for (uint8_t c = 0; c < 3 && relogio; c++) {
      for (int i = 0; i < agenda.n; i++) {
        const Dose& d = agenda.doses[i];
        if (d.compartimento != c) continue;
        for (int desloc = -1; desloc <= 0; desloc++) {  // ontem: dose das 23h ainda vale até 1h
          int diaSemana;
          uint32_t prevista = ocorrencia(d, agora, desloc, diaSemana);
          if (!(d.dias & (1 << diaSemana))) continue;
          if (agenda.jaTomada(d.lembrete, prevista)) continue;
          long dif = (long)agora - (long)prevista;
          if (dif < -ANTES_SEG || dif >= LIMITE_SEG) continue;

          if (tocou[c]) {
            fila.adicionar(prefs, d.lembrete, prevista, (uint32_t)agora);
            agenda.marcarTomada(d.lembrete, prevista, (uint32_t)agora);
            Serial.printf("[dose] %s das %02d:%02d tomada (compartimento %s)\n", d.nome, d.hora, d.minuto, NOME_COMPARTIMENTO[c]);
            registradas[c]++;
            continue;
          }
          if (dif >= NO_HORARIO_SEG) modo[c] = ModoLed::Piscando;                  // atrasada
          else if (dif >= 0 && modo[c] == ModoLed::Apagado) modo[c] = ModoLed::Aceso;  // na hora
          if (dif >= 0) pendente = true;
        }
      }
    }

    for (uint8_t c = 0; c < 3; c++) {
      if (tocou[c]) guardarToque(c, (uint32_t)agora, registradas[c] > 0, agenda.demo);
    }

    if (agenda.demo) {
      if (!demoAtivo) {
        demoAtivo = true;
        demoLigado = true;
        Serial.println("[demo] modo demonstração ligado: LEDs de HORA em ciclo de 5 s");
      }
      return pendente;
    }
    if (demoAtivo) {
      demoAtivo = false;
      demoLigado = false;
      leds.apagarTudo();
      Serial.println("[demo] modo demonstração desligado: LEDs seguem os lembretes");
    }
    if (!relogio) {
      leds.apagarTudo();
      return false;
    }

    for (uint8_t c = 0; c < 3; c++) {
      if (tocou[c] && registradas[c] == 0) leds.piscar(c, 1);  // toque sem dose pendente: LED de hora pisca 1 vez
      leds.definirHora(c, modo[c]);  // o azul é da tarefa do toque (aceso só enquanto encosta)
    }
    return pendente;
  }

  // Tarefas de todos os estados pareados: doses, sensor e conversa com o servidor.
  // Devolve false se o servidor revogou a caixa (o estado já foi trocado).
  bool rotina() {
    uint32_t agora = millis();
    if (!online()) return true;

    if (fila.n && agora - ultimoEnvio >= INTERVALO_FILA) {
      if (enviarProximaDaFila() == Rede::NaoAutorizada) return revogada();
    }
    if (nToques && agora - ultimoToque >= 500) {
      if (enviarProximoToque() == Rede::NaoAutorizada) return revogada();
    }
    if (!agendaBuscada || agora - ultimaAgenda >= INTERVALO_AGENDA) {
      if (buscarAgenda() == Rede::NaoAutorizada) return revogada();
    }
    bool mudouAlerta = sensor.foraDaFaixa() != alertaEnviado || sensor.comFalha() != falhaEnviada;
    if (!leituraEnviada || agora - ultimaLeitura >= INTERVALO_LEITURA || mudouAlerta) {
      if (!isnan(sensor.temp) || !isnan(sensor.umid) || sensor.comFalha()) {
        if (enviarLeitura() == Rede::NaoAutorizada) return revogada();
      }
    }
    return true;
  }

  PadraoStatus padraoPareado() const { return sensor.foraDaFaixa() ? PadraoStatus::Alerta : PadraoStatus::Batimento; }

 private:
  Estado* estado = nullptr;
  bool resetando = false;

 public:
  // Só apaga o pareamento se o servidor recusar 3 vezes seguidas (um erro solto não derruba a caixa).
  uint8_t recusas = 0;
  bool revogada() {
    recusas++;
    Serial.printf("[nuvem] servidor recusou a caixa (%u de 3)\n", recusas);
    ultimaAgenda = millis() - INTERVALO_AGENDA + 5000;  // confere de novo pela agenda em 5 s
    if (recusas < 3) return true;
    recusas = 0;
    esquecerPareamento("Esta caixa foi despareada no app. Pareie de novo.");
    return false;
  }

  // Ajuda a achar quedas: falta de energia (brownout), travamento ou reset normal
  static const char* motivoReinicio() {
    switch (esp_reset_reason()) {
      case ESP_RST_POWERON:  return "ligou na energia";
      case ESP_RST_SW:       return "reinício pelo programa";
      case ESP_RST_PANIC:    return "TRAVOU (erro no programa) - mande este log";
      case ESP_RST_INT_WDT:
      case ESP_RST_TASK_WDT:
      case ESP_RST_WDT:      return "TRAVOU (watchdog) - mande este log";
      case ESP_RST_BROWNOUT: return "FALTA DE ENERGIA (brownout): troque o cabo USB ou a porta/carregador";
      case ESP_RST_EXT:      return "botão EN/RST";
      default:               return "outro";
    }
  }

  // Segurar o botão BOOT da placa por 5 s apaga Wi-Fi e pareamento.
  // (Antes era o toque da manhã, mas com o Wi-Fi ligado o toque pode "travar"
  //  sozinho e a caixa se resetava sem ninguém encostar.)
  uint32_t bootDesde = 0;
  void verificarReset(uint32_t agora) {
    if (resetando) return;
    if (digitalRead(PINO_BOTAO_BOOT) == HIGH) {  // solto
      bootDesde = 0;
      return;
    }
    if (bootDesde == 0) {
      bootDesde = agora | 1;
      Serial.println("[caixa] botão BOOT apertado: segure 5 s para apagar Wi-Fi e pareamento");
    }
    if (agora - bootDesde < 5000) return;
    resetando = true;
    Serial.println("[caixa] RESET pelo botão BOOT: apagando Wi-Fi e pareamento");
    for (uint8_t k = 0; k < 6; k++) {
      leds.todos(k % 2 == 0);
      delay(150);
    }
    prefs.clear();
    ESP.restart();
  }
};

Caixa caixa;

// =====================================================================
// Comportamento de cada estado

ModoLed Estado::ledWifi(const Caixa& c) const { return c.online() ? ModoLed::Aceso : ModoLed::Apagado; }

void EstadoConfiguracao::entrar(Caixa& c) {
  WiFi.disconnect(true);
  recebidoEm = 0;
  portal::iniciar(c.erro);
}

void EstadoConfiguracao::executar(Caixa& c) {
  portal::atender();
  if (portal::recebido && recebidoEm == 0) recebidoEm = millis();
  // espera 2 s para a página de resposta chegar ao celular antes de desligar a rede da caixa
  if (recebidoEm && millis() - recebidoEm > 2000) {
    portal::recebido = false;
    c.salvarWifi(portal::ssid, portal::senha);
    c.codigoPendente = portal::codigo;
    // pareando de novo: descarta o pareamento antigo
    c.deviceId = c.token = "";
    c.prefs.remove("device");
    c.prefs.remove("token");
    c.mudarPara(conectando);
  }
}

void EstadoConfiguracao::sair(Caixa&) { portal::parar(); }

void EstadoConectando::entrar(Caixa& c) {
  inicio = millis();
  WiFi.mode(WIFI_STA);
  WiFi.begin(c.ssid.c_str(), c.senha.c_str());
  Serial.printf("[wifi] conectando em '%s'...\n", c.ssid.c_str());
}

void EstadoConectando::executar(Caixa& c) {
  if (c.pareado()) c.rotinaDoses();  // mesmo conectando, os LEDs continuam funcionando

  if (WiFi.status() == WL_CONNECTED) {
    Serial.printf("[wifi] conectado, IP %s\n", WiFi.localIP().toString().c_str());
    if (!c.pareado()) {
      if (c.codigoPendente.length() == 0 || !c.parear()) {
        if (c.erro.length() == 0) c.erro = "Falta o código de pareamento.";
        c.mudarPara(configuracao);
        return;
      }
    }
    c.mudarPara(sincronizando);
    return;
  }

  if (millis() - inicio > 20000) {
    if (c.pareado()) {
      c.mudarPara(offline);  // já pareada: segue funcionando com a agenda guardada
    } else {
      c.erro = "Não conectei ao Wi-Fi \"" + c.ssid + "\". Confira o nome e a senha (precisa ser 2,4 GHz).";
      c.mudarPara(configuracao);
    }
  }
}

void EstadoSincronizando::entrar(Caixa& c) {
  inicio = millis();
  ultimaTentativa = 0;
  configTzTime(FUSO_SAO_PAULO, "a.st1.ntp.br", "pool.ntp.org", "time.google.com");
  c.agendaBuscada = false;
  c.leituraEnviada = false;
}

void EstadoSincronizando::executar(Caixa& c) {
  c.rotinaDoses();
  // espera o NTP por até 10 s (o HTTPS confere a data do certificado)
  if (!relogioOk() && millis() - inicio < 10000) return;
  if (ultimaTentativa && millis() - ultimaTentativa < 5000) return;  // não martela o servidor
  ultimaTentativa = millis();
  if (!relogioOk()) Serial.println("[relogio] NTP não respondeu; tentando pela hora do servidor");

  Rede r = c.buscarAgenda();
  if (r == Rede::NaoAutorizada) {
    c.revogada();
    return;
  }
  if (r == Rede::Ok) {
    while (c.fila.n && c.enviarProximaDaFila() == Rede::Ok) {}  // voltou a internet: reenvia tudo
    c.mudarPara(ocioso);
    return;
  }
  if (!c.online()) c.mudarPara(offline);
  else if (millis() - inicio > 30000) c.mudarPara(relogioOk() ? (Estado&)ocioso : (Estado&)offline);
}

PadraoStatus EstadoOcioso::padrao(const Caixa& c) const { return c.padraoPareado(); }

void EstadoOcioso::executar(Caixa& c) {
  bool pendente = c.rotinaDoses();
  if (!c.rotina()) return;
  if (!c.online()) c.mudarPara(offline);
  else if (pendente) c.mudarPara(dosePendente);
}

PadraoStatus EstadoDosePendente::padrao(const Caixa& c) const { return c.padraoPareado(); }

void EstadoDosePendente::executar(Caixa& c) {
  bool pendente = c.rotinaDoses();
  if (!c.rotina()) return;
  if (!c.online()) c.mudarPara(offline);
  else if (!pendente) c.mudarPara(ocioso);
}

void EstadoOffline::entrar(Caixa&) {
  ultimaTentativa = millis();
  reconectandoDesde = 0;
}

ModoLed EstadoOffline::ledWifi(const Caixa& c) const {
  if (c.online()) return ModoLed::Aceso;
  return reconectandoDesde && millis() - reconectandoDesde < 20000 ? ModoLed::Piscando : ModoLed::Apagado;
}

void EstadoOffline::executar(Caixa& c) {
  c.rotinaDoses();  // continua acendendo LEDs com a agenda guardada; doses vão para a fila
  if (c.online()) {
    c.mudarPara(sincronizando);
    return;
  }
  if (millis() - ultimaTentativa > 30000) {
    ultimaTentativa = reconectandoDesde = millis();
    Serial.println("[wifi] offline, tentando reconectar...");
    WiFi.disconnect();
    WiFi.begin(c.ssid.c_str(), c.senha.c_str());
  }
}
```

---

## config.example.h

_MODELO do config.h (veja o passo 4)_

```cpp
// Modelo do config.h. NÃO edite este arquivo para colocar dados reais.
// O jeito certo é rodar, na pasta do projeto:
//     node scripts/caixa-config.mjs
// que lê o .env e cria o config.h com o endereço, a chave publishable e o
// certificado raiz do Supabase. O config.h não vai para o Git.
#pragma once

#define SUPABASE_URL "https://SEU-PROJETO.supabase.co"
#define SUPABASE_KEY "sb_publishable_COLE_AQUI"

// Certificado raiz (PEM) do servidor. Vazio = HTTPS SEM conferir o servidor
// (só para teste rápido; a caixa avisa no Monitor Serial).
static const char CERTIFICADO_RAIZ[] = "";
```

