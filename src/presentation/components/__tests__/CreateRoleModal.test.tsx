import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreateRoleModal } from '../CreateRoleModal';

jest.mock('@/domain/entities/Permission', () => ({
  SystemModule: {
    Users: 'users',
    Events: 'events',
  },
  PermissionAction: {
    View: 'view',
    Create: 'create',
  },
  PermissionManager: {
    getAllModules: () => ['users', 'events'],
    getAllActions: () => ['view', 'create'],
    getModuleLabel: (value: string) => value.toUpperCase(),
    getActionLabel: (value: string) => value.toUpperCase(),
  },
}));

describe('CreateRoleModal', () => {
  it('nao renderiza quando fechado', () => {
    const { container } = render(
      <CreateRoleModal
        isOpen={false}
        onClose={jest.fn()}
        onCreateRole={jest.fn()}
        loading={false}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('valida campos obrigatorios e cria funcao', async () => {
    const onCreateRole = jest.fn().mockResolvedValue(undefined);
    const onClose = jest.fn();

    render(
      <CreateRoleModal
        isOpen
        onClose={onClose}
        onCreateRole={onCreateRole}
        loading={false}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: 'Criar Função' }));
    expect(screen.getByText('Nome da função é obrigatório')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Nome da Função *'), { target: { value: 'Coordenador' } });
    fireEvent.change(screen.getByLabelText('Nome de Exibição *'), { target: { value: 'Coord.' } });
    fireEvent.change(screen.getByLabelText('Descrição *'), { target: { value: 'Responsavel por projetos' } });
    fireEvent.click(screen.getAllByRole('checkbox')[1]);

    fireEvent.click(screen.getByRole('button', { name: 'Criar Função' }));

    await waitFor(() => {
      expect(onCreateRole).toHaveBeenCalledWith({
        roleName: 'Coordenador',
        displayName: 'Coord.',
        description: 'Responsavel por projetos',
        modules: [{ module: 'users', actions: ['view'] }],
      });
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('carrega modo de edicao e salva alteracoes', async () => {
    const onUpdateRole = jest.fn().mockResolvedValue(undefined);

    render(
      <CreateRoleModal
        isOpen
        onClose={jest.fn()}
        onCreateRole={jest.fn()}
        onUpdateRole={onUpdateRole}
        loading={false}
        editingRole={{
          roleId: 'coord',
          displayName: 'Coordenador',
          description: 'Desc',
          modules: [{ module: 'events' as any, actions: ['view' as any] }],
        } as any}
      />
    );

    expect(screen.getByDisplayValue('coord')).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Nome de Exibição *'), { target: { value: 'Coordenador Geral' } });
    fireEvent.click(screen.getByRole('button', { name: 'Salvar Alterações' }));

    await waitFor(() => {
      expect(onUpdateRole).toHaveBeenCalledWith('coord', {
        displayName: 'Coordenador Geral',
        description: 'Desc',
        modules: [{ module: 'events', actions: ['view'] }],
      });
    });
  });
});
