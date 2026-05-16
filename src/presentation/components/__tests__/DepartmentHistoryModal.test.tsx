import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DepartmentHistoryModal } from '../DepartmentHistoryModal';
import {
  Department,
  DepartmentTransaction,
  DepartmentTransactionStatus,
  DepartmentTransactionType
} from '@modules/church-management/departments/domain/entities/Department';

const mockGetTransactions = jest.fn();

jest.mock('@modules/financial/department-finance/application/services/DepartmentFinancialService', () => ({
  departmentFinancialService: {
    getTransactions: (...args: unknown[]) => mockGetTransactions(...args)
  }
}));

const department: Department = {
  id: 'dept-1',
  name: 'Aplicação Financeira',
  currentBalance: 4614.31,
  initialBalance: 100,
  responsibleName: 'Nielly Brito',
  isActive: true,
  createdAt: new Date('2026-05-01T12:00:00.000Z'),
  updatedAt: new Date('2026-05-01T12:00:00.000Z'),
  createdBy: 'admin@example.com'
};

const transactions: DepartmentTransaction[] = [
  {
    id: 'transaction-1',
    departmentId: department.id,
    departmentName: department.name,
    type: DepartmentTransactionType.DEPOSIT,
    amount: 150,
    description: 'Oferta direcionada',
    reference: 'DEPT-001',
    date: new Date('2026-05-13T12:00:00.000Z'),
    status: DepartmentTransactionStatus.APPROVED,
    createdAt: new Date('2026-05-13T12:00:00.000Z'),
    updatedAt: new Date('2026-05-13T12:00:00.000Z'),
    createdBy: 'admin@example.com'
  },
  {
    id: 'transaction-2',
    departmentId: department.id,
    departmentName: department.name,
    type: DepartmentTransactionType.WITHDRAWAL,
    amount: 50,
    description: 'Compra de material',
    receiptNumber: 'REC-002',
    date: new Date('2026-05-14T12:00:00.000Z'),
    status: DepartmentTransactionStatus.PENDING,
    createdAt: new Date('2026-05-14T12:00:00.000Z'),
    updatedAt: new Date('2026-05-14T12:00:00.000Z'),
    createdBy: 'admin@example.com'
  }
];

describe('DepartmentHistoryModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactions.mockResolvedValue(transactions);
  });

  it('carrega e exibe o historico completo da caixinha', async () => {
    render(
      <DepartmentHistoryModal
        isOpen={true}
        onClose={jest.fn()}
        department={department}
      />
    );

    expect(await screen.findByText('Oferta direcionada')).toBeInTheDocument();

    expect(mockGetTransactions).toHaveBeenCalledWith({ departmentId: department.id }, 10000);
    expect(screen.getByText('Histórico Completo - Aplicação Financeira')).toBeInTheDocument();
    expect(screen.getByText('Responsável: Nielly Brito')).toBeInTheDocument();
    expect(screen.getByText('Compra de material')).toBeInTheDocument();
    expect(screen.getByText('DEPT-001')).toBeInTheDocument();
    expect(screen.getByText('REC-002')).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Movimentações (2)')).toBeInTheDocument();
    });
  });

  it('nao busca dados quando fechado', () => {
    render(
      <DepartmentHistoryModal
        isOpen={false}
        onClose={jest.fn()}
        department={department}
      />
    );

    expect(mockGetTransactions).not.toHaveBeenCalled();
    expect(screen.queryByText(/Histórico Completo/i)).not.toBeInTheDocument();
  });

  it('pagina o historico quando ha muitas movimentacoes', async () => {
    const manyTransactions = Array.from({ length: 21 }, (_, index) => ({
      ...transactions[0],
      id: `transaction-${index + 1}`,
      description: `Movimentação ${index + 1}`,
      amount: index + 1
    }));
    mockGetTransactions.mockResolvedValue(manyTransactions);

    render(
      <DepartmentHistoryModal
        isOpen={true}
        onClose={jest.fn()}
        department={department}
      />
    );

    expect(await screen.findByText('Movimentação 1')).toBeInTheDocument();
    expect(screen.queryByText('Movimentação 21')).not.toBeInTheDocument();
    expect(screen.getByText('Exibindo 1-20 de 21')).toBeInTheDocument();
    expect(screen.getByText('Página 1 de 2')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Próxima' }));

    expect(screen.getByText('Movimentação 21')).toBeInTheDocument();
    expect(screen.queryByText('Movimentação 1')).not.toBeInTheDocument();
    expect(screen.getByText('Exibindo 21-21 de 21')).toBeInTheDocument();
    expect(screen.getByText('Página 2 de 2')).toBeInTheDocument();
  });
});
