// Hook para verificar se existe pelo menos um admin no sistema
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../config/firebase';

interface AdminCheckResult {
  hasAdmin: boolean | null; // null = loading, true/false = resultado
  loading: boolean;
  error: string | null;
  recheck: () => void; // Função para forçar nova verificação
}

export const useAdminCheck = (): AdminCheckResult => {
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
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
        const isInitialized = systemData.initialized === true;
        setHasAdmin(isInitialized);
      } else {
        // Se não existe o documento, o sistema não foi inicializado
        setHasAdmin(false);
      }
    } catch (error) {
      console.error('Error checking system setup:', error);
      setError('Falha ao verificar configuração do sistema');
      // Em caso de erro, assume que precisa de setup
      setHasAdmin(false);
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