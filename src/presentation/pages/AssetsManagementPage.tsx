// Presentation Page - Assets Management
// Church asset and property inventory management

import React, { useState, useEffect } from 'react';
import { AssetService } from '@modules/church-management/assets/application/services/AssetService';
import {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  AssetEntity
} from '@modules/church-management/assets/domain/entities/Asset';
import { useAuth } from '../contexts/AuthContext';

const AssetsManagementPage: React.FC = () => {
  const { currentUser } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [filteredAssets, setFilteredAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<AssetCategory | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<AssetStatus | 'all'>('all');
  const [statistics, setStatistics] = useState<any>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Asset>>({
    name: '',
    description: '',
    category: AssetCategory.Equipment,
    acquisitionDate: new Date(),
    acquisitionValue: 0,
    currentValue: undefined,
    condition: AssetCondition.Good,
    status: AssetStatus.Active,
    location: '',
    serialNumber: '',
    brand: '',
    model: '',
    invoiceNumber: '',
    warrantyExpiryDate: undefined,
    insurancePolicyNumber: '',
    insuranceExpiryDate: undefined,
    responsiblePerson: '',
    notes: '',
    tags: []
  });

  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const assetService = new AssetService();

  useEffect(() => {
    loadAssets();
    loadStatistics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    filterAssets();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets, searchTerm, filterCategory, filterStatus]);

  const loadAssets = async () => {
    try {
      setIsLoading(true);
      const data = await assetService.getAllAssets();
      setAssets(data);
    } catch (error: any) {
      console.error('Error loading assets:', error);
      alert(error.message || 'Erro ao carregar patrimônios');
    } finally {
      setIsLoading(false);
    }
  };

  const loadStatistics = async () => {
    try {
      const stats = await assetService.getStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('Error loading statistics:', error);
    }
  };

  const filterAssets = () => {
    let filtered = assets;

    // Apply search filter
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filtered = filtered.filter(asset =>
        asset.name.toLowerCase().includes(lowerSearch) ||
        asset.description.toLowerCase().includes(lowerSearch) ||
        asset.location.toLowerCase().includes(lowerSearch) ||
        asset.serialNumber?.toLowerCase().includes(lowerSearch) ||
        asset.brand?.toLowerCase().includes(lowerSearch) ||
        asset.model?.toLowerCase().includes(lowerSearch)
      );
    }

    // Apply category filter
    if (filterCategory !== 'all') {
      filtered = filtered.filter(asset => asset.category === filterCategory);
    }

    // Apply status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(asset => asset.status === filterStatus);
    }

    setFilteredAssets(filtered);
    setCurrentPage(1);
  };

  const validateForm = (): boolean => {
    const errors = AssetEntity.validateAsset(formData);
    setValidationErrors(errors);
    return errors.length === 0;
  };

  const handleInputChange = (field: keyof Asset, value: any) => {
    const newFormData = { ...formData, [field]: value };
    setFormData(newFormData);

    // Real-time validation
    const errors = AssetEntity.validateAsset(newFormData);
    setValidationErrors(errors);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      alert('Por favor, corrija os erros no formulário antes de salvar.');
      return;
    }

    try {
      const dataToSave = {
        ...formData,
        createdBy: currentUser?.id || 'system',
        updatedBy: currentUser?.id || 'system'
      };

      if (editingAsset) {
        await assetService.updateAsset(editingAsset.id, dataToSave);
        alert('Patrimônio atualizado com sucesso!');
      } else {
        await assetService.createAsset(dataToSave);
        alert('Patrimônio criado com sucesso!');
      }

      closeModal();
      loadAssets();
      loadStatistics();
    } catch (error: any) {
      console.error('Error saving asset:', error);
      alert(error.message || 'Erro ao salvar patrimônio');
    }
  };

  const handleEdit = (asset: Asset) => {
    setEditingAsset(asset);
    setFormData({
      name: asset.name,
      description: asset.description,
      category: asset.category,
      acquisitionDate: asset.acquisitionDate,
      acquisitionValue: asset.acquisitionValue,
      currentValue: asset.currentValue,
      condition: asset.condition,
      status: asset.status,
      location: asset.location,
      serialNumber: asset.serialNumber,
      brand: asset.brand,
      model: asset.model,
      invoiceNumber: asset.invoiceNumber,
      warrantyExpiryDate: asset.warrantyExpiryDate,
      insurancePolicyNumber: asset.insurancePolicyNumber,
      insuranceExpiryDate: asset.insuranceExpiryDate,
      responsiblePerson: asset.responsiblePerson,
      notes: asset.notes,
      tags: asset.tags
    });
    setValidationErrors([]);
    setShowModal(true);
  };

  const handleDelete = async (asset: Asset) => {
    if (!window.confirm(`Tem certeza que deseja excluir "${asset.name}"?`)) {
      return;
    }

    try {
      await assetService.deleteAsset(asset.id);
      alert('Patrimônio excluído com sucesso!');
      loadAssets();
      loadStatistics();
    } catch (error: any) {
      console.error('Error deleting asset:', error);
      alert(error.message || 'Erro ao excluir patrimônio');
    }
  };

  const openCreateModal = () => {
    setEditingAsset(null);
    setFormData({
      name: '',
      description: '',
      category: AssetCategory.Equipment,
      acquisitionDate: new Date(),
      acquisitionValue: 0,
      currentValue: undefined,
      condition: AssetCondition.Good,
      status: AssetStatus.Active,
      location: '',
      serialNumber: '',
      brand: '',
      model: '',
      invoiceNumber: '',
      warrantyExpiryDate: undefined,
      insurancePolicyNumber: '',
      insuranceExpiryDate: undefined,
      responsiblePerson: '',
      notes: '',
      tags: []
    });
    setValidationErrors([]);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingAsset(null);
    setFormData({
      name: '',
      description: '',
      category: AssetCategory.Equipment,
      acquisitionDate: new Date(),
      acquisitionValue: 0,
      currentValue: undefined,
      condition: AssetCondition.Good,
      status: AssetStatus.Active,
      location: '',
      serialNumber: '',
      brand: '',
      model: '',
      invoiceNumber: '',
      warrantyExpiryDate: undefined,
      insurancePolicyNumber: '',
      insuranceExpiryDate: undefined,
      responsiblePerson: '',
      notes: '',
      tags: []
    });
    setValidationErrors([]);
  };

  const isFormValid = AssetEntity.isFormValid(formData);

  // Pagination
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando patrimônios...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Patrimônio</h1>
          <p className="mt-2 text-gray-600">Gerencie os bens e ativos da igreja</p>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Total de Itens</div>
              <div className="mt-2 text-3xl font-bold text-gray-900">{statistics.totalAssets}</div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Valor Total</div>
              <div className="mt-2 text-3xl font-bold text-green-600">
                {AssetEntity.formatCurrency(statistics.totalValue)}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Em Uso</div>
              <div className="mt-2 text-3xl font-bold text-blue-600">
                {statistics.byStatus[AssetStatus.Active] || 0}
              </div>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-sm font-medium text-gray-500">Manutenção</div>
              <div className="mt-2 text-3xl font-bold text-yellow-600">
                {statistics.byStatus[AssetStatus.UnderMaintenance] || 0}
              </div>
            </div>
          </div>
        )}

        {/* Filters and Actions */}
        <div className="bg-white rounded-lg shadow mb-6 p-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nome, descrição, localização..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Category Filter */}
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value as AssetCategory | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todas as Categorias</option>
              {Object.values(AssetCategory).map(category => (
                <option key={category} value={category}>
                  {AssetEntity.getCategoryLabel(category)}
                </option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as AssetStatus | 'all')}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="all">Todos os Status</option>
              {Object.values(AssetStatus).map(status => (
                <option key={status} value={status}>
                  {AssetEntity.getStatusLabel(status)}
                </option>
              ))}
            </select>

            {/* Add Button */}
            <button
              onClick={openCreateModal}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors whitespace-nowrap"
            >
              + Adicionar Patrimônio
            </button>
          </div>
        </div>

        {/* Assets Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patrimônio
                  </th>
                  <th className="hidden md:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Categoria
                  </th>
                  <th className="hidden lg:table-cell px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Valor
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Condição
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {paginatedAssets.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      {searchTerm || filterCategory !== 'all' || filterStatus !== 'all'
                        ? 'Nenhum patrimônio encontrado com os filtros aplicados'
                        : 'Nenhum patrimônio cadastrado'}
                    </td>
                  </tr>
                ) : (
                  paginatedAssets.map((asset) => (
                    <tr key={asset.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{asset.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">{asset.description}</div>
                        <div className="md:hidden text-xs text-gray-500 mt-1">
                          {AssetEntity.getCategoryLabel(asset.category)}
                        </div>
                      </td>
                      <td className="hidden md:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {AssetEntity.getCategoryLabel(asset.category)}
                        </div>
                      </td>
                      <td className="hidden lg:table-cell px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {AssetEntity.formatCurrency(asset.currentValue || asset.acquisitionValue)}
                        </div>
                        {asset.currentValue && (
                          <div className="text-xs text-gray-500">
                            Aquisição: {AssetEntity.formatCurrency(asset.acquisitionValue)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${AssetEntity.getConditionColor(asset.condition)}`}>
                          {AssetEntity.getConditionLabel(asset.condition)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${AssetEntity.getStatusColor(asset.status)}`}>
                          {AssetEntity.getStatusLabel(asset.status)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(asset)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Editar"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(asset)}
                            className="text-red-600 hover:text-red-900"
                            title="Excluir"
                          >
                            Excluir
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredAssets.length > itemsPerPage && (
            <div className="bg-white px-4 py-3 border-t border-gray-200 sm:px-6">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Mostrando <span className="font-medium">{startIndex + 1}</span> até{' '}
                  <span className="font-medium">{Math.min(endIndex, filteredAssets.length)}</span> de{' '}
                  <span className="font-medium">{filteredAssets.length}</span> resultados
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-1 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Próxima
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full my-8">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingAsset ? 'Editar Patrimônio' : 'Adicionar Novo Patrimônio'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="px-6 py-4 max-h-[calc(100vh-200px)] overflow-y-auto">
              {/* Validation Errors */}
              {validationErrors.length > 0 && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                  <h3 className="text-sm font-medium text-red-800 mb-2">Erros de validação:</h3>
                  <ul className="list-disc list-inside text-sm text-red-700 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nome */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome do Patrimônio <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Projetor Epson PowerLite"
                    maxLength={200}
                    required
                  />
                </div>

                {/* Descrição */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Descrição
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Descreva o patrimônio..."
                    maxLength={1000}
                  />
                </div>

                {/* Categoria */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Categoria <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value as AssetCategory)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    {Object.values(AssetCategory).map(category => (
                      <option key={category} value={category}>
                        {AssetEntity.getCategoryLabel(category)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Localização */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Localização <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Sala de Som, Secretaria"
                    maxLength={300}
                    required
                  />
                </div>

                {/* Data de Aquisição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Aquisição <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.acquisitionDate instanceof Date
                      ? formData.acquisitionDate.toISOString().split('T')[0]
                      : ''}
                    onChange={(e) => handleInputChange('acquisitionDate', new Date(e.target.value))}
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  />
                </div>

                {/* Valor de Aquisição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor de Aquisição (R$) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    value={formData.acquisitionValue}
                    onChange={(e) => handleInputChange('acquisitionValue', parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                    required
                  />
                </div>

                {/* Valor Atual */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Valor Atual (R$)
                  </label>
                  <input
                    type="number"
                    value={formData.currentValue || ''}
                    onChange={(e) => handleInputChange('currentValue', e.target.value ? parseFloat(e.target.value) : undefined)}
                    min="0"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="0.00"
                  />
                </div>

                {/* Condição */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condição <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.condition}
                    onChange={(e) => handleInputChange('condition', e.target.value as AssetCondition)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    {Object.values(AssetCondition).map(condition => (
                      <option key={condition} value={condition}>
                        {AssetEntity.getConditionLabel(condition)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Status <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => handleInputChange('status', e.target.value as AssetStatus)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    required
                  >
                    {Object.values(AssetStatus).map(status => (
                      <option key={status} value={status}>
                        {AssetEntity.getStatusLabel(status)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Número de Série */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número de Série
                  </label>
                  <input
                    type="text"
                    value={formData.serialNumber || ''}
                    onChange={(e) => handleInputChange('serialNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: SN123456789"
                  />
                </div>

                {/* Marca */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Marca
                  </label>
                  <input
                    type="text"
                    value={formData.brand || ''}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: Epson, Yamaha"
                  />
                </div>

                {/* Modelo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Modelo
                  </label>
                  <input
                    type="text"
                    value={formData.model || ''}
                    onChange={(e) => handleInputChange('model', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: PowerLite X39"
                  />
                </div>

                {/* Responsável */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Responsável
                  </label>
                  <input
                    type="text"
                    value={formData.responsiblePerson || ''}
                    onChange={(e) => handleInputChange('responsiblePerson', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Nome do responsável"
                  />
                </div>

                {/* Número da Nota Fiscal */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Nota Fiscal
                  </label>
                  <input
                    type="text"
                    value={formData.invoiceNumber || ''}
                    onChange={(e) => handleInputChange('invoiceNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: NF-123456"
                  />
                </div>

                {/* Vencimento da Garantia */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vencimento da Garantia
                  </label>
                  <input
                    type="date"
                    value={formData.warrantyExpiryDate instanceof Date
                      ? formData.warrantyExpiryDate.toISOString().split('T')[0]
                      : ''}
                    onChange={(e) => handleInputChange('warrantyExpiryDate', e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Número da Apólice de Seguro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número da Apólice de Seguro
                  </label>
                  <input
                    type="text"
                    value={formData.insurancePolicyNumber || ''}
                    onChange={(e) => handleInputChange('insurancePolicyNumber', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Ex: AP-123456"
                  />
                </div>

                {/* Vencimento do Seguro */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Vencimento do Seguro
                  </label>
                  <input
                    type="date"
                    value={formData.insuranceExpiryDate instanceof Date
                      ? formData.insuranceExpiryDate.toISOString().split('T')[0]
                      : ''}
                    onChange={(e) => handleInputChange('insuranceExpiryDate', e.target.value ? new Date(e.target.value) : undefined)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </div>

                {/* Observações */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Observações
                  </label>
                  <textarea
                    value={formData.notes || ''}
                    onChange={(e) => handleInputChange('notes', e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    rows={3}
                    placeholder="Notas adicionais..."
                  />
                </div>
              </div>

              {/* Required Fields Note */}
              <p className="mt-4 text-sm text-gray-500">
                <span className="text-red-500">*</span> Campos obrigatórios
              </p>
            </form>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleSubmit}
                disabled={!isFormValid}
                className={`px-6 py-2 font-medium rounded-lg transition-colors ${
                  isFormValid
                    ? 'bg-indigo-600 text-white hover:bg-indigo-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
                title={!isFormValid ? 'Preencha todos os campos obrigatórios corretamente' : ''}
              >
                {editingAsset ? 'Atualizar' : 'Criar'} Patrimônio
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetsManagementPage;
