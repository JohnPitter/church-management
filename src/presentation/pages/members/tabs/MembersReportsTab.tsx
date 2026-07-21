import React, { useMemo } from 'react';
import {
  Member,
  MemberStatus,
  MemberType,
  MemberEntity,
} from '@/domain/entities/Member';

interface MembersReportsTabProps {
  members: Member[];
  calculateAge: (birthDate: Date) => number;
  canManage: boolean;
  getStatusColor: (status: MemberStatus) => string;
  getStatusLabel: (status: MemberStatus) => string;
  exportSignatureListToPDF: () => void;
  exportSignatureListToWord: () => void;
  exportToExcel: () => void;
  exportToPDF: () => void;
  exportToCSV: () => void;
}

export const MembersReportsTab: React.FC<MembersReportsTabProps> = ({
  members,
  calculateAge,
  canManage,
  getStatusColor,
  getStatusLabel,
  exportSignatureListToPDF,
  exportSignatureListToWord,
  exportToExcel,
  exportToPDF,
  exportToCSV,
}) => {
  const total = members.length || 1;

  const countByAge = (pred: (age: number) => boolean) =>
    members.filter((m) => pred(calculateAge(m.birthDate))).length;

  const under18 = countByAge((a) => a < 18);
  const a18to35 = countByAge((a) => a >= 18 && a <= 35);
  const a36to60 = countByAge((a) => a >= 36 && a <= 60);
  const over60 = countByAge((a) => a > 60);

  const sortedMinistries = useMemo(() => {
    const ministryCounts: Record<string, number> = {};
    members.forEach((member) => {
      member.ministries?.forEach((ministry) => {
        ministryCounts[ministry] = (ministryCounts[ministry] || 0) + 1;
      });
    });
    return Object.entries(ministryCounts).sort((a, b) => b[1] - a[1]);
  }, [members]);

  const recentMembers = useMemo(
    () =>
      [...members]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [members]
  );

  return (
    <div className="space-y-6">
      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="mr-2">📊</span>
          Estatísticas Gerais
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600">Total de Membros</p>
            <p className="text-3xl font-bold text-gray-900">{members.length}</p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600">Membros Ativos</p>
            <p className="text-3xl font-bold text-gray-900">
              {members.filter((m) => m.status === MemberStatus.Active).length}
            </p>
          </div>
          <div className="border-l-4 border-yellow-500 pl-4">
            <p className="text-sm text-gray-600">Membros Inativos</p>
            <p className="text-3xl font-bold text-gray-900">
              {members.filter((m) => m.status === MemberStatus.Inactive).length}
            </p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600">Transferidos</p>
            <p className="text-3xl font-bold text-gray-900">
              {members.filter((m) => m.status === MemberStatus.Transferred).length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
          <span className="mr-2">👤</span>
          Membros e Congregados
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-blue-500 pl-4">
            <p className="text-sm text-gray-600">Membros Oficiais</p>
            <p className="text-3xl font-bold text-blue-700">
              {members.filter((m) => m.memberType === MemberType.Member).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Podem assinar atas e votar em assembleias
            </p>
          </div>
          <div className="border-l-4 border-purple-500 pl-4">
            <p className="text-sm text-gray-600">Congregados</p>
            <p className="text-3xl font-bold text-purple-700">
              {members.filter((m) => m.memberType === MemberType.Congregant).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Não podem assinar documentos oficiais
            </p>
          </div>
          <div className="border-l-4 border-green-500 pl-4">
            <p className="text-sm text-gray-600">Membros Aptos a Assinar</p>
            <p className="text-3xl font-bold text-green-700">
              {members.filter((m) => MemberEntity.canSignDocuments(m)).length}
            </p>
            <p className="text-xs text-gray-500 mt-2">
              Membros ativos, maiores de idade e oficiais
            </p>
          </div>
        </div>

        <div className="mt-6 bg-blue-50 border-l-4 border-blue-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <span className="text-xl text-blue-400">ℹ️</span>
            </div>
            <div className="ml-3">
              <p className="text-sm text-blue-700">
                <strong>Nota:</strong> Congregados aparecem em todos os relatórios e estatísticas,
                mas são excluídos automaticamente das listas de assinatura de atas e votação em
                assembleias.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">👥</span>
          Distribuição por Faixa Etária
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm font-medium text-blue-900">0-17 anos</p>
            <p className="text-2xl font-bold text-blue-700">{under18}</p>
            <p className="text-xs text-blue-600">{((under18 / total) * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm font-medium text-green-900">18-35 anos</p>
            <p className="text-2xl font-bold text-green-700">{a18to35}</p>
            <p className="text-xs text-green-600">{((a18to35 / total) * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4">
            <p className="text-sm font-medium text-yellow-900">36-60 anos</p>
            <p className="text-2xl font-bold text-yellow-700">{a36to60}</p>
            <p className="text-xs text-yellow-600">{((a36to60 / total) * 100).toFixed(1)}%</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-900">60+ anos</p>
            <p className="text-2xl font-bold text-purple-700">{over60}</p>
            <p className="text-xs text-purple-600">{((over60 / total) * 100).toFixed(1)}%</p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">💑</span>
          Estado Civil
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Solteiros</p>
            <p className="text-2xl font-bold text-gray-900">
              {members.filter((m) => m.maritalStatus === 'single').length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Casados</p>
            <p className="text-2xl font-bold text-gray-900">
              {members.filter((m) => m.maritalStatus === 'married').length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Divorciados</p>
            <p className="text-2xl font-bold text-gray-900">
              {members.filter((m) => m.maritalStatus === 'divorced').length}
            </p>
          </div>
          <div className="border rounded-lg p-4">
            <p className="text-sm text-gray-600">Viúvos</p>
            <p className="text-2xl font-bold text-gray-900">
              {members.filter((m) => m.maritalStatus === 'widowed').length}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">📋</span>
          Distribuição por Tipo e Status
        </h3>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border-2 border-blue-200 rounded-lg p-5 bg-blue-50">
            <h4 className="text-md font-semibold text-blue-900 mb-4 flex items-center">
              <span className="mr-2">👥</span>
              Membros Oficiais
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white rounded p-3">
                <span className="text-sm text-gray-700">Ativos</span>
                <span className="text-lg font-bold text-green-600">
                  {
                    members.filter(
                      (m) => m.memberType === MemberType.Member && m.status === MemberStatus.Active
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center bg-white rounded p-3">
                <span className="text-sm text-gray-700">Inativos</span>
                <span className="text-lg font-bold text-yellow-600">
                  {
                    members.filter(
                      (m) =>
                        m.memberType === MemberType.Member && m.status === MemberStatus.Inactive
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center bg-white rounded p-3">
                <span className="text-sm text-gray-700">Transferidos</span>
                <span className="text-lg font-bold text-purple-600">
                  {
                    members.filter(
                      (m) =>
                        m.memberType === MemberType.Member &&
                        m.status === MemberStatus.Transferred
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center bg-white rounded p-3">
                <span className="text-sm text-gray-700">Disciplinados</span>
                <span className="text-lg font-bold text-red-600">
                  {
                    members.filter(
                      (m) =>
                        m.memberType === MemberType.Member &&
                        m.status === MemberStatus.Disciplined
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center bg-blue-100 rounded p-3 border-t-2 border-blue-300">
                <span className="text-sm font-semibold text-blue-900">Total</span>
                <span className="text-xl font-bold text-blue-700">
                  {members.filter((m) => m.memberType === MemberType.Member).length}
                </span>
              </div>
            </div>
          </div>

          <div className="border-2 border-purple-200 rounded-lg p-5 bg-purple-50">
            <h4 className="text-md font-semibold text-purple-900 mb-4 flex items-center">
              <span className="mr-2">👤</span>
              Congregados
            </h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center bg-white rounded p-3">
                <span className="text-sm text-gray-700">Ativos</span>
                <span className="text-lg font-bold text-green-600">
                  {
                    members.filter(
                      (m) =>
                        m.memberType === MemberType.Congregant && m.status === MemberStatus.Active
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center bg-white rounded p-3">
                <span className="text-sm text-gray-700">Inativos</span>
                <span className="text-lg font-bold text-yellow-600">
                  {
                    members.filter(
                      (m) =>
                        m.memberType === MemberType.Congregant &&
                        m.status === MemberStatus.Inactive
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center bg-white rounded p-3">
                <span className="text-sm text-gray-700">Transferidos</span>
                <span className="text-lg font-bold text-purple-600">
                  {
                    members.filter(
                      (m) =>
                        m.memberType === MemberType.Congregant &&
                        m.status === MemberStatus.Transferred
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center bg-white rounded p-3">
                <span className="text-sm text-gray-700">Disciplinados</span>
                <span className="text-lg font-bold text-red-600">
                  {
                    members.filter(
                      (m) =>
                        m.memberType === MemberType.Congregant &&
                        m.status === MemberStatus.Disciplined
                    ).length
                  }
                </span>
              </div>
              <div className="flex justify-between items-center bg-purple-100 rounded p-3 border-t-2 border-purple-300">
                <span className="text-sm font-semibold text-purple-900">Total</span>
                <span className="text-xl font-bold text-purple-700">
                  {members.filter((m) => m.memberType === MemberType.Congregant).length}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">⛪</span>
          Estatísticas Eclesiásticas
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="border-l-4 border-indigo-500 pl-4">
            <p className="text-sm text-gray-600">Membros Batizados</p>
            <p className="text-3xl font-bold text-gray-900">
              {members.filter((m) => m.baptismDate).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {((members.filter((m) => m.baptismDate).length / total) * 100).toFixed(1)}% do total
            </p>
          </div>
          <div className="border-l-4 border-pink-500 pl-4">
            <p className="text-sm text-gray-600">Com Data de Conversão</p>
            <p className="text-3xl font-bold text-gray-900">
              {members.filter((m) => m.conversionDate).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {((members.filter((m) => m.conversionDate).length / total) * 100).toFixed(1)}% do
              total
            </p>
          </div>
          <div className="border-l-4 border-teal-500 pl-4">
            <p className="text-sm text-gray-600">Em Ministérios</p>
            <p className="text-3xl font-bold text-gray-900">
              {members.filter((m) => m.ministries && m.ministries.length > 0).length}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {(
                (members.filter((m) => m.ministries && m.ministries.length > 0).length / total) *
                100
              ).toFixed(1)}
              % do total
            </p>
          </div>
        </div>
      </div>

      {sortedMinistries.length > 0 && (
        <div className="bg-white shadow-sm rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <span className="mr-2">🎯</span>
            Distribuição por Ministérios
          </h3>

          <div className="space-y-3">
            {sortedMinistries.map(([ministry, count]) => (
              <div key={ministry} className="flex items-center">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{ministry}</span>
                    <span className="text-sm text-gray-600">{count} membros</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-indigo-600 h-2 rounded-full"
                      style={{ width: `${(count / total) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="mr-2">🆕</span>
          Membros Cadastrados Recentemente
        </h3>

        <div className="space-y-3">
          {recentMembers.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50"
            >
              <div>
                <p className="font-medium text-gray-900">{member.name}</p>
                <p className="text-sm text-gray-600">{member.email}</p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">
                  {new Date(member.createdAt).toLocaleDateString('pt-BR')}
                </p>
                <span
                  className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(member.status)}`}
                >
                  {getStatusLabel(member.status)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <span className="mr-2">✍️</span>
          Listas de Assinatura
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Gere listas com espaço para assinatura dos membros, ideal para presenças, atas e
          documentos oficiais
        </p>

        {canManage && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={exportSignatureListToPDF}
              className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 shadow-md hover:shadow-lg transition-all"
            >
              📄 <span className="font-medium ml-2">Lista de Assinatura em PDF</span>
            </button>
            <button
              onClick={exportSignatureListToWord}
              className="flex items-center justify-center px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg hover:from-blue-600 hover:to-blue-700 shadow-md hover:shadow-lg transition-all"
            >
              📝 <span className="font-medium ml-2">Lista de Assinatura em Word</span>
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow-sm rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-center">
          <span className="mr-2">📥</span>
          Exportar Dados Completos
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Exporte todos os dados dos membros em diferentes formatos para análise e backup
        </p>

        {canManage && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button
              onClick={exportToExcel}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <span className="text-xl text-green-600 mr-2">📊</span>
              Exportar Excel
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <span className="text-xl text-red-600 mr-2">📄</span>
              Exportar PDF
            </button>
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <span className="text-xl text-blue-600 mr-2">📋</span>
              Exportar CSV
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
