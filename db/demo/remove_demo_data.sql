-- =====================================================================
-- InfoMed - db/demo/remove_demo_data.sql
-- Apaga TODOS os DADOS DE DEMONSTRAÇÃO criados por demo_data.sql.
-- A exclusão do usuário apaga em cascata perfil, consultas, lembretes e notificações.
-- Não toca em usuários reais (só e-mails demoN@infomed.invalid).
-- =====================================================================
delete from auth.users where email like 'demo%@infomed.invalid';

select count(*) as usuarios_demo_restantes from auth.users where email like 'demo%@infomed.invalid';
