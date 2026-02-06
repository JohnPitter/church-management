// Presentation Hook - Unified Permission System
// Re-exports useAtomicPermissions as the main hook

import { useAtomicPermissions } from './useAtomicPermissions';

// Re-export the atomic permissions hook as the main usePermissions
export const usePermissions = useAtomicPermissions;
