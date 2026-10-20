# Feature: Integração do aplicativo com o banco (SupabaseMedicationRepository)

- **Requisito atendido (RF/RNF):** RF - Medicamentos exibidos a partir de dados persistidos; RNF - Manutenibilidade (troca de fonte de dados sem alterar as telas).
- **Disciplinas relacionadas:** Modelagem de Padrões de Projetos; Computação em Nuvem
- **Padrão ou tecnologia usada e por quê:** Repository com implementação Supabase; seleção automática da implementação por variáveis de ambiente (ver ADR-003 e ADR-007).
- **Arquivos principais:**
  - `src/app/lib/supabase.ts`
  - `src/app/repositories/supabase/SupabaseMedicationRepository.ts`
  - `src/app/repositories/index.ts`
  - `.env.example`
- **Como testar:** alterar o nome de um medicamento no Table Editor do Supabase, recarregar o aplicativo e verificar a mudança. Remover o `.env` e verificar que o aplicativo volta a usar os dados do Mock.
- **Evidência (print ou diagrama):** print do app com dados do banco e do `git status` sem o `.env`, em `docs/evidence/`.
- **Observações / dificuldades encontradas:** nenhuma tela precisou ser alterada na troca de Mock para Supabase, o que valida a decisão do ADR-003.
