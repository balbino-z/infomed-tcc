-- =====================================================================
-- InfoMed - 02_seed.sql
-- Dados de exemplo (fictícios). Execute DEPOIS do 01_schema.sql.
-- =====================================================================

insert into public.medications (name, dosage, form, description) values
  ('Losartana Potássica', '50mg',  'Comprimido', 'Anti-hipertensivo'),
  ('Metformina',          '500mg', 'Comprimido', 'Antidiabético'),
  ('Omeprazol',           '20mg',  'Cápsula',    'Antiácido'),
  ('Sinvastatina',        '20mg',  'Comprimido', 'Hipolipemiante'),
  ('Paracetamol',         '750mg', 'Comprimido', 'Analgésico'),
  ('Amoxicilina',         '500mg', 'Cápsula',    'Antibiótico');

-- Coordenadas FICTÍCIAS (região central de São Paulo). Depois trocamos pelas da sua cidade.
insert into public.health_units (name, address, lat, lng, opens_at, closes_at, services) values
  ('UBS Central',          'Rua das Flores, 123 - Centro',          -23.5505, -46.6333, '07:00', '17:00', '{"Clínico Geral","Pediatria","Enfermagem","Cardiologia","Ortopedia"}'),
  ('UBS Vila Nova',        'Av. Principal, 456 - Vila Nova',        -23.5620, -46.6450, '07:00', '17:00', '{"Clínico Geral","Ginecologia","Vacinação","Cardiologia"}'),
  ('UBS Jardim América',   'Rua América, 789 - Jardim América',     -23.5700, -46.6200, '07:00', '17:00', '{"Clínico Geral","Odontologia"}'),
  ('UBS São João',         'Rua São João, 321 - São João',          -23.5400, -46.6500, '08:00', '19:00', '{"Clínico Geral","Cardiologia","Psicologia"}');

-- Estoque por unidade (status por medicamento em cada UBS)
insert into public.unit_medications (unit_id, medication_id, status)
select u.id, m.id, v.status
from (values
  ('UBS Central',        'Losartana Potássica', 'disponivel'),
  ('UBS Central',        'Metformina',          'disponivel'),
  ('UBS Central',        'Omeprazol',           'disponivel'),
  ('UBS Central',        'Sinvastatina',        'atencao'),
  ('UBS Central',        'Paracetamol',         'disponivel'),
  ('UBS Central',        'Amoxicilina',         'indisponivel'),
  ('UBS Vila Nova',      'Losartana Potássica', 'atencao'),
  ('UBS Vila Nova',      'Metformina',          'disponivel'),
  ('UBS Vila Nova',      'Amoxicilina',         'indisponivel'),
  ('UBS Jardim América', 'Omeprazol',           'disponivel'),
  ('UBS Jardim América', 'Paracetamol',         'disponivel'),
  ('UBS Jardim América', 'Amoxicilina',         'indisponivel'),
  ('UBS São João',       'Losartana Potássica', 'disponivel'),
  ('UBS São João',       'Sinvastatina',        'atencao')
) as v(unit_name, med_name, status)
join public.health_units u on u.name = v.unit_name
join public.medications  m on m.name = v.med_name;

insert into public.specialties (name, color) values
  ('Clínico Geral', '#0A73FF'),
  ('Cardiologia',   '#FF4D5E'),
  ('Pediatria',     '#FFCC48'),
  ('Oftalmologia',  '#27C183'),
  ('Neurologia',    '#9B59B6'),
  ('Ortopedia',     '#E67E22');

insert into public.doctors (name, crm, specialty_id, unit_id)
select v.name, v.crm, s.id, u.id
from (values
  ('Dr. Carlos Santos',    'CRM 12345-SP', 'Cardiologia',   'UBS Central'),
  ('Dra. Ana Paula Lima',  'CRM 67890-SP', 'Cardiologia',   'UBS Vila Nova'),
  ('Dr. Roberto Silva',    'CRM 54321-SP', 'Cardiologia',   'UBS Central'),
  ('Dra. Maria Costa',     'CRM 11111-SP', 'Clínico Geral', 'UBS Central'),
  ('Dr. João Pereira',     'CRM 22222-SP', 'Clínico Geral', 'UBS São João'),
  ('Dra. Paula Mendes',    'CRM 33333-SP', 'Pediatria',     'UBS Central'),
  ('Dr. Fernando Alves',   'CRM 44444-SP', 'Ortopedia',     'UBS Central'),
  ('Dra. Lúcia Ramos',     'CRM 55555-SP', 'Oftalmologia',  'UBS Vila Nova'),
  ('Dr. Marcos Teixeira',  'CRM 66666-SP', 'Neurologia',    'UBS São João')
) as v(name, crm, spec_name, unit_name)
join public.specialties  s on s.name = v.spec_name
join public.health_units u on u.name = v.unit_name;
