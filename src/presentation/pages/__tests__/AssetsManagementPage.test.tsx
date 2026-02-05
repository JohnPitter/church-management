// Unit Tests - AssetsManagementPage
// Comprehensive tests for assets management UI functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetsManagementPage from '../AssetsManagementPage';
import {
  Asset,
  AssetCategory,
  AssetCondition,
  AssetStatus,
  MaintenanceRecord
} from '@modules/church-management/assets/domain/entities/Asset';

// Mock window.alert and window.confirm globally
global.alert = jest.fn();
global.confirm = jest.fn(() => true);

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock AssetService - Create mock functions that will be accessible
const mockGetAllAssets = jest.fn();
const mockGetStatistics = jest.fn();
const mockCreateAsset = jest.fn();
const mockUpdateAsset = jest.fn();
const mockDeleteAsset = jest.fn();

jest.mock('@modules/church-management/assets/application/services/AssetService', () => ({
  AssetService: jest.fn(function(this: any) {
    this.getAllAssets = (...args: any[]) => mockGetAllAssets(...args);
    this.getStatistics = (...args: any[]) => mockGetStatistics(...args);
    this.createAsset = (...args: any[]) => mockCreateAsset(...args);
    this.updateAsset = (...args: any[]) => mockUpdateAsset(...args);
    this.deleteAsset = (...args: any[]) => mockDeleteAsset(...args);
    // Additional methods
    this.getAssetById = jest.fn().mockResolvedValue(null);
    this.getAssetsByCategory = jest.fn().mockResolvedValue([]);
    this.getAssetsByStatus = jest.fn().mockResolvedValue([]);
    this.searchAssets = jest.fn().mockResolvedValue([]);
    return this;
  })
}));

// Mock useAuth hook
const mockCurrentUser = {
  uid: 'user-1',
  email: 'admin@church.com',
  role: 'admin'
};

jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    currentUser: mockCurrentUser
  })
}));

// Test data factories
const createTestAsset = (overrides = {}) => ({
  id: 'asset-1',
  name: 'Projetor Epson',
  description: 'Projetor para cultos',
  category: AssetCategory.Electronics,
  acquisitionDate: new Date('2023-01-15'),
  acquisitionValue: 5000,
  currentValue: 4500,
  condition: AssetCondition.Good,
  status: AssetStatus.Active,
  location: 'Sala Principal',
  serialNumber: 'EP123456',
  brand: 'Epson',
  model: 'PowerLite X49',
  invoiceNumber: 'INV-2023-001',
  warrantyExpiryDate: new Date('2025-01-15'),
  responsiblePerson: 'João Silva',
  notes: 'Manutenção regular necessária',
  tags: ['culto', 'audiovisual'],
  createdAt: new Date('2023-01-15'),
  updatedAt: new Date('2023-06-01'),
  createdBy: 'admin-1',
  updatedBy: 'admin-1',
  ...overrides
});


