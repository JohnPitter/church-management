import { DomainEvent, EventBus, eventBus } from '../EventBus';

const createEvent = (eventType: string): DomainEvent => ({
  eventType,
  eventId: `${eventType}-1`,
  occurredAt: new Date('2024-01-01T12:00:00Z'),
  payload: { ok: true },
});

describe('EventBus', () => {
  let bus: EventBus;
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    bus = EventBus.getInstance();
    bus.clear();
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  });

  afterEach(() => {
    bus.clear();
    jest.restoreAllMocks();
  });

  it('mantem um singleton compartilhado', () => {
    expect(EventBus.getInstance()).toBe(EventBus.getInstance());
    expect(eventBus).toBe(EventBus.getInstance());
  });

  it('inscreve, publica e remove handlers', async () => {
    const handler = jest.fn();
    const event = createEvent('member.created');

    bus.subscribe(event.eventType, handler);

    expect(bus.getHandlerCount(event.eventType)).toBe(1);

    await bus.publish(event);

    expect(handler).toHaveBeenCalledWith(event);
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "EventBus: handler registered for 'member.created'"
    );
    expect(consoleLogSpy).toHaveBeenCalledWith(
      "EventBus: publishing 'member.created' to 1 handler(s)"
    );

    bus.unsubscribe(event.eventType, handler);

    expect(bus.getHandlerCount(event.eventType)).toBe(0);
  });

  it('ignora unsubscribe sem handlers e captura erros de handlers', async () => {
    const failingHandler = jest.fn().mockRejectedValue(new Error('boom'));
    const event = createEvent('member.updated');

    bus.unsubscribe(event.eventType, failingHandler);
    bus.subscribe(event.eventType, failingHandler);

    await bus.publish(event);

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "EventBus: handler failure for 'member.updated'",
      expect.any(Error)
    );

    bus.clear();
    expect(bus.getHandlerCount(event.eventType)).toBe(0);
  });
});
