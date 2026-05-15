import { exportRowsToXlsx } from '../xlsxExport';

describe('xlsxExport', () => {
  it('exports rows as an Excel blob', async () => {
    const blob = await exportRowsToXlsx([
      ['Relatório'],
      ['Data', 'Valor'],
      ['13/05/2026', 150]
    ], {
      sheetName: 'Relatorio',
      columnWidths: [14, 12]
    });

    expect(blob).toBeInstanceOf(Blob);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    expect(blob.size).toBeGreaterThan(0);
  });
});
