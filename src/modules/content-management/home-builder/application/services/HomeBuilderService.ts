// Infrastructure Service - Home Builder Service
// Service for managing home page builder functionality

import { FirebaseHomeBuilderRepository } from '@modules/content-management/home-builder/infrastructure/repositories/FirebaseHomeBuilderRepository';
import { 
  HomeLayout, 
  HomeComponent, 
  ComponentType,
  ComponentTemplate,
  COMPONENT_TEMPLATES,
  HomeBuilderEntity
} from '../../domain/entities/HomeBuilder';

export class HomeBuilderService {
  private repository = new FirebaseHomeBuilderRepository();

  async createLayout(layout: Omit<HomeLayout, 'id' | 'createdAt' | 'updatedAt'>): Promise<HomeLayout> {
    try {
      // Validate layout
      const errors = HomeBuilderEntity.validateLayout(layout as HomeLayout);
      if (errors.length > 0) {
        throw new Error(errors.join(', '));
      }

      // Reorder components
      const reorderedComponents = HomeBuilderEntity.reorderComponents(layout.components);
      
      const layoutData = {
        ...layout,
        components: reorderedComponents
      };

      return await this.repository.createLayout(layoutData);
    } catch (error) {
      console.error('Error creating layout:', error);
      throw error;
    }
  }

  async updateLayout(id: string, updates: Partial<HomeLayout>): Promise<HomeLayout> {
    try {
      // If updating components, reorder them
      if (updates.components) {
        updates.components = HomeBuilderEntity.reorderComponents(updates.components);
      }

      // Increment version
      const currentLayout = await this.repository.getLayoutById(id);
      if (currentLayout) {
        updates.version = (currentLayout.version || 1) + 1;
      }

      return await this.repository.updateLayout(id, updates);
    } catch (error) {
      console.error('Error updating layout:', error);
      throw error;
    }
  }

  async deleteLayout(id: string): Promise<void> {
    try {
      // Check if it's the active layout
      const layout = await this.repository.getLayoutById(id);
      if (layout && layout.isActive) {
        throw new Error('Não é possível excluir o layout ativo');
      }

      // Check if it's a default layout
      if (layout && layout.isDefault) {
        throw new Error('Não é possível excluir o layout padrão');
      }

      await this.repository.deleteLayout(id);
    } catch (error) {
      console.error('Error deleting layout:', error);
      throw error;
    }
  }

  async getLayoutById(id: string): Promise<HomeLayout | null> {
    return await this.repository.getLayoutById(id);
  }

  async getAllLayouts(): Promise<HomeLayout[]> {
    return await this.repository.getAllLayouts();
  }

  async getActiveLayout(): Promise<HomeLayout | null> {
    return await this.repository.getActiveLayout();
  }

  async ensureDefaultLayout(): Promise<HomeLayout> {
    let activeLayout = await this.repository.getActiveLayout();
    
    // If no active layout, create and set default layout
    if (!activeLayout) {
      const defaultLayout = HomeBuilderEntity.createDefaultLayout();
      defaultLayout.createdBy = 'system';
      activeLayout = await this.repository.createLayout(defaultLayout);
      await this.repository.setActiveLayout(activeLayout.id);
    }
    
    return activeLayout;
  }

  async setActiveLayout(layoutId: string): Promise<void> {
    try {
      const layout = await this.repository.getLayoutById(layoutId);
      if (!layout) {
        throw new Error('Layout não encontrado');
      }

      await this.repository.setActiveLayout(layoutId);
    } catch (error) {
      console.error('Error setting active layout:', error);
      throw error;
    }
  }

  async deactivateLayout(): Promise<void> {
    try {
      console.log('🚫 [SERVICE] Desativando layout...');
      await this.repository.setActiveLayout(null);
      console.log('🚫 [SERVICE] Layout desativado com sucesso no repositório');
    } catch (error) {
      console.error('❌ [SERVICE] Error deactivating layout:', error);
      throw error;
    }
  }

  async duplicateLayout(layoutId: string, newName: string, createdBy: string): Promise<HomeLayout> {
    return await this.repository.duplicateLayout(layoutId, newName, createdBy);
  }

  async getLayoutsByUser(userId: string): Promise<HomeLayout[]> {
    return await this.repository.getLayoutsByUser(userId);
  }

  // Component management methods
  async addComponent(layoutId: string, componentType: ComponentType, order?: number): Promise<HomeLayout> {
    try {
      const layout = await this.repository.getLayoutById(layoutId);
      if (!layout) {
        throw new Error('Layout não encontrado');
      }

      const template = COMPONENT_TEMPLATES.find(t => t.type === componentType);
      if (!template) {
        throw new Error('Tipo de componente inválido');
      }

      const newComponent: HomeComponent = {
        id: HomeBuilderEntity.generateComponentId(),
        type: componentType,
        order: order || layout.components.length + 1,
        enabled: true,
        settings: { ...template.defaultSettings }
      };

      const updatedComponents = [...layout.components, newComponent];
      const reorderedComponents = HomeBuilderEntity.reorderComponents(updatedComponents);

      return await this.updateLayout(layoutId, {
        components: reorderedComponents
      });
    } catch (error) {
      console.error('Error adding component:', error);
      throw error;
    }
  }

