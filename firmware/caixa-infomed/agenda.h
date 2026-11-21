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
