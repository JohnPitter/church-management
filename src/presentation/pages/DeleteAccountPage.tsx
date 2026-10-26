// Presentation Page - Delete Account
// Public page: explains account deletion to visitors (and app-store reviewers) and lets a
// logged-in user permanently delete their own account. Data policy mirrors docs/exclusao-de-conta.md.

import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  EmailAuthProvider,
  GoogleAuthProvider,
  reauthenticateWithCredential,
  reauthenticateWithPopup
} from 'firebase/auth';
import toast from 'react-hot-toast';
import { auth } from '@/config/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSettings } from '../contexts/SettingsContext';
import { DEFAULT_CHURCH_CONTACT_EMAIL } from '@/config/contact';

export const DELETE_CONFIRMATION_WORD = 'EXCLUIR';

const DELETED_ITEMS = [
  'Seu login e seu perfil (nome, e-mail, telefone, biografia e preferências)',
  'Suas fotos de perfil',
  'Notificações recebidas e preferências de notificação',
  'Confirmações de presença em eventos e inscrições em projetos',
  'Seu progresso em devocionais e planos de leitura',
  'Curtidas, perfil e atividades no fórum e presença em transmissões'
];

const ANONYMIZED_ITEMS = [
  'Tópicos e respostas no fórum, inclusive a indicação de "última resposta" nos tópicos em que você respondeu por último',
  'Comentários no blog e nos devocionais',
  'Pedidos de oração enviados com o e-mail da conta'
];

const KEPT_ITEMS = [
  'Registros institucionais, financeiros, de assistência, pedagógicos e de frequência',
  'Cadastros de membro, voluntário e liderança mantidos pela secretaria: não têm vínculo com o login e não são alterados (peça à igreja para corrigi-los ou removê-los)',
  'Posts do blog e devocionais publicados pela equipe: o nome do autor permanece até a administração editá-los',
  'Cadastro de profissional de assistência: o vínculo com a conta é removido e o cadastro fica inativo',
  'Logs de auditoria exigidos por lei'
];

