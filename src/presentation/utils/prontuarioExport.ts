import jsPDF from 'jspdf';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx';
import { saveAs } from 'file-saver';
export interface ProntuarioExportData {
  pacienteNome: string;
  profissionalNome: string;
  tipoAssistencia: string;
  dataInicio: any;
  status: string;
  objetivo?: string;
  observacoes?: string;
}

export function generateProntuarioPDF(ficha: ProntuarioExportData): void {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let yPos = 20;

  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('PRONTUÁRIO DO PACIENTE', pageWidth / 2, yPos, { align: 'center' });
  yPos += 15;

  // Informações do paciente
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Informações do Paciente', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`Nome: ${ficha.pacienteNome}`, 20, yPos);
  yPos += 6;
  doc.text(`Profissional: ${ficha.profissionalNome}`, 20, yPos);
  yPos += 6;
  doc.text(`Tipo de Assistência: ${ficha.tipoAssistencia}`, 20, yPos);
  yPos += 6;
  doc.text(`Data de Início: ${new Date(ficha.dataInicio).toLocaleDateString('pt-BR')}`, 20, yPos);
  yPos += 6;
  doc.text(`Status: ${ficha.status}`, 20, yPos);
  yPos += 6;
  doc.text(`Objetivo: ${ficha.objetivo || 'Não informado'}`, 20, yPos);
  yPos += 12;

  // Conteúdo do prontuário
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Registro do Prontuário', 20, yPos);
  yPos += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);

  if (ficha.observacoes) {
    const splitText = doc.splitTextToSize(ficha.observacoes, pageWidth - 40);
    for (const line of splitText) {
      if (yPos > 270) {
        doc.addPage();
        yPos = 20;
      }
      doc.text(line, 20, yPos);
      yPos += 5;
    }
  } else {
    doc.text('Nenhum registro no prontuário.', 20, yPos);
  }

  // Rodapé
  yPos = 280;
  doc.setFontSize(8);
  doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 20, yPos);

  // Salvar
  doc.save(`prontuario_${ficha.pacienteNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function generateProntuarioWord(ficha: ProntuarioExportData): Promise<void> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          text: 'PRONTUÁRIO DO PACIENTE',
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'Informações do Paciente',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Nome: ', bold: true }),
            new TextRun(ficha.pacienteNome),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Profissional: ', bold: true }),
            new TextRun(ficha.profissionalNome),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Tipo de Assistência: ', bold: true }),
            new TextRun(ficha.tipoAssistencia),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Data de Início: ', bold: true }),
            new TextRun(new Date(ficha.dataInicio).toLocaleDateString('pt-BR')),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Status: ', bold: true }),
            new TextRun(ficha.status),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({ text: 'Objetivo: ', bold: true }),
            new TextRun(ficha.objetivo || 'Não informado'),
          ],
        }),
        new Paragraph({ text: '' }),
        new Paragraph({
          text: 'Registro do Prontuário',
          heading: HeadingLevel.HEADING_1,
        }),
        new Paragraph({ text: '' }),
        ...(ficha.observacoes
          ? ficha.observacoes.split('\n').map(line =>
              new Paragraph({ text: line })
            )
          : [new Paragraph({ text: 'Nenhum registro no prontuário.' })]
        ),
        new Paragraph({ text: '' }),
        new Paragraph({
          children: [
            new TextRun({ text: `Gerado em: ${new Date().toLocaleString('pt-BR')}`, italics: true, size: 18 }),
          ],
        }),
      ],
    }],
  });

  const blob = await Packer.toBlob(doc);
  saveAs(blob, `prontuario_${ficha.pacienteNome.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.docx`);
}
