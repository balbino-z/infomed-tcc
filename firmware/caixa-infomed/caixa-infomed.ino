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
