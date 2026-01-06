// Presentation Page - Admin Home Builder (Professional Version)
// Modern drag-and-drop page builder with real-time preview

import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../hooks/useTheme';
import { HomeBuilderService } from '@modules/content-management/home-builder/application/services/HomeBuilderService';
import {
  HomeLayout,
  HomeComponent,
  ComponentTemplate,
  ComponentType,
  HomeBuilderEntity
} from '@modules/content-management/home-builder/domain/entities/HomeBuilder';
import { ComponentRenderer } from '../components/HomeBuilder/ComponentRenderer';
import { ComponentSettings } from '../components/HomeBuilder/ComponentSettings';

export const AdminHomeBuilderPage: React.FC = () => {
  const { currentUser } = useAuth();
  const { isDarkMode } = useTheme();

  // State
  const [layouts, setLayouts] = useState<HomeLayout[]>([]);
  const [currentLayout, setCurrentLayout] = useState<HomeLayout | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showComponentSettings, setShowComponentSettings] = useState(false);
  const [editingComponent, setEditingComponent] = useState<HomeComponent | null>(null);
  const [viewMode, setViewMode] = useState<'edit' | 'preview' | 'split'>('split');
  const [showLayoutManager, setShowLayoutManager] = useState(false);
  const [showComponentPalette, setShowComponentPalette] = useState(true);
  const [showPageSettings, setShowPageSettings] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');
  const [searchComponents, setSearchComponents] = useState('');

  const homeBuilderService = new HomeBuilderService();

  // Component Templates
  const componentTemplates: ComponentTemplate[] = [
    {
      type: ComponentType.MENU,
      name: 'Menu de Navegação',
      description: 'Barra de navegação com logo e links',
      icon: '☰',
      category: 'Header',
      defaultSettings: {
        title: 'Menu Principal',
        backgroundColor: '#ffffff',
        textColor: '#000000'
      }
    },
    {
      type: ComponentType.HERO,
      name: 'Hero Section',
      description: 'Grande seção de boas-vindas com título e subtítulo',
      icon: '🎯',
      category: 'Header',
      defaultSettings: {
        title: 'Bem-vindo à Nossa Igreja',
        subtitle: 'Um lugar de fé, esperança e amor',
        showClock: true,
        showDate: true
      }
    },
    {
      type: ComponentType.DEVOTIONAL,
      name: 'Versículo do Dia',
      description: 'Exibe o versículo bíblico do dia',
      icon: '📖',
      category: 'Content',
      defaultSettings: {
        title: 'Versículo do Dia'
      }
    },
    {
      type: ComponentType.EVENTS,
      name: 'Próximos Eventos',
      description: 'Lista de eventos futuros',
      icon: '📅',
      category: 'Content',
      defaultSettings: {
        title: 'Próximos Eventos',
        itemsToShow: 3
      }
    },
    {
      type: ComponentType.BLOG,
      name: 'Últimas Postagens',
      description: 'Posts recentes do blog',
      icon: '📝',
      category: 'Content',
      defaultSettings: {
        title: 'Últimas Mensagens',
        itemsToShow: 3
      }
    },
    {
      type: ComponentType.GALLERY,
      name: 'Galeria de Fotos',
      description: 'Grade de imagens',
      icon: '🖼️',
      category: 'Media',
      defaultSettings: {
        title: 'Nossa Galeria',
        columns: 3
      }
    },
    {
      type: ComponentType.VIDEO,
      name: 'Vídeo Destaque',
      description: 'Player de vídeo do YouTube',
      icon: '🎥',
      category: 'Media',
      defaultSettings: {
        title: 'Assista',
        videoUrl: ''
      }
    },
    {
      type: ComponentType.CUSTOM_HTML,
      name: 'Bloco de Texto',
      description: 'Texto formatado com título',
      icon: '📄',
      category: 'Content',
      defaultSettings: {
        title: 'Nossa Missão',
        customHTML: '<p>Digite aqui...</p>'
      }
    },
    {
      type: ComponentType.DONATION,
      name: 'Chamada para Ação',
      description: 'Botão de ação destacado',
      icon: '🎯',
      category: 'Action',
      defaultSettings: {
        title: 'Junte-se a Nós',
        primaryButtonText: 'Saiba Mais',
        primaryButtonLink: '/about'
      }
    },
    {
      type: ComponentType.STATISTICS,
      name: 'Estatísticas',
      description: 'Números e métricas importantes',
      icon: '📊',
      category: 'Data',
      defaultSettings: {
        title: 'Números que Importam'
      }
    }
  ];

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [allLayouts, activeLayout] = await Promise.all([
        homeBuilderService.getAllLayouts(),
        homeBuilderService.getActiveLayout()
      ]);

      setLayouts(allLayouts);
      setCurrentLayout(activeLayout);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Drag and drop handler
  const handleDragEnd = async (result: DropResult) => {
    if (!result.destination || !currentLayout) return;

    const items = Array.from(currentLayout.components);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // Update orders
    const reorderedComponents = items.map((item, index) => ({
      id: item.id,
      order: index + 1
    }));

    try {
      const updatedLayout = await homeBuilderService.reorderComponents(currentLayout.id, reorderedComponents);
      setCurrentLayout(updatedLayout);
      // Don't reload all data to keep smooth drag-and-drop
    } catch (error) {
      console.error('Error reordering:', error);
    }
  };

  // Component actions
  const handleAddComponent = async (template: ComponentTemplate) => {
    if (!currentLayout) {
      alert('❌ Selecione um layout primeiro');
      return;
    }

    try {
      const updatedLayout = await homeBuilderService.addComponent(
        currentLayout.id,
        template.type
      );
      setCurrentLayout(updatedLayout);
      // Don't reload all data, just update current layout
    } catch (error) {
      console.error('Error adding component:', error);
      alert('❌ Erro ao adicionar componente');
    }
  };

  const handleEditComponent = (component: HomeComponent) => {
    setEditingComponent(component);
    setShowComponentSettings(true);
  };

  const handleDeleteComponent = async (componentId: string) => {
    if (!currentLayout) return;

    if (!window.confirm('Excluir este componente?')) return;

    try {
      const updatedLayout = await homeBuilderService.removeComponent(
        currentLayout.id,
        componentId
      );
      setCurrentLayout(updatedLayout);
      // Don't reload all data, just update current layout to avoid scroll reset
    } catch (error) {
      console.error('Error deleting component:', error);
      alert('❌ Erro ao excluir componente');
    }
  };

  const handleToggleComponent = async (componentId: string) => {
    if (!currentLayout) return;

    try {
      const updatedLayout = await homeBuilderService.toggleComponent(
        currentLayout.id,
        componentId
      );
      setCurrentLayout(updatedLayout);
      // Don't reload all data, just update current layout to avoid scroll reset
    } catch (error) {
      console.error('Error toggling component:', error);
    }
  };

  const handleSaveComponentSettings = async (settings: any) => {
    if (!currentLayout || !editingComponent) return;

    try {
      const updatedLayout = await homeBuilderService.updateComponent(
        currentLayout.id,
        editingComponent.id,
        { settings }
      );
      setCurrentLayout(updatedLayout);
      setShowComponentSettings(false);
      setEditingComponent(null);
      // Don't reload all data, just update current layout
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('❌ Erro ao salvar configurações');
    }
  };

  // Layout actions
  const handlePublishLayout = async () => {
    if (!currentLayout) return;

    if (!window.confirm('Publicar este layout? Ele se tornará a página inicial ativa.')) return;

    try {
      setSaving(true);
      await homeBuilderService.setActiveLayout(currentLayout.id);
      alert('✅ Layout publicado com sucesso!');
      await loadData();
    } catch (error) {
      console.error('Error publishing:', error);
      alert('❌ Erro ao publicar layout');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewLayout = async () => {
    const name = window.prompt('Nome do novo layout:');
    if (!name) return;

    try {
      const newLayout = HomeBuilderEntity.createDefaultLayout();
      newLayout.name = name;
      newLayout.createdBy = currentUser?.email || 'unknown';
      newLayout.isActive = false;
      newLayout.isDefault = false; // ✅ Force isDefault to false for new layouts

      const createdLayout = await homeBuilderService.createLayout(newLayout);
      setCurrentLayout(createdLayout);
      await loadData();
    } catch (error) {
      console.error('Error creating layout:', error);
      alert('❌ Erro ao criar layout');
    }
  };

  const handleToggleDefault = async (layoutId: string, currentIsDefault: boolean) => {
    try {
      await homeBuilderService.updateLayout(layoutId, {
        isDefault: !currentIsDefault
      });
      alert(currentIsDefault ? '✅ Layout desmarcado como padrão' : '✅ Layout marcado como padrão');
      await loadData();
    } catch (error) {
      console.error('Error toggling default:', error);
      alert('❌ Erro ao atualizar layout');
    }
  };

  const handleDeleteLayout = async (layoutId: string, layoutName: string, isActive: boolean, isDefault: boolean) => {
    // Prevent deletion of active layouts
    if (isActive) {
      alert('❌ Não é possível excluir o layout ativo. Desative-o primeiro.');
      return;
    }

    // If it's default, ask if user wants to unmark it first
    if (isDefault) {
      const unmarkFirst = window.confirm(
        `Este layout está marcado como padrão.\n\n` +
        `Deseja desmarcar como padrão para poder excluí-lo?\n\n` +
        `Clique em OK para desmarcar, ou Cancelar para manter.`
      );

      if (unmarkFirst) {
        await handleToggleDefault(layoutId, true);
        return; // Let user click delete again after unmarking
      } else {
        return; // User canceled
      }
    }

    const confirmed = window.confirm(`Tem certeza que deseja excluir o layout "${layoutName}"?\n\nEsta ação não pode ser desfeita.`);
    if (!confirmed) return;

    try {
      await homeBuilderService.deleteLayout(layoutId);

      // Update local state
      const updatedLayouts = layouts.filter(l => l.id !== layoutId);
      setLayouts(updatedLayouts);

      // If the deleted layout was the current one, switch to another layout
      if (currentLayout?.id === layoutId) {
        setCurrentLayout(updatedLayouts[0] || null);
      }

      alert('✅ Layout excluído com sucesso!');
      await loadData();
    } catch (error: any) {
      console.error('Error deleting layout:', error);
      alert(`❌ Erro ao excluir layout: ${error.message || 'Erro desconhecido'}`);
    }
  };

  // Filter components
  const filteredTemplates = componentTemplates.filter(template =>
    template.name.toLowerCase().includes(searchComponents.toLowerCase()) ||
    template.description.toLowerCase().includes(searchComponents.toLowerCase()) ||
    template.category.toLowerCase().includes(searchComponents.toLowerCase())
  );

  // Group templates by category
  const groupedTemplates = filteredTemplates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ComponentTemplate[]>);

  // Preview device styles
  const getPreviewContainerStyle = () => {
    const styles: Record<typeof previewDevice, string> = {
      desktop: 'w-full',
      tablet: 'w-[768px] mx-auto',
      mobile: 'w-[375px] mx-auto'
    };
    return styles[previewDevice];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando construtor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <h1 className="text-2xl font-bold text-gray-900">🏗️ Construtor da Home</h1>
              {currentLayout && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
                  {currentLayout.name}
                  {currentLayout.isActive && ' ✓ Ativo'}
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {/* View Mode Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('edit')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'edit'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ✏️ Editar
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'split'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ⚡ Split
                </button>
                <button
                  onClick={() => setViewMode('preview')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    viewMode === 'preview'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  👁️ Preview
                </button>
              </div>

              {/* Device Preview Toggle */}
              {(viewMode === 'preview' || viewMode === 'split') && (
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setPreviewDevice('desktop')}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      previewDevice === 'desktop'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Desktop"
                  >
                    🖥️
                  </button>
                  <button
                    onClick={() => setPreviewDevice('tablet')}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      previewDevice === 'tablet'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Tablet"
                  >
                    📱
                  </button>
                  <button
                    onClick={() => setPreviewDevice('mobile')}
                    className={`px-3 py-2 rounded-md text-sm transition-colors ${
                      previewDevice === 'mobile'
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="Mobile"
                  >
                    📱
                  </button>
                </div>
              )}

              {/* Layout Actions */}
              <button
                onClick={() => setShowPageSettings(true)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                🎨 Página
              </button>

              <button
                onClick={() => setShowLayoutManager(true)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                📁 Layouts
              </button>

              {currentLayout && !currentLayout.isActive && (
                <button
                  onClick={handlePublishLayout}
                  disabled={saving}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? '⏳ Publicando...' : '🚀 Publicar'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex h-[calc(100vh-88px)]">
        {/* Left Sidebar - Component Palette */}
        {(viewMode === 'edit' || viewMode === 'split') && showComponentPalette && (
          <div className="w-72 flex-shrink-0 bg-white border-r border-gray-200 overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Componentes</h2>
                <button
                  onClick={() => setShowComponentPalette(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              {/* Search */}
              <input
                type="text"
                placeholder="Buscar componentes..."
                value={searchComponents}
                onChange={(e) => setSearchComponents(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 mb-4"
              />

              {/* Component Groups */}
              {Object.entries(groupedTemplates).map(([category, templates]) => (
                <div key={`category-${category}`} className="mb-6">
                  <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider mb-3">
                    {category}
                  </h3>
                  <div key={`templates-${category}`} className="space-y-2">
                    {templates.map((template, idx) => (
                      <button
                        key={`${category}-${template.type}-${idx}`}
                        onClick={() => handleAddComponent(template)}
                        className="w-full p-4 text-left bg-gray-50 hover:bg-indigo-50 rounded-lg border border-gray-200 hover:border-indigo-300 transition-all group"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{template.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-gray-900 group-hover:text-indigo-600">
                              {template.name}
                            </h4>
                            <p className="text-sm text-gray-500 mt-1">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum componente encontrado
                </div>
              )}
            </div>
          </div>
        )}

        {/* Center/Main Area */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto bg-gray-100 p-6">
            {!currentLayout ? (
              <div className="flex flex-col items-center justify-center h-full">
                <div className="text-center max-w-md">
                  <div className="text-6xl mb-4">🏗️</div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    Nenhum Layout Selecionado
                  </h2>
                  <p className="text-gray-600 mb-6">
                    Crie um novo layout ou selecione um existente para começar a construir sua página inicial.
                  </p>
                  <button
                    onClick={handleCreateNewLayout}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
                  >
                    ➕ Criar Novo Layout
                  </button>
                </div>
              </div>
            ) : (
              <div className={`h-full ${viewMode === 'split' ? 'grid grid-cols-2 gap-6' : ''}`}>
                {/* Edit View */}
                {(viewMode === 'edit' || viewMode === 'split') && (
                  <div className={`bg-white rounded-lg shadow-sm p-6 ${viewMode === 'split' ? 'overflow-y-auto h-full' : 'mb-6'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900">
                        Componentes do Layout ({currentLayout.components.length})
                      </h3>
                      {!showComponentPalette && (
                        <button
                          onClick={() => setShowComponentPalette(true)}
                          className="px-4 py-2 text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                          ➕ Adicionar Componente
                        </button>
                      )}
                    </div>

                    {currentLayout.components.length === 0 ? (
                      <div className="text-center py-12 text-gray-500">
                        <div className="text-4xl mb-4">📦</div>
                        <p>Nenhum componente adicionado ainda.</p>
                        <p className="text-sm mt-2">
                          Use a barra lateral para adicionar componentes.
                        </p>
                      </div>
                    ) : (
                      <DragDropContext onDragEnd={handleDragEnd}>
                        <Droppable droppableId="components">
                          {(provided) => (
                            <div
                              {...provided.droppableProps}
                              ref={provided.innerRef}
                              className="space-y-3"
                            >
                              {currentLayout.components
                                .sort((a, b) => a.order - b.order)
                                .map((component, index) => (
                                  <Draggable
                                    key={component.id}
                                    draggableId={component.id}
                                    index={index}
                                  >
                                    {(provided, snapshot) => (
                                      <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        className={`bg-gray-50 border border-gray-200 rounded-lg p-4 transition-shadow ${
                                          snapshot.isDragging ? 'shadow-lg' : ''
                                        }`}
                                      >
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-4 flex-1">
                                            <div
                                              {...provided.dragHandleProps}
                                              className="text-gray-400 hover:text-gray-600 cursor-grab active:cursor-grabbing"
                                            >
                                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                                              </svg>
                                            </div>

                                            <div className="flex-1">
                                              <div className="flex items-center gap-3">
                                                <span className="text-xl">
                                                  {componentTemplates.find(t => t.type === component.type)?.icon || '📦'}
                                                </span>
                                                <div>
                                                  <h4 className="font-medium text-gray-900">
                                                    {componentTemplates.find(t => t.type === component.type)?.name || component.type}
                                                  </h4>
                                                  <p className="text-sm text-gray-500">
                                                    {component.settings?.title || 'Sem título'}
                                                  </p>
                                                </div>
                                              </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                              {/* Toggle Visibility */}
                                              <button
                                                onClick={() => handleToggleComponent(component.id)}
                                                className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                                                  component.enabled
                                                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                                    : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
                                                }`}
                                              >
                                                {component.enabled ? '👁️ Visível' : '👁️‍🗨️ Oculto'}
                                              </button>

                                              {/* Edit Settings */}
                                              <button
                                                onClick={() => handleEditComponent(component)}
                                                className="px-3 py-1.5 bg-indigo-100 text-indigo-700 rounded-md hover:bg-indigo-200 transition-colors text-sm font-medium"
                                              >
                                                ⚙️ Configurar
                                              </button>

                                              {/* Delete */}
                                              <button
                                                onClick={() => handleDeleteComponent(component.id)}
                                                className="px-3 py-1.5 bg-red-100 text-red-700 rounded-md hover:bg-red-200 transition-colors text-sm font-medium"
                                              >
                                                🗑️
                                              </button>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </Draggable>
                                ))}
                              {provided.placeholder}
                            </div>
                          )}
                        </Droppable>
                      </DragDropContext>
                    )}
                  </div>
                )}

                {/* Preview */}
                {(viewMode === 'preview' || viewMode === 'split') && (
                  <div className={`bg-white rounded-lg shadow-sm overflow-hidden ${viewMode === 'split' ? 'h-full flex flex-col' : ''}`}>
                    <div className="bg-gray-800 px-4 py-2 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-gray-400 text-sm">Preview em Tempo Real</span>
                    </div>
                    <div
                      className="overflow-auto flex-1"
                      style={{
                        backgroundColor: currentLayout.globalSettings?.backgroundColor || '#f9fafb',
                        fontFamily: currentLayout.globalSettings?.fontFamily || 'Inter, sans-serif'
                      }}
                    >
                      {currentLayout.components
                        .filter(c => c.enabled)
                        .sort((a, b) => a.order - b.order)
                        .map((component) => (
                          <div key={component.id}>
                            <ComponentRenderer
                              component={component}
                              isDarkMode={isDarkMode}
                            />
                          </div>
                        ))}
                      {currentLayout.components.filter(c => c.enabled).length === 0 && (
                        <div className="text-center py-20 text-gray-500">
                          <p>Nenhum componente visível para preview</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Component Settings Modal */}
      {showComponentSettings && editingComponent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <ComponentSettings
            component={editingComponent}
            onSave={handleSaveComponentSettings}
            onCancel={() => {
              setShowComponentSettings(false);
              setEditingComponent(null);
            }}
          />
        </div>
      )}

      {/* Page Settings Modal */}
      {showPageSettings && currentLayout && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">🎨 Configurações da Página</h2>
              <button
                onClick={() => setShowPageSettings(false)}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              <div className="space-y-6">
                {/* Background Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor de Fundo da Página
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={currentLayout.globalSettings?.backgroundColor || '#f9fafb'}
                      onChange={(e) => {
                        setCurrentLayout({
                          ...currentLayout,
                          globalSettings: {
                            ...currentLayout.globalSettings,
                            backgroundColor: e.target.value
                          }
                        });
                      }}
                      className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentLayout.globalSettings?.backgroundColor || '#f9fafb'}
                      onChange={(e) => {
                        setCurrentLayout({
                          ...currentLayout,
                          globalSettings: {
                            ...currentLayout.globalSettings,
                            backgroundColor: e.target.value
                          }
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="#f9fafb"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Define a cor de fundo de toda a página
                  </p>
                </div>

                {/* Primary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Primária
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={currentLayout.globalSettings?.primaryColor || '#3b82f6'}
                      onChange={(e) => {
                        setCurrentLayout({
                          ...currentLayout,
                          globalSettings: {
                            ...currentLayout.globalSettings,
                            primaryColor: e.target.value
                          }
                        });
                      }}
                      className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentLayout.globalSettings?.primaryColor || '#3b82f6'}
                      onChange={(e) => {
                        setCurrentLayout({
                          ...currentLayout,
                          globalSettings: {
                            ...currentLayout.globalSettings,
                            primaryColor: e.target.value
                          }
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="#3b82f6"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Cor principal usada em botões e destaques
                  </p>
                </div>

                {/* Secondary Color */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cor Secundária
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={currentLayout.globalSettings?.secondaryColor || '#8b5cf6'}
                      onChange={(e) => {
                        setCurrentLayout({
                          ...currentLayout,
                          globalSettings: {
                            ...currentLayout.globalSettings,
                            secondaryColor: e.target.value
                          }
                        });
                      }}
                      className="w-16 h-10 rounded-lg border border-gray-300 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={currentLayout.globalSettings?.secondaryColor || '#8b5cf6'}
                      onChange={(e) => {
                        setCurrentLayout({
                          ...currentLayout,
                          globalSettings: {
                            ...currentLayout.globalSettings,
                            secondaryColor: e.target.value
                          }
                        });
                      }}
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="#8b5cf6"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Cor secundária para variações e gradientes
                  </p>
                </div>

                {/* Font Family */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fonte do Texto
                  </label>
                  <select
                    value={currentLayout.globalSettings?.fontFamily || 'Inter, sans-serif'}
                    onChange={(e) => {
                      setCurrentLayout({
                        ...currentLayout,
                        globalSettings: {
                          ...currentLayout.globalSettings,
                          fontFamily: e.target.value
                        }
                      });
                    }}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Inter, sans-serif">Inter (Moderna)</option>
                    <option value="Roboto, sans-serif">Roboto (Clean)</option>
                    <option value="Open Sans, sans-serif">Open Sans (Legível)</option>
                    <option value="Lato, sans-serif">Lato (Elegante)</option>
                    <option value="Montserrat, sans-serif">Montserrat (Moderna)</option>
                    <option value="Poppins, sans-serif">Poppins (Amigável)</option>
                    <option value="Georgia, serif">Georgia (Clássica)</option>
                    <option value="Times New Roman, serif">Times New Roman (Tradicional)</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setShowPageSettings(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  await handleSaveLayout();
                  setShowPageSettings(false);
                }}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Salvar Configurações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layout Manager Modal */}
      {showLayoutManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Gerenciar Layouts</h2>
              <button
                onClick={() => setShowLayoutManager(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
              <button
                onClick={() => {
                  handleCreateNewLayout();
                  setShowLayoutManager(false);
                }}
                className="w-full mb-4 p-4 border-2 border-dashed border-indigo-300 rounded-lg text-indigo-600 hover:bg-indigo-50 transition-colors font-medium"
              >
                ➕ Criar Novo Layout
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {layouts.map((layout) => (
                  <div
                    key={layout.id}
                    className={`p-4 border-2 rounded-lg transition-all ${
                      currentLayout?.id === layout.id
                        ? 'border-indigo-600 bg-indigo-50'
                        : 'border-gray-200 hover:border-indigo-300'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div
                        className="flex-1 cursor-pointer"
                        onClick={() => {
                          setCurrentLayout(layout);
                          setShowLayoutManager(false);
                        }}
                      >
                        <h3 className="font-semibold text-gray-900">{layout.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">
                          {layout.components.length} componentes
                        </p>
                        {layout.isActive && (
                          <span className="inline-block mt-2 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                            ✓ Ativo
                          </span>
                        )}
                        {layout.isDefault && (
                          <span className="inline-block mt-2 ml-2 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                            📌 Padrão
                          </span>
                        )}
                      </div>

                      {/* Delete button - always visible but disabled only for active */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteLayout(layout.id, layout.name, layout.isActive, layout.isDefault);
                        }}
                        disabled={layout.isActive}
                        className={`ml-2 p-2 rounded-lg transition-colors ${
                          layout.isActive
                            ? 'text-gray-300 cursor-not-allowed'
                            : layout.isDefault
                            ? 'text-orange-600 hover:bg-orange-50 cursor-pointer'
                            : 'text-red-600 hover:bg-red-50 cursor-pointer'
                        }`}
                        title={
                          layout.isActive
                            ? 'Não é possível excluir o layout ativo'
                            : layout.isDefault
                            ? 'Clique para desmarcar como padrão e depois excluir'
                            : 'Excluir layout'
                        }
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setShowLayoutManager(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminHomeBuilderPage;
