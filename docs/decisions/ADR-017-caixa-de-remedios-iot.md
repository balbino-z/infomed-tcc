# ADR-017: Caixa de remédios inteligente (IoT) com ESP32 e padrão State

- **Status:** Aceita (implementada em 18/11/2026); hardware a validar na bancada
- **Data:** 18/11/2026
- **Disciplinas relacionadas:** Sistemas Distribuídos e IoT; Segurança e Defesa Cibernética (LGPD); Modelagem de Padrões de Projetos (State); Business Intelligence; Estatística Aplicada; Programação Multi Plataforma

## Contexto

O app já avisava a hora do remédio (lembretes, ADR-012), mas não sabia se a pessoa tomou. Adesão ao tratamento é um problema real e caro para o SUS. Era preciso medir a adesão sem criar uma função paralela ao que já existe, com hardware barato (ESP32 comum, LEDs, sensor DHT) e sem tela nem teclado no aparelho.

## Decisão

1. **Caixa com 3 compartimentos** (manhã < 12h, tarde 12h-18h, noite ≥ 18h). Na hora, o LED do compartimento acende; o toque (sensor capacitivo do ESP32 em papel-alumínio) registra a dose. Quem não tem a caixa usa o botão **"Tomei"** no app (`source = app`).
2. **Regras no banco** (`db/10_caixa.sql`), espelhadas no app (`features/adherence/doses.ts`), no firmware e no simulador: janela de 30 min antes até 30 min depois = tomada; até 2 h = atrasada; depois = esquecida. As **esquecidas são calculadas pelo servidor** (lembretes × dias), então não dependem da caixa estar ligada.
3. **Pareamento por código** (como câmeras e lâmpadas inteligentes): o app gera 6 dígitos (10 min, uso único, só o hash guardado); a caixa cria a rede `InfoMed-Caixa` com portal cativo; o servidor devolve um **token por aparelho** (32 bytes, guardado como SHA-256). Revogação pelo app ("Desparear").
4. **Permissão mínima:** a caixa usa a chave publishable e só executa 4 funções `security definer`; nenhuma tabela é liberada para ela. Erros de regra voltam como `{ok:false}` (e não exceção) para a caixa descartar o item da fila e para as tentativas erradas de pareamento ficarem registradas.
5. **Firmware como máquina de estados (padrão State):** `Configuracao → Conectando → Sincronizando → Ocioso ⇄ DosePendente`, e `Offline` a partir de qualquer estado pareado. Cada estado define o padrão do LED de status e as transições.
6. **Sistema distribuído:** relógio por NTP (fuso de São Paulo) com a hora do servidor como plano B; agenda em cache na flash; fila offline de até 50 doses reenviada ao voltar a internet, **idempotente** pelo índice único `(reminder_id, scheduled_at)`; "online" = falou com o servidor nos últimos 3 minutos.
7. **LGPD no BI:** `bi_adesao` só para administrador, só agregados, e esconde a taxa de grupos com menos de 5 pacientes (k-anonimato simples).
8. **Plano B:** simulador em Node (`scripts/simulador-caixa.mjs`) que chama as mesmas funções.

## Alternativas consideradas

- **MQTT/broker próprio:** mais "IoT clássico", mas exigiria outro servidor; o PostgREST do Supabase já entrega HTTPS e autenticação.
- **Supabase Auth na caixa (login do paciente):** colocaria a senha do paciente no aparelho. Rejeitado.
- **Calcular esquecidas na caixa:** falharia com a caixa desligada. Rejeitado.
- **Cron no servidor para o aviso "Você tomou?":** exigiria Edge Function agendada; ficou no app (`ReminderScheduler`, com o app aberto), como os lembretes atuais.

## Consequências

- Nova tela `/perfil/caixa`, selos de hoje nos Lembretes, cartão de adesão no Perfil e bloco de adesão no Painel de BI.
- `DeviceRepository` e `AdherenceRepository` (Mock e Supabase), seguindo o ADR-003.
- Limitações: limite de tentativas de pareamento é global; lembrete desligado deixa de contar também nos dias anteriores; o certificado raiz precisa ser regerado se o Supabase trocar de autoridade certificadora.
