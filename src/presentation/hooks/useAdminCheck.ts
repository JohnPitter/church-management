// Hook para verificar se existe pelo menos um admin no sistema
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/config/firebase';

const SYSTEM_SETUP_CACHE_KEY = 'church-management:system-setup-initialized';

interface AdminCheckResult {
  hasAdmin: boolean | null; // null = loading, true/false = resultado
  loading: boolean;
  error: string | null;
  recheck: () => void; // Função para forçar nova verificação
}

export const useAdminCheck = (): AdminCheckResult => {
  const cachedHasAdmin = localStorage.getItem(SYSTEM_SETUP_CACHE_KEY) === 'true';
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(cachedHasAdmin ? true : null);
  const [loading, setLoading] = useState(!cachedHasAdmin);
  const [error, setError] = useState<string | null>(null);
  const [recheckTrigger, setRecheckTrigger] = useState(0);

  const checkSystemSetup = async () => {
    try {
      setLoading(true);
      setError(null);

      // Verificar se existe documento de configuração do sistema indicando se foi inicializado
      const systemDoc = await getDoc(doc(db, 'settings', 'system'));
      
      if (systemDoc.exists()) {
        const systemData = systemDoc.data();
        const isInitialized = systemData?.initialized === true;
        localStorage.setItem(SYSTEM_SETUP_CACHE_KEY, String(isInitialized));
        setHasAdmin(isInitialized);
      } else {
        // Se não existe o documento, o sistema não foi inicializado
        localStorage.setItem(SYSTEM_SETUP_CACHE_KEY, 'false');
        setHasAdmin(false);
      }
    } catch (error) {
      console.error('Error checking system setup:', error);
      setError('Falha ao verificar configuração do sistema');
      setHasAdmin(cachedHasAdmin ? true : false);
    } finally {
      setLoading(false);
    }
  };

  const recheck = () => {
    setRecheckTrigger(prev => prev + 1);
  };

  useEffect(() => {
    checkSystemSetup();
  }, [recheckTrigger]);

  return { hasAdmin, loading, error, recheck };
};
