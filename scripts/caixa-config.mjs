// Gera firmware/caixa-infomed/config.h a partir do .env:
//   - endereço do Supabase e chave publishable (as mesmas do app)
//   - certificado RAIZ do servidor, para a caixa só conversar com o Supabase verdadeiro
// Uso (na pasta do projeto):  node scripts/caixa-config.mjs
// Rode de novo se a caixa começar a falhar com erro de certificado.
import { readFileSync, writeFileSync } from 'node:fs';
import tls from 'node:tls';

export function lerEnv(caminho = '.env') {
  let texto;
  try {
    texto = readFileSync(caminho, 'utf8');
  } catch {
    throw new Error('Não achei o .env na pasta do projeto. Copie o .env.example para .env e preencha.');
  }
  const env = {};
  for (const linha of texto.split(/\r?\n/)) {
    const m = linha.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m) env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
  const url = env.VITE_SUPABASE_URL;
  const key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) throw new Error('O .env precisa de VITE_SUPABASE_URL e VITE_SUPABASE_PUBLISHABLE_KEY.');
  return { url: url.replace(/\/+$/, ''), key };
}

const toPem = (c) => `-----BEGIN CERTIFICATE-----\n${c.raw.toString('base64').match(/.{1,64}/g).join('\n')}\n-----END CERTIFICATE-----\n`;

/**
 * Conecta no servidor e pega a cadeia ACIMA do certificado do site (intermediárias + raiz).
 * Todas entram como confiáveis no firmware: se o servidor mudar o caminho até a raiz
 * (ex.: deixar de mandar um certificado cruzado), a caixa continua validando.
 */
function certificadoRaiz(host) {
  return new Promise((resolve, reject) => {
    const sock = tls.connect(443, host, { servername: host }, () => {
      const cadeia = [];
      let c = sock.getPeerCertificate(true);
      const vistos = new Set([c.fingerprint256]);
      while (c.issuerCertificate && !vistos.has(c.issuerCertificate.fingerprint256)) {
        c = c.issuerCertificate;
        vistos.add(c.fingerprint256);
        cadeia.push(c);
      }
      sock.end();
      if (!cadeia.length) return reject(new Error('O servidor não enviou a cadeia de certificados.'));
      const raiz = cadeia[cadeia.length - 1];
      resolve({
        pem: cadeia.map(toPem).join(''),
        nome: cadeia.map((x) => x.subject?.CN || x.subject?.O).join(' → '),
        validoAte: raiz.valid_to,
      });
    });
    sock.setTimeout(10000, () => { sock.destroy(); reject(new Error('Tempo esgotado ao conectar no Supabase')); });
    sock.on('error', reject);
  });
}

async function main() {
  const { url, key } = lerEnv();
  const host = new URL(url).hostname;
  console.log(`Buscando o certificado raiz de ${host}...`);
  const raiz = await certificadoRaiz(host);
  console.log(`Raiz: ${raiz.nome} (válido até ${raiz.validoAte})`);

  const h = `// GERADO por scripts/caixa-config.mjs em ${new Date().toISOString()}. Não versionar.
#pragma once

#define SUPABASE_URL "${url}"
#define SUPABASE_KEY "${key}"

// Certificado raiz: ${raiz.nome} (válido até ${raiz.validoAte})
static const char CERTIFICADO_RAIZ[] = R"PEM(
${raiz.pem})PEM";
`;
  writeFileSync('firmware/caixa-infomed/config.h', h);
  console.log('OK: firmware/caixa-infomed/config.h criado. Agora abra o firmware na Arduino IDE e grave.');
}

// só roda quando chamado direto (o simulador importa lerEnv deste arquivo)
if (process.argv[1]?.replace(/\\/g, '/').endsWith('scripts/caixa-config.mjs')) {
  main().catch((e) => {
    console.error('ERRO:', e.message);
    process.exit(1);
  });
}