  async removeComponent(layoutId: string, componentId: string): Promise<HomeLayout> {
    try {
      const layout = await this.repository.getLayoutById(layoutId);
      if (!layout) {
        throw new Error('Layout não encontrado');
      }

      const updatedComponents = layout.components.filter(comp => comp.id !== componentId);
      const reorderedComponents = HomeBuilderEntity.reorderComponents(updatedComponents);

      return await this.updateLayout(layoutId, {
        components: reorderedComponents
      });
    } catch (error) {
      console.error('Error removing component:', error);
      throw error;
    }
  }

  async updateComponent(layoutId: string, componentId: string, updates: Partial<HomeComponent>): Promise<HomeLayout> {
    try {
      const layout = await this.repository.getLayoutById(layoutId);
      if (!layout) {
        throw new Error('Layout não encontrado');
      }

      const updatedComponents = layout.components.map(comp => 
        comp.id === componentId ? { ...comp, ...updates } : comp
      );

      return await this.updateLayout(layoutId, {
        components: updatedComponents
      });
    } catch (error) {
      console.error('Error updating component:', error);
      throw error;
    }
  }

  async reorderComponents(layoutId: string, newOrder: Array<{id: string, order: number}>): Promise<HomeLayout> {
    try {
      const layout = await this.repository.getLayoutById(layoutId);
      if (!layout) {
        throw new Error('Layout não encontrado');
      }

      const updatedComponents = layout.components.map(comp => {
        const newOrderItem = newOrder.find(item => item.id === comp.id);
        return newOrderItem ? { ...comp, order: newOrderItem.order } : comp;
      });

      const reorderedComponents = HomeBuilderEntity.reorderComponents(updatedComponents);

      return await this.updateLayout(layoutId, {
        components: reorderedComponents
      });
    } catch (error) {
      console.error('Error reordering components:', error);
      throw error;
    }
  }

  async toggleComponent(layoutId: string, componentId: string): Promise<HomeLayout> {
    try {
      const layout = await this.repository.getLayoutById(layoutId);
      if (!layout) {
        throw new Error('Layout não encontrado');
      }

      const component = layout.components.find(comp => comp.id === componentId);
      if (!component) {
        throw new Error('Componente não encontrado');
      }

      return await this.updateComponent(layoutId, componentId, {
        enabled: !component.enabled
      });
    } catch (error) {
      console.error('Error toggling component:', error);
      throw error;
    }
  }

  // Template and component utilities
  getComponentTemplates(): ComponentTemplate[] {
    return COMPONENT_TEMPLATES;
  }

  getComponentTemplatesByCategory(category: ComponentTemplate['category']): ComponentTemplate[] {
    return COMPONENT_TEMPLATES.filter(template => template.category === category);
  }

  getComponentTemplate(type: ComponentType): ComponentTemplate | undefined {
    return COMPONENT_TEMPLATES.find(template => template.type === type);
  }

  // Preview and export utilities
  async exportLayout(layoutId: string): Promise<string> {
    try {
      const layout = await this.repository.getLayoutById(layoutId);
      if (!layout) {
        throw new Error('Layout não encontrado');
      }

      return JSON.stringify(layout, null, 2);
    } catch (error) {
      console.error('Error exporting layout:', error);
      throw error;
    }
  }

  async importLayout(layoutData: string, createdBy: string): Promise<HomeLayout> {
    try {
      const parsedLayout = JSON.parse(layoutData) as HomeLayout;
      
      // Remove ID and timestamps for import
      const layoutToImport: Omit<HomeLayout, 'id' | 'createdAt' | 'updatedAt'> = {
        ...parsedLayout,
        name: `${parsedLayout.name} (Importado)`,
        isActive: false,
        isDefault: false,
        createdBy,
        version: 1
      };

      return await this.createLayout(layoutToImport);
    } catch (error) {
      console.error('Error importing layout:', error);
      throw new Error('Erro ao importar layout. Verifique se o formato está correto.');
    }
  }

  // Backup and restore
  async createBackup(): Promise<HomeLayout[]> {
    try {
      return await this.repository.getAllLayouts();
    } catch (error) {
      console.error('Error creating backup:', error);
      throw error;
    }
  }

  async restoreFromBackup(layouts: HomeLayout[], createdBy: string): Promise<void> {
    try {
      for (const layout of layouts) {
        const layoutToRestore: Omit<HomeLayout, 'id' | 'createdAt' | 'updatedAt'> = {
          ...layout,
          name: `${layout.name} (Restaurado)`,
          isActive: false,
          isDefault: false,
          createdBy,
          version: 1
        };
        
        await this.createLayout(layoutToRestore);
      }
    } catch (error) {
      console.error('Error restoring from backup:', error);
      throw error;
    }
  }
}
