/**
 * @jest-environment node
 */
import { PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import { generateAttendanceReportPDF } from '../attendanceReportExport';

describe('attendanceReportExport', () => {
  it('rejects an empty report', () => {
    expect(() => generateAttendanceReportPDF([], PedagogyOrganization.ONG)).toThrow(
      'Não há chamadas para exportar'
    );
  });
});
