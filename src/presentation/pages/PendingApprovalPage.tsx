// Presentation Page - Pending Approval Page
// Page shown to users who are waiting for admin approval

import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export const PendingApprovalPage: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 text-6xl">⏳</div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Aguardando Aprovação
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Sua conta foi criada com sucesso!
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="text-center">
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Olá, {currentUser?.displayName}!
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                Sua conta está aguardando aprovação por um administrador. 
                Você receberá acesso completo ao sistema assim que sua conta for aprovada.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-blue-400 text-xl">ℹ️</span>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">
                      O que acontece agora?
                    </h3>
                    <div className="mt-2 text-sm text-blue-700">
                      <ul className="list-disc list-inside space-y-1">
                        <li>Um administrador revisará sua solicitação</li>
                        <li>Você será notificado quando sua conta for aprovada</li>
                        <li>Após a aprovação, você terá acesso completo ao sistema</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="text-sm text-gray-500">
                <p><strong>Email:</strong> {currentUser?.email}</p>
                <p><strong>Status:</strong> 
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 ml-2">
                    Aguardando Aprovação
                  </span>
                </p>
              </div>

              <div className="border-t border-gray-200 pt-4">
                <button
                  onClick={handleLogout}
                  className="w-full flex justify-center py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Sair da Conta
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">
            Precisa de ajuda? Entre em contato com os administradores do sistema.
          </p>
        </div>
      </div>
    </div>
  );
};