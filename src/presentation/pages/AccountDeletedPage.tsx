// Presentation Page - Account Deleted
// Public confirmation shown after a user deletes their own account.

import React from 'react';
import { Link } from 'react-router-dom';

export const AccountDeletedPage: React.FC = () => (
  <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
    <div className="max-w-md w-full bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl" aria-hidden="true">
        ✓
      </div>
      <h1 className="text-2xl font-bold text-gray-900 mb-3">Conta excluída</h1>
      <p className="text-gray-600 mb-2">
        Sua conta e seus dados pessoais foram excluídos. Conteúdos que você publicou na comunidade
        agora aparecem como "Usuário removido".
      </p>
      <p className="text-sm text-gray-500 mb-8">
        Registros institucionais exigidos por lei foram mantidos, conforme a nossa política de privacidade.
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

export default AccountDeletedPage;
