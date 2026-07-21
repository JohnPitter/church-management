// Presentation Page - Leadership (Public View)
// Displays church leaders and pastoral team

import React, { useState, useEffect } from 'react';
import { Leader, LEADER_ROLE_LABELS } from '@modules/content-management/leadership/domain/entities/Leader';
import { LeadershipService } from '@modules/content-management/leadership/application/services/LeadershipService';

export const LeadershipPage: React.FC = () => {
  const [leaders, setLeaders] = useState<Leader[]>([]);
  const [loading, setLoading] = useState(true);

  const leadershipService = new LeadershipService();

  useEffect(() => {
    loadLeaders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadLeaders = async () => {
    try {
      setLoading(true);
      const data = await leadershipService.getActiveLeaders();
      setLeaders(data);
    } catch (error) {
      console.error('Error loading leaders:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header — mesmo padrão de Eventos / Fórum / Projetos */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Liderança</h1>
              <p className="mt-1 text-sm text-gray-600">
                Conheça os líderes e pastores que servem nossa comunidade
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto" />
            <p className="mt-3 text-sm text-gray-500">Carregando liderança...</p>
          </div>
        ) : leaders.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-10 text-center">
            <div className="text-4xl mb-3">👥</div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum líder cadastrado</h3>
            <p className="text-sm text-gray-500">Em breve você conhecerá nossa equipe pastoral.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {leaders.map((leader) => (
              <div
                key={leader.id}
                className="bg-white rounded-lg shadow overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="h-56 bg-gray-100 flex items-center justify-center overflow-hidden">
                  {leader.foto ? (
                    <img
                      src={leader.foto}
                      alt={leader.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-3xl font-semibold">
                      {(leader.nome || '?').charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    {leader.nome}
                  </h3>
                  <p className="text-indigo-600 text-sm font-medium mb-3">
                    {leader.cargoPersonalizado || LEADER_ROLE_LABELS[leader.cargo]}
                  </p>

                  {leader.ministerio && (
                    <p className="text-gray-600 text-sm mb-2">
                      <span className="font-medium text-gray-700">Ministério:</span>{' '}
                      {leader.ministerio}
                    </p>
                  )}

                  {leader.bio && (
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {leader.bio}
                    </p>
                  )}

                  {(leader.email || leader.telefone) && (
                    <div className="mt-4 pt-4 border-t border-gray-100 flex gap-4">
                      {leader.email && (
                        <a
                          href={`mailto:${leader.email}`}
                          className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                          title="Enviar email"
                        >
                          📧 Contato
                        </a>
                      )}
                      {leader.telefone && (
                        <a
                          href={`tel:${leader.telefone}`}
                          className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
                          title="Ligar"
                        >
                          📞 Telefone
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadershipPage;
