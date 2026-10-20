-- =====================================================================
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

insert into public.specialties (name, color) values
  ('Clínico Geral', '#0A73FF'),
  ('Pediatria', '#FFCC48'),
  ('Ginecologia', '#FF4D5E'),
  ('Odontologia', '#27C183');

insert into public.health_units (name, address, lat, lng, opens_at, closes_at, services, phone, source_url, verified, notes) values
  ('UBS Dr. Carlos Perez - 31 de Março', 'Rua 23 de Maio, 196 - 31 de Março, Santa Bárbara d''Oeste', -22.738803, -47.403105, '07:00', '16:30', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma', 'Fonoaudiologia']::text[], '(19) 3454-6515', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, null),
  ('UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)', 'Avenida Sábato Ronsini, 203 - Vila Linópolis, Santa Bárbara d''Oeste', -22.7589118, -47.4178312, '07:00', '16:30', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma', 'Psicologia', 'Nutrição', 'Fonoaudiologia']::text[], '(19) 3454-1107', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, null),
  ('UBS Dr. Hélio Furlan - Cidade Nova', 'Rua do Algodão, 1441 - Cidade Nova, Santa Bárbara d''Oeste', -22.7365171, -47.3777807, '07:00', '19:00', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma', 'Psicologia', 'Nutrição', 'Fonoaudiologia']::text[], '(19) 3457-4856', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, null),
  ('UBS Paulo Pereira Fonseca - Cruzeiro do Sul', 'Rua Coronel Hélio Caldas, 57 - Cruzeiro do Sul, Santa Bárbara d''Oeste', -22.7393306, -47.4848616, '07:00', '16:30', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma', 'Fonoaudiologia']::text[], '(19) 3454-5669', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, null),
  ('UBS Dr. José Wenceslau Júnior - Jardim Esmeralda', 'Rua do Centeio, 1591 - Jardim Esmeralda, Santa Bárbara d''Oeste', -22.745507, -47.3813872, '07:00', '16:30', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma', 'Fonoaudiologia']::text[], '(19) 3457-5072', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, 'CONFERIR ENDEREÇO: a página Atenção Básica informa Rua do Centeio, 1591 (salão da Igreja N. Sra. Aparecida); outra notícia da Prefeitura informa Rua Ribeirão Preto, 110.'),
  ('UBS Dr. Simão Galdeman - Jardim Europa', 'Rua Portugal, 522 - Jardim Europa, Santa Bárbara d''Oeste', -22.7256393, -47.3730389, '07:00', '19:00', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma', 'Psicologia', 'Fonoaudiologia']::text[], '(19) 3457-4954', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, null),
  ('UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2', 'Rua Mombuca, 385 - Planalto do Sol 2, Santa Bárbara d''Oeste', -22.7341996, -47.3930303, '07:00', '16:30', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma']::text[], '(19) 3457-3675', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, null),
  ('UBS Dr. Felício Fernandes Nogueira - Mollon', 'Rua do Cobre, 850 - Mollon, Santa Bárbara d''Oeste', -22.753809, -47.3626363, '07:00', '16:30', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma', 'Psicologia', 'Nutrição', 'Fonoaudiologia']::text[], '(19) 3457-5021', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, null),
  ('UBS Dr. Célio Faria - Romano', 'Rua Doutor Sebastião de Paula Coelho, 600 - Conjunto Roberto Romano, Santa Bárbara d''Oeste', -22.7714982, -47.4220731, '07:00', '16:30', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma', 'Psicologia', 'Fonoaudiologia']::text[], '(19) 3454-4885', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, 'CONFERIR ENDEREÇO: a página Atenção Básica informa Rua Dr. Sebastião de Paula Coelho, 600; notícias de vacinação informam Rua Profeta Jeremias, 140 (Jd Laudissi/Romano).'),
  ('UBS Amália Salvador Dal'' Bello - Jardim São Fernando', 'Rua do Centeio, 38 - Jardim São Fernando, Santa Bárbara d''Oeste', -22.7427259, -47.3721812, '07:00', '16:30', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma', 'Nutrição', 'Psicologia']::text[], '(19) 3457-4981', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, null),
  ('UBS Dr. José Togeiro de Andrade - Jardim São Francisco', 'Rua dos Tucanos, 406 - Jardim São Francisco, Santa Bárbara d''Oeste', -22.768302055940282, -47.39244379961947, '07:00', '16:30', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Odontologia', 'Vacinação', 'Enfermagem', 'Farmácia', 'Eletrocardiograma', 'Psicologia', 'Fonoaudiologia']::text[], '(19) 3454-0910', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, 'CONFERIR ENDEREÇO: a página Atenção Básica informa Rua dos Tucanos, 406; notícias de vacinação informam Rua Cariris, 400 (Jd São Francisco 2/Santa Rita).'),
  ('UBS Dr. Sérgio Moricazu Miyazato - Europa IV', 'Rua Letônia, 150 - Jardim Europa IV, Santa Bárbara d''Oeste', -22.7274147, -47.3758949, '07:00', '13:00', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Enfermagem', 'Eletrocardiograma']::text[], '(19) 3463-8304', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, 'Sem farmácia na lista de serviços da fonte; sem estoque de medicamentos no app.'),
  ('UBS Gabriel Rubens Pimentel - Jardim Boa Vista', 'Avenida de Cillo, 1015 - Jardim Boa Vista, Santa Bárbara d''Oeste', -22.7588212, -47.4038368, '14:00', '19:00', ARRAY['Clínico Geral', 'Pediatria', 'Ginecologia', 'Vacinação', 'Enfermagem']::text[], '(19) 3455-7037', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, 'Atende somente à tarde. Sem farmácia na lista de serviços da fonte; sem estoque no app.'),
  ('UBS Elizeu Vilha - Planalto do Sol', 'Rua Teresina, 553 - Planalto do Sol, Santa Bárbara d''Oeste', -22.7348072, -47.3845063, '07:00', '16:30', ARRAY['Clínico Geral', 'Enfermagem']::text[], '(19) 3458-1224', 'https://www.santabarbara.sp.gov.br/portal/secretarias-paginas/2/atencao-basica/', false, 'Sem farmácia na lista de serviços da fonte; sem estoque no app.'),
  ('UBS Regional Zona Sul - Santa Rita', 'Rua José Calixto, 100 - Jardim Santa Rita, Santa Bárbara d''Oeste', -22.771861, -47.3907712, '07:00', '16:30', ARRAY['Clínico Geral', 'Vacinação', 'Enfermagem']::text[], '(19) 3454-5178', 'https://www.santabarbara.sp.gov.br/portal/noticias/0/3/73556/santa-barbara-ja-aplicou-242-mil-doses-durante-a-vacinacao-contra-a-gripe', false, 'CONFERIR HORÁRIO E SERVIÇOS: a unidade consta nas notícias e no catálogo de telefones da Prefeitura, mas não na página Atenção Básica; horário assumido igual ao da maioria das UBS. Substitui, no atendimento, a UBS Vista Alegre (fechada).');

-- ESTOQUE SIMULADO
insert into public.unit_medications (unit_id, medication_id, status)
select u.id, m.id, v.status
from (values
  ('UBS Dr. Carlos Perez - 31 de Março', 'Losartana Potássica', 'disponivel'),
  ('UBS Dr. Carlos Perez - 31 de Março', 'Metformina', 'disponivel'),
  ('UBS Dr. Carlos Perez - 31 de Março', 'Omeprazol', 'atencao'),
  ('UBS Dr. Carlos Perez - 31 de Março', 'Sinvastatina', 'indisponivel'),
  ('UBS Dr. Carlos Perez - 31 de Março', 'Paracetamol', 'disponivel'),
  ('UBS Dr. Carlos Perez - 31 de Março', 'Amoxicilina', 'disponivel'),
  ('UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)', 'Losartana Potássica', 'disponivel'),
  ('UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)', 'Metformina', 'disponivel'),
  ('UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)', 'Omeprazol', 'disponivel'),
  ('UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)', 'Sinvastatina', 'atencao'),
  ('UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)', 'Paracetamol', 'disponivel'),
  ('UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)', 'Amoxicilina', 'atencao'),
  ('UBS Dr. Hélio Furlan - Cidade Nova', 'Losartana Potássica', 'atencao'),
  ('UBS Dr. Hélio Furlan - Cidade Nova', 'Metformina', 'atencao'),
  ('UBS Dr. Hélio Furlan - Cidade Nova', 'Omeprazol', 'disponivel'),
  ('UBS Dr. Hélio Furlan - Cidade Nova', 'Sinvastatina', 'disponivel'),
  ('UBS Dr. Hélio Furlan - Cidade Nova', 'Paracetamol', 'disponivel'),
  ('UBS Dr. Hélio Furlan - Cidade Nova', 'Amoxicilina', 'disponivel'),
  ('UBS Paulo Pereira Fonseca - Cruzeiro do Sul', 'Losartana Potássica', 'disponivel'),
  ('UBS Paulo Pereira Fonseca - Cruzeiro do Sul', 'Metformina', 'atencao'),
  ('UBS Paulo Pereira Fonseca - Cruzeiro do Sul', 'Omeprazol', 'atencao'),
  ('UBS Paulo Pereira Fonseca - Cruzeiro do Sul', 'Sinvastatina', 'indisponivel'),
  ('UBS Paulo Pereira Fonseca - Cruzeiro do Sul', 'Paracetamol', 'disponivel'),
  ('UBS Paulo Pereira Fonseca - Cruzeiro do Sul', 'Amoxicilina', 'disponivel'),
  ('UBS Dr. José Wenceslau Júnior - Jardim Esmeralda', 'Losartana Potássica', 'disponivel'),
  ('UBS Dr. José Wenceslau Júnior - Jardim Esmeralda', 'Metformina', 'disponivel'),
  ('UBS Dr. José Wenceslau Júnior - Jardim Esmeralda', 'Omeprazol', 'disponivel'),
  ('UBS Dr. José Wenceslau Júnior - Jardim Esmeralda', 'Sinvastatina', 'disponivel'),
  ('UBS Dr. José Wenceslau Júnior - Jardim Esmeralda', 'Paracetamol', 'indisponivel'),
  ('UBS Dr. José Wenceslau Júnior - Jardim Esmeralda', 'Amoxicilina', 'indisponivel'),
  ('UBS Dr. Simão Galdeman - Jardim Europa', 'Losartana Potássica', 'indisponivel'),
  ('UBS Dr. Simão Galdeman - Jardim Europa', 'Metformina', 'disponivel'),
  ('UBS Dr. Simão Galdeman - Jardim Europa', 'Omeprazol', 'disponivel'),
  ('UBS Dr. Simão Galdeman - Jardim Europa', 'Sinvastatina', 'indisponivel'),
  ('UBS Dr. Simão Galdeman - Jardim Europa', 'Paracetamol', 'disponivel'),
  ('UBS Dr. Simão Galdeman - Jardim Europa', 'Amoxicilina', 'disponivel'),
  ('UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2', 'Losartana Potássica', 'disponivel'),
  ('UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2', 'Metformina', 'disponivel'),
  ('UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2', 'Omeprazol', 'disponivel'),
  ('UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2', 'Sinvastatina', 'atencao'),
  ('UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2', 'Paracetamol', 'atencao'),
  ('UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2', 'Amoxicilina', 'disponivel'),
  ('UBS Dr. Felício Fernandes Nogueira - Mollon', 'Losartana Potássica', 'disponivel'),
  ('UBS Dr. Felício Fernandes Nogueira - Mollon', 'Metformina', 'disponivel'),
  ('UBS Dr. Felício Fernandes Nogueira - Mollon', 'Omeprazol', 'disponivel'),
  ('UBS Dr. Felício Fernandes Nogueira - Mollon', 'Sinvastatina', 'disponivel'),
  ('UBS Dr. Felício Fernandes Nogueira - Mollon', 'Paracetamol', 'atencao'),
  ('UBS Dr. Felício Fernandes Nogueira - Mollon', 'Amoxicilina', 'disponivel'),
  ('UBS Dr. Célio Faria - Romano', 'Losartana Potássica', 'atencao'),
  ('UBS Dr. Célio Faria - Romano', 'Metformina', 'atencao'),
  ('UBS Dr. Célio Faria - Romano', 'Omeprazol', 'disponivel'),
  ('UBS Dr. Célio Faria - Romano', 'Sinvastatina', 'disponivel'),
  ('UBS Dr. Célio Faria - Romano', 'Paracetamol', 'disponivel'),
  ('UBS Dr. Célio Faria - Romano', 'Amoxicilina', 'disponivel'),
  ('UBS Amália Salvador Dal'' Bello - Jardim São Fernando', 'Losartana Potássica', 'disponivel'),
  ('UBS Amália Salvador Dal'' Bello - Jardim São Fernando', 'Metformina', 'atencao'),
  ('UBS Amália Salvador Dal'' Bello - Jardim São Fernando', 'Omeprazol', 'disponivel'),
  ('UBS Amália Salvador Dal'' Bello - Jardim São Fernando', 'Sinvastatina', 'atencao'),
  ('UBS Amália Salvador Dal'' Bello - Jardim São Fernando', 'Paracetamol', 'atencao'),
  ('UBS Amália Salvador Dal'' Bello - Jardim São Fernando', 'Amoxicilina', 'indisponivel'),
  ('UBS Dr. José Togeiro de Andrade - Jardim São Francisco', 'Losartana Potássica', 'disponivel'),
  ('UBS Dr. José Togeiro de Andrade - Jardim São Francisco', 'Metformina', 'disponivel'),
  ('UBS Dr. José Togeiro de Andrade - Jardim São Francisco', 'Omeprazol', 'disponivel'),
  ('UBS Dr. José Togeiro de Andrade - Jardim São Francisco', 'Sinvastatina', 'atencao'),
  ('UBS Dr. José Togeiro de Andrade - Jardim São Francisco', 'Paracetamol', 'disponivel'),
  ('UBS Dr. José Togeiro de Andrade - Jardim São Francisco', 'Amoxicilina', 'indisponivel'),
  ('UBS Regional Zona Sul - Santa Rita', 'Losartana Potássica', 'disponivel'),
  ('UBS Regional Zona Sul - Santa Rita', 'Metformina', 'disponivel'),
  ('UBS Regional Zona Sul - Santa Rita', 'Omeprazol', 'disponivel'),
  ('UBS Regional Zona Sul - Santa Rita', 'Sinvastatina', 'disponivel'),
  ('UBS Regional Zona Sul - Santa Rita', 'Paracetamol', 'atencao'),
  ('UBS Regional Zona Sul - Santa Rita', 'Amoxicilina', 'atencao')
) as v(unit_name, med_name, status)
join public.health_units u on u.name = v.unit_name
join public.medications  m on m.name = v.med_name;

-- MÉDICOS SIMULADOS (nomes e registros fictícios)
insert into public.doctors (name, crm, specialty_id, unit_id)
select v.name, v.crm, s.id, u.id
from (values
  ('Dr. Carlos Almeida', 'SIM-0001', 'Clínico Geral', 'UBS Dr. Carlos Perez - 31 de Março'),
  ('Dra. Fernanda Rocha', 'SIM-0002', 'Pediatria', 'UBS Dr. Carlos Perez - 31 de Março'),
  ('Dr. Paulo Menezes', 'SIM-0003', 'Ginecologia', 'UBS Dr. Carlos Perez - 31 de Março'),
  ('Dra. Juliana Prado', 'SIM-0004', 'Odontologia', 'UBS Dr. Carlos Perez - 31 de Março'),
  ('Dr. Ricardo Tavares', 'SIM-0005', 'Clínico Geral', 'UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)'),
  ('Dra. Beatriz Nogueira', 'SIM-0006', 'Pediatria', 'UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)'),
  ('Dr. André Castro', 'SIM-0007', 'Ginecologia', 'UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)'),
  ('Dra. Camila Duarte', 'SIM-0008', 'Odontologia', 'UBS Dr. Jéber Juabre - Centro de Saúde (Linópolis)'),
  ('Dr. Marcelo Pires', 'SIM-0009', 'Clínico Geral', 'UBS Dr. Hélio Furlan - Cidade Nova'),
  ('Dra. Patrícia Lopes', 'SIM-0010', 'Pediatria', 'UBS Dr. Hélio Furlan - Cidade Nova'),
  ('Dr. Rodrigo Faria', 'SIM-0011', 'Ginecologia', 'UBS Dr. Hélio Furlan - Cidade Nova'),
  ('Dra. Luciana Barros', 'SIM-0012', 'Odontologia', 'UBS Dr. Hélio Furlan - Cidade Nova'),
  ('Dr. Thiago Ramos', 'SIM-0013', 'Clínico Geral', 'UBS Paulo Pereira Fonseca - Cruzeiro do Sul'),
  ('Dra. Renata Moraes', 'SIM-0014', 'Pediatria', 'UBS Paulo Pereira Fonseca - Cruzeiro do Sul'),
  ('Dr. Eduardo Silveira', 'SIM-0015', 'Ginecologia', 'UBS Paulo Pereira Fonseca - Cruzeiro do Sul'),
  ('Dra. Aline Cardoso', 'SIM-0016', 'Odontologia', 'UBS Paulo Pereira Fonseca - Cruzeiro do Sul'),
  ('Dr. Gustavo Neves', 'SIM-0017', 'Clínico Geral', 'UBS Dr. José Wenceslau Júnior - Jardim Esmeralda'),
  ('Dra. Vanessa Teixeira', 'SIM-0018', 'Pediatria', 'UBS Dr. José Wenceslau Júnior - Jardim Esmeralda'),
  ('Dr. Leandro Costa', 'SIM-0019', 'Ginecologia', 'UBS Dr. José Wenceslau Júnior - Jardim Esmeralda'),
  ('Dra. Priscila Martins', 'SIM-0020', 'Odontologia', 'UBS Dr. José Wenceslau Júnior - Jardim Esmeralda'),
  ('Dr. Carlos Almeida', 'SIM-0021', 'Clínico Geral', 'UBS Dr. Simão Galdeman - Jardim Europa'),
  ('Dra. Fernanda Rocha', 'SIM-0022', 'Pediatria', 'UBS Dr. Simão Galdeman - Jardim Europa'),
  ('Dr. Paulo Menezes', 'SIM-0023', 'Ginecologia', 'UBS Dr. Simão Galdeman - Jardim Europa'),
  ('Dra. Juliana Prado', 'SIM-0024', 'Odontologia', 'UBS Dr. Simão Galdeman - Jardim Europa'),
  ('Dr. Ricardo Tavares', 'SIM-0025', 'Clínico Geral', 'UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2'),
  ('Dra. Beatriz Nogueira', 'SIM-0026', 'Pediatria', 'UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2'),
  ('Dr. André Castro', 'SIM-0027', 'Ginecologia', 'UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2'),
  ('Dra. Camila Duarte', 'SIM-0028', 'Odontologia', 'UBS Dra. Nair Sizuka Nobuyasu Guimarães - Planalto do Sol 2'),
  ('Dr. Marcelo Pires', 'SIM-0029', 'Clínico Geral', 'UBS Dr. Felício Fernandes Nogueira - Mollon'),
  ('Dra. Patrícia Lopes', 'SIM-0030', 'Pediatria', 'UBS Dr. Felício Fernandes Nogueira - Mollon'),
  ('Dr. Rodrigo Faria', 'SIM-0031', 'Ginecologia', 'UBS Dr. Felício Fernandes Nogueira - Mollon'),
  ('Dra. Luciana Barros', 'SIM-0032', 'Odontologia', 'UBS Dr. Felício Fernandes Nogueira - Mollon'),
  ('Dr. Thiago Ramos', 'SIM-0033', 'Clínico Geral', 'UBS Dr. Célio Faria - Romano'),
  ('Dra. Renata Moraes', 'SIM-0034', 'Pediatria', 'UBS Dr. Célio Faria - Romano'),
  ('Dr. Eduardo Silveira', 'SIM-0035', 'Ginecologia', 'UBS Dr. Célio Faria - Romano'),
  ('Dra. Aline Cardoso', 'SIM-0036', 'Odontologia', 'UBS Dr. Célio Faria - Romano'),
  ('Dr. Gustavo Neves', 'SIM-0037', 'Clínico Geral', 'UBS Amália Salvador Dal'' Bello - Jardim São Fernando'),
  ('Dra. Vanessa Teixeira', 'SIM-0038', 'Pediatria', 'UBS Amália Salvador Dal'' Bello - Jardim São Fernando'),
  ('Dr. Leandro Costa', 'SIM-0039', 'Ginecologia', 'UBS Amália Salvador Dal'' Bello - Jardim São Fernando'),
  ('Dra. Priscila Martins', 'SIM-0040', 'Odontologia', 'UBS Amália Salvador Dal'' Bello - Jardim São Fernando'),
  ('Dr. Carlos Almeida', 'SIM-0041', 'Clínico Geral', 'UBS Dr. José Togeiro de Andrade - Jardim São Francisco'),
  ('Dra. Fernanda Rocha', 'SIM-0042', 'Pediatria', 'UBS Dr. José Togeiro de Andrade - Jardim São Francisco'),
  ('Dr. Paulo Menezes', 'SIM-0043', 'Ginecologia', 'UBS Dr. José Togeiro de Andrade - Jardim São Francisco'),
  ('Dra. Juliana Prado', 'SIM-0044', 'Odontologia', 'UBS Dr. José Togeiro de Andrade - Jardim São Francisco'),
  ('Dr. Ricardo Tavares', 'SIM-0045', 'Clínico Geral', 'UBS Dr. Sérgio Moricazu Miyazato - Europa IV'),
  ('Dra. Beatriz Nogueira', 'SIM-0046', 'Pediatria', 'UBS Dr. Sérgio Moricazu Miyazato - Europa IV'),
  ('Dr. André Castro', 'SIM-0047', 'Ginecologia', 'UBS Dr. Sérgio Moricazu Miyazato - Europa IV'),
  ('Dra. Camila Duarte', 'SIM-0048', 'Clínico Geral', 'UBS Gabriel Rubens Pimentel - Jardim Boa Vista'),
  ('Dr. Marcelo Pires', 'SIM-0049', 'Pediatria', 'UBS Gabriel Rubens Pimentel - Jardim Boa Vista'),
  ('Dra. Patrícia Lopes', 'SIM-0050', 'Ginecologia', 'UBS Gabriel Rubens Pimentel - Jardim Boa Vista'),
  ('Dr. Rodrigo Faria', 'SIM-0051', 'Clínico Geral', 'UBS Elizeu Vilha - Planalto do Sol'),
  ('Dra. Luciana Barros', 'SIM-0052', 'Clínico Geral', 'UBS Regional Zona Sul - Santa Rita')
) as v(name, crm, spec_name, unit_name)
join public.specialties  s on s.name = v.spec_name
join public.health_units u on u.name = v.unit_name;

commit;
