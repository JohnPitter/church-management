// Presentation Page - Account Deleted
// Public confirmation shown after a user deletes their own account.

import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';
import { DEFAULT_CHURCH_CONTACT_EMAIL } from '@/config/contact';

export const AccountDeletedPage: React.FC = () => {
  const { settings } = useSettings();
  const contactEmail = settings?.churchEmail || DEFAULT_CHURCH_CONTACT_EMAIL;
  return (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl" aria-hidden="true">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Conta excluída</h1>
      <p className="text-gray-600 mb-2">
        Sua conta e seus dados pessoais foram excluídos. Seus tópicos, respostas e comentários na
        comunidade e seus pedidos de oração agora aparecem como "Usuário removido".
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Registros institucionais exigidos por lei foram mantidos. Cadastros feitos pela secretaria (membros,
        voluntários, liderança) e posts do blog ou devocionais publicados pela equipe podem manter seu nome
        até a administração removê-lo — fale com a igreja se quiser essa remoção:{' '}
        <a href={`mailto:${contactEmail}`} className="text-blue-600 hover:underline">{contactEmail}</a>.
      </p>
      <div className="flex flex-col gap-3">
        <Link
          to="/"
          className="bg-blue-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          Voltar ao início
        </Link>
        <Link to="/privacidade" className="text-sm text-gray-600 hover:text-gray-900">
          Política de Privacidade
        </Link>
      </div>
    </div>
  </div>
  );
};

export default AccountDeletedPage;
