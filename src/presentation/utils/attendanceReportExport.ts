import jsPDF from 'jspdf';
import {
  ClassAttendanceRoll,
  PEDAGOGY_ORGANIZATION_LABELS,
  PedagogyEntity,
  PedagogyOrganization
} from '@modules/pedagogy/domain/entities/Pedagogy';

const PAGE_BOTTOM = 278;

function fileStamp(date = new Date()): string {
  return date.toISOString().split('T')[0];
}

function sanitizeFilePart(value: string): string {
  const cleaned = value.trim().replace(/\s+/g, '_').replace(/[^\w\-]+/g, '');
  return cleaned || 'chamada';
}

function nextLine(doc: jsPDF, y: number, extra = 6): number {
  if (y + extra > PAGE_BOTTOM) {
    doc.addPage();
    return 20;
  }
  return y + extra;
}

function writeWrapped(doc: jsPDF, text: string, x: number, y: number, maxWidth: number): number {
  const lines = doc.splitTextToSize(text, maxWidth) as string[];
  let cursor = y;
  lines.forEach(line => {
    doc.text(line, x, cursor);
    cursor = nextLine(doc, cursor, 5);
  });
  return cursor;
}

function writeFooter(doc: jsPDF): void {
  const pageCount = doc.getNumberOfPages();
  for (let page = 1; page <= pageCount; page += 1) {
    doc.setPage(page);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Gerado em: ${new Date().toLocaleString('pt-BR')} · Página ${page}/${pageCount}`,
      20,
      doc.internal.pageSize.getHeight() - 10
    );
  }
}

function writeRollBlock(doc: jsPDF, roll: ClassAttendanceRoll, y: number, pageWidth: number): number {
  const absent = PedagogyEntity.absentStudents(roll);
  const present = roll.students.filter(student => student.name.trim() && student.present);
  const named = roll.students.filter(student => student.name.trim());

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(
    `${roll.classGroup} · ${roll.sessionDate.toLocaleDateString('pt-BR')}`,
    20,
    y
  );
  y = nextLine(doc, y, 7);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  y = writeWrapped(
    doc,
    `${roll.educatorName} · ${PedagogyEntity.presentCount(roll)} presente(s) · ${absent.length} falta(s) · ${named.length} aluno(s)`,
    20,
    y,
    pageWidth - 40
  );

  if (present.length > 0) {
    y = writeWrapped(doc, `Presentes: ${present.map(item => item.name).join(', ')}`, 20, y, pageWidth - 40);
  }
  if (absent.length > 0) {
    y = writeWrapped(doc, `Ausentes: ${absent.map(item => item.name).join(', ')}`, 20, y, pageWidth - 40);
  } else {
    y = writeWrapped(doc, 'Ausentes: nenhum', 20, y, pageWidth - 40);
  }
  return nextLine(doc, y, 6);
}

export function generateAttendanceRollPDF(
  roll: ClassAttendanceRoll,
  organization: PedagogyOrganization
): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('CHAMADA PEDAGÓGICA', pageWidth / 2, y, { align: 'center' });
  y = nextLine(doc, y, 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contexto: ${PEDAGOGY_ORGANIZATION_LABELS[organization]}`, 20, y);
  y = nextLine(doc, y, 10);
  y = writeRollBlock(doc, roll, y, pageWidth);

  writeFooter(doc);
  doc.save(`chamada_${sanitizeFilePart(roll.classGroup)}_${fileStamp(roll.sessionDate)}.pdf`);
}

export function generateAttendanceReportPDF(
  rolls: ClassAttendanceRoll[],
  organization: PedagogyOrganization
): void {
  if (rolls.length === 0) {
    throw new Error('Não há chamadas para exportar');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const absences = PedagogyEntity.absenceReport(rolls);
  let y = 20;

  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('RELATÓRIO DE CHAMADAS', pageWidth / 2, y, { align: 'center' });
  y = nextLine(doc, y, 10);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Contexto: ${PEDAGOGY_ORGANIZATION_LABELS[organization]}`, 20, y);
  y = nextLine(doc, y, 6);
  doc.text(`${rolls.length} chamada(s) · ${absences.length} falta(s)`, 20, y);
  y = nextLine(doc, y, 12);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Chamadas', 20, y);
  y = nextLine(doc, y, 8);

  rolls.forEach(roll => {
    y = writeRollBlock(doc, roll, y, pageWidth);
  });

  y = nextLine(doc, y, 4);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Relatório de faltas', 20, y);
  y = nextLine(doc, y, 8);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  if (absences.length === 0) {
    doc.text('Nenhuma falta registrada.', 20, y);
  } else {
    absences.forEach(item => {
      y = writeWrapped(
        doc,
        `${item.studentName} · ${item.classGroup} · ${item.sessionDate.toLocaleDateString('pt-BR')} · ${item.educatorName}`,
        20,
        y,
        pageWidth - 40
      );
    });
  }

  writeFooter(doc);
  doc.save(`relatorio_chamadas_${sanitizeFilePart(PEDAGOGY_ORGANIZATION_LABELS[organization])}_${fileStamp()}.pdf`);
}
