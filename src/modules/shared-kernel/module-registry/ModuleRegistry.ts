/**
 * Central registry to manage module lifecycle and dependencies.
 * Each module registers itself here and is initialized in dependency order.
 */
export interface ModuleConfig {
  name: string;
  version: string;
  dependencies: string[];
}

export interface ModuleDefinition {
  config: ModuleConfig;
  register(): void;
  initialize(): Promise<void>;
}

export class ModuleRegistry {
  private static modules: Map<string, ModuleDefinition> = new Map();
  private static initialized: Set<string> = new Set();

  /**
   * Register a module in the registry and run its registration hook.
   */
  static register(module: ModuleDefinition): void {
    const { name, dependencies } = module.config;

    for (const dependency of dependencies) {
      if (!this.modules.has(dependency)) {
        console.warn(`Module '${name}' declares dependency '${dependency}' which is not registered yet`);
      }
    }

    this.modules.set(name, module);
    console.log(`ModuleRegistry: registered module '${name}' v${module.config.version}`);

    module.register();
  }

  /**
   * Initialize a module and its dependencies (depth-first).
   */
  static async initialize(moduleName: string): Promise<void> {
    const module = this.modules.get(moduleName);

    if (!module) {
      throw new Error(`Module '${moduleName}' not found in registry`);
    }

    if (this.initialized.has(moduleName)) {
      return;
    }

    for (const dependency of module.config.dependencies) {
      await this.initialize(dependency);
    }

    console.log(`ModuleRegistry: initializing module '${moduleName}'...`);
    await module.initialize();
    this.initialized.add(moduleName);
    console.log(`ModuleRegistry: module '${moduleName}' initialized`);
  }

  /**
   * Initialize every module currently registered.
   */
  static async initializeAll(): Promise<void> {
    console.log(`ModuleRegistry: initializing ${this.modules.size} module(s)...`);
    for (const moduleName of this.modules.keys()) {
      await this.initialize(moduleName);
    }
    console.log('ModuleRegistry: all modules initialized');
  }

  /**
   * Fetch a registered module definition.
   */
  static getModule(moduleName: string): ModuleDefinition | undefined {
    return this.modules.get(moduleName);
  }

  /**
   * List all registered module configs.
   */
  static listModules(): ModuleConfig[] {
    return Array.from(this.modules.values()).map((module) => module.config);
  }

  /**
   * Clear registry state (useful for tests or reboots).
   */
  static clear(): void {
    this.modules.clear();
    this.initialized.clear();
  }
}
