import { getBirthDateParts, isInactiveMemberStatus } from '../birthDateParts';

describe('getBirthDateParts', () => {
  it('usa UTC para mês e dia (alinhado ao mobile)', () => {
    // 15 de março UTC — independente do fuso local
    const d = new Date(Date.UTC(1990, 2, 15, 12, 0, 0));
    expect(getBirthDateParts(d)).toEqual({ birthMonth: 3, birthDay: 15 });
  });

  it('aceita string/Date e normaliza janeiro e dezembro', () => {
    expect(getBirthDateParts(new Date(Date.UTC(2000, 0, 1)))).toEqual({
      birthMonth: 1,
      birthDay: 1,
    });
    expect(getBirthDateParts(new Date(Date.UTC(2000, 11, 31)))).toEqual({
      birthMonth: 12,
      birthDay: 31,
    });
  });
});

describe('isInactiveMemberStatus', () => {
  it('marca inactive e transferred como inativos', () => {
    expect(isInactiveMemberStatus('inactive')).toBe(true);
    expect(isInactiveMemberStatus('Transferred')).toBe(true);
    expect(isInactiveMemberStatus('active')).toBe(false);
    expect(isInactiveMemberStatus(null)).toBe(false);
  });
});
