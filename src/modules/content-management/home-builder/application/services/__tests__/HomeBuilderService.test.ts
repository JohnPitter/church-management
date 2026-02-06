// Unit Tests - HomeBuilderService
// Tests for HomeBuilderService business logic and component management

import { HomeBuilderService } from '../HomeBuilderService';
import { FirebaseHomeBuilderRepository } from '../../../infrastructure/repositories/FirebaseHomeBuilderRepository';
import {
  HomeLayout,
  HomeComponent,
  ComponentType,
  HomeBuilderEntity,
  COMPONENT_TEMPLATES
} from '../../../domain/entities/HomeBuilder';

// Mock Firebase to prevent auth/invalid-api-key error in CI
jest.mock('firebase/firestore');
jest.mock('@/config/firebase', () => ({
  db: {}
}));

// Mock the repository
jest.mock('../../../infrastructure/repositories/FirebaseHomeBuilderRepository');

describe('HomeBuilderService', () => {
  let service: HomeBuilderService;
  let mockRepository: jest.Mocked<FirebaseHomeBuilderRepository>;

  const createTestLayout = (overrides: Partial<HomeLayout> = {}): HomeLayout => ({
    id: 'layout-1',
    name: 'Test Layout',
    description: 'Test description',
    components: [
      {
        id: 'comp-1',
        type: ComponentType.HERO,
        order: 1,
        enabled: true,
        settings: {
          title: 'Welcome',
          subtitle: 'Test subtitle'
        }
      },
      {
        id: 'comp-2',
        type: ComponentType.EVENTS,
        order: 2,
        enabled: true,
        settings: {
          title: 'Events',
          itemsToShow: 3
        }
      }
    ],
    globalSettings: {
      backgroundColor: '#ffffff',
      primaryColor: '#3b82f6'
    },
    isActive: false,
    isDefault: false,
    createdBy: 'user-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    version: 1,
    ...overrides
  });

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();

    // Create a new instance of the service
    service = new HomeBuilderService();

    // Get the mocked repository instance
    mockRepository = (service as any).repository as jest.Mocked<FirebaseHomeBuilderRepository>;
  });

  describe('createLayout', () => {
    it('should create a valid layout successfully', async () => {
      const layoutData = {
        name: 'New Layout',
        description: 'Description',
        components: [
          {
            id: 'comp-1',
            type: ComponentType.HERO,
            order: 1,
            enabled: true,
            settings: { title: 'Hero' }
          }
        ],
        isActive: false,
        isDefault: false,
        createdBy: 'user-1',
        version: 1
      };

      const expectedLayout = createTestLayout(layoutData);
      mockRepository.createLayout = jest.fn().mockResolvedValue(expectedLayout);

      const result = await service.createLayout(layoutData);

      expect(mockRepository.createLayout).toHaveBeenCalledWith(
        expect.objectContaining({
          name: layoutData.name,
          components: expect.any(Array)
        })
      );
      expect(result).toEqual(expectedLayout);
    });

    it('should reorder components before creating layout', async () => {
      const layoutData = {
        name: 'New Layout',
        components: [
          {
            id: 'comp-1',
            type: ComponentType.HERO,
            order: 5,
            enabled: true,
            settings: {}
          },
          {
            id: 'comp-2',
            type: ComponentType.EVENTS,
            order: 3,
            enabled: true,
            settings: {}
          }
        ],
        isActive: false,
        createdBy: 'user-1',
        version: 1
      };

      const expectedLayout = createTestLayout();
      mockRepository.createLayout = jest.fn().mockResolvedValue(expectedLayout);

      await service.createLayout(layoutData);

      expect(mockRepository.createLayout).toHaveBeenCalledWith(
        expect.objectContaining({
          components: expect.arrayContaining([
            expect.objectContaining({ order: 1 }),
            expect.objectContaining({ order: 2 })
          ])
        })
      );
    });

    it('should throw error for invalid layout (missing name)', async () => {
      const invalidLayout = {
        name: '',
        components: [
          {
            id: 'comp-1',
            type: ComponentType.HERO,
            order: 1,
            enabled: true,
            settings: {}
          }
        ],
        isActive: false,
        createdBy: 'user-1',
        version: 1
      };

      await expect(service.createLayout(invalidLayout)).rejects.toThrow('Nome do layout é obrigatório');
    });

    it('should throw error for layout without components', async () => {
      const invalidLayout = {
        name: 'Test Layout',
        components: [],
        isActive: false,
        createdBy: 'user-1',
        version: 1
      };

      await expect(service.createLayout(invalidLayout)).rejects.toThrow('Layout deve ter pelo menos um componente');
    });

    it('should handle repository errors gracefully', async () => {
      const layoutData = {
        name: 'Test Layout',
        components: [
          {
            id: 'comp-1',
            type: ComponentType.HERO,
            order: 1,
            enabled: true,
            settings: {}
          }
        ],
        isActive: false,
        createdBy: 'user-1',
        version: 1
      };

      mockRepository.createLayout = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(service.createLayout(layoutData)).rejects.toThrow('Database error');
    });
  });

  describe('updateLayout', () => {
    it('should update layout successfully', async () => {
      const existingLayout = createTestLayout({ version: 1 });
      const updates = { name: 'Updated Layout' };
      const updatedLayout = createTestLayout({ ...updates, version: 2 });

      mockRepository.getLayoutById = jest.fn().mockResolvedValue(existingLayout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(updatedLayout);

      const result = await service.updateLayout('layout-1', updates);

      expect(mockRepository.getLayoutById).toHaveBeenCalledWith('layout-1');
      expect(mockRepository.updateLayout).toHaveBeenCalledWith('layout-1', {
        ...updates,
        version: 2
      });
      expect(result.version).toBe(2);
    });

    it('should reorder components when updating components', async () => {
      const existingLayout = createTestLayout();
      const updates = {
        components: [
          {
            id: 'comp-1',
            type: ComponentType.HERO,
            order: 5,
            enabled: true,
            settings: {}
          },
          {
            id: 'comp-2',
            type: ComponentType.EVENTS,
            order: 3,
            enabled: true,
            settings: {}
          }
        ]
      };

      mockRepository.getLayoutById = jest.fn().mockResolvedValue(existingLayout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(createTestLayout(updates));

      await service.updateLayout('layout-1', updates);

      expect(mockRepository.updateLayout).toHaveBeenCalledWith('layout-1',
        expect.objectContaining({
          components: expect.arrayContaining([
            expect.objectContaining({ order: 1 }),
            expect.objectContaining({ order: 2 })
          ])
        })
      );
    });

    it('should increment version number', async () => {
      const existingLayout = createTestLayout({ version: 3 });
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(existingLayout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(createTestLayout({ version: 4 }));

      await service.updateLayout('layout-1', { name: 'Updated' });

      expect(mockRepository.updateLayout).toHaveBeenCalledWith('layout-1',
        expect.objectContaining({ version: 4 })
      );
    });

    it('should handle repository errors', async () => {
      mockRepository.getLayoutById = jest.fn().mockRejectedValue(new Error('Not found'));

      await expect(service.updateLayout('layout-1', { name: 'Updated' })).rejects.toThrow('Not found');
    });
  });

  describe('deleteLayout', () => {
    it('should delete non-active, non-default layout successfully', async () => {
      const layout = createTestLayout({ isActive: false, isDefault: false });
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.deleteLayout = jest.fn().mockResolvedValue(undefined);

      await service.deleteLayout('layout-1');

      expect(mockRepository.deleteLayout).toHaveBeenCalledWith('layout-1');
    });

    it('should throw error when trying to delete active layout', async () => {
      const activeLayout = createTestLayout({ isActive: true });
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(activeLayout);

      await expect(service.deleteLayout('layout-1')).rejects.toThrow('Não é possível excluir o layout ativo');
    });

    it('should throw error when trying to delete default layout', async () => {
      const defaultLayout = createTestLayout({ isDefault: true });
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(defaultLayout);

      await expect(service.deleteLayout('layout-1')).rejects.toThrow('Não é possível excluir o layout padrão');
    });

    it('should handle layout not found gracefully', async () => {
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(null);
      mockRepository.deleteLayout = jest.fn().mockResolvedValue(undefined);

      await service.deleteLayout('layout-1');

      expect(mockRepository.deleteLayout).toHaveBeenCalledWith('layout-1');
    });
  });

  describe('getLayoutById', () => {
    it('should retrieve layout by id', async () => {
      const layout = createTestLayout();
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);

      const result = await service.getLayoutById('layout-1');

      expect(mockRepository.getLayoutById).toHaveBeenCalledWith('layout-1');
      expect(result).toEqual(layout);
    });

    it('should return null for non-existent layout', async () => {
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(null);

      const result = await service.getLayoutById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('getAllLayouts', () => {
    it('should retrieve all layouts', async () => {
      const layouts = [createTestLayout({ id: '1' }), createTestLayout({ id: '2' })];
      mockRepository.getAllLayouts = jest.fn().mockResolvedValue(layouts);

      const result = await service.getAllLayouts();

      expect(mockRepository.getAllLayouts).toHaveBeenCalled();
      expect(result).toEqual(layouts);
      expect(result).toHaveLength(2);
    });

    it('should return empty array when no layouts exist', async () => {
      mockRepository.getAllLayouts = jest.fn().mockResolvedValue([]);

      const result = await service.getAllLayouts();

      expect(result).toEqual([]);
    });
  });

  describe('getActiveLayout', () => {
    it('should retrieve the active layout', async () => {
      const activeLayout = createTestLayout({ isActive: true });
      mockRepository.getActiveLayout = jest.fn().mockResolvedValue(activeLayout);

      const result = await service.getActiveLayout();

      expect(mockRepository.getActiveLayout).toHaveBeenCalled();
      expect(result).toEqual(activeLayout);
      expect(result?.isActive).toBe(true);
    });

    it('should return null when no active layout exists', async () => {
      mockRepository.getActiveLayout = jest.fn().mockResolvedValue(null);

      const result = await service.getActiveLayout();

      expect(result).toBeNull();
    });
  });

  describe('ensureDefaultLayout', () => {
    it('should return existing active layout', async () => {
      const activeLayout = createTestLayout({ isActive: true });
      mockRepository.getActiveLayout = jest.fn().mockResolvedValue(activeLayout);

      const result = await service.ensureDefaultLayout();

      expect(mockRepository.getActiveLayout).toHaveBeenCalled();
      expect(mockRepository.createLayout).not.toHaveBeenCalled();
      expect(result).toEqual(activeLayout);
    });

    it('should create default layout if none exists', async () => {
      const defaultLayout = createTestLayout({ isActive: true, isDefault: true });
      mockRepository.getActiveLayout = jest.fn().mockResolvedValue(null);
      mockRepository.createLayout = jest.fn().mockResolvedValue(defaultLayout);
      mockRepository.setActiveLayout = jest.fn().mockResolvedValue(undefined);

      const result = await service.ensureDefaultLayout();

      expect(mockRepository.getActiveLayout).toHaveBeenCalled();
      expect(mockRepository.createLayout).toHaveBeenCalled();
      expect(mockRepository.setActiveLayout).toHaveBeenCalledWith(defaultLayout.id);
      expect(result).toEqual(defaultLayout);
    });
  });

  describe('setActiveLayout', () => {
    it('should set layout as active', async () => {
      const layout = createTestLayout();
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.setActiveLayout = jest.fn().mockResolvedValue(undefined);

      await service.setActiveLayout('layout-1');

      expect(mockRepository.getLayoutById).toHaveBeenCalledWith('layout-1');
      expect(mockRepository.setActiveLayout).toHaveBeenCalledWith('layout-1');
    });

    it('should throw error if layout not found', async () => {
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(null);

      await expect(service.setActiveLayout('non-existent')).rejects.toThrow('Layout não encontrado');
    });
  });

  describe('deactivateLayout', () => {
    it('should deactivate the active layout', async () => {
      mockRepository.setActiveLayout = jest.fn().mockResolvedValue(undefined);

      await service.deactivateLayout();

      expect(mockRepository.setActiveLayout).toHaveBeenCalledWith(null);
    });

    it('should handle repository errors', async () => {
      mockRepository.setActiveLayout = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(service.deactivateLayout()).rejects.toThrow('Database error');
    });
  });

  describe('duplicateLayout', () => {
    it('should duplicate a layout', async () => {
      const originalLayout = createTestLayout();
      const duplicatedLayout = createTestLayout({
        id: 'layout-2',
        name: 'Copy of Test Layout',
        isActive: false,
        isDefault: false
      });

      mockRepository.duplicateLayout = jest.fn().mockResolvedValue(duplicatedLayout);

      const result = await service.duplicateLayout('layout-1', 'Copy of Test Layout', 'user-2');

      expect(mockRepository.duplicateLayout).toHaveBeenCalledWith('layout-1', 'Copy of Test Layout', 'user-2');
      expect(result).toEqual(duplicatedLayout);
    });
  });

  describe('getLayoutsByUser', () => {
    it('should retrieve layouts by user', async () => {
      const userLayouts = [
        createTestLayout({ id: '1', createdBy: 'user-1' }),
        createTestLayout({ id: '2', createdBy: 'user-1' })
      ];
      mockRepository.getLayoutsByUser = jest.fn().mockResolvedValue(userLayouts);

      const result = await service.getLayoutsByUser('user-1');

      expect(mockRepository.getLayoutsByUser).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(userLayouts);
      expect(result).toHaveLength(2);
    });
  });

  describe('addComponent', () => {
    it('should add a component to layout', async () => {
      const layout = createTestLayout();
      const updatedLayout = createTestLayout({
        components: [
          ...layout.components,
          {
            id: 'comp-3',
            type: ComponentType.BLOG,
            order: 3,
            enabled: true,
            settings: { title: 'Blog' }
          }
        ]
      });

      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(updatedLayout);

      const result = await service.addComponent('layout-1', ComponentType.BLOG);

      expect(mockRepository.getLayoutById).toHaveBeenCalledWith('layout-1');
      expect(result.components).toHaveLength(3);
    });

    it('should add component with specified order', async () => {
      const layout = createTestLayout();
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(layout);

      await service.addComponent('layout-1', ComponentType.BLOG, 1);

      expect(mockRepository.updateLayout).toHaveBeenCalled();
    });

    it('should throw error if layout not found', async () => {
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(null);

      await expect(service.addComponent('layout-1', ComponentType.BLOG)).rejects.toThrow('Layout não encontrado');
    });

    it('should throw error for invalid component type', async () => {
      const layout = createTestLayout();
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);

      await expect(service.addComponent('layout-1', 'invalid' as ComponentType)).rejects.toThrow('Tipo de componente inválido');
    });

    it('should use template default settings', async () => {
      const layout = createTestLayout();
      const template = COMPONENT_TEMPLATES.find(t => t.type === ComponentType.HERO);

      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(layout);

      await service.addComponent('layout-1', ComponentType.HERO);

      expect(mockRepository.updateLayout).toHaveBeenCalledWith('layout-1',
        expect.objectContaining({
          components: expect.arrayContaining([
            expect.objectContaining({
              type: ComponentType.HERO,
              settings: expect.objectContaining(template?.defaultSettings || {})
            })
          ])
        })
      );
    });
  });

  describe('removeComponent', () => {
    it('should remove a component from layout', async () => {
      const layout = createTestLayout();
      const updatedLayout = createTestLayout({
        components: [layout.components[0]]
      });

      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(updatedLayout);

      const result = await service.removeComponent('layout-1', 'comp-2');

      expect(mockRepository.getLayoutById).toHaveBeenCalledWith('layout-1');
      expect(result.components).toHaveLength(1);
      expect(result.components.find(c => c.id === 'comp-2')).toBeUndefined();
    });

    it('should throw error if layout not found', async () => {
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(null);

      await expect(service.removeComponent('layout-1', 'comp-1')).rejects.toThrow('Layout não encontrado');
    });

    it('should reorder remaining components', async () => {
      const layout = createTestLayout({
        components: [
          { id: 'comp-1', type: ComponentType.HERO, order: 1, enabled: true, settings: {} },
          { id: 'comp-2', type: ComponentType.EVENTS, order: 2, enabled: true, settings: {} },
          { id: 'comp-3', type: ComponentType.BLOG, order: 3, enabled: true, settings: {} }
        ]
      });

      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(layout);

      await service.removeComponent('layout-1', 'comp-2');

      expect(mockRepository.updateLayout).toHaveBeenCalledWith('layout-1',
        expect.objectContaining({
          components: expect.arrayContaining([
            expect.objectContaining({ order: 1 }),
            expect.objectContaining({ order: 2 })
          ])
        })
      );
    });
  });

  describe('updateComponent', () => {
    it('should update a component', async () => {
      const layout = createTestLayout();
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(layout);

      await service.updateComponent('layout-1', 'comp-1', {
        settings: { title: 'Updated Title' }
      });

      expect(mockRepository.getLayoutById).toHaveBeenCalledWith('layout-1');
      expect(mockRepository.updateLayout).toHaveBeenCalledWith('layout-1',
        expect.objectContaining({
          components: expect.arrayContaining([
            expect.objectContaining({
              id: 'comp-1',
              settings: expect.objectContaining({ title: 'Updated Title' })
            })
          ])
        })
      );
    });

    it('should throw error if layout not found', async () => {
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(null);

      await expect(service.updateComponent('layout-1', 'comp-1', {})).rejects.toThrow('Layout não encontrado');
    });

    it('should preserve other component properties', async () => {
      const layout = createTestLayout();
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(layout);

      await service.updateComponent('layout-1', 'comp-1', { enabled: false });

      expect(mockRepository.updateLayout).toHaveBeenCalledWith('layout-1',
        expect.objectContaining({
          components: expect.arrayContaining([
            expect.objectContaining({
              id: 'comp-1',
              type: ComponentType.HERO,
              enabled: false,
              settings: expect.any(Object)
            })
          ])
        })
      );
    });
  });

  describe('reorderComponents', () => {
    it('should reorder components correctly', async () => {
      const layout = createTestLayout({
        components: [
          { id: 'comp-1', type: ComponentType.HERO, order: 1, enabled: true, settings: {} },
          { id: 'comp-2', type: ComponentType.EVENTS, order: 2, enabled: true, settings: {} },
          { id: 'comp-3', type: ComponentType.BLOG, order: 3, enabled: true, settings: {} }
        ]
      });

      const newOrder = [
        { id: 'comp-3', order: 1 },
        { id: 'comp-1', order: 2 },
        { id: 'comp-2', order: 3 }
      ];

      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(layout);

      await service.reorderComponents('layout-1', newOrder);

      expect(mockRepository.updateLayout).toHaveBeenCalledWith('layout-1',
        expect.objectContaining({
          components: expect.arrayContaining([
            expect.objectContaining({ id: 'comp-3', order: 1 }),
            expect.objectContaining({ id: 'comp-1', order: 2 }),
            expect.objectContaining({ id: 'comp-2', order: 3 })
          ])
        })
      );
    });

    it('should throw error if layout not found', async () => {
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(null);

      await expect(service.reorderComponents('layout-1', [])).rejects.toThrow('Layout não encontrado');
    });

    it('should handle partial reordering', async () => {
      const layout = createTestLayout({
        components: [
          { id: 'comp-1', type: ComponentType.HERO, order: 1, enabled: true, settings: {} },
          { id: 'comp-2', type: ComponentType.EVENTS, order: 2, enabled: true, settings: {} }
        ]
      });

      const newOrder = [{ id: 'comp-1', order: 5 }];

      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(layout);

      await service.reorderComponents('layout-1', newOrder);

      expect(mockRepository.updateLayout).toHaveBeenCalled();
    });
  });

  describe('toggleComponent', () => {
    it('should toggle component enabled state to false', async () => {
      const layout = createTestLayout();
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(layout);

      await service.toggleComponent('layout-1', 'comp-1');

      expect(mockRepository.updateLayout).toHaveBeenCalledWith('layout-1',
        expect.objectContaining({
          components: expect.arrayContaining([
            expect.objectContaining({
              id: 'comp-1',
              enabled: false
            })
          ])
        })
      );
    });

    it('should toggle component enabled state to true', async () => {
      const layout = createTestLayout({
        components: [
          {
            id: 'comp-1',
            type: ComponentType.HERO,
            order: 1,
            enabled: false,
            settings: {}
          }
        ]
      });

      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);
      mockRepository.updateLayout = jest.fn().mockResolvedValue(layout);

      await service.toggleComponent('layout-1', 'comp-1');

      expect(mockRepository.updateLayout).toHaveBeenCalledWith('layout-1',
        expect.objectContaining({
          components: expect.arrayContaining([
            expect.objectContaining({
              id: 'comp-1',
              enabled: true
            })
          ])
        })
      );
    });

    it('should throw error if layout not found', async () => {
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(null);

      await expect(service.toggleComponent('layout-1', 'comp-1')).rejects.toThrow('Layout não encontrado');
    });

    it('should throw error if component not found', async () => {
      const layout = createTestLayout();
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);

      await expect(service.toggleComponent('layout-1', 'non-existent')).rejects.toThrow('Componente não encontrado');
    });
  });

  describe('getComponentTemplates', () => {
    it('should return all component templates', () => {
      const templates = service.getComponentTemplates();

      expect(templates).toBeDefined();
      expect(Array.isArray(templates)).toBe(true);
      expect(templates.length).toBeGreaterThan(0);
      expect(templates).toEqual(COMPONENT_TEMPLATES);
    });
  });

  describe('getComponentTemplatesByCategory', () => {
    it('should return templates filtered by category', () => {
      const contentTemplates = service.getComponentTemplatesByCategory('content');

      expect(contentTemplates).toBeDefined();
      expect(Array.isArray(contentTemplates)).toBe(true);
      expect(contentTemplates.every(t => t.category === 'content')).toBe(true);
    });

    it('should return media category templates', () => {
      const mediaTemplates = service.getComponentTemplatesByCategory('media');

      expect(mediaTemplates.length).toBeGreaterThan(0);
      expect(mediaTemplates.every(t => t.category === 'media')).toBe(true);
    });

    it('should return empty array for non-existent category', () => {
      const templates = service.getComponentTemplatesByCategory('non-existent' as any);

      expect(templates).toEqual([]);
    });
  });

  describe('getComponentTemplate', () => {
    it('should return template for specific component type', () => {
      const heroTemplate = service.getComponentTemplate(ComponentType.HERO);

      expect(heroTemplate).toBeDefined();
      expect(heroTemplate?.type).toBe(ComponentType.HERO);
      expect(heroTemplate?.name).toBeDefined();
      expect(heroTemplate?.defaultSettings).toBeDefined();
    });

    it('should return undefined for invalid component type', () => {
      const template = service.getComponentTemplate('invalid' as ComponentType);

      expect(template).toBeUndefined();
    });
  });

  describe('exportLayout', () => {
    it('should export layout as JSON string', async () => {
      const layout = createTestLayout();
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);

      const result = await service.exportLayout('layout-1');

      expect(mockRepository.getLayoutById).toHaveBeenCalledWith('layout-1');
      expect(typeof result).toBe('string');

      const parsed = JSON.parse(result);
      expect(parsed.id).toBe(layout.id);
      expect(parsed.name).toBe(layout.name);
    });

    it('should throw error if layout not found', async () => {
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(null);

      await expect(service.exportLayout('layout-1')).rejects.toThrow('Layout não encontrado');
    });

    it('should format JSON with proper indentation', async () => {
      const layout = createTestLayout();
      mockRepository.getLayoutById = jest.fn().mockResolvedValue(layout);

      const result = await service.exportLayout('layout-1');

      expect(result).toContain('\n');
      expect(result).toContain('  ');
    });
  });

  describe('importLayout', () => {
    it('should import layout from JSON string', async () => {
      const layout = createTestLayout();
      const jsonData = JSON.stringify(layout);
      const importedLayout = createTestLayout({
        name: `${layout.name} (Importado)`,
        isActive: false,
        isDefault: false,
        version: 1
      });

      mockRepository.createLayout = jest.fn().mockResolvedValue(importedLayout);

      const result = await service.importLayout(jsonData, 'user-2');

      expect(mockRepository.createLayout).toHaveBeenCalledWith(
        expect.objectContaining({
          name: `${layout.name} (Importado)`,
          isActive: false,
          isDefault: false,
          createdBy: 'user-2',
          version: 1
        })
      );
      expect(result).toEqual(importedLayout);
    });

    it('should throw error for invalid JSON', async () => {
      const invalidJson = 'not valid json';

      await expect(service.importLayout(invalidJson, 'user-1')).rejects.toThrow('Erro ao importar layout');
    });

    it('should set imported layout as inactive', async () => {
      const layout = createTestLayout({ isActive: true });
      const jsonData = JSON.stringify(layout);

      mockRepository.createLayout = jest.fn().mockResolvedValue(layout);

      await service.importLayout(jsonData, 'user-2');

      expect(mockRepository.createLayout).toHaveBeenCalledWith(
        expect.objectContaining({ isActive: false })
      );
    });
  });

  describe('createBackup', () => {
    it('should create backup of all layouts', async () => {
      const layouts = [
        createTestLayout({ id: '1' }),
        createTestLayout({ id: '2' })
      ];
      mockRepository.getAllLayouts = jest.fn().mockResolvedValue(layouts);

      const result = await service.createBackup();

      expect(mockRepository.getAllLayouts).toHaveBeenCalled();
      expect(result).toEqual(layouts);
      expect(result).toHaveLength(2);
    });

    it('should handle empty layouts', async () => {
      mockRepository.getAllLayouts = jest.fn().mockResolvedValue([]);

      const result = await service.createBackup();

      expect(result).toEqual([]);
    });
  });

  describe('restoreFromBackup', () => {
    it('should restore layouts from backup', async () => {
      const layouts = [
        createTestLayout({ id: '1', name: 'Layout 1' }),
        createTestLayout({ id: '2', name: 'Layout 2' })
      ];

      mockRepository.createLayout = jest.fn()
        .mockResolvedValueOnce(createTestLayout({ name: 'Layout 1 (Restaurado)' }))
        .mockResolvedValueOnce(createTestLayout({ name: 'Layout 2 (Restaurado)' }));

      await service.restoreFromBackup(layouts, 'user-1');

      expect(mockRepository.createLayout).toHaveBeenCalledTimes(2);
      expect(mockRepository.createLayout).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'Layout 1 (Restaurado)',
          isActive: false,
          isDefault: false,
          createdBy: 'user-1'
        })
      );
    });

    it('should handle empty backup', async () => {
      await service.restoreFromBackup([], 'user-1');

      expect(mockRepository.createLayout).not.toHaveBeenCalled();
    });

    it('should handle restoration errors', async () => {
      const layouts = [createTestLayout()];
      mockRepository.createLayout = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(service.restoreFromBackup(layouts, 'user-1')).rejects.toThrow('Database error');
    });
  });
});
