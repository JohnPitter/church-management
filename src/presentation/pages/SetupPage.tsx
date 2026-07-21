// Página de Setup Inicial - primeiro admin via Cloud Function (Admin SDK)
import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { useAuth } from '../contexts/AuthContext';
import { functions } from '@/config/firebase';

const SetupPage: React.FC = () => {
  const { currentUser, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err) {
      console.error('Error signing in:', err);
      setError('Erro ao fazer login com Google');
    } finally {
      setLoading(false);
    }
  };

  const createFirstAdmin = async () => {
    if (!currentUser) {
      setError('Você precisa estar logado para continuar');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const bootstrap = httpsCallable(functions, 'bootstrapFirstAdmin');
      await bootstrap({
        displayName: currentUser.displayName || 'Administrador',
        email: currentUser.email,
        photoURL: currentUser.photoURL || null,
      });

      setSuccess(true);
      setTimeout(() => {
        window.location.href = '/welcome';
      }, 1500);
    } catch (err: unknown) {
      console.error('Error creating admin:', err);
      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message: string }).message)
          : 'Erro ao criar administrador. Tente novamente.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Setup Concluído!</h1>
          <p className="text-gray-600 mb-4">
            Administrador criado com sucesso. Redirecionando...
          </p>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Configuração Inicial</h1>
          <p className="text-gray-600">
            Crie o primeiro administrador do sistema de forma segura (servidor).
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {!currentUser ? (
          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={loading}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Entrar com Google'}
          </button>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
              Logado como <strong>{currentUser.email}</strong>
            </div>
            <button
              type="button"
              onClick={createFirstAdmin}
              disabled={loading}
              className="w-full rounded-lg bg-indigo-600 px-4 py-3 font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              {loading ? 'Criando administrador...' : 'Tornar-me o primeiro admin'}
            </button>
            <p className="text-xs text-gray-500">
              Esta ação só funciona se ainda não existir admin. O elevamento de role é feito
              pela Cloud Function <code>bootstrapFirstAdmin</code>, não pelo cliente.
            </p>
          </div>
        )}

        <p className="mt-6 text-center text-xs text-gray-400">
          Este setup só aparece quando não há administradores no sistema.
        </p>
      </div>
    </div>
  );
};

export default SetupPage;
