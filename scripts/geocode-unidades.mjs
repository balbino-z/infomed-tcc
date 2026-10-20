// Preenche latitude/longitude em data/unidades-sbo.json usando o Nominatim (OpenStreetMap).
// Uso: node scripts/geocode-unidades.mjs
// Regras do Nominatim: no máximo 1 requisição por segundo e User-Agent identificando o app.
import { readFileSync, writeFileSync } from 'node:fs';

const FILE = 'data/unidades-sbo.json';
const UA = 'InfoMed-TCC/1.0 (projeto academico; Santa Barbara d Oeste)';
// Caixa em volta de Santa Bárbara d'Oeste, para não achar o mesmo endereço em outra cidade
const VIEWBOX = '-47.50,-22.69,-47.30,-22.82';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function search(q) {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.search = new URLSearchParams({ q, format: 'jsonv2', limit: '1', countrycodes: 'br', viewbox: VIEWBOX, bounded: '1' });
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept-Language': 'pt-BR' } });
  if (!res.ok) throw new Error(`Nominatim respondeu ${res.status}`);
  const data = await res.json();
  return data[0] ?? null;
}

const units = JSON.parse(readFileSync(FILE, 'utf8'));

for (const u of units) {
  if (u.lat != null && u.lng != null) {
    console.log(`= ${u.name}: já tem coordenadas, mantido`);
    continue;
  }
  const tentativas = [
    { q: `${u.street}, ${u.number}, ${u.bairro}, Santa Bárbara d'Oeste, SP`, precision: 'endereco' },
    { q: `${u.street}, ${u.number}, Santa Bárbara d'Oeste, SP`, precision: 'endereco' },
    { q: `${u.street}, Santa Bárbara d'Oeste, SP`, precision: 'rua (sem número)' },
  ];
  let achou = null;
  for (const t of tentativas) {
    try {
      const r = await search(t.q);
      await sleep(1100);
      if (r) { achou = { lat: Number(r.lat), lng: Number(r.lon), precision: t.precision }; break; }
    } catch (e) {
      console.log(`  erro em "${t.q}": ${e.message}`);
      await sleep(1100);
    }
  }
  if (achou) {
    u.lat = achou.lat; u.lng = achou.lng; u.geocode_precision = achou.precision;
    console.log(`✔ ${u.name}: ${achou.lat}, ${achou.lng} [${achou.precision}]`);
    console.log(`   confira: https://www.openstreetmap.org/?mlat=${achou.lat}&mlon=${achou.lng}#map=18/${achou.lat}/${achou.lng}`);
  } else {
    console.log(`✘ ${u.name}: NÃO ENCONTRADO. Preencha lat/lng à mão no JSON (veja o passo a passo).`);
  }
}

writeFileSync(FILE, JSON.stringify(units, null, 2) + '\n');
console.log('\nSalvo em', FILE);
