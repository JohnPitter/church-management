/**
 * Backfill de birthMonth/birthDay para membros legados.
 * Lógica pura (sem I/O) — reutiliza getBirthDateParts (UTC).
 * O script CLI / Admin SDK só itera e grava.
 */
import { getBirthDateParts } from '../domain/birthDateParts';

export type MemberBirthLegacyDoc = {
  id: string;
  birthDate?: Date | { toDate?: () => Date } | string | number | null;
  birthMonth?: number | null;
  birthDay?: number | null;
  dataNascimento?: Date | { toDate?: () => Date } | string | number | null;
};

export type BirthPartsBackfillPatch = {
  id: string;
  birthMonth: number;
  birthDay: number;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'object' && value !== null && 'toDate' in value) {
    try {
      const d = (value as { toDate: () => Date }).toDate();
      return Number.isNaN(d.getTime()) ? null : d;
    } catch {
      return null;
    }
  }
  if (typeof value === 'string' || typeof value === 'number') {
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return null;
}

/**
 * Calcula patch de backfill para um doc. Retorna null se já indexado ou sem data.
 */
export function computeBirthPartsBackfill(
  doc: MemberBirthLegacyDoc
): BirthPartsBackfillPatch | null {
  if (typeof doc.birthMonth === 'number' && typeof doc.birthDay === 'number') {
    return null;
  }
  const birth = toDate(doc.birthDate) || toDate(doc.dataNascimento);
  if (!birth) return null;
  const parts = getBirthDateParts(birth);
  return {
    id: doc.id,
    birthMonth: parts.birthMonth,
    birthDay: parts.birthDay,
  };
}

/**
 * Deriva patches para uma lista de membros (dry-run friendly).
 */
export function planBirthPartsBackfill(
  docs: MemberBirthLegacyDoc[]
): BirthPartsBackfillPatch[] {
  const patches: BirthPartsBackfillPatch[] = [];
  for (const doc of docs) {
    const patch = computeBirthPartsBackfill(doc);
    if (patch) patches.push(patch);
  }
  return patches;
}
