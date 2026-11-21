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
