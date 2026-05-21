import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DepartmentActionsMenu } from '../DepartmentActionsMenu';

const mockConfirm = jest.fn();

jest.mock('../ConfirmDialog', () => ({
  useConfirmDialog: () => ({
    confirm: mockConfirm,
  }),
}));

const department = {
  id: 'dept-1',
  name: 'Departamento Jovem',
  isActive: true,
  initialBalance: 100,
  responsibleName: 'Maria',
} as any;

describe('DepartmentActionsMenu', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConfirm.mockResolvedValue(true);
  });

  it('abre menu, edita e fecha ao clicar fora', async () => {
    const onEdit = jest.fn();
    const onToggleActive = jest.fn();

    render(
      <DepartmentActionsMenu
        department={department}
        onEdit={onEdit}
        onToggleActive={onToggleActive}
        onOpenHistory={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Editar Departamento/i }));

    expect(onEdit).toHaveBeenCalledWith(department);

    fireEvent.click(screen.getByRole('button'));
    fireEvent.mouseDown(document.body);

    await waitFor(() => {
      expect(screen.queryByRole('menuitem', { name: /Editar Departamento/i })).not.toBeInTheDocument();
    });
  });

  it('confirma desativacao e mostra informacoes do departamento', async () => {
    const onEdit = jest.fn();
    const onToggleActive = jest.fn();

    render(
      <DepartmentActionsMenu
        department={department}
        onEdit={onEdit}
        onToggleActive={onToggleActive}
        onOpenHistory={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));

    expect(screen.getByText('Saldo inicial: R$ 100.00')).toBeInTheDocument();
    expect(screen.getByText('Responsável: Maria')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('menuitem', { name: /Desativar Departamento/i }));

    await waitFor(() => {
      expect(mockConfirm).toHaveBeenCalled();
      expect(onToggleActive).toHaveBeenCalledWith(department);
    });
  });

  it('mostra acao de reativar quando o departamento esta inativo', async () => {
    const onToggleActive = jest.fn();
    mockConfirm.mockResolvedValue(false);

    render(
      <DepartmentActionsMenu
        department={{ ...department, isActive: false }}
        onEdit={jest.fn()}
        onToggleActive={onToggleActive}
        onOpenHistory={jest.fn()}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Reativar Departamento/i }));

    await waitFor(() => {
      expect(onToggleActive).not.toHaveBeenCalled();
    });
  });

  it('abre historico completo pelo menu', () => {
    const onOpenHistory = jest.fn();

    render(
      <DepartmentActionsMenu
        department={department}
        onEdit={jest.fn()}
        onToggleActive={jest.fn()}
        onOpenHistory={onOpenHistory}
      />
    );

    fireEvent.click(screen.getByRole('button'));
    fireEvent.click(screen.getByRole('menuitem', { name: /Histórico Completo/i }));

    expect(onOpenHistory).toHaveBeenCalledWith(department);
  });
});
