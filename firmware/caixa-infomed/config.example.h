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
