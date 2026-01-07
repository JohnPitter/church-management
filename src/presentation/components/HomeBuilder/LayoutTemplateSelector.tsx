// Presentation Component - Layout Template Selector
// Beautiful UI for selecting pre-designed layout templates

import React, { useState } from 'react';
import { LayoutStyle, LayoutTemplateFactory, LayoutTemplateMetadata } from '@modules/content-management/home-builder/domain/entities/LayoutTemplates';

interface LayoutTemplateSelectorProps {
  onSelect: (style: LayoutStyle) => void;
  onCancel: () => void;
}

export const LayoutTemplateSelector: React.FC<LayoutTemplateSelectorProps> = ({
  onSelect,
  onCancel
}) => {
  const [selectedStyle, setSelectedStyle] = useState<LayoutStyle | null>(null);
  const [hoveredStyle, setHoveredStyle] = useState<LayoutStyle | null>(null);

  const templates = LayoutTemplateFactory.getAllTemplates();

  const handleConfirm = () => {
    if (selectedStyle) {
      onSelect(selectedStyle);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-white mb-2">
                Escolha o Estilo da Sua Home Page
              </h2>
              <p className="text-white/90 text-lg">
                Selecione um dos três designs profissionais pré-configurados
              </p>
            </div>
            <button
              onClick={onCancel}
              className="text-white hover:bg-white/20 rounded-xl p-3 transition-all duration-200 hover:rotate-90"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Template Cards */}
        <div className="p-8 overflow-y-auto max-h-[calc(90vh-220px)]">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {templates.map((template) => {
              const isSelected = selectedStyle === template.style;
              const isHovered = hoveredStyle === template.style;

              return (
                <div
                  key={template.id}
                  className={`
                    relative cursor-pointer rounded-2xl overflow-hidden
                    transition-all duration-300 transform
                    ${isSelected ? 'ring-4 ring-indigo-600 scale-105' : 'hover:scale-105'}
                    ${isHovered && !isSelected ? 'ring-2 ring-gray-300' : ''}
                  `}
                  onClick={() => setSelectedStyle(template.style)}
                  onMouseEnter={() => setHoveredStyle(template.style)}
                  onMouseLeave={() => setHoveredStyle(null)}
                >
                  {/* Style-specific gradient backgrounds */}
                  <div
                    className={`
                      h-48 relative overflow-hidden
                      ${template.style === LayoutStyle.CANVA ? 'bg-gradient-to-br from-red-400 via-pink-400 to-purple-400' : ''}
                      ${template.style === LayoutStyle.APPLE ? 'bg-gradient-to-br from-gray-100 via-white to-gray-200' : ''}
                      ${template.style === LayoutStyle.ENTERPRISE ? 'bg-gradient-to-br from-blue-900 via-blue-700 to-blue-500' : ''}
                    `}
                  >
                    {/* Icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-8xl opacity-90 drop-shadow-2xl">
                        {template.icon}
                      </span>
                    </div>

                    {/* Selected badge */}
                    {isSelected && (
                      <div className="absolute top-4 right-4 bg-white text-indigo-600 rounded-full px-4 py-2 font-bold shadow-lg animate-bounce-in flex items-center gap-2">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Selecionado
                      </div>
                    )}

                    {/* Decorative elements for Canva style */}
                    {template.style === LayoutStyle.CANVA && (
                      <>
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-300 rounded-full -mr-16 -mt-16 opacity-50"></div>
                        <div className="absolute bottom-0 left-0 w-24 h-24 bg-cyan-300 rounded-full -ml-12 -mb-12 opacity-50"></div>
                      </>
                    )}

                    {/* Minimal line for Apple style */}
                    {template.style === LayoutStyle.APPLE && (
                      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black"></div>
                    )}

                    {/* Grid pattern for Enterprise style */}
                    {template.style === LayoutStyle.ENTERPRISE && (
                      <div className="absolute inset-0 opacity-10" style={{
                        backgroundImage: 'linear-gradient(white 1px, transparent 1px), linear-gradient(90deg, white 1px, transparent 1px)',
                        backgroundSize: '20px 20px'
                      }}></div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-6 bg-white">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
                      {template.name}
                    </h3>
                    <p className="text-gray-600 mb-4 leading-relaxed">
                      {template.description}
                    </p>

                    {/* Design Principles */}
                    <div className="space-y-2">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Princípios de Design:
                      </p>
                      <ul className="space-y-1">
                        {template.designPrinciples.slice(0, 3).map((principle, idx) => (
                          <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                            <span className="text-green-500 mt-0.5">✓</span>
                            <span>{principle}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Color Swatches */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                        Paleta de Cores:
                      </p>
                      <div className="flex gap-2">
                        <div
                          className="w-8 h-8 rounded-lg shadow-sm border border-gray-200"
                          style={{ backgroundColor: template.colorScheme.primary }}
                          title="Primária"
                        ></div>
                        <div
                          className="w-8 h-8 rounded-lg shadow-sm border border-gray-200"
                          style={{ backgroundColor: template.colorScheme.secondary }}
                          title="Secundária"
                        ></div>
                        <div
                          className="w-8 h-8 rounded-lg shadow-sm border border-gray-200"
                          style={{ backgroundColor: template.colorScheme.accent }}
                          title="Destaque"
                        ></div>
                        <div
                          className="w-8 h-8 rounded-lg shadow-sm border border-gray-200"
                          style={{ backgroundColor: template.colorScheme.background }}
                          title="Fundo"
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Help Text */}
          <div className="mt-8 p-6 bg-blue-50 rounded-xl border border-blue-200">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h4 className="font-semibold text-blue-900 mb-2">Dica Importante</h4>
                <p className="text-blue-800 leading-relaxed">
                  Cada template vem pré-configurado com todos os componentes necessários seguindo o estilo escolhido.
                  Você poderá personalizar cores, textos e componentes depois de criar o layout.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-8 py-6 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div>
            {selectedStyle && (
              <p className="text-sm text-gray-600">
                <span className="font-semibold">Estilo selecionado:</span>{' '}
                {templates.find(t => t.style === selectedStyle)?.name}
              </p>
            )}
          </div>
          <div className="flex gap-3">
            <button
              onClick={onCancel}
              className="px-6 py-3 text-gray-700 bg-white rounded-xl hover:bg-gray-100 transition-colors font-medium border border-gray-300"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={!selectedStyle}
              className={`
                px-8 py-3 rounded-xl font-bold transition-all duration-200 shadow-lg
                ${selectedStyle
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 transform hover:scale-105'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }
              `}
            >
              {selectedStyle ? 'Criar Layout' : 'Selecione um Estilo'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0);
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }

        .animate-bounce-in {
          animation: bounce-in 0.4s ease-out;
        }
      `}</style>
    </div>
  );
};
