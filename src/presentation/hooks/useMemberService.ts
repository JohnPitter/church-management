// Presentation Hook - useMemberService
// Custom hook to provide access to MemberService

import { useMemo } from 'react';
import { MemberService } from '../../infrastructure/services/MemberService';

export const useMemberService = (): MemberService => {
  return useMemo(() => new MemberService(), []);
};
