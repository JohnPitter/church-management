import { format as formatDate } from 'date-fns';

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

export async function exportTransactionsToXlsx(
  transactions: ExportableTransaction[],
  options: ExportOptions
): Promise<Blob> {
  const XLSX = await import('xlsx');

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
  const ws = XLSX.utils.aoa_to_sheet(allRows);
  ws['!cols'] = [
    { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 35 },
    { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 15 }
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, options.sheetName);
  const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  return new Blob([xlsxBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}
