import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DepartmentReportModal } from '../DepartmentReportModal';
import {
  Department,
  DepartmentTransaction,
  DepartmentTransactionStatus,
  DepartmentTransactionType
} from '@modules/church-management/departments/domain/entities/Department';
import { downloadBlob } from '../../../utils/dateUtils';
import { exportRowsToXlsx } from '../../../utils/xlsxExport';

const mockGetTransactions = jest.fn();
const mockReportBlob = new Blob(['xlsx'], {
  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
});

jest.mock('@modules/financial/department-finance/application/services/DepartmentFinancialService', () => ({
  departmentFinancialService: {
    getTransactions: (...args: unknown[]) => mockGetTransactions(...args)
  }
}));

jest.mock('../../../utils/dateUtils', () => ({
  downloadBlob: jest.fn()
}));

jest.mock('../../../utils/xlsxExport', () => ({
  exportRowsToXlsx: jest.fn()
}));

const department: Department = {
  id: 'dept-1',
  name: 'Aplicação Financeira',
  currentBalance: 4614.31,
  isActive: true,
  createdAt: new Date('2026-05-01T12:00:00.000Z'),
  updatedAt: new Date('2026-05-01T12:00:00.000Z'),
  createdBy: 'admin@example.com'
};

const transaction: DepartmentTransaction = {
  id: 'transaction-1',
  departmentId: department.id,
  departmentName: department.name,
  type: DepartmentTransactionType.DEPOSIT,
  amount: 150,
  description: 'Oferta direcionada',
  receiptNumber: 'REC-001',
  date: new Date('2026-05-13T12:00:00.000Z'),
  status: DepartmentTransactionStatus.APPROVED,
  createdAt: new Date('2026-05-13T12:00:00.000Z'),
  updatedAt: new Date('2026-05-13T12:00:00.000Z'),
  createdBy: 'admin@example.com'
};

describe('DepartmentReportModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetTransactions.mockResolvedValue([transaction]);
    (exportRowsToXlsx as jest.Mock).mockResolvedValue(mockReportBlob);
  });

  it('exports the department report as Excel', async () => {
    render(
      <DepartmentReportModal
        isOpen={true}
        onClose={jest.fn()}
        department={department}
      />
    );

    expect(await screen.findByText('Oferta direcionada')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Exportar Excel' }));

    await waitFor(() => {
      expect(exportRowsToXlsx).toHaveBeenCalled();
    });

    const [rows, options] = (exportRowsToXlsx as jest.Mock).mock.calls[0];

    expect(rows).toContainEqual(['Relatório - Aplicação Financeira']);
    expect(rows).toContainEqual(['Data', 'Tipo', 'Descrição', 'Valor', 'Status', 'Recibo', 'Observações']);
    expect(rows).toContainEqual([
      '13/05/2026',
      'Depósito',
      'Oferta direcionada',
      expect.stringMatching(/^R\$\s*150,00$/),
      'Aprovada',
      'REC-001',
      ''
    ]);
    expect(options).toEqual(expect.objectContaining({ sheetName: 'Relatorio' }));
    expect(downloadBlob).toHaveBeenCalledWith(
      mockReportBlob,
      expect.stringMatching(/^relatorio-caixinha-aplicacao-financeira-\d{4}-\d{2}\.xlsx$/)
    );
  });
});
