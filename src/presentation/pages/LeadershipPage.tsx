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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando liderança...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            👥 Nossa Liderança
          </h1>
          <p className="text-xl text-indigo-100 max-w-3xl mx-auto">
            Conheça os líderes e pastores que servem nossa comunidade com amor e dedicação
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        {leaders.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-6xl mb-4">👥</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum líder cadastrado</h3>
            <p className="text-gray-500">Em breve você conhecerá nossa equipe pastoral.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {leaders.map((leader) => (
              <div
                key={leader.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300"
              >
                {/* Photo */}
                <div className="h-64 bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                  {leader.foto ? (
                    <img
                      src={leader.foto}
                      alt={leader.nome}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-8xl text-white/50">👤</div>
                  )}
                </div>

                {/* Info */}
                <div className="p-6">
                  <h3 className="text-xl font-bold text-gray-900 mb-1">
                    {leader.nome}
                  </h3>
                  <p className="text-indigo-600 font-medium mb-3">
                    {leader.cargoPersonalizado || LEADER_ROLE_LABELS[leader.cargo]}
                  </p>

                  {leader.ministerio && (
                    <p className="text-gray-600 text-sm mb-3">
                      <span className="font-medium">Ministério:</span> {leader.ministerio}
                    </p>
                  )}

                  {leader.bio && (
                    <p className="text-gray-600 text-sm line-clamp-3">
                      {leader.bio}
                    </p>
                  )}

                  {/* Contact */}
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                    {leader.email && (
                      <a
                        href={`mailto:${leader.email}`}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Enviar email"
                      >
                        <span className="text-xl">📧</span>
                      </a>
                    )}
                    {leader.telefone && (
                      <a
                        href={`tel:${leader.telefone}`}
                        className="text-gray-400 hover:text-indigo-600 transition-colors"
                        title="Ligar"
                      >
                        <span className="text-xl">📞</span>
                      </a>
                    )}
                  </div>
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
