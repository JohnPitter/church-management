// Presentation Hook - useMemberService
// Custom hook to provide access to MemberService

import { useMemo } from 'react';
import { MemberService } from '@modules/church-management/members/application/services/MemberService';

export const useMemberService = (): MemberService => {
  return useMemo(() => new MemberService(), []);
};
