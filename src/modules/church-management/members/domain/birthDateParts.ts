/**
 * Deriva mês/dia de nascimento em UTC (alinhado ao app mobile KMP).
 * Usado para indexar `birthMonth` no Firestore e evitar full-scan de members.
 */
export function getBirthDateParts(date: Date): { birthMonth: number; birthDay: number } {
  const d = date instanceof Date ? date : new Date(date);
  return {
    birthMonth: d.getUTCMonth() + 1, // 1-12
    birthDay: d.getUTCDate(),
  };
}

export function isInactiveMemberStatus(status: string | undefined | null): boolean {
  const s = (status || '').toLowerCase();
  return s === 'inactive' || s === 'transferred';
}
