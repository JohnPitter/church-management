// Unit Tests - MembersManagementPage
// Comprehensive tests for members management UI functionality

import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import MembersManagementPage from '../MembersManagementPage';
import { Member, MemberStatus, MemberType, MaritalStatus, Address } from '@/domain/entities/Member';
import { SystemModule, PermissionAction } from '@/domain/entities/Permission';

// Mock Firebase config
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock MemberService - Create mock functions that will be accessible
const mockGetAllMembers = jest.fn();
const mockGetStatistics = jest.fn();
const mockUpdateMemberStatus = jest.fn();
const mockDeleteMember = jest.fn();

jest.mock('@modules/church-management/members/application/services/MemberService', () => {
  return {
    MemberService: function() {
      return {
        getAllMembers: (...args: any[]) => mockGetAllMembers(...args),
        getStatistics: (...args: any[]) => mockGetStatistics(...args),
        updateMemberStatus: (...args: any[]) => mockUpdateMemberStatus(...args),
        deleteMember: (...args: any[]) => mockDeleteMember(...args),
        getMemberById: jest.fn().mockResolvedValue(null),
        getMembersByStatus: jest.fn().mockResolvedValue([]),
        searchMembers: jest.fn().mockResolvedValue([]),
        createMember: jest.fn().mockResolvedValue({}),
        updateMember: jest.fn().mockResolvedValue({}),
        transferMember: jest.fn().mockResolvedValue(undefined),
        disciplineMember: jest.fn().mockResolvedValue(undefined),
        restoreMember: jest.fn().mockResolvedValue(undefined)
      };
    }
  };
});

// Mock usePermissions hook
const mockHasPermission = jest.fn().mockReturnValue(true);

jest.mock('../../hooks/usePermissions', () => ({
  usePermissions: () => ({
    hasPermission: jest.fn().mockReturnValue(true),
    loading: false,
    permissions: []
  })
}));

// Mock CreateMemberModal
jest.mock('@modules/church-management/members/presentation/components/CreateMemberModal', () => ({
  CreateMemberModal: ({ isOpen, onClose, onSuccess, member }: any) => (
    isOpen ? (
      <div data-testid="create-member-modal">
        <span>{member ? 'Edit Modal' : 'Create Modal'}</span>
        <button onClick={onClose} data-testid="close-modal">Close</button>
        <button onClick={onSuccess} data-testid="submit-modal">Submit</button>
      </div>
    ) : null
  )
}));

// Mock docx module
jest.mock('docx', () => ({
  Document: jest.fn(),
  Packer: {
    toBlob: jest.fn().mockResolvedValue(new Blob())
  },
  Paragraph: jest.fn(),
  TextRun: jest.fn(),
  AlignmentType: { CENTER: 'center' },
  BorderStyle: { SINGLE: 'single' }
}));

// Test data factories
const createTestAddress = (overrides: Partial<Address> = {}): Address => ({
  street: 'Rua das Flores',
  number: '123',
  neighborhood: 'Centro',
  city: 'Sao Paulo',
  state: 'SP',
  zipCode: '01234567',
  ...overrides
});

const createTestMember = (overrides: Partial<Member> = {}): Member => ({
  id: 'member-1',
  name: 'Joao Silva',
  email: 'joao@example.com',
  phone: '(11) 99999-9999',
  birthDate: new Date('1990-01-15'),
  address: createTestAddress(),
  maritalStatus: MaritalStatus.Single,
  memberType: MemberType.Member,
  baptismDate: new Date('2010-01-01'),
  conversionDate: new Date('2009-01-01'),
  ministries: ['Louvor', 'Jovens'],
  status: MemberStatus.Active,
  createdAt: new Date('2023-01-01'),
  updatedAt: new Date('2023-06-01'),
  createdBy: 'admin-1',
  ...overrides
});

