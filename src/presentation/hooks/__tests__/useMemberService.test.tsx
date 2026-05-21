import { renderHook } from '@testing-library/react';
import { useMemberService } from '../useMemberService';
import { MemberService } from '@modules/church-management/members/application/services/MemberService';

describe('useMemberService', () => {
  it('retorna uma instancia de MemberService e a memoiza entre renders', () => {
    const { result, rerender } = renderHook(() => useMemberService());
    const firstInstance = result.current;

    expect(firstInstance).toBeInstanceOf(MemberService);

    rerender();

    expect(result.current).toBe(firstInstance);
  });
});
