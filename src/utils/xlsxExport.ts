import { format as formatDate } from 'date-fns';

const XLSX_MIME_TYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

interface ExportableTransaction {
  date: Date;
  type: string;
  category: { name: string };
  description: string;
  amount: number;
  paymentMethod?: string;
  status: string;
  reference?: string;
}

interface ExportOptions {
  title: string;
  sheetName: string;
  startDate?: Date;
  endDate?: Date;
  incomeType: string;
}

export type XlsxCellValue = string | number | boolean | Date | null;

interface RowsExportOptions {
  sheetName: string;
  columnWidths?: number[];
}

export async function exportRowsToXlsx(
  rows: XlsxCellValue[][],
  options: RowsExportOptions
): Promise<Blob> {
  const ExcelJS = await import('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet(options.sheetName);

  rows.forEach(row => worksheet.addRow(row));
  options.columnWidths?.forEach((width, index) => {
    worksheet.getColumn(index + 1).width = width;
  });

  const xlsxBuffer = await workbook.xlsx.writeBuffer();
  return new Blob([xlsxBuffer], { type: XLSX_MIME_TYPE });
}

export async function exportTransactionsToXlsx(
  transactions: ExportableTransaction[],
  options: ExportOptions
): Promise<Blob> {
  const totalIncome = transactions.filter(t => t.type === options.incomeType).reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type !== options.incomeType).reduce((s, t) => s + t.amount, 0);

  const headerRows = [
    [options.title],
    [`Periodo: ${options.startDate ? formatDate(options.startDate, 'dd/MM/yyyy') : '-'} a ${options.endDate ? formatDate(options.endDate, 'dd/MM/yyyy') : '-'}`],
    [`Gerado em: ${formatDate(new Date(), 'dd/MM/yyyy HH:mm')}`],
    [],
    ['RESUMO'],
    ['Total Receitas', totalIncome],
    ['Total Despesas', totalExpense],
    ['Resultado Liquido', totalIncome - totalExpense],
    [],
    ['DATA', 'TIPO', 'CATEGORIA', 'DESCRICAO', 'VALOR (R$)', 'METODO', 'STATUS', 'REFERENCIA']
  ];

  const dataRows = transactions.map(t => [
    formatDate(t.date, 'dd/MM/yyyy'),
    t.type === options.incomeType ? 'RECEITA' : 'DESPESA',
    t.category.name,
    t.description,
    t.amount,
    t.paymentMethod || '-',
    t.status === 'approved' ? 'Aprovada' : t.status === 'pending' ? 'Pendente' : t.status,
    t.reference || '-'
  ]);

  const allRows = [...headerRows, ...dataRows];
  return exportRowsToXlsx(allRows, {
    sheetName: options.sheetName,
    columnWidths: [12, 10, 20, 35, 15, 18, 12, 15]
  });
}