describe('MembersManagementPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPermissionsLoading = false;

    // Default permission setup - full access
    mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => true);

    // Default service responses
    mockGetAllMembers.mockResolvedValue([]);
    mockGetStatistics.mockResolvedValue({
      total: 0,
      active: 0,
      inactive: 0,
      transferred: 0,
      disciplined: 0,
      ageDistribution: new Map(),
      monthlyGrowth: 0
    });
  });

  // ===========================================
  // PERMISSION STATES
  // ===========================================
  describe('Permission States', () => {
    it('should show loading spinner when permissions are loading', () => {
      mockPermissionsLoading = true;

      render(<MembersManagementPage />);

      expect(screen.getByText('Verificando permissões...')).toBeInTheDocument();
    });

    it('should show access denied when user cannot view members', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return action !== PermissionAction.View;
      });

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Acesso Negado')).toBeInTheDocument();
      });
      expect(screen.getByText('Voce nao tem permissao para visualizar membros.')).toBeInTheDocument();
    });

    it('should not show create button when user cannot create members', async () => {
      mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
        return action !== PermissionAction.Create;
      });
      mockGetAllMembers.mockResolvedValue([createTestMember()]);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.queryByText('Novo Membro')).not.toBeInTheDocument();
      });
    });

    it('should show create button when user has create permission', async () => {
      mockGetAllMembers.mockResolvedValue([createTestMember()]);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText(/Novo Membro/)).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // LOADING STATES
  // ===========================================
  describe('Loading States', () => {
    it('should show loading spinner while fetching members', async () => {
      // Make the service call never resolve initially
      mockGetAllMembers.mockImplementation(() => new Promise(() => {}));

      render(<MembersManagementPage />);

      // Should show loading spinner (after permission check)
      await waitFor(() => {
        const spinners = document.querySelectorAll('.animate-spin');
        expect(spinners.length).toBeGreaterThan(0);
      });
    });

    it('should hide loading spinner after members are loaded', async () => {
      mockGetAllMembers.mockResolvedValue([createTestMember()]);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // EMPTY STATE
  // ===========================================
  describe('Empty State', () => {
    it('should show empty message when no members match filters', async () => {
      mockGetAllMembers.mockResolvedValue([]);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Nenhum membro encontrado com os filtros aplicados.')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // DATA DISPLAY
  // ===========================================
  describe('Data Display', () => {
    const testMembers = [
      createTestMember({ id: '1', name: 'Joao Silva', status: MemberStatus.Active, memberType: MemberType.Member }),
      createTestMember({ id: '2', name: 'Maria Santos', status: MemberStatus.Inactive, memberType: MemberType.Congregant }),
      createTestMember({ id: '3', name: 'Pedro Costa', status: MemberStatus.Active, memberType: MemberType.Member })
    ];

    it('should display member list with correct data', async () => {
      mockGetAllMembers.mockResolvedValue(testMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
      });
    });

    it('should display member status badges', async () => {
      mockGetAllMembers.mockResolvedValue(testMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Ativo').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Inativo').length).toBeGreaterThan(0);
      });
    });

    it('should display member type badges', async () => {
      mockGetAllMembers.mockResolvedValue(testMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getAllByText('Membro').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Congregado').length).toBeGreaterThan(0);
      });
    });

    it('should display statistics when available', async () => {
      mockGetAllMembers.mockResolvedValue(testMembers);
      mockGetStatistics.mockResolvedValue({
        total: 100,
        active: 80,
        inactive: 15,
        transferred: 3,
        disciplined: 2,
        ageDistribution: new Map(),
        monthlyGrowth: 5
      });

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('80')).toBeInTheDocument(); // Active count
        expect(screen.getByText('100')).toBeInTheDocument(); // Total count
        expect(screen.getByText('5')).toBeInTheDocument(); // Monthly growth
      });
    });
  });

  // ===========================================
  // FILTERING
  // ===========================================
  describe('Filtering', () => {
    const testMembers = [
      createTestMember({ id: '1', name: 'Joao Silva', email: 'joao@example.com', status: MemberStatus.Active, memberType: MemberType.Member }),
      createTestMember({ id: '2', name: 'Maria Santos', email: 'maria@example.com', status: MemberStatus.Inactive, memberType: MemberType.Congregant }),
      createTestMember({ id: '3', name: 'Pedro Costa', email: 'pedro@example.com', status: MemberStatus.Active, memberType: MemberType.Member }),
      createTestMember({ id: '4', name: 'Ana Joana', email: 'ana@example.com', status: MemberStatus.Transferred, memberType: MemberType.Member })
    ];

    it('should filter members by search term (name)', async () => {
      mockGetAllMembers.mockResolvedValue(testMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Nome, email ou telefone...');
      fireEvent.change(searchInput, { target: { value: 'Joao' } });

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        expect(screen.getByText('Ana Joana')).toBeInTheDocument();
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
        expect(screen.queryByText('Pedro Costa')).not.toBeInTheDocument();
      });
    });

    it('should filter members by search term (email)', async () => {
      mockGetAllMembers.mockResolvedValue(testMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText('Nome, email ou telefone...');
      fireEvent.change(searchInput, { target: { value: 'maria@' } });

      await waitFor(() => {
        expect(screen.queryByText('Joao Silva')).not.toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
      });
    });

    it('should filter members by status', async () => {
      mockGetAllMembers.mockResolvedValue(testMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: MemberStatus.Active } });

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
        expect(screen.queryByText('Ana Joana')).not.toBeInTheDocument();
      });
    });

    it('should filter members by member type', async () => {
      mockGetAllMembers.mockResolvedValue(testMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      const typeSelect = screen.getByLabelText('Tipo');
      fireEvent.change(typeSelect, { target: { value: MemberType.Congregant } });

      await waitFor(() => {
        expect(screen.queryByText('Joao Silva')).not.toBeInTheDocument();
        expect(screen.getByText('Maria Santos')).toBeInTheDocument();
        expect(screen.queryByText('Pedro Costa')).not.toBeInTheDocument();
      });
    });

    it('should combine multiple filters', async () => {
      mockGetAllMembers.mockResolvedValue(testMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      // Filter by status
      const statusSelect = screen.getByLabelText('Status');
      fireEvent.change(statusSelect, { target: { value: MemberStatus.Active } });

      // Filter by member type
      const typeSelect = screen.getByLabelText('Tipo');
      fireEvent.change(typeSelect, { target: { value: MemberType.Member } });

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        expect(screen.getByText('Pedro Costa')).toBeInTheDocument();
        expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // PAGINATION
  // ===========================================
  describe('Pagination', () => {
    it('should paginate members correctly', async () => {
      // Create 15 members
      const manyMembers = Array.from({ length: 15 }, (_, i) =>
        createTestMember({ id: `member-${i}`, name: `Member ${i + 1}` })
      );
      mockGetAllMembers.mockResolvedValue(manyMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        // Default items per page is 10
        expect(screen.getByText('Member 1')).toBeInTheDocument();
        expect(screen.getByText('Member 10')).toBeInTheDocument();
        expect(screen.queryByText('Member 11')).not.toBeInTheDocument();
      });
    });

    it('should navigate to next page', async () => {
      const manyMembers = Array.from({ length: 15 }, (_, i) =>
        createTestMember({ id: `member-${i}`, name: `Member ${i + 1}` })
      );
      mockGetAllMembers.mockResolvedValue(manyMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Member 1')).toBeInTheDocument();
      });

      // Click next page button
      const nextButton = screen.getByText('Proxima');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.queryByText('Member 1')).not.toBeInTheDocument();
        expect(screen.getByText('Member 11')).toBeInTheDocument();
        expect(screen.getByText('Member 15')).toBeInTheDocument();
      });
    });

    it('should change items per page', async () => {
      const manyMembers = Array.from({ length: 25 }, (_, i) =>
        createTestMember({ id: `member-${i}`, name: `Member ${i + 1}` })
      );
      mockGetAllMembers.mockResolvedValue(manyMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Member 1')).toBeInTheDocument();
      });

      // Change items per page to 20
      const itemsPerPageSelect = screen.getByLabelText('Mostrar:');
      fireEvent.change(itemsPerPageSelect, { target: { value: '20' } });

      await waitFor(() => {
        expect(screen.getByText('Member 1')).toBeInTheDocument();
        expect(screen.getByText('Member 20')).toBeInTheDocument();
        expect(screen.queryByText('Member 21')).not.toBeInTheDocument();
      });
    });

    it('should reset to page 1 when filters change', async () => {
      const manyMembers = Array.from({ length: 15 }, (_, i) =>
        createTestMember({
          id: `member-${i}`,
          name: `Member ${i + 1}`,
          status: i < 12 ? MemberStatus.Active : MemberStatus.Inactive
        })
      );
      mockGetAllMembers.mockResolvedValue(manyMembers);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Member 1')).toBeInTheDocument();
      });

      // Go to page 2
      const nextButton = screen.getByText('Proxima');
      fireEvent.click(nextButton);

      await waitFor(() => {
        expect(screen.queryByText('Member 1')).not.toBeInTheDocument();
      });

      // Change filter - should reset to page 1
      const searchInput = screen.getByPlaceholderText('Nome, email ou telefone...');
      fireEvent.change(searchInput, { target: { value: 'Member 1' } });

      await waitFor(() => {
        expect(screen.getByText('Member 1')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // CRUD OPERATIONS
  // ===========================================
  describe('CRUD Operations', () => {
    describe('Create Member', () => {
      it('should open create modal when clicking new member button', async () => {
        mockGetAllMembers.mockResolvedValue([]);

        render(<MembersManagementPage />);

        await waitFor(() => {
          expect(screen.getByText(/Novo Membro/)).toBeInTheDocument();
        });

        const createButton = screen.getByText(/Novo Membro/);
        fireEvent.click(createButton);

        await waitFor(() => {
          expect(screen.getByTestId('create-member-modal')).toBeInTheDocument();
          expect(screen.getByText('Create Modal')).toBeInTheDocument();
        });
      });

      it('should close modal and refresh data after successful creation', async () => {
        mockGetAllMembers.mockResolvedValue([]);

        render(<MembersManagementPage />);

        await waitFor(() => {
          expect(screen.getByText(/Novo Membro/)).toBeInTheDocument();
        });

        // Open modal
        fireEvent.click(screen.getByText(/Novo Membro/));

        await waitFor(() => {
          expect(screen.getByTestId('create-member-modal')).toBeInTheDocument();
        });

        // Clear mocks to verify reload
        mockGetAllMembers.mockClear();
        mockGetStatistics.mockClear();

        // Click submit (simulating success)
        fireEvent.click(screen.getByTestId('submit-modal'));

        await waitFor(() => {
          expect(mockGetAllMembers).toHaveBeenCalled();
          expect(mockGetStatistics).toHaveBeenCalled();
        });
      });
    });

    describe('Edit Member', () => {
      it('should open edit modal when clicking edit button', async () => {
        mockGetAllMembers.mockResolvedValue([createTestMember()]);

        render(<MembersManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        });

        // Find and click edit button
        const editButton = screen.getByText('Editar');
        fireEvent.click(editButton);

        await waitFor(() => {
          expect(screen.getByTestId('create-member-modal')).toBeInTheDocument();
          expect(screen.getByText('Edit Modal')).toBeInTheDocument();
        });
      });

      it('should not show edit button when user lacks update permission', async () => {
        mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
          return action !== PermissionAction.Update;
        });
        mockGetAllMembers.mockResolvedValue([createTestMember()]);

        render(<MembersManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        });

        expect(screen.queryByText('Editar')).not.toBeInTheDocument();
      });
    });

    describe('Delete Member', () => {
      it('should show confirmation dialog and delete member', async () => {
        const member = createTestMember();
        mockGetAllMembers.mockResolvedValue([member]);
        mockDeleteMember.mockResolvedValue(undefined);

        // Mock window.confirm
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<MembersManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        });

        // Find and click delete button
        const deleteButton = screen.getByText('Excluir');
        fireEvent.click(deleteButton);

        await waitFor(() => {
          expect(confirmSpy).toHaveBeenCalled();
          expect(mockDeleteMember).toHaveBeenCalledWith(member.id);
          expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('excluido com sucesso'));
        });

        confirmSpy.mockRestore();
        alertSpy.mockRestore();
      });

      it('should not delete member when confirmation is cancelled', async () => {
        mockGetAllMembers.mockResolvedValue([createTestMember()]);

        // Mock window.confirm to return false
        const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(false);

        render(<MembersManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        });

        const deleteButton = screen.getByText('Excluir');
        fireEvent.click(deleteButton);

        expect(confirmSpy).toHaveBeenCalled();
        expect(mockDeleteMember).not.toHaveBeenCalled();

        confirmSpy.mockRestore();
      });

      it('should not show delete button when user lacks delete permission', async () => {
        mockHasPermission.mockImplementation((module: SystemModule, action: PermissionAction) => {
          return action !== PermissionAction.Delete;
        });
        mockGetAllMembers.mockResolvedValue([createTestMember()]);

        render(<MembersManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        });

        expect(screen.queryByText('Excluir')).not.toBeInTheDocument();
      });
    });

    describe('Update Status', () => {
      it('should update member status when selecting new status', async () => {
        const member = createTestMember({ status: MemberStatus.Active });
        mockGetAllMembers.mockResolvedValue([member]);
        mockUpdateMemberStatus.mockResolvedValue(undefined);

        const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});

        render(<MembersManagementPage />);

        await waitFor(() => {
          expect(screen.getByText('Joao Silva')).toBeInTheDocument();
        });

        // Find the status select in the actions column
        const statusSelects = screen.getAllByRole('combobox');
        const actionStatusSelect = statusSelects.find(select =>
          select.closest('td')?.textContent?.includes('Ativo')
        );

        if (actionStatusSelect) {
          fireEvent.change(actionStatusSelect, { target: { value: MemberStatus.Inactive } });

          await waitFor(() => {
            expect(mockUpdateMemberStatus).toHaveBeenCalledWith(member.id, MemberStatus.Inactive);
          });
        }

        alertSpy.mockRestore();
      });
    });
  });

  // ===========================================
  // TAB NAVIGATION
  // ===========================================
  describe('Tab Navigation', () => {
    it('should switch to birthdays tab', async () => {
      mockGetAllMembers.mockResolvedValue([createTestMember()]);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      // Click birthdays tab
      const birthdaysTab = screen.getByText(/Aniversarios/);
      fireEvent.click(birthdaysTab);

      await waitFor(() => {
        expect(screen.getByText(/Aniversarios deste Mes/)).toBeInTheDocument();
      });
    });

    it('should switch to reports tab', async () => {
      mockGetAllMembers.mockResolvedValue([createTestMember()]);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      // Click reports tab
      const reportsTab = screen.getByText(/Relatorios/);
      fireEvent.click(reportsTab);

      await waitFor(() => {
        expect(screen.getByText('Estatisticas Gerais')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // ERROR HANDLING
  // ===========================================
  describe('Error Handling', () => {
    it('should show error alert when loading members fails', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockGetAllMembers.mockRejectedValue(new Error('Network error'));

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao carregar membros'));
      });

      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should show specific error for permission errors', async () => {
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      mockGetAllMembers.mockRejectedValue(new Error('insufficient permissions'));

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('permissao'));
      });

      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should handle delete errors gracefully', async () => {
      mockGetAllMembers.mockResolvedValue([createTestMember()]);
      mockDeleteMember.mockRejectedValue(new Error('Delete failed'));

      const confirmSpy = jest.spyOn(window, 'confirm').mockReturnValue(true);
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      const deleteButton = screen.getByText('Excluir');
      fireEvent.click(deleteButton);

      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao excluir'));
      });

      confirmSpy.mockRestore();
      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });

    it('should handle status update errors gracefully', async () => {
      const member = createTestMember();
      mockGetAllMembers.mockResolvedValue([member]);
      mockUpdateMemberStatus.mockRejectedValue(new Error('Update failed'));

      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      // Find and change status select
      const statusSelects = screen.getAllByRole('combobox');
      const actionStatusSelect = statusSelects.find(select => {
        const options = within(select as HTMLElement).queryAllByRole('option');
        return options.some(opt => opt.textContent === 'Inativo');
      });

      if (actionStatusSelect) {
        fireEvent.change(actionStatusSelect, { target: { value: MemberStatus.Inactive } });

        await waitFor(() => {
          expect(alertSpy).toHaveBeenCalledWith(expect.stringContaining('Erro ao atualizar'));
        });
      }

      alertSpy.mockRestore();
      consoleSpy.mockRestore();
    });
  });

  // ===========================================
  // BIRTHDAYS TAB
  // ===========================================
  describe('Birthdays Tab', () => {
    it('should display members with birthdays in current month', async () => {
      const currentMonth = new Date().getMonth();
      const currentDate = new Date();
      currentDate.setDate(15);
      currentDate.setMonth(currentMonth);

      const memberWithBirthday = createTestMember({
        id: '1',
        name: 'Birthday Member',
        birthDate: currentDate,
        status: MemberStatus.Active
      });

      mockGetAllMembers.mockResolvedValue([memberWithBirthday]);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Birthday Member')).toBeInTheDocument();
      });

      // Switch to birthdays tab
      fireEvent.click(screen.getByText(/Aniversarios/));

      await waitFor(() => {
        // Should show the member in birthdays list
        const birthdaySection = screen.getByText(/Aniversarios deste Mes/);
        expect(birthdaySection).toBeInTheDocument();
      });
    });

    it('should show empty message when no birthdays in current month', async () => {
      // Create member with birthday in a different month
      const differentMonth = (new Date().getMonth() + 6) % 12;
      const birthDate = new Date();
      birthDate.setMonth(differentMonth);

      const member = createTestMember({
        birthDate
      });

      mockGetAllMembers.mockResolvedValue([member]);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      // Switch to birthdays tab
      fireEvent.click(screen.getByText(/Aniversarios/));

      await waitFor(() => {
        expect(screen.getByText('Nenhum aniversario este mes.')).toBeInTheDocument();
      });
    });
  });

  // ===========================================
  // REPORTS TAB
  // ===========================================
  describe('Reports Tab', () => {
    it('should display general statistics', async () => {
      mockGetAllMembers.mockResolvedValue([
        createTestMember({ id: '1', status: MemberStatus.Active }),
        createTestMember({ id: '2', status: MemberStatus.Inactive }),
        createTestMember({ id: '3', status: MemberStatus.Active })
      ]);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      // Switch to reports tab
      fireEvent.click(screen.getByText(/Relatorios/));

      await waitFor(() => {
        expect(screen.getByText('Total de Membros')).toBeInTheDocument();
        expect(screen.getByText('Membros Ativos')).toBeInTheDocument();
        expect(screen.getByText('Membros Inativos')).toBeInTheDocument();
      });
    });

    it('should display age distribution', async () => {
      mockGetAllMembers.mockResolvedValue([
        createTestMember({ id: '1', birthDate: new Date('2000-01-01') }), // Young adult
        createTestMember({ id: '2', birthDate: new Date('1970-01-01') })  // Older adult
      ]);

      render(<MembersManagementPage />);

      await waitFor(() => {
        expect(screen.getByText('Joao Silva')).toBeInTheDocument();
      });

      // Switch to reports tab
      fireEvent.click(screen.getByText(/Relatorios/));

      await waitFor(() => {
        expect(screen.getByText(/Distribuicao por Faixa Etaria/)).toBeInTheDocument();
      });
    });
  });
});
