import type { EvaluationInstrument, EvaluationReport } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';
import { evaluationReportContent, reportFilename } from './evaluationReportContent';
import { renderEvaluationChart, renderEvaluationDimensionChart } from './evaluationChart';

export async function exportEvaluationPDF(report: EvaluationReport, instrument: EvaluationInstrument): Promise<void> {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF();
  let cursor = 20;
  for (const item of evaluationReportContent(report, instrument)) {
    const heading = item.kind !== 'body';
    doc.setFont('helvetica', heading ? 'bold' : 'normal');
    doc.setFontSize(item.kind === 'title' ? 17 : heading ? 12 : 10);
    cursor += heading ? 4 : 2;
    const lines = doc.splitTextToSize(item.text, 170) as string[];
    const neededSpace = item.text === 'Evolução e indicadores' ? 145 : lines.length * (heading ? 7 : 5) + (heading ? 12 : 0);
    if (neededSpace < 250 && cursor + neededSpace > 275) { doc.addPage(); cursor = 20; }
    for (const line of lines) {
      if (cursor > 275) { doc.addPage(); cursor = 20; }
      doc.text(line, 20, cursor); cursor += heading ? 7 : 5;
    }
    if (item.kind === 'title') {
      doc.addImage(renderEvaluationChart(report, instrument), 'PNG', 20, cursor + 5, 170, 78.2);
      cursor += 90;
    }
    if (item.text === 'Evolução e indicadores') {
      if (cursor + 132 > 275) { doc.addPage(); cursor = 20; }
      doc.addImage(renderEvaluationDimensionChart(report, instrument), 'PNG', 20, cursor + 4, 170, 125.8);
      cursor += 132;
    }
  }
  const count = doc.getNumberOfPages();
  for (let page = 1; page <= count; page += 1) {
    doc.setPage(page); doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text(`Página ${page} de ${count}`, 20, 287);
  }
  doc.save(`${reportFilename(report)}.pdf`);
}

export async function buildEvaluationWord(report: EvaluationReport, instrument: EvaluationInstrument): Promise<Blob> {
  const { Document, Paragraph, TextRun, ImageRun, Packer } = await import('docx');
  const imageParagraph = (dataUrl: string, height: number) => new Paragraph({ children: [new ImageRun({
    type: 'png', data: Uint8Array.from(atob(dataUrl.split(',')[1]), char => char.charCodeAt(0)), transformation: { width: 600, height }
  })] });
  const children = evaluationReportContent(report, instrument).flatMap(item => {
    const paragraph = new Paragraph({
      style: item.kind === 'title' ? 'Title' : item.kind === 'heading' ? 'Heading1' : 'Normal',
      keepNext: item.kind !== 'body', spacing: { after: 140 },
      children: item.text.split('\n').map((line, index) => new TextRun({ text: line, break: index ? 1 : 0 }))
    });
    if (item.kind === 'title') return [paragraph, imageParagraph(renderEvaluationChart(report, instrument), 276)];
    if (item.text === 'Evolução e indicadores') return [paragraph, imageParagraph(renderEvaluationDimensionChart(report, instrument), 444)];
    return [paragraph];
  });
  const document = new Document({
    styles: { default: { document: { run: { font: 'Arial', size: 22, color: '000000' } } }, paragraphStyles: [
      { id: 'Title', name: 'Title', basedOn: 'Normal', run: { size: 34, bold: true, color: '000000' } },
      { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', run: { size: 26, bold: true, color: '000000' }, paragraph: { spacing: { before: 240, after: 120 } } }
    ] },
    sections: [{ properties: { page: { size: { width: 11906, height: 16838 }, margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } }, children }]
  });
  return Packer.toBlob(document);
}

export async function exportEvaluationWord(report: EvaluationReport, instrument: EvaluationInstrument): Promise<void> {
  const { saveAs } = await import('file-saver');
  saveAs(await buildEvaluationWord(report, instrument), `${reportFilename(report)}.docx`);
}
