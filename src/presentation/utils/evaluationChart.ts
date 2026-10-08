import type { EvaluationInstrument, EvaluationReport } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';

export const evolutionColors = ['#0369a1', '#047857', '#a16207', '#7e22ce'];

export function evaluationChartSeries(report: EvaluationReport, instrument: EvaluationInstrument) {
  return [
    { label: 'IDG', values: report.evolution.map(item => item.indices.idg) },
    ...instrument.axes.map(axis => ({ label: `IDE ${axis.label}`, values: report.evolution.map(item => item.indices.ide[axis.id]) }))
  ];
}

export function renderEvaluationChart(report: EvaluationReport, instrument: EvaluationInstrument): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1000;
  canvas.height = 460;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível gerar o gráfico do relatório');
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.font = '18px Arial';
  for (let value = 0; value <= 100; value += 25) {
    const y = 380 - value * 3;
    context.strokeStyle = '#e5e7eb';
    context.beginPath(); context.moveTo(80, y); context.lineTo(940, y); context.stroke();
    context.fillStyle = '#374151'; context.fillText(`${value}%`, 20, y + 6);
  }
  report.evolution.forEach((item, index) => {
    const label = instrument.moments.find(moment => moment.id === item.moment)?.label || item.moment;
    context.fillText(label, 150 + index * 350, 425);
  });
  evaluationChartSeries(report, instrument).forEach((series, index) => drawSeries(context, series, index));
  return canvas.toDataURL('image/png');
}

export function evaluationDimensionSeries(report: EvaluationReport, instrument: EvaluationInstrument) {
  return report.evolution.map(item => ({
    label: instrument.moments.find(moment => moment.id === item.moment)?.label || item.moment,
    values: instrument.dimensions.map(dimension => item.indices.idd[dimension.id])
  }));
}

export function renderEvaluationDimensionChart(report: EvaluationReport, instrument: EvaluationInstrument): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1000; canvas.height = 740;
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Não foi possível gerar o gráfico das dimensões');
  context.fillStyle = '#ffffff'; context.fillRect(0, 0, 1000, 740); context.font = '16px Arial';
  const series = evaluationDimensionSeries(report, instrument);
  series.forEach((item, index) => { context.fillStyle = evolutionColors[index]; context.fillText(item.label, 360 + index * 180, 30); });
  for (let value = 0; value <= 100; value += 25) {
    const x = 360 + value * 5.8;
    context.strokeStyle = '#e5e7eb'; context.beginPath(); context.moveTo(x, 70); context.lineTo(x, 675); context.stroke();
    context.fillStyle = '#374151'; context.fillText(`${value}%`, x - 12, 710);
  }
  instrument.dimensions.forEach((dimension, dimensionIndex) => {
    const y = 100 + dimensionIndex * 65;
    context.fillStyle = '#374151';
    const words = dimension.label.split(' ');
    let line = ''; let labelY = y;
    for (const word of words) {
      if (context.measureText(`${line} ${word}`).width > 310) { context.fillText(line, 20, labelY); labelY += 20; line = word; }
      else line = `${line} ${word}`.trim();
    }
    context.fillText(line, 20, labelY);
    series.forEach((item, index) => {
      const value = item.values[dimensionIndex];
      if (value === null) return;
      context.fillStyle = evolutionColors[index]; context.fillRect(360, y - 15 + index * 13, value * 5.8, 10);
    });
  });
  return canvas.toDataURL('image/png');
}

function drawSeries(context: CanvasRenderingContext2D, series: { label: string; values: Array<number | null> }, index: number) {
  context.strokeStyle = evolutionColors[index]; context.fillStyle = evolutionColors[index]; context.lineWidth = 3;
  context.fillText(series.label, 80 + index * 220, 35);
  let previous: { x: number; y: number } | undefined;
  series.values.forEach((value, position) => {
    if (value === null) { previous = undefined; return; }
    const point = { x: 180 + position * 350, y: 380 - value * 3 };
    if (previous) {
      context.beginPath(); context.moveTo(previous.x, previous.y); context.lineTo(point.x, point.y); context.stroke();
    }
    context.beginPath(); context.arc(point.x, point.y, 5, 0, Math.PI * 2); context.fill();
    previous = point;
  });
}
