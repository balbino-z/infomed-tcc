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
