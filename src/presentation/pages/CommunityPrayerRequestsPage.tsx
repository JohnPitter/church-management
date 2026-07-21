// Presentation Page - Community Prayer Requests
// Membros veem pedidos dos últimos 7 dias e marcam "orei" (curtida)

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { PrayerRequestService } from '@modules/church-management/prayer-requests/application/services/PrayerRequestService';
import {
  PrayerRequest,
  PrayerRequestStatus
} from '@modules/church-management/prayer-requests/domain/entities/PrayerRequest';

const DAYS_WINDOW = 7;

const statusLabel: Record<PrayerRequestStatus, string> = {
  [PrayerRequestStatus.Pending]: 'Novo',
  [PrayerRequestStatus.Approved]: 'Em oração',
  [PrayerRequestStatus.Praying]: 'Em oração',
  [PrayerRequestStatus.Answered]: 'Respondido',
  [PrayerRequestStatus.Rejected]: 'Rejeitado'
};

const statusClass: Record<PrayerRequestStatus, string> = {
  [PrayerRequestStatus.Pending]: 'bg-amber-100 text-amber-800',
  [PrayerRequestStatus.Approved]: 'bg-sky-100 text-sky-800',
  [PrayerRequestStatus.Praying]: 'bg-blue-100 text-blue-800',
  [PrayerRequestStatus.Answered]: 'bg-purple-100 text-purple-800',
  [PrayerRequestStatus.Rejected]: 'bg-red-100 text-red-800'
};

export const CommunityPrayerRequestsPage: React.FC = () => {
  const { currentUser } = useAuth();
  const prayerService = useMemo(() => new PrayerRequestService(), []);
  const [requests, setRequests] = useState<PrayerRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const userKey = currentUser?.email || currentUser?.id || '';

  const loadRequests = useCallback(async () => {
    try {
      setLoading(true);
      const data = await prayerService.getCommunityPrayerRequests(DAYS_WINDOW);
      setRequests(data);
    } catch (error) {
      console.error('Error loading community prayer requests:', error);
      toast.error('Não foi possível carregar os pedidos de oração');
    } finally {
      setLoading(false);
    }
  }, [prayerService]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleTogglePray = async (request: PrayerRequest) => {
    if (!userKey) {
      toast.error('Faça login para registrar sua oração');
      return;
    }

    const already = (request.prayedBy || []).includes(userKey);
    // Otimista
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== request.id) return r;
        const prayedBy = already
          ? (r.prayedBy || []).filter((e) => e !== userKey)
          : [...(r.prayedBy || []), userKey];
        return { ...r, prayedBy };
      })
    );

    try {
      setProcessingId(request.id);
      const nowPraying = await prayerService.togglePrayedBy(request.id, userKey);
      toast.success(nowPraying ? 'Você está orando por este pedido 🙏' : 'Registro de oração removido');
    } catch (error) {
      console.error('Error toggling prayer:', error);
      toast.error('Não foi possível registrar a oração');
      // Reverte otimista
      await loadRequests();
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow">
        <div className="max-w-3xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Pedidos de Oração</h1>
              <p className="mt-1 text-sm text-gray-600">
                Pedidos dos últimos {DAYS_WINDOW} dias. Marque que você orou — como uma curtida de intercessão.
              </p>
            </div>
            <Link
              to="/prayer"
              className="inline-flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              Enviar pedido
            </Link>
          </div>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Carregando pedidos...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <div className="text-4xl mb-3">🙏</div>
            <h2 className="text-lg font-medium text-gray-900">Nenhum pedido recente</h2>
            <p className="mt-2 text-sm text-gray-500">
              Ainda não há pedidos de oração nos últimos {DAYS_WINDOW} dias.
            </p>
            <Link
              to="/prayer"
              className="mt-4 inline-flex text-indigo-600 hover:text-indigo-800 text-sm font-medium"
            >
              Seja o primeiro a enviar um pedido
            </Link>
          </div>
        ) : (
          <ul className="space-y-4">
            {requests.map((request) => {
              const prayedBy = request.prayedBy || [];
              const iPrayed = !!userKey && prayedBy.includes(userKey);
              const count = prayedBy.length;
              const displayName = request.isAnonymous ? 'Anônimo' : request.name || 'Irmão(ã)';

              return (
                <li
                  key={request.id}
                  className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                    request.isUrgent ? 'border-red-200 ring-1 ring-red-100' : 'border-gray-100'
                  }`}
                >
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h2 className="text-base font-semibold text-gray-900 truncate">
                            {displayName}
                          </h2>
                          {request.isUrgent && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                              Urgente
                            </span>
                          )}
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              statusClass[request.status] || 'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {statusLabel[request.status] || request.status}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-gray-500">
                          {format(new Date(request.createdAt), "dd/MM/yyyy 'às' HH:mm", {
                            locale: ptBR
                          })}
                          {' · '}
                          {formatDistanceToNow(new Date(request.createdAt), {
                            addSuffix: true,
                            locale: ptBR
                          })}
                        </p>
                      </div>
                    </div>

                    <p className="mt-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {request.request}
                    </p>

                    <div className="mt-5 flex items-center justify-between gap-3 border-t border-gray-100 pt-4">
                      <p className="text-sm text-gray-600">
                        {count === 0 && 'Ninguém orou ainda — seja o primeiro'}
                        {count === 1 && '1 pessoa está orando'}
                        {count > 1 && `${count} pessoas estão orando`}
                      </p>

                      <button
                        type="button"
                        disabled={processingId === request.id || !userKey}
                        onClick={() => handleTogglePray(request)}
                        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-colors disabled:opacity-50 ${
                          iPrayed
                            ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                            : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                        }`}
                        title={iPrayed ? 'Remover seu “orei”' : 'Registrar que você orou'}
                      >
                        <span aria-hidden="true">🙏</span>
                        {iPrayed ? 'Orei' : 'Orar'}
                        {count > 0 && (
                          <span
                            className={`min-w-[1.25rem] text-center text-xs ${
                              iPrayed ? 'text-indigo-100' : 'text-indigo-500'
                            }`}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </div>
  );
};

export default CommunityPrayerRequestsPage;
