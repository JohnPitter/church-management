/**
 * Simple publish/subscribe event bus for cross-module communication.
 * Follows a minimal Domain Event contract to keep modules decoupled.
 */
export interface DomainEvent {
  eventType: string;
  eventId: string;
  occurredAt: Date;
  payload: unknown;
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

export class EventBus {
  private static instance: EventBus;
  private readonly handlers: Map<string, EventHandler[]> = new Map();

  private constructor() {}

  /**
   * Singleton accessor to keep a single bus instance across the app.
   */
  static getInstance(): EventBus {
    if (!EventBus.instance) {
      EventBus.instance = new EventBus();
    }
    return EventBus.instance;
  }

  /**
   * Register a handler for a specific event type.
   */
  subscribe(eventType: string, handler: EventHandler): void {
    if (!this.handlers.has(eventType)) {
      this.handlers.set(eventType, []);
    }
    this.handlers.get(eventType)!.push(handler);
    // Log registration to help debug module wiring.
    console.log(`EventBus: handler registered for '${eventType}'`);
  }

  /**
   * Remove a handler from a specific event type.
   */
  unsubscribe(eventType: string, handler: EventHandler): void {
    const handlers = this.handlers.get(eventType);
    if (!handlers) {
      return;
    }

    const index = handlers.indexOf(handler);
    if (index >= 0) {
      handlers.splice(index, 1);
    }
  }

  /**
   * Publish an event to every handler registered for that type.
   */
  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.eventType) ?? [];
    console.log(`EventBus: publishing '${event.eventType}' to ${handlers.length} handler(s)`);

    const executions = handlers.map(async (handler) => {
      try {
        await handler(event);
      } catch (error) {
        console.error(`EventBus: handler failure for '${event.eventType}'`, error);
      }
    });

    await Promise.all(executions);
  }

  /**
   * Clear every handler. Useful in tests to reset global state.
   */
  clear(): void {
    this.handlers.clear();
  }

  /**
   * Return how many handlers are currently wired for a given event type.
   */
  getHandlerCount(eventType: string): number {
    return this.handlers.get(eventType)?.length ?? 0;
  }
}

// Export a singleton instance to ease consumption across modules.
export const eventBus = EventBus.getInstance();
