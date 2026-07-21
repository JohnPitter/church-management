import {
  computeBirthPartsBackfill,
  planBirthPartsBackfill,
} from '../backfillBirthDateParts';
import { getBirthDateParts } from '../../domain/birthDateParts';

describe('computeBirthPartsBackfill / planBirthPartsBackfill', () => {
  it('deriva birthMonth/birthDay via getBirthDateParts (UTC) a partir de birthDate', () => {
    const birthDate = new Date(Date.UTC(1990, 4, 15, 12, 0, 0)); // 15 maio
    const expected = getBirthDateParts(birthDate);

    const patch = computeBirthPartsBackfill({
      id: 'm1',
      birthDate,
    });

    expect(patch).toEqual({
      id: 'm1',
      birthMonth: expected.birthMonth,
      birthDay: expected.birthDay,
    });
    expect(patch).toEqual({ id: 'm1', birthMonth: 5, birthDay: 15 });
  });

  it('aceita Timestamp-like e dataNascimento legado', () => {
    const d = new Date(Date.UTC(2001, 0, 2));
    const patch = computeBirthPartsBackfill({
      id: 'legacy',
      dataNascimento: { toDate: () => d },
    });
    expect(patch).toEqual({
      id: 'legacy',
      ...getBirthDateParts(d),
    });
  });

  it('ignora docs já indexados e sem data', () => {
    expect(
      computeBirthPartsBackfill({
        id: 'ok',
        birthDate: new Date(),
        birthMonth: 3,
        birthDay: 10,
      })
    ).toBeNull();
    expect(computeBirthPartsBackfill({ id: 'empty' })).toBeNull();
  });

  it('planeja backfill só para legados sem parts', () => {
    const docs = [
      { id: 'a', birthDate: new Date(Date.UTC(1995, 6, 20)), birthMonth: 7, birthDay: 20 },
      { id: 'b', birthDate: new Date(Date.UTC(1995, 6, 20)) },
      { id: 'c' },
    ];
    const plan = planBirthPartsBackfill(docs);
    expect(plan).toHaveLength(1);
    expect(plan[0].id).toBe('b');
    expect(plan[0]).toEqual({
      id: 'b',
      ...getBirthDateParts(new Date(Date.UTC(1995, 6, 20))),
    });
  });
});
