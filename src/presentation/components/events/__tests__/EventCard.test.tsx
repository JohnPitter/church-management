import { fireEvent, render, screen } from '@testing-library/react';
import { EventCard } from '../EventCard';
import { EventStatus } from '../../../../modules/church-management/events/domain/entities/Event';

jest.mock('../../common/LoadingButton', () => ({
  LoadingButton: ({ children, onClick }: any) => <button onClick={onClick}>{children}</button>,
}));

const baseEvent = {
  id: 'evt-1',
  title: 'Evento Teste',
  description: 'Descricao do evento',
  date: new Date('2099-03-12T10:00:00'),
  time: '10:00',
  location: 'Templo',
  category: { name: 'Culto', color: '#ff0000' },
  isPublic: true,
  requiresConfirmation: true,
  responsible: 'resp',
  status: EventStatus.Scheduled,
  createdAt: new Date('2026-03-01T10:00:00'),
  updatedAt: new Date('2026-03-01T10:00:00'),
  createdBy: 'admin',
} as any;

describe('EventCard', () => {
  it('renderiza informacoes principais e badge de urgencia', () => {
    render(<EventCard event={{ ...baseEvent, date: new Date(Date.now() + 2 * 86400000) }} />);

    expect(screen.getByText('Culto')).toBeInTheDocument();
    expect(screen.getByText('Evento Teste')).toBeInTheDocument();
    expect(screen.getByText('Templo')).toBeInTheDocument();
    expect(screen.getByText('Descricao do evento')).toBeInTheDocument();
  });

  it('renderiza acoes e streaming quando aplicavel', () => {
    const onConfirmAttendance = jest.fn();
    const onViewDetails = jest.fn();

    render(
      <EventCard
        event={{ ...baseEvent, streamingURL: 'https://example.com', maxParticipants: 20 }}
        onConfirmAttendance={onConfirmAttendance}
        onViewDetails={onViewDetails}
        hasConfirmed
      />
    );

    fireEvent.click(screen.getByText('Ver detalhes'));
    fireEvent.click(screen.getByRole('button', { name: /Confirmado/i }));

    expect(onViewDetails).toHaveBeenCalled();
    expect(onConfirmAttendance).toHaveBeenCalled();
    expect(screen.getByText('Transmissão ao vivo disponível')).toBeInTheDocument();
    expect(screen.getByText('Limite de participantes: 20')).toBeInTheDocument();
  });

  it('mostra estado de evento encerrado e oculta descricao em modo compacto', () => {
    render(
      <EventCard
        event={{
          ...baseEvent,
          date: new Date('2000-03-01T10:00:00'),
          status: EventStatus.Completed,
        }}
        compact
      />
    );

    expect(screen.getByText('Evento encerrado')).toBeInTheDocument();
    expect(screen.queryByText('Descricao do evento')).not.toBeInTheDocument();
  });
});
