# Proposta de IoT: caixa de remédios inteligente (NÃO IMPLEMENTADA)

> **Atenção:** este diagrama é uma **proposta de trabalho futuro** para a disciplina de Sistemas Distribuídos Aplicados a IoT. Nada disto existe no código hoje. No TCC, apresentar como proposta.

**Ideia:** uma caixa de remédios com sensor de tampa (aberta/fechada) e um microcontrolador com Wi-Fi (ex.: ESP32). Quando o horário do lembrete chega, a caixa acende um LED; quando a pessoa abre a tampa, a caixa avisa o sistema que a dose foi tomada. Se a tampa não for aberta em 30 minutos, o app avisa a pessoa (ou um familiar).

## Arquitetura proposta

```mermaid
flowchart LR
  subgraph Casa["Casa do paciente"]
    CX["Caixa de remédios<br/>ESP32 + sensor de tampa + LED"]
  end
  subgraph Broker["Broker MQTT na nuvem"]
    T1[/"infomed/caixa/ID/evento<br/>tampa_aberta"/]
    T2[/"infomed/caixa/ID/comando<br/>acender_led"/]
  end
  subgraph Nuvem["Supabase"]
    EF[Edge Function<br/>ponte MQTT ↔ banco]
    DB[(dose_events<br/>com RLS)]
    RM[(reminders)]
  end
  APP[App InfoMed PWA]
  CX -- publica --> T1
  T2 -- assina --> CX
  T1 --> EF --> DB
  RM --> EF --> T2
  DB --> APP
  APP -- "dose tomada às 08:03 ✅" --> U([Paciente])
```

## Sequência proposta

```mermaid
sequenceDiagram
  participant R as reminders (banco)
  participant F as Edge Function
  participant B as Broker MQTT
  participant C as Caixa ESP32
  participant A as App
  R->>F: 08:00 lembrete ativo
  F->>B: publish comando/acender_led
  B->>C: acender LED
  C->>B: publish evento/tampa_aberta (08:03)
  B->>F: evento
  F->>R: grava dose_events (tomada)
  F-->>A: Realtime: dose registrada
  alt tampa não abriu em 30 min
    F-->>A: notificação "Você tomou o remédio?"
  end
```

## Por que é um sistema distribuído

- Vários nós independentes (caixa, broker, nuvem, app) comunicando por mensagens.
- Padrão publicar/assinar (MQTT), o mesmo princípio do Observer já usado no app (ADR-012), só que entre máquinas.
- Tolerância a falhas: a caixa guarda eventos se ficar sem Wi-Fi e envia depois.
- Para o TCC sem hardware: a caixa pode ser **simulada** por um script que publica no broker.
