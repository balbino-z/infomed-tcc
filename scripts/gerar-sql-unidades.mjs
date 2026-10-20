// Gera db/05_postos_reais.sql a partir de data/unidades-sbo.json.
// Uso: node scripts/gerar-sql-unidades.mjs
// Só gera se TODAS as unidades tiverem latitude e longitude.
import { readFileSync, writeFileSync } from 'node:fs';

const units = JSON.parse(readFileSync('data/unidades-sbo.json', 'utf8'));
const faltando = units.filter((u) => u.lat == null || u.lng == null);
if (faltando.length) {
  console.error('Faltam coordenadas em:\n - ' + faltando.map((u) => u.name).join('\n - '));
  process.exit(1);
}

const q = (s) => `'${String(s).replace(/'/g, "''")}'`;
const arr = (a) => `ARRAY[${a.map(q).join(', ')}]::text[]`;

// ---- Dados SIMULADOS (não existem fontes públicas por posto) ----
const MEDS = ['Losartana Potássica', 'Metformina', 'Omeprazol', 'Sinvastatina', 'Paracetamol', 'Amoxicilina'];
const SPECIALTIES = [
  ['Clínico Geral', '#0A73FF'],
  ['Pediatria', '#FFCC48'],
  ['Ginecologia', '#FF4D5E'],
  ['Odontologia', '#27C183'],
];
const SPEC_BY_SERVICE = { 'Clínico Geral': 'Clínico Geral', Pediatria: 'Pediatria', Ginecologia: 'Ginecologia', Odontologia: 'Odontologia' };
const NOMES = ['Dr. Carlos Almeida', 'Dra. Fernanda Rocha', 'Dr. Paulo Menezes', 'Dra. Juliana Prado', 'Dr. Ricardo Tavares', 'Dra. Beatriz Nogueira', 'Dr. André Castro', 'Dra. Camila Duarte', 'Dr. Marcelo Pires', 'Dra. Patrícia Lopes', 'Dr. Rodrigo Faria', 'Dra. Luciana Barros', 'Dr. Thiago Ramos', 'Dra. Renata Moraes', 'Dr. Eduardo Silveira', 'Dra. Aline Cardoso', 'Dr. Gustavo Neves', 'Dra. Vanessa Teixeira', 'Dr. Leandro Costa', 'Dra. Priscila Martins'];

let seed = 20261020; // gerador pseudo-aleatório determinístico: mesmo resultado sempre
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
const status = () => { const r = rnd(); return r < 0.65 ? 'disponivel' : r < 0.85 ? 'atencao' : 'indisponivel'; };

const out = [];
out.push(`-- =====================================================================
-- InfoMed - 05_postos_reais.sql   (GERADO por scripts/gerar-sql-unidades.mjs)
-- Substitui as unidades fictícias pelas UBS de Santa Bárbara d'Oeste.
-- Fontes: ver docs/data/fontes-unidades.md
-- ATENÇÃO: estoque de medicamentos e médicos são SIMULADOS.
-- Roda tudo em uma transação: se der erro, nada é alterado.
-- =====================================================================
begin;

alter table public.health_units
  add column if not exists phone      text,
  add column if not exists source_url text,
  add column if not exists verified   boolean not null default false,
  add column if not exists notes      text;

-- limpa os dados de exemplo antigos (a ordem respeita as chaves estrangeiras)
-- ATENÇÃO: apaga também consultas de teste. Rode este script UMA vez, antes do agendamento (T7) existir.
delete from public.appointments;
delete from public.doctors;
delete from public.unit_medications;
delete from public.health_units;
delete from public.specialties;
`);

out.push(`insert into public.specialties (name, color) values\n${SPECIALTIES.map(([n, c]) => `  (${q(n)}, ${q(c)})`).join(',\n')};\n`);

out.push(`insert into public.health_units (name, address, lat, lng, opens_at, closes_at, services, phone, source_url, verified, notes) values`);
out.push(units.map((u) => {
  const address = `${u.street}, ${u.number} - ${u.bairro}, Santa Bárbara d'Oeste`;
  return `  (${q(u.name)}, ${q(address)}, ${u.lat}, ${u.lng}, ${q(u.opens)}, ${q(u.closes)}, ${arr(u.services)}, ${q(u.phone)}, ${q(u.source)}, false, ${u.notes ? q(u.notes) : 'null'})`;
}).join(',\n') + ';\n');

// estoque simulado (só unidades com farmácia)
const stock = [];
for (const u of units) if (u.farmacia) for (const m of MEDS) stock.push(`  (${q(u.name)}, ${q(m)}, ${q(status())})`);
out.push(`-- ESTOQUE SIMULADO
insert into public.unit_medications (unit_id, medication_id, status)
select u.id, m.id, v.status
from (values
${stock.join(',\n')}
) as v(unit_name, med_name, status)
join public.health_units u on u.name = v.unit_name
join public.medications  m on m.name = v.med_name;
`);

// médicos simulados: um por especialidade oferecida em cada unidade (até 4 por unidade)
const docs = [];
let n = 0;
for (const u of units) {
  const specs = [...new Set(u.services.filter((s) => SPEC_BY_SERVICE[s]).map((s) => SPEC_BY_SERVICE[s]))].slice(0, 4);
  for (const s of specs) { docs.push(`  (${q(NOMES[n % NOMES.length])}, ${q('SIM-' + String(n + 1).padStart(4, '0'))}, ${q(s)}, ${q(u.name)})`); n++; }
}
out.push(`-- MÉDICOS SIMULADOS (nomes e registros fictícios)
insert into public.doctors (name, crm, specialty_id, unit_id)
select v.name, v.crm, s.id, u.id
from (values
${docs.join(',\n')}
) as v(name, crm, spec_name, unit_name)
join public.specialties  s on s.name = v.spec_name
join public.health_units u on u.name = v.unit_name;

commit;
`);

writeFileSync('db/05_postos_reais.sql', out.join('\n'));
console.log(`OK: db/05_postos_reais.sql (${units.length} unidades, ${stock.length} linhas de estoque simulado, ${docs.length} médicos simulados)`);