describe('AssetsManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset window mocks
    (global.alert as jest.Mock).mockClear();
    (global.confirm as jest.Mock).mockReturnValue(true);

    // Default service responses
    mockGetAllAssets.mockResolvedValue([]);
    mockGetStatistics.mockResolvedValue({
      totalAssets: 0,
      totalValue: 0,
      byCategory: {},
      byStatus: {},
      byCondition: {},
      depreciationRate: 0
    });
    mockCreateAsset.mockResolvedValue(createTestAsset());
    mockUpdateAsset.mockResolvedValue(createTestAsset());
    mockDeleteAsset.mockResolvedValue(undefined);
  });

  // ===========================================
  // LOADING STATES
  // ===========================================
  describe('Loading States', () => {
    it('should show loading spinner while fetching assets', async () => {
      mockGetAllAssets.mockImplementation(() => new Promise(() => {}));

      render(<AssetsManagementPage />);

      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin');
        expect(spinners.length).toBeGreaterThan(0);
      });
    });

    it('should hide loading spinner after assets are loaded', async () => {
      mockGetAllAssets.mockResolvedValue([createTestAsset()]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const spinners = document.querySelectorAll('.animate-spin');
      const visibleSpinners = Array.from(spinners).filter((spinner) => {
        const parent = spinner.parentElement;
        return parent && !parent.textContent?.includes('Projetor Epson');
      });
      expect(visibleSpinners.length).toBe(0);
    });

    it('should load assets on mount', async () => {
      const assets = [createTestAsset()];
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(mockGetAllAssets).toHaveBeenCalledTimes(1);
      });
    });

    it('should load statistics on mount', async () => {
      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(mockGetStatistics).toHaveBeenCalledTimes(1);
      });
    });
  });

  // ===========================================
  // DISPLAY AND RENDERING
  // ===========================================
  describe('Display and Rendering', () => {
    it('should render page title', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Gestão de Patrimônio/i)).toBeInTheDocument();
      });
    });

    it('should display asset cards when assets are loaded', async () => {
      const assets = [
        createTestAsset({ id: 'asset-1', name: 'Projetor Epson' }),
        createTestAsset({ id: 'asset-2', name: 'Piano Digital' })
      ];
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
        expect(screen.getByText('Piano Digital')).toBeInTheDocument();
      });
    });

    it('should display empty state when no assets exist', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Nenhum patrimônio cadastrado/i)).toBeInTheDocument();
      });
    });

    it('should display asset category label', async () => {
      const asset = createTestAsset({ category: AssetCategory.Electronics });
      mockGetAllAssets.mockResolvedValue([asset]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Eletrônicos/i)).toBeInTheDocument();
      });
    });

    it('should display asset condition badge', async () => {
      const asset = createTestAsset({ condition: AssetCondition.Good });
      mockGetAllAssets.mockResolvedValue([asset]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Bom/i)).toBeInTheDocument();
      });
    });

    it('should display asset status badge', async () => {
      const asset = createTestAsset({ status: AssetStatus.Active });
      mockGetAllAssets.mockResolvedValue([asset]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Em Uso/i)).toBeInTheDocument();
      });
    });

    it('should display asset value formatted as currency', async () => {
      const asset = createTestAsset({ acquisitionValue: 5000 });
      mockGetAllAssets.mockResolvedValue([asset]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/5.000,00/)).toBeInTheDocument();
      });
    });

    it('should display new asset button', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Novo Patrimônio/i)).toBeInTheDocument();
      });
    });
  });


  // ===========================================
  // SEARCH AND FILTERING
  // ===========================================
  describe('Search and Filtering', () => {
    it('should filter assets by search term (name)', async () => {
      const assets = [
        createTestAsset({ id: 'asset-1', name: 'Projetor Epson' }),
        createTestAsset({ id: 'asset-2', name: 'Piano Digital' })
      ];
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar patrimônio/i);
      fireEvent.change(searchInput, { target: { value: 'Projetor' } });

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
        expect(screen.queryByText('Piano Digital')).not.toBeInTheDocument();
      });
    });

    it('should filter assets by search term (location)', async () => {
      const assets = [
        createTestAsset({ id: 'asset-1', name: 'Projetor', location: 'Sala Principal' }),
        createTestAsset({ id: 'asset-2', name: 'Piano', location: 'Sala de Ensaio' })
      ];
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar patrimônio/i);
      fireEvent.change(searchInput, { target: { value: 'Principal' } });

      await waitFor(() => {
        expect(screen.getByText('Projetor')).toBeInTheDocument();
        expect(screen.queryByText('Piano')).not.toBeInTheDocument();
      });
    });

    it('should filter assets by category', async () => {
      const assets = [
        createTestAsset({ id: 'asset-1', name: 'Projetor', category: AssetCategory.Electronics }),
        createTestAsset({ id: 'asset-2', name: 'Piano', category: AssetCategory.Musical })
      ];
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor')).toBeInTheDocument();
      });

      const categoryFilter = screen.getByDisplayValue(/Todas as Categorias/i);
      fireEvent.change(categoryFilter, { target: { value: AssetCategory.Electronics } });

      await waitFor(() => {
        expect(screen.getByText('Projetor')).toBeInTheDocument();
        expect(screen.queryByText('Piano')).not.toBeInTheDocument();
      });
    });

    it('should filter assets by status', async () => {
      const assets = [
        createTestAsset({ id: 'asset-1', name: 'Projetor', status: AssetStatus.Active }),
        createTestAsset({ id: 'asset-2', name: 'Piano', status: AssetStatus.Inactive })
      ];
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor')).toBeInTheDocument();
      });

      const statusFilter = screen.getByDisplayValue(/Todos os Status/i);
      fireEvent.change(statusFilter, { target: { value: AssetStatus.Active } });

      await waitFor(() => {
        expect(screen.getByText('Projetor')).toBeInTheDocument();
        expect(screen.queryByText('Piano')).not.toBeInTheDocument();
      });
    });

    it('should be case-insensitive in search', async () => {
      const assets = [createTestAsset({ name: 'Projetor Epson' })];
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/Buscar patrimônio/i);
      fireEvent.change(searchInput, { target: { value: 'PROJETOR' } });

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });
    });
  });


  // ===========================================
  // PAGINATION
  // ===========================================
  describe('Pagination', () => {
    it('should display pagination controls when assets exceed page size', async () => {
      const assets = Array.from({ length: 15 }, (_, i) =>
        createTestAsset({ id: `asset-${i}`, name: `Asset ${i}` })
      );
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Página/i)).toBeInTheDocument();
      });
    });

    it('should show first page by default', async () => {
      const assets = Array.from({ length: 15 }, (_, i) =>
        createTestAsset({ id: `asset-${i}`, name: `Asset ${i}` })
      );
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Asset 0')).toBeInTheDocument();
        expect(screen.getByText('Asset 9')).toBeInTheDocument();
        expect(screen.queryByText('Asset 10')).not.toBeInTheDocument();
      });
    });

    it('should navigate to next page', async () => {
      const assets = Array.from({ length: 15 }, (_, i) =>
        createTestAsset({ id: `asset-${i}`, name: `Asset ${i}` })
      );
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Asset 0')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /Próxima/i });
      userEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.getByText('Asset 10')).toBeInTheDocument();
        expect(screen.queryByText('Asset 0')).not.toBeInTheDocument();
      });
    });

    it('should disable previous button on first page', async () => {
      const assets = Array.from({ length: 15 }, (_, i) =>
        createTestAsset({ id: `asset-${i}`, name: `Asset ${i}` })
      );
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        const prevButton = screen.getByRole('button', { name: /Anterior/i });
        expect(prevButton).toBeDisabled();
      });
    });

    it('should disable next button on last page', async () => {
      const assets = Array.from({ length: 15 }, (_, i) =>
        createTestAsset({ id: `asset-${i}`, name: `Asset ${i}` })
      );
      mockGetAllAssets.mockResolvedValue(assets);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Asset 0')).toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /Próxima/i });
      userEvent.click(nextButton);

      await waitFor(() => {
        expect(nextButton).toBeDisabled();
      });
    });
  });


  // ===========================================
  // CREATE ASSET MODAL
  // ===========================================
  describe('Create Asset Modal', () => {
    it('should open create modal when new asset button is clicked', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Novo Patrimônio/i)).toBeInTheDocument();
      });

      const newButton = screen.getByText(/Novo Patrimônio/i);
      userEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should close modal when cancel button is clicked', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Novo Patrimônio/i)).toBeInTheDocument();
      });

      const newButton = screen.getByText(/Novo Patrimônio/i);
      userEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const cancelButton = screen.getByRole('button', { name: /Cancelar/i });
      userEvent.click(cancelButton);

      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should display form fields in create modal', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Novo Patrimônio/i)).toBeInTheDocument();
      });

      const newButton = screen.getByText(/Novo Patrimônio/i);
      userEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByLabelText(/Nome/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Descrição/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Categoria/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Valor de Aquisição/i)).toBeInTheDocument();
        expect(screen.getByLabelText(/Localização/i)).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // EDIT ASSET
  // ===========================================
  describe('Edit Asset', () => {
    it('should open edit modal when edit button is clicked', async () => {
      const asset = createTestAsset();
      mockGetAllAssets.mockResolvedValue([asset]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Editar/i });
      userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
    });

    it('should populate form with asset data in edit mode', async () => {
      const asset = createTestAsset({ name: 'Projetor Epson' });
      mockGetAllAssets.mockResolvedValue([asset]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Editar/i });
      userEvent.click(editButton);

      await waitFor(() => {
        const nameInput = screen.getByLabelText(/Nome/i) as HTMLInputElement;
        expect(nameInput.value).toBe('Projetor Epson');
      });
    });

    it('should call updateAsset when editing asset', async () => {
      const asset = createTestAsset();
      mockGetAllAssets.mockResolvedValue([asset]);
      mockUpdateAsset.mockResolvedValue({ ...asset, name: 'Updated Name' });

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const editButton = screen.getByRole('button', { name: /Editar/i });
      userEvent.click(editButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const nameInput = screen.getByLabelText(/Nome/i);
      fireEvent.change(nameInput, { target: { value: 'Updated Name' } });

      const submitButton = screen.getByRole('button', { name: /Salvar/i });
      userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockUpdateAsset).toHaveBeenCalledWith(
          asset.id,
          expect.objectContaining({ name: 'Updated Name' })
        );
      });
    });
  });


  // ===========================================
  // DELETE ASSET
  // ===========================================
  describe('Delete Asset', () => {
    it('should show confirmation dialog when delete button is clicked', async () => {
      const asset = createTestAsset();
      mockGetAllAssets.mockResolvedValue([asset]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Excluir/i });
      userEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.confirm).toHaveBeenCalled();
      });
    });

    it('should call deleteAsset when confirmed', async () => {
      const asset = createTestAsset();
      mockGetAllAssets.mockResolvedValue([asset]);
      (global.confirm as jest.Mock).mockReturnValue(true);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Excluir/i });
      userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteAsset).toHaveBeenCalledWith(asset.id);
      });
    });

    it('should not delete when confirmation is cancelled', async () => {
      const asset = createTestAsset();
      mockGetAllAssets.mockResolvedValue([asset]);
      (global.confirm as jest.Mock).mockReturnValue(false);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Excluir/i });
      userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockDeleteAsset).not.toHaveBeenCalled();
      });
    });

    it('should reload assets after successful deletion', async () => {
      const asset = createTestAsset();
      mockGetAllAssets.mockResolvedValue([asset]);
      (global.confirm as jest.Mock).mockReturnValue(true);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Excluir/i });
      userEvent.click(deleteButton);

      await waitFor(() => {
        expect(mockGetAllAssets).toHaveBeenCalledTimes(2);
      });
    });

    it('should show error alert when deletion fails', async () => {
      const asset = createTestAsset();
      mockGetAllAssets.mockResolvedValue([asset]);
      mockDeleteAsset.mockRejectedValue(new Error('Delete failed'));
      (global.confirm as jest.Mock).mockReturnValue(true);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Projetor Epson')).toBeInTheDocument();
      });

      const deleteButton = screen.getByRole('button', { name: /Excluir/i });
      userEvent.click(deleteButton);

      await waitFor(() => {
        expect(global.alert).toHaveBeenCalledWith('Delete failed');
      });
    });
  });

  // ===========================================
  // FORM VALIDATION
  // ===========================================
  describe('Form Validation', () => {
    it('should show validation errors for required fields', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Novo Patrimônio/i)).toBeInTheDocument();
      });

      const newButton = screen.getByText(/Novo Patrimônio/i);
      userEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Salvar/i });
      userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Nome é obrigatório/i)).toBeInTheDocument();
      });
    });

    it('should validate name is required', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Novo Patrimônio/i)).toBeInTheDocument();
      });

      const newButton = screen.getByText(/Novo Patrimônio/i);
      userEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Salvar/i });
      userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Nome é obrigatório/i)).toBeInTheDocument();
      });
    });

    it('should validate location is required', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Novo Patrimônio/i)).toBeInTheDocument();
      });

      const newButton = screen.getByText(/Novo Patrimônio/i);
      userEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const submitButton = screen.getByRole('button', { name: /Salvar/i });
      userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Localização é obrigatória/i)).toBeInTheDocument();
      });
    });

    it('should validate acquisition value is positive', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Novo Patrimônio/i)).toBeInTheDocument();
      });

      const newButton = screen.getByText(/Novo Patrimônio/i);
      userEvent.click(newButton);

      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });

      const valueInput = screen.getByLabelText(/Valor de Aquisição/i);
      fireEvent.change(valueInput, { target: { value: '-100' } });

      const submitButton = screen.getByRole('button', { name: /Salvar/i });
      userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Valor de aquisição é obrigatório e deve ser positivo/i)).toBeInTheDocument();
      });
    });

    it('should disable submit button when form is invalid', async () => {
      mockGetAllAssets.mockResolvedValue([]);

      render(<AssetsManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Novo Patrimônio/i)).toBeInTheDocument();
      });

      const newButton = screen.getByText(/Novo Patrimônio/i);
      userEvent.click(newButton);

      await waitFor(() => {
        const submitButton = screen.getByRole('button', { name: /Salvar/i });
        expect(submitButton).toBeDisabled();
      });
    });
  });
});
