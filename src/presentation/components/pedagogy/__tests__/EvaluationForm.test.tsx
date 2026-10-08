import React from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EvaluationForm from '../EvaluationForm';
import { PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import type { EvaluationInstrument } from '@modules/pedagogy/application/services/DevelopmentEvaluationService';
import instrumentData from '../../../../../functions/src/pedagogy/instrument.json';

const instrument = instrumentData as EvaluationInstrument;
const mockCreate = jest.fn();
const mockError = jest.fn();
jest.mock('@modules/pedagogy/application/services/DevelopmentEvaluationService', () => ({ developmentEvaluationService: { create: (...args: unknown[]) => mockCreate(...args) } }));
jest.mock('react-hot-toast', () => ({ __esModule: true, default: { success: jest.fn(), error: (...args: unknown[]) => mockError(...args) } }));

function renderForm() {
  return render(<EvaluationForm organization={PedagogyOrganization.ONG} educatorName="Ana" instrument={instrument} onSaved={jest.fn()}
    rolls={[{ id: 'roll-1', organization: PedagogyOrganization.ONG, educatorId: 'educator', educatorName: 'Ana', classGroup: 'Artes', students: [{ name: 'Maria', present: true }], sessionDate: new Date('2026-10-07T12:00:00Z'), createdAt: new Date(), updatedAt: new Date() }]} />);
}

async function fillAnswers() {
  userEvent.selectOptions(screen.getByLabelText('Chamada e turma'), 'roll-1');
  userEvent.selectOptions(screen.getByLabelText('Assistido'), 'Maria');
  userEvent.type(screen.getByLabelText('Idade'), '7');
  for (const question of instrument.cycles[0].questions) {
    userEvent.click(within(screen.getByRole('group', { name: question.text })).getByLabelText('A) Sim, espontaneamente'));
  }
  userEvent.click(screen.getByLabelText('Não há necessidade identificada no momento'));
}

beforeEach(() => {
  mockCreate.mockReset().mockResolvedValue({});
  mockError.mockClear();
  Object.defineProperty(global, 'crypto', { configurable: true, value: { randomUUID: () => 'request-1234567890123456' } });
});

test('envia nove respostas e dados qualitativos sem identidade do autor ou índices calculados no cliente', async () => {
  renderForm();
  await fillAnswers();
  userEvent.click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(1));
  const payload = mockCreate.mock.calls[0][0];
  expect(payload.studentName).toBe('Maria');
  expect(payload.attendanceRollId).toBe('roll-1');
  expect(Object.keys(payload.answers)).toHaveLength(9);
  expect(payload.referrals).toEqual(['none']);
  expect(payload.observations).toEqual({ attention: '', potential: '', additional: '' });
  expect(payload.educatorId).toBeUndefined();
  expect(payload.indices).toBeUndefined();
});

test('trocar o ciclo troca as perguntas e limpa as respostas', async () => {
  renderForm();
  await fillAnswers();
  userEvent.selectOptions(screen.getByLabelText('Ciclo'), '3');
  expect(screen.getByText(instrument.cycles[2].questions[0].text)).toBeInTheDocument();
  expect(screen.queryByText(instrument.cycles[0].questions[0].text)).not.toBeInTheDocument();
  expect(screen.getAllByRole('radio').every(input => !(input as HTMLInputElement).checked)).toBe(true);
});

test('encaminhamento substitui sem necessidade e permite múltiplas observações', async () => {
  renderForm();
  await fillAnswers();
  userEvent.click(screen.getByLabelText('Avaliação pela Psicologia'));
  userEvent.click(screen.getByLabelText('Contato ou diálogo com a família/responsável'));
  expect(screen.getByLabelText('Não há necessidade identificada no momento')).not.toBeChecked();
  userEvent.click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  await waitFor(() => expect(mockCreate).toHaveBeenCalled());
  expect(mockCreate.mock.calls[0][0].referrals).toEqual(['psychology', 'family']);
});

test('falha preserva formulário e usa o mesmo identificador ao tentar novamente', async () => {
  mockCreate.mockRejectedValueOnce(new Error('Tente novamente'));
  renderForm();
  await fillAnswers();
  userEvent.click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  await waitFor(() => expect(mockError).toHaveBeenCalledWith('Tente novamente'));
  userEvent.click(screen.getByRole('button', { name: 'Salvar avaliação' }));
  await waitFor(() => expect(mockCreate).toHaveBeenCalledTimes(2));
  expect(mockCreate.mock.calls[1][0].requestId).toBe(mockCreate.mock.calls[0][0].requestId);
  expect(mockCreate.mock.calls[1][0].studentName).toBe('Maria');
});
