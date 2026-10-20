-- =====================================================================
-- InfoMed - 03_teste_rls.sql  (EVIDÊNCIA PARA O TCC)
-- Prova que um usuário NÃO enxerga dados de outro.
-- Antes: crie 2 contas no app (ou em Authentication > Users > Add user).
-- Depois: copie o UUID de cada uma e troque abaixo.
-- Rode tudo de uma vez; tire print do resultado.
-- =====================================================================
begin;

-- 1) cria uma consulta COMO a Maria
set local role authenticated;
select set_config('request.jwt.claim.sub', '169305af-b345-4ec0-a1cc-4dc7889e6ac2', true);
insert into public.appointments (doctor_id, starts_at)
  select id, now() + interval '3 days' from public.doctors limit 1;
select 'Maria vê suas consultas' as teste, count(*) as resultado from public.appointments;

-- 2) agora COMO o João
select set_config('request.jwt.claim.sub', '1e22f02b-b830-405a-8436-3cd53e98d770', true);
select 'João vê consultas da Maria (esperado 0)' as teste, count(*) as resultado from public.appointments;

rollback;  -- desfaz tudo: não deixa dados de teste
