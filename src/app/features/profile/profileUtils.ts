import { isoDateSP } from '../scheduling/dateUtils';
import type { UpdateProfileInput } from '../../domain/profile';

/** Mantém só os dígitos. */
export const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** '19999998888' -> '(19) 99999-8888'; '1934567890' -> '(19) 3456-7890'. Aceita digitação parcial. */
export function formatPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : '';
  const ddd = d.slice(0, 2);
  const rest = d.slice(2);
  if (rest.length <= 4) return `(${ddd}) ${rest}`;
  const split = d.length === 11 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, split)}-${rest.slice(split)}`;
}

/** 'AAAA-MM-DD' -> 'DD/MM/AAAA'. */
export function formatDateBR(iso: string | null | undefined): string {
  if (!iso) return '';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

export type ProfileErrors = Partial<Record<keyof UpdateProfileInput, string>>;

/** Mesmas regras de db/09_perfil.sql, com mensagens para o usuário. */
export function validateProfile(input: UpdateProfileInput, now = new Date()): ProfileErrors {
  const errors: ProfileErrors = {};
  const name = input.fullName.trim();
  if (name.length < 3) errors.fullName = 'Informe seu nome (pelo menos 3 letras).';
  else if (name.length > 120) errors.fullName = 'O nome pode ter até 120 caracteres.';

  const phone = onlyDigits(input.phone);
  if (phone && phone.length !== 10 && phone.length !== 11) errors.phone = 'Telefone com DDD: 10 ou 11 dígitos.';

  if (input.birthDate) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate) || Number.isNaN(Date.parse(input.birthDate))) errors.birthDate = 'Data inválida.';
    else if (input.birthDate < '1900-01-01') errors.birthDate = 'A data deve ser depois de 1900.';
    else if (input.birthDate > isoDateSP(now)) errors.birthDate = 'A data não pode estar no futuro.';
  }
  return errors;
}

/** Deixa os dados no formato gravado no banco (nome sem espaços extras, telefone só com dígitos). */
export function normalizeProfile(input: UpdateProfileInput): UpdateProfileInput {
  return { fullName: input.fullName.trim().replace(/\s+/g, ' '), birthDate: input.birthDate, phone: onlyDigits(input.phone) };
}
