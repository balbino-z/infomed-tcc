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
