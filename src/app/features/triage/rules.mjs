// Regras de domínio aplicadas junto com o modelo (usadas pelo app e pelo script de avaliação).
import { normalize } from './classifier.mjs';

export const PEDIATRICS = 'Pediatria';
export const GENERAL = 'Clínico Geral';

// Menções a criança: só nesses casos a Pediatria é considerada.
const CHILD = /\b(crianca|criancas|bebe|bebes|nene|filho|filha|filhos|filhas|menino|menina|recem[ -]?nascido|recem[ -]?nascida|neto|neta|infantil|anos de idade|meses de idade|[0-9]+ (meses|mes)\b)/;

/** A frase fala de uma criança? */
export function mentionsChild(text) {
  return CHILD.test(normalize(text));
}

/** Classes que o modelo pode escolher para esta frase (sem criança, a Pediatria sai). */
export function allowedClasses(classes, text) {
  return mentionsChild(text) ? classes : classes.filter((c) => c !== PEDIATRICS);
}
