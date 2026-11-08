import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PedagogyRosterPanel from '../PedagogyRosterPanel';
import { PedagogyOrganization } from '@modules/pedagogy/domain/entities/Pedagogy';
import { pedagogyService } from '@modules/pedagogy/application/services/PedagogyService';

jest.mock('react-hot-toast', () => {
  const toast: any = jest.fn();
  toast.success = jest.fn();
  toast.error = jest.fn();
  return { __esModule: true, default: toast };
});

jest.mock('@modules/pedagogy/application/services/PedagogyService', () => ({
  pedagogyService: {
    createRoster: jest.fn(),
    addStudentToRoster: jest.fn(),
    renameStudentInRoster: jest.fn(),
    renameClassGroup: jest.fn(),
    changeRosterOrganization: jest.fn(),
    removeStudentFromRoster: jest.fn(),
    moveStudent: jest.fn(),
    copyStudent: jest.fn(),
    deleteRoster: jest.fn()
  }
}));

const service = pedagogyService as jest.Mocked<typeof pedagogyService>;

const roster = {
  id: 'r1',
  organization: PedagogyOrganization.Church,
  classGroup: 'Clube da leitura',
  students: ['Maria Silva'],
  createdBy: 'u1',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('PedagogyRosterPanel', () => {
  beforeEach(() => jest.clearAllMocks());

  it('salva nome da turma, nomes de alunos e aluno novo com um único botão', async () => {
    const onSaved = jest.fn().mockResolvedValue(undefined);
    render(
      <PedagogyRosterPanel
        organization={PedagogyOrganization.Church}
        rosters={[roster]}
        createdBy="u1"
        onSaved={onSaved}
        fieldClass=""
      />
    );

    fireEvent.change(screen.getByDisplayValue('Clube da leitura'), { target: { value: 'Leitura 2' } });
    fireEvent.change(screen.getByDisplayValue('Maria Silva'), { target: { value: 'Maria S. Silva' } });
    fireEvent.change(screen.getByPlaceholderText('Adicionar aluno'), { target: { value: 'João Santos' } });
    fireEvent.click(screen.getByText('Salvar alterações da turma'));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(service.renameClassGroup).toHaveBeenCalledWith('r1', 'Leitura 2');
    expect(service.renameStudentInRoster).toHaveBeenCalledWith('r1', 'Maria Silva', 'Maria S. Silva');
    expect(service.addStudentToRoster).toHaveBeenCalledWith('r1', 'João Santos');
  });

  it('adiciona aluno ao apertar Enter no campo', async () => {
    const onSaved = jest.fn().mockResolvedValue(undefined);
    render(
      <PedagogyRosterPanel
        organization={PedagogyOrganization.Church}
        rosters={[roster]}
        createdBy="u1"
        onSaved={onSaved}
        fieldClass=""
      />
    );
    const input = screen.getByPlaceholderText('Adicionar aluno');
    fireEvent.change(input, { target: { value: 'Ana' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    await waitFor(() => expect(service.addStudentToRoster).toHaveBeenCalledWith('r1', 'Ana'));
  });
});
