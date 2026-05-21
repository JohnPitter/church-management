import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { CreateTopicModal } from '../CreateTopicModal';

const mockCreateTopic = jest.fn();

jest.mock('@modules/content-management/forum/domain/entities/Forum', () => ({
  TopicStatus: { PUBLISHED: 'published' },
  TopicPriority: {
    LOW: 'low',
    NORMAL: 'normal',
    HIGH: 'high',
    URGENT: 'urgent',
  },
}));

jest.mock('@modules/content-management/forum/infrastructure/services/ForumService', () => ({
  forumService: {
    createTopic: (...args: any[]) => mockCreateTopic(...args),
  },
}));

const categories = [
  { id: 'cat-1', name: 'Geral', icon: 'A', isActive: true },
  { id: 'cat-2', name: 'Off', icon: 'B', isActive: false },
] as any;

describe('CreateTopicModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCreateTopic.mockResolvedValue(undefined);
  });

  it('nao renderiza quando fechado', () => {
    const { container } = render(
      <CreateTopicModal
        isOpen={false}
        onClose={jest.fn()}
        onTopicCreated={jest.fn()}
        currentUser={{}}
        categories={categories}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('valida formulario e cria topico com dados processados', async () => {
    const onTopicCreated = jest.fn();
    const onClose = jest.fn();

    render(
      <CreateTopicModal
        isOpen
        onClose={onClose}
        onTopicCreated={onTopicCreated}
        currentUser={{ id: 'u1', displayName: 'Maria', email: 'maria@test.com' }}
        categories={categories}
      />
    );

    expect(screen.getByText('Título é obrigatório')).toBeInTheDocument();

    fireEvent.change(screen.getByPlaceholderText('Digite o título do tópico'), {
      target: { value: 'Topico novo' },
    });
    fireEvent.change(screen.getByPlaceholderText('Escreva o conteúdo do tópico...'), {
      target: { value: 'Conteudo suficientemente grande para passar na validacao.' },
    });
    fireEvent.change(screen.getByDisplayValue('Selecione uma categoria'), {
      target: { value: 'cat-1' },
    });
    fireEvent.change(screen.getByPlaceholderText('discussão, ajuda, oração'), {
      target: { value: 'ajuda, geral' },
    });
    fireEvent.click(screen.getByLabelText(/Fixar tópico no topo/i));

    fireEvent.click(screen.getByRole('button', { name: 'Criar Tópico' }));

    await waitFor(() => {
      expect(mockCreateTopic).toHaveBeenCalledWith(
        expect.objectContaining({
          title: 'Topico novo',
          categoryId: 'cat-1',
          authorId: 'u1',
          authorName: 'Maria',
          tags: ['ajuda', 'geral'],
          isPinned: true,
        })
      );
      expect(onTopicCreated).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('reseta formulario ao fechar e trata erro de criacao', async () => {
    mockCreateTopic.mockRejectedValueOnce(new Error('fail'));
    const onClose = jest.fn();

    render(
      <CreateTopicModal
        isOpen
        onClose={onClose}
        onTopicCreated={jest.fn()}
        currentUser={{ id: 'u1' }}
        categories={categories}
      />
    );

    fireEvent.change(screen.getByPlaceholderText('Digite o título do tópico'), {
      target: { value: 'Outro topico' },
    });
    fireEvent.change(screen.getByPlaceholderText('Escreva o conteúdo do tópico...'), {
      target: { value: 'Conteudo suficientemente grande para passar na validacao.' },
    });
    fireEvent.change(screen.getByDisplayValue('Selecione uma categoria'), {
      target: { value: 'cat-1' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Criar Tópico' }));

    expect(await screen.findByText('Erro ao criar tópico. Tente novamente.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onClose).toHaveBeenCalled();
  });
});
