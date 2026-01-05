import 'reflect-metadata';
import { container, DependencyContainer } from 'tsyringe';

/**
 * Thin wrapper around tsyringe to standardize dependency registration.
 * Keeps a single DI container shared across every module.
 */
export class DIContainer {
  private static instance: DependencyContainer = container;

  /**
   * Register a singleton implementation.
   */
  static registerSingleton<T>(token: string, implementation: new (...args: any[]) => T): void {
    this.instance.registerSingleton<T>(token, implementation);
    console.log(`DI: registered singleton '${token}'`);
  }

  /**
   * Register a transient implementation (new instance per resolve).
   */
  static register<T>(token: string, implementation: new (...args: any[]) => T): void {
    this.instance.register<T>(token, { useClass: implementation });
    console.log(`DI: registered '${token}'`);
  }

  /**
   * Register a specific instance.
   */
  static registerInstance<T>(token: string, instance: T): void {
    this.instance.registerInstance<T>(token, instance);
    console.log(`DI: registered instance '${token}'`);
  }

  /**
   * Resolve a dependency by token.
   */
  static resolve<T>(token: string): T {
    return this.instance.resolve<T>(token);
  }

  /**
   * Check if a token is already registered.
   */
  static isRegistered(token: string): boolean {
    return this.instance.isRegistered(token);
  }

  /**
   * Clear instances (useful for resetting state in tests).
   */
  static clear(): void {
    this.instance.clearInstances();
  }
}
