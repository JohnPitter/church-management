// Presentation Page - Admin Backup & Data
// System backup and data management interface

import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../hooks/usePermissions';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';
import { format } from 'date-fns';
import { BackupInfo, DatabaseStats, backupService } from '@modules/analytics/backup/application/services/BackupService';
import { loggingService } from '@modules/shared-kernel/logging/infrastructure/services/LoggingService';

export const AdminBackupPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { hasPermission, loading: permissionsLoading } = usePermissions();

  // Permission checks
  const canView = hasPermission(SystemModule.Backup, PermissionAction.View);
  const canCreate = hasPermission(SystemModule.Backup, PermissionAction.Create);
  const canManage = hasPermission(SystemModule.Backup, PermissionAction.Manage);
  const [backups, setBackups] = useState<BackupInfo[]>([]);
  const [databaseStats, setDatabaseStats] = useState<DatabaseStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [selectedBackupType, setSelectedBackupType] = useState<string>('full');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const backupTypes = [
    { value: 'full', label: 'Backup Completo', description: 'Todos os dados e arquivos' },
    { value: 'database', label: 'Base de Dados', description: 'Apenas dados do Firestore' },
    { value: 'files', label: 'Arquivos', description: 'Apenas arquivos de mídia' },
    { value: 'incremental', label: 'Incremental', description: 'Apenas alterações recentes' }
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      const [backupsData, statsData] = await Promise.all([
        backupService.getBackups(),
        backupService.getDatabaseStats()
      ]);
      setBackups(backupsData);
      setDatabaseStats(statsData);
    } catch (error) {
      console.error('Error loading backup data:', error);
      alert('Erro ao carregar dados de backup');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateBackup = async () => {
    if (!currentUser) return;

    setCreating(true);
    try {
      const backupType = selectedBackupType as 'full' | 'incremental' | 'database' | 'files';
      const description = backupTypes.find(t => t.value === backupType)?.description || '';

      await backupService.createBackup(backupType, description, currentUser.email);
      setShowCreateModal(false);

      await loggingService.logSystem('info', 'Backup created',
        `Type: ${backupType}, Description: ${description}`, currentUser as any);

      // Refresh the data to show the new backup
      setTimeout(() => {
        loadData();
      }, 1000);

      alert('Backup iniciado com sucesso!');
    } catch (error) {
      console.error('Error creating backup:', error);
      await loggingService.logSystem('error', 'Failed to create backup',
        `Type: ${selectedBackupType}, Error: ${error}`, currentUser as any);
      alert('Erro ao criar backup');
    } finally {
      setCreating(false);
    }
  };

  const handleDownloadBackup = async (backupId: string, backupName: string) => {
    try {
      setLoading(true);
      const blob = await backupService.downloadBackup(backupId);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${backupName.replace(/\s+/g, '_')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      await loggingService.logSystem('info', 'Backup downloaded',
        `ID: ${backupId}, Name: ${backupName}`, currentUser as any);
    } catch (error) {
      console.error('Error downloading backup:', error);
      await loggingService.logSystem('error', 'Failed to download backup',
        `ID: ${backupId}, Name: ${backupName}, Error: ${error}`, currentUser as any);
      alert('Erro ao baixar backup');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBackup = async (backupId: string, backupName: string) => {
    if (!window.confirm(`Tem certeza que deseja excluir o backup "${backupName}"?`)) {
      return;
    }

    try {
      await backupService.deleteBackup(backupId);
      loadData(); // Refresh the list

      await loggingService.logSystem('warning', 'Backup deleted',
        `ID: ${backupId}, Name: ${backupName}`, currentUser as any);

      alert('Backup excluído com sucesso');
    } catch (error) {
      console.error('Error deleting backup:', error);
      await loggingService.logSystem('error', 'Failed to delete backup',
        `ID: ${backupId}, Name: ${backupName}, Error: ${error}`, currentUser as any);
      alert('Erro ao excluir backup');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'failed': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'completed': return 'Concluído';
      case 'in_progress': return 'Em Progresso';
      case 'failed': return 'Falhou';
      default: return status;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'full': return '💾';
      case 'database': return '🗄️';
      case 'files': return '📁';
      case 'incremental': return '📊';
      default: return '💾';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'full': return 'bg-blue-100 text-blue-800';
      case 'database': return 'bg-purple-100 text-purple-800';
      case 'files': return 'bg-orange-100 text-orange-800';
      case 'incremental': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };


  const handleRestoreBackup = async (backupId: string) => {
    if (!window.confirm('ATENÇÃO: Esta ação irá substituir todos os dados atuais. Tem certeza que deseja continuar?')) {
      return;
    }

    // In a real implementation, this would restore data from the backup
    alert('Funcionalidade de restauração em desenvolvimento.\n\nEm uma implementação completa, esta função:\n- Validaria o backup selecionado\n- Faria backup dos dados atuais\n- Restauraria os dados do backup escolhido\n- Atualizaria todas as coleções do Firestore');
  };

  const handleExportData = async (format: 'json' | 'csv') => {
    if (!databaseStats) {
      alert('Aguarde o carregamento das estatísticas do banco de dados.');
      return;
    }

    setLoading(true);
    try {
      let blob: Blob;
      let filename: string;
      const timestamp = new Date().toISOString().split('T')[0];
      
      if (format === 'json') {
        // Export as JSON
        const exportData = {
          exportedAt: new Date().toISOString(),
          databaseStats,
          backups: backups.map(backup => ({
            ...backup,
            createdAt: backup.createdAt.toISOString()
          }))
        };
        
        blob = new Blob([JSON.stringify(exportData, null, 2)], { 
          type: 'application/json' 
        });
        filename = `backup-export-${timestamp}.json`;
      } else {
        // Export as CSV
        let csvContent = 'Tipo de Dados,Nome,Quantidade,Tamanho,Data\n';
        
        // Add database statistics
        csvContent += `Estatísticas Gerais,Total de Registros,${databaseStats.totalRecords},"${databaseStats.totalSize}","${databaseStats.lastCalculated.toLocaleDateString('pt-BR')}"\n`;
        
        // Add collections data
        databaseStats.collections.forEach(collection => {
          csvContent += `Coleção,"${collection.name}",${collection.records},"${collection.size}","${collection.lastUpdated?.toLocaleDateString('pt-BR') || 'N/A'}"\n`;
        });
        
        // Add backups data
        backups.forEach(backup => {
          csvContent += `Backup,"${backup.name}","${backup.status}","${backup.size}","${backup.createdAt.toLocaleDateString('pt-BR')}"\n`;
        });
        
        blob = new Blob([csvContent], { 
          type: 'text/csv;charset=utf-8;' 
        });
        filename = `backup-export-${timestamp}.csv`;
      }
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      await loggingService.logSystem('info', 'Data exported',
        `Format: ${format.toUpperCase()}`, currentUser as any);

      alert(`Dados exportados em ${format.toUpperCase()} com sucesso!`);
    } catch (error) {
      console.error('Error exporting data:', error);
      await loggingService.logSystem('error', 'Failed to export data',
        `Format: ${format.toUpperCase()}, Error: ${error}`, currentUser as any);
      alert('Erro ao exportar dados.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking permissions
  if (permissionsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permissões...</p>
        </div>
      </div>
    );
  }

  // Check view permission
  if (!canView) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
          <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Backup & Dados</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gerencie backups e dados do sistema
              </p>
            </div>
            {canCreate && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                ➕ Novo Backup
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Database Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Estatísticas da Base de Dados</h3>
            
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando estatísticas...</p>
              </div>
            )}

            {!loading && !databaseStats && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-gray-500">Erro ao carregar estatísticas</p>
                <button 
                  onClick={loadData}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  🔄 Tentar Novamente
                </button>
              </div>
            )}

            {!loading && databaseStats && (
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Total de Registros</span>
                  <span className="text-lg font-bold text-indigo-600">{databaseStats.totalRecords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Tamanho Total</span>
                  <span className="text-lg font-bold text-indigo-600">{databaseStats.totalSize}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium text-gray-900">Última Atualização</span>
                  <span className="text-sm text-gray-600">{format(databaseStats.lastCalculated, 'dd/MM/yyyy HH:mm')}</span>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Ações Rápidas</h3>
            <div className="space-y-3">
              {canManage ? (
                <>
                  <button
                    onClick={() => handleExportData('json')}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    📄 Exportar Dados (JSON)
                  </button>
                  <button
                    onClick={() => handleExportData('csv')}
                    disabled={loading}
                    className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    📊 Exportar Dados (CSV)
                  </button>
                  <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                    ⚙️ Configurar Backup Automático
                  </button>
                </>
              ) : (
                <p className="text-sm text-gray-500 text-center py-4">
                  Você não tem permissão para exportar dados.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Collections Breakdown */}
        <div className="bg-white shadow rounded-lg mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Detalhamento por Coleção</h3>
          </div>
          <div className="p-6">
            {loading && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Carregando coleções...</p>
              </div>
            )}

            {!loading && !databaseStats && (
              <div className="text-center py-8">
                <div className="text-4xl mb-4">⚠️</div>
                <p className="text-gray-500">Erro ao carregar coleções</p>
                <button 
                  onClick={loadData}
                  className="mt-4 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  🔄 Tentar Novamente
                </button>
              </div>
            )}

            {!loading && databaseStats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {databaseStats.collections.map((collection, index) => (
                  <div key={index} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="text-sm font-medium text-gray-900">{collection.name}</h4>
                      <span className="text-xs text-gray-500">{collection.size}</span>
                    </div>
                    <p className="text-2xl font-bold text-indigo-600">{collection.records.toLocaleString()}</p>
                    <p className="text-xs text-gray-500">registros</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Backups List */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Histórico de Backups</h3>
          </div>
          
          {loading && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando histórico de backups...</p>
            </div>
          )}

          {!loading && backups.length === 0 && (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">Nenhum Backup Encontrado</h4>
              <p className="text-sm text-gray-500 mb-4">
                Crie seu primeiro backup para começar a proteger seus dados.
              </p>
              {canCreate && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  ➕ Criar Primeiro Backup
                </button>
              )}
            </div>
          )}

          {!loading && backups.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Backup
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tamanho
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Data
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {backups.map((backup) => (
                    <tr key={backup.id}>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <span className="text-2xl mr-3">{getTypeIcon(backup.type)}</span>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{backup.name}</div>
                            <div className="text-sm text-gray-500">{backup.description}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(backup.type)}`}>
                          {backupTypes.find(t => t.value === backup.type)?.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(backup.status)}`}>
                          {getStatusText(backup.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {backup.size}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(backup.createdAt, 'dd/MM/yyyy HH:mm')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          {backup.status === 'completed' && (
                            <>
                              {canManage && (
                                <button
                                  onClick={() => handleDownloadBackup(backup.id, backup.name)}
                                  disabled={loading}
                                  className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                                >
                                  Download
                                </button>
                              )}
                              {canManage && (
                                <button
                                  onClick={() => handleRestoreBackup(backup.id)}
                                  disabled={loading}
                                  className="text-green-600 hover:text-green-900 disabled:opacity-50"
                                >
                                  Restaurar
                                </button>
                              )}
                            </>
                          )}
                          {canManage && (
                            <button
                              onClick={() => handleDeleteBackup(backup.id, backup.name)}
                              disabled={loading || backup.status === 'in_progress'}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Excluir
                            </button>
                          )}
                          {!canManage && (
                            <span className="text-gray-400 text-xs">Sem permissão</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Create Backup Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 text-center mb-4">
                Criar Novo Backup
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Backup
                  </label>
                  <select
                    value={selectedBackupType}
                    onChange={(e) => setSelectedBackupType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    {backupTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label} - {type.description}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex justify-center space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleCreateBackup}
                  disabled={creating}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
                >
                  {creating ? 'Criando...' : 'Criar Backup'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};