const PolicySummary: React.FC = () => (
  <div className="space-y-4">
    <section className="bg-red-50 border border-red-200 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-red-800 mb-2">O que é apagado</h2>
      <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
        {DELETED_ITEMS.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
    <section className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-amber-800 mb-2">O que é anonimizado</h2>
      <p className="text-sm text-amber-700 mb-2">
        O conteúdo continua visível para a comunidade, mas seu nome passa a aparecer como
        "Usuário removido" e seu e-mail, telefone e foto são removidos:
      </p>
      <ul className="list-disc list-inside space-y-1 text-sm text-amber-700">
        {ANONYMIZED_ITEMS.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
    <section className="bg-gray-50 border border-gray-200 rounded-lg p-4">
      <h2 className="text-sm font-semibold text-gray-800 mb-2">O que é mantido</h2>
      <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
        {KEPT_ITEMS.map(item => <li key={item}>{item}</li>)}
      </ul>
    </section>
  </div>
);

const PageFrame: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="min-h-screen bg-gray-50 py-10 px-4">
    <div className="max-w-2xl mx-auto">
      <Link to="/" className="text-sm text-gray-600 hover:text-gray-900">← Voltar ao início</Link>
      <div className="mt-4 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 sm:p-8">
        {children}
      </div>
      <p className="mt-6 text-center text-sm text-gray-500">
        Saiba mais na nossa{' '}
        <Link to="/privacidade" className="text-blue-600 hover:underline">Política de Privacidade</Link>.
      </p>
    </div>
  </div>
);

function getReauthErrorMessage(code?: string): string {
  switch (code) {
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
    case 'auth/invalid-login-credentials':
      return 'Senha incorreta. Verifique e tente novamente.';
    case 'auth/too-many-requests':
      return 'Muitas tentativas. Aguarde alguns minutos e tente novamente.';
    case 'auth/popup-closed-by-user':
    case 'auth/cancelled-popup-request':
      return 'Confirmação com o Google cancelada.';
    case 'auth/popup-blocked':
      return 'O navegador bloqueou a janela do Google. Permita pop-ups e tente novamente.';
    case 'auth/user-mismatch':
      return 'Entre com a mesma conta Google que você está usando no sistema.';
    case 'auth/network-request-failed':
      return 'Erro de conexão. Verifique sua internet.';
    default:
      return 'Não foi possível confirmar sua identidade. Tente novamente.';
  }
}

type Phase = 'idle' | 'deleting' | 'done';

export const DeleteAccountPage: React.FC = () => {
  const { currentUser, loading, deleteAccount } = useAuth();
  const navigate = useNavigate();
  const { settings } = useSettings();
  const contactEmail = settings?.churchEmail || DEFAULT_CHURCH_CONTACT_EMAIL;
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [phase, setPhase] = useState<Phase>('idle');
  const [error, setError] = useState('');
  const [isLastAdminError, setIsLastAdminError] = useState(false);

  // While deleting (or right after), keep showing progress even though currentUser becomes
  // null — avoids flashing the logged-out view before navigating to /conta-excluida.
  if (phase !== 'idle') {
    return (
      <PageFrame>
        <div className="text-center py-10" role="status">
          <div className="mx-auto mb-4 h-10 w-10 rounded-full border-4 border-red-200 border-t-red-600 animate-spin" />
          <p className="text-gray-700 font-medium">Excluindo sua conta...</p>
          <p className="text-sm text-gray-500 mt-1">Não feche esta página.</p>
        </div>
      </PageFrame>
    );
  }

  if (loading) {
    return (
      <PageFrame>
        <p className="text-center text-gray-600 py-10">Carregando...</p>
      </PageFrame>
    );
  }

  if (!currentUser) {
    return (
      <PageFrame>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Excluir minha conta</h1>
        <p className="text-gray-600 mb-6">
          Você pode excluir sua conta e seus dados pessoais a qualquer momento. Para sua segurança,
          é preciso entrar na conta e confirmar sua identidade antes da exclusão, que é permanente.
        </p>
        <PolicySummary />
        <button
          type="button"
          onClick={() => navigate('/login', { state: { from: '/excluir-conta' } })}
          className="mt-6 w-full bg-red-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
        >
          Entrar para excluir minha conta
        </button>
        <p className="mt-4 text-sm text-gray-500 text-center">
          Não consegue entrar? Fale com a administração:{' '}
          <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">{contactEmail}</a>.
        </p>
      </PageFrame>
    );
  }

  const providerIds = (auth.currentUser?.providerData || []).map(provider => provider.providerId);
  const usesPassword = providerIds.includes('password');
  const usesGoogleOnly = !usesPassword && providerIds.includes('google.com');
  const confirmationOk = confirmation === DELETE_CONFIRMATION_WORD;
  const canSubmit = confirmationOk && (usesGoogleOnly || password.length > 0);

  const handleDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setError('');
    setIsLastAdminError(false);

    const firebaseUser = auth.currentUser;
    if (!firebaseUser) {
      setError('Sua sessão expirou. Entre novamente para excluir a conta.');
      return;
    }

    setPhase('deleting');
    try {
      if (usesGoogleOnly) {
        await reauthenticateWithPopup(firebaseUser, new GoogleAuthProvider());
      } else {
        const credential = EmailAuthProvider.credential(firebaseUser.email || currentUser.email, password);
        await reauthenticateWithCredential(firebaseUser, credential);
      }
      // Force a fresh ID token so the server sees the new auth_time (it requires <= 5 min).
      await firebaseUser.getIdToken(true);
    } catch (reauthError: any) {
      setError(getReauthErrorMessage(reauthError?.code));
      setPhase('idle');
      return;
    }

    try {
      await deleteAccount();
      setPhase('done');
      toast.success('Sua conta foi excluída.');
      navigate('/conta-excluida', { replace: true });
    } catch (deleteError: any) {
      const reason = deleteError?.details?.reason;
      const lastAdmin = reason === 'last-admin'
        || (!reason && deleteError?.code === 'functions/failed-precondition');
      setIsLastAdminError(lastAdmin);
      if (reason === 'recent-login-required') {
        setPassword('');
        setError('Sua confirmação de identidade expirou. Confirme sua senha (ou sua conta Google) novamente e clique em excluir logo em seguida.');
      } else {
        setError(deleteError?.message || 'Não foi possível excluir sua conta. Tente novamente.');
      }
      setPhase('idle');
    }
  };

  return (
    <PageFrame>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Excluir minha conta</h1>
      <p className="text-gray-600 mb-6">
        Conta: <span className="font-medium text-gray-900">{currentUser.email}</span>
      </p>

      <div className="bg-red-600 text-white rounded-lg p-4 mb-6" role="alert">
        <p className="font-semibold">Esta ação é permanente e não pode ser desfeita.</p>
        <p className="text-sm text-red-100 mt-1">
          Depois de excluída, sua conta não poderá ser recuperada. Para voltar a usar o sistema
          será preciso criar uma nova conta.
        </p>
      </div>

      <PolicySummary />

      <form onSubmit={handleDelete} className="mt-6 space-y-4">
        {usesGoogleOnly ? (
          <p className="text-sm text-gray-600">
            Ao continuar, abriremos uma janela do Google para confirmar sua identidade.
          </p>
        ) : (
          <div>
            <label htmlFor="delete-account-password" className="block text-sm font-medium text-gray-700 mb-1">
              Confirme sua senha
            </label>
            <input
              id="delete-account-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-500"
            />
          </div>
        )}

        <div>
          <label htmlFor="delete-account-confirmation" className="block text-sm font-medium text-gray-700 mb-1">
            Digite <span className="font-mono font-bold">{DELETE_CONFIRMATION_WORD}</span> para confirmar
          </label>
          <input
            id="delete-account-confirmation"
            type="text"
            autoComplete="off"
            value={confirmation}
            onChange={e => setConfirmation(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-2 font-mono focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        {error && (
          <div
            className={`rounded-md p-4 text-sm ${isLastAdminError ? 'bg-amber-50 border border-amber-300 text-amber-800' : 'bg-red-50 border border-red-200 text-red-700'}`}
            role="alert"
            data-testid="delete-account-error"
          >
            {isLastAdminError && <p className="font-semibold mb-1">Não é possível excluir o último administrador</p>}
            <p>{error}</p>
            <p className="mt-2">
              Precisa de ajuda? Escreva para{' '}
              <a href={`mailto:${contactEmail}`} className="underline">{contactEmail}</a>.
            </p>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Link
            to="/profile"
            className="text-center px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
          >
            Cancelar
          </Link>
          <button
            type="submit"
            disabled={!canSubmit}
            className="px-5 py-2.5 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-700 disabled:bg-red-300 disabled:cursor-not-allowed"
          >
            Excluir minha conta permanentemente
          </button>
        </div>
      </form>
    </PageFrame>
  );
};

export default DeleteAccountPage;
