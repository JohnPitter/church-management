// Presentation Component - Component Palette
// Palette of available components for the home builder

import React, { useState } from 'react';
import { ComponentTemplate, COMPONENT_TEMPLATES } from '../../../modules/content-management/home-builder/domain/entities/HomeBuilder';

interface ComponentPaletteProps {
  onAddComponent: (template: ComponentTemplate) => void;
}

export const ComponentPalette: React.FC<ComponentPaletteProps> = ({
  onAddComponent
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const categories = [
    { id: 'all', name: 'Todos', icon: '📋' },
    { id: 'content', name: 'Conteúdo', icon: '📝' },
    { id: 'media', name: 'Mídia', icon: '🎬' },
    { id: 'interaction', name: 'Interação', icon: '🤝' },
    { id: 'layout', name: 'Layout', icon: '📐' },
    { id: 'custom', name: 'Personalizado', icon: '🔧' }
  ];

  const filteredTemplates = COMPONENT_TEMPLATES.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          📦 Componentes
        </h3>
        
        {/* Search */}
        <div className="relative mb-3">
          <input
            type="text"
            placeholder="Pesquisar componentes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <div className="absolute left-3 top-2.5 text-gray-400">
            🔍
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-1">
          {categories.map(category => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {category.icon} {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Components List */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="space-y-3">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className="border border-gray-200 rounded-lg p-3 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer group"
              onClick={() => onAddComponent(template)}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl flex-shrink-0">
                  {template.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="font-medium text-gray-900 text-sm truncate">
                      {template.name}
                    </h4>
                    {template.premium && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                        Premium
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${getCategoryColor(template.category)}`}>
                      {getCategoryName(template.category)}
                    </span>
                    <button className="opacity-0 group-hover:opacity-100 text-blue-600 text-xs font-medium transition-opacity">
                      Adicionar →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">🔍</div>
            <p className="text-gray-500 text-sm">
              Nenhum componente encontrado
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-blue-600 text-sm mt-2 hover:underline"
              >
                Limpar pesquisa
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <p className="text-xs text-gray-600 text-center">
          💡 Clique em um componente para adicioná-lo à sua página
        </p>
      </div>
    </div>
  );
};

function getCategoryColor(category: ComponentTemplate['category']): string {
  switch (category) {
    case 'content': return 'bg-blue-100 text-blue-700';
    case 'media': return 'bg-purple-100 text-purple-700';
    case 'interaction': return 'bg-green-100 text-green-700';
    case 'layout': return 'bg-orange-100 text-orange-700';
    case 'custom': return 'bg-gray-100 text-gray-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}

function getCategoryName(category: ComponentTemplate['category']): string {
  switch (category) {
    case 'content': return 'Conteúdo';
    case 'media': return 'Mídia';
    case 'interaction': return 'Interação';
    case 'layout': return 'Layout';
    case 'custom': return 'Personalizado';
    default: return 'Outro';
  }
}