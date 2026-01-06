import React, { useState } from 'react';
import { DataMigrationService } from '@modules/shared-kernel/migration/application/services/DataMigrationService';
import { useSettings } from '../contexts/SettingsContext';
import {
  HiCloudArrowUp,
  HiCheckCircle,
  HiXCircle,
  HiArrowPath,
  HiExclamationTriangle,
  HiDocumentText
} from 'react-icons/hi2';

interface MigrationProgress {
  collection: string;
  total: number;
  processed: number;
  errors: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessages?: string[];
}

const AdminDataMigrationPage: React.FC = () => {
  const { settings } = useSettings();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isMigrating, setIsMigrating] = useState(false);
  const [validationResult, setValidationResult] = useState<{ valid: boolean; errors: string[] } | null>(null);
  const [migrationProgress, setMigrationProgress] = useState<MigrationProgress[]>([]);
  const [migrationResult, setMigrationResult] = useState<any | null>(null);
  const [previewData, setPreviewData] = useState<any | null>(null);

  const migrationService = DataMigrationService.getInstance();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setValidationResult(null);
    setMigrationResult(null);
    setMigrationProgress([]);
    setPreviewData(null);

    // Validar arquivo
    setIsValidating(true);
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      const validation = migrationService.validateOldData(data);
      setValidationResult(validation);

      // Criar preview dos dados
      if (validation.valid) {
        const preview: any = {};

        if (data.assistidos) {
          preview.assistidos = Object.keys(data.assistidos).length;
        }
        if (data.membros) {
          preview.membros = Object.keys(data.membros).length;
        }
        if (data.eventos) {
          preview.eventos = Object.keys(data.eventos).length;
        }
        if (data.transacoes) {
          preview.transacoes = Object.keys(data.transacoes).length;
        }

        setPreviewData(preview);
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: [`Erro ao ler arquivo: ${error}`],
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleStartMigration = async () => {
    if (!selectedFile || !validationResult?.valid) return;

    setIsMigrating(true);
    setMigrationResult(null);
    setMigrationProgress([]);

    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      const result = await migrationService.migrateData(data, (progress) => {
        setMigrationProgress([...progress]);
      });

      setMigrationResult(result);
      alert(`✅ Migração concluída!\n\nTotal: ${result.totalRecords}\nMigrados: ${result.migratedRecords}\nErros: ${result.errors}\nDuração: ${(result.duration / 1000).toFixed(2)}s`);
    } catch (error) {
      alert(`❌ Erro na migração: ${error}`);
    } finally {
      setIsMigrating(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <HiArrowPath className="w-5 h-5 text-gray-400" />;
      case 'processing':
        return <HiArrowPath className="w-5 h-5 text-blue-500 animate-spin" />;
      case 'completed':
        return <HiCheckCircle className="w-5 h-5 text-green-500" />;
      case 'error':
        return <HiXCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 text-gray-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'completed':
        return 'bg-green-100 text-green-700';
      case 'error':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <HiCloudArrowUp className="w-8 h-8" style={{ color: settings?.primaryColor || '#3B82F6' }} />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Migração de Dados</h1>
              <p className="mt-1 text-sm text-gray-600">
                Importe dados da aplicação antiga (sgi-ibc-default-rtdb-export.json)
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Upload Area */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Selecionar Arquivo de Dados</h2>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <HiDocumentText className="w-12 h-12 text-gray-400 mx-auto mb-4" />

            <label htmlFor="file-upload" className="cursor-pointer">
              <span
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: settings?.primaryColor || '#3B82F6' }}
              >
                <HiCloudArrowUp className="w-5 h-5 mr-2" />
                Selecionar Arquivo JSON
              </span>
              <input
                id="file-upload"
                type="file"
                accept=".json"
                className="hidden"
                onChange={handleFileSelect}
                disabled={isMigrating}
              />
            </label>

            {selectedFile && (
              <p className="mt-4 text-sm text-gray-600">
                Arquivo selecionado: <span className="font-medium">{selectedFile.name}</span>
              </p>
            )}
          </div>

          {isValidating && (
            <div className="mt-4 flex items-center justify-center text-blue-600">
              <HiArrowPath className="w-5 h-5 mr-2 animate-spin" />
              Validando arquivo...
            </div>
          )}

          {/* Validation Result */}
          {validationResult && !isValidating && (
            <div className={`mt-4 p-4 rounded-lg ${validationResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
              <div className="flex items-start">
                {validationResult.valid ? (
                  <HiCheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                ) : (
                  <HiXCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                )}
                <div className="flex-1">
                  <h3 className={`font-medium ${validationResult.valid ? 'text-green-800' : 'text-red-800'}`}>
                    {validationResult.valid ? 'Arquivo Válido' : 'Arquivo Inválido'}
                  </h3>

                  {validationResult.errors.length > 0 && (
                    <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
                      {validationResult.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Preview */}
          {previewData && (
            <div className="mt-6 bg-blue-50 rounded-lg p-4">
              <h3 className="font-medium text-blue-900 mb-3 flex items-center">
                <HiExclamationTriangle className="w-5 h-5 mr-2" />
                Dados Encontrados no Arquivo
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(previewData).map(([key, value]) => (
                  <div key={key} className="bg-white rounded-lg p-3">
                    <div className="text-2xl font-bold text-blue-600">{value as number}</div>
                    <div className="text-sm text-gray-600 capitalize">{key}</div>
                  </div>
                ))}
              </div>

              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> A migração verificará duplicados por CPF. Registros existentes serão
                  atualizados, novos registros serão criados.
                </p>
              </div>
            </div>
          )}

          {/* Start Migration Button */}
          {validationResult?.valid && !isMigrating && !migrationResult && (
            <div className="mt-6">
              <button
                onClick={handleStartMigration}
                className="w-full py-3 px-4 border border-transparent rounded-md shadow-sm text-white font-medium hover:opacity-90 transition-opacity"
                style={{ backgroundColor: settings?.primaryColor || '#3B82F6' }}
              >
                <HiCloudArrowUp className="w-5 h-5 inline-block mr-2" />
                Iniciar Migração
              </button>
            </div>
          )}
        </div>

        {/* Migration Progress */}
        {migrationProgress.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Progresso da Migração</h2>

            <div className="space-y-4">
              {migrationProgress.map((progress) => (
                <div key={progress.collection} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(progress.status)}
                      <span className="font-medium text-gray-900 capitalize">{progress.collection}</span>
                    </div>
                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(progress.status)}`}>
                      {progress.status === 'processing' && 'Processando...'}
                      {progress.status === 'pending' && 'Aguardando'}
                      {progress.status === 'completed' && 'Concluído'}
                      {progress.status === 'error' && 'Erro'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                    <span>
                      {progress.processed} / {progress.total}
                    </span>
                    <span className="text-red-600">Erros: {progress.errors}</span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${(progress.processed / progress.total) * 100}%`,
                        backgroundColor: settings?.primaryColor || '#3B82F6',
                      }}
                    />
                  </div>

                  {/* Error Messages */}
                  {progress.errorMessages && progress.errorMessages.length > 0 && (
                    <div className="mt-3 p-2 bg-gray-50 rounded text-xs space-y-1 max-h-32 overflow-y-auto">
                      {progress.errorMessages.map((error, index) => (
                        <div key={index} className="text-gray-700">
                          {error}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Migration Result */}
        {migrationResult && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <HiCheckCircle className="w-6 h-6 text-green-500 mr-2" />
              Migração Concluída
            </h2>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-blue-600">{migrationResult.totalRecords}</div>
                <div className="text-sm text-gray-600">Total de Registros</div>
              </div>

              <div className="bg-green-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-600">{migrationResult.migratedRecords}</div>
                <div className="text-sm text-gray-600">Migrados</div>
              </div>

              <div className="bg-red-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-red-600">{migrationResult.errors}</div>
                <div className="text-sm text-gray-600">Erros</div>
              </div>

              <div className="bg-purple-50 rounded-lg p-4">
                <div className="text-2xl font-bold text-purple-600">
                  {(migrationResult.duration / 1000).toFixed(2)}s
                </div>
                <div className="text-sm text-gray-600">Duração</div>
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedFile(null);
                setValidationResult(null);
                setMigrationResult(null);
                setMigrationProgress([]);
                setPreviewData(null);
              }}
              className="w-full py-2 px-4 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Nova Migração
            </button>
          </div>
        )}

        {/* Instructions */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h3 className="font-medium text-blue-900 mb-2">Como usar:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm text-blue-800">
            <li>Selecione o arquivo JSON exportado da aplicação antiga</li>
            <li>Aguarde a validação automática do arquivo</li>
            <li>Revise os dados que serão importados</li>
            <li>Clique em "Iniciar Migração" para começar o processo</li>
            <li>Acompanhe o progresso em tempo real</li>
          </ol>

          <div className="mt-4 p-3 bg-white border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> A migração é segura e incremental. Registros existentes (identificados por CPF)
              serão atualizados, e apenas novos registros serão criados. Você pode executar a migração múltiplas vezes.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDataMigrationPage;
