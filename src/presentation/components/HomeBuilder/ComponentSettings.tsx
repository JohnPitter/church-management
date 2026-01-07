// Presentation Component - Component Settings
// Settings panel for configuring home page components

import React, { useState, useEffect } from 'react';
import { HomeComponent, ComponentType, ComponentSettings as IComponentSettings } from '../../../modules/content-management/home-builder/domain/entities/HomeBuilder';

interface ComponentSettingsProps {
  component: HomeComponent;
  onSave: (settings: IComponentSettings) => void;
  onCancel: () => void;
}

export const ComponentSettings: React.FC<ComponentSettingsProps> = ({
  component,
  onSave,
  onCancel
}) => {
  const [settings, setSettings] = useState<IComponentSettings>(component.settings);

  useEffect(() => {
    setSettings(component.settings);
  }, [component]);

  const handleInputChange = (key: keyof IComponentSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSave = () => {
    onSave(settings);
  };

  const renderBasicSettings = () => (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Título
        </label>
        <input
          type="text"
          value={settings.title || ''}
          onChange={(e) => handleInputChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Subtítulo
        </label>
        <input
          type="text"
          value={settings.subtitle || ''}
          onChange={(e) => handleInputChange('subtitle', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Descrição
        </label>
        <textarea
          value={settings.description || ''}
          onChange={(e) => handleInputChange('description', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );

  const renderStyleSettings = () => (
    <div className="space-y-4">
      {/* Gradient or Solid Color Toggle */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tipo de Fundo
        </label>
        <select
          value={settings.backgroundType || 'solid'}
          onChange={(e) => handleInputChange('backgroundType', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="solid">Cor Sólida</option>
          <option value="gradient">Degradê</option>
          <option value="image">Imagem</option>
        </select>
      </div>

      {/* Solid Color */}
      {(!settings.backgroundType || settings.backgroundType === 'solid') && (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor de Fundo
            </label>
            <input
              type="color"
              value={settings.backgroundColor || '#ffffff'}
              onChange={(e) => handleInputChange('backgroundColor', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor do Texto
            </label>
            <input
              type="color"
              value={settings.textColor || '#000000'}
              onChange={(e) => handleInputChange('textColor', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      {/* Gradient Options */}
      {settings.backgroundType === 'gradient' && (
        <div className="space-y-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Direção do Degradê
            </label>
            <select
              value={settings.gradientDirection || 'to right'}
              onChange={(e) => handleInputChange('gradientDirection', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="to right">Esquerda → Direita</option>
              <option value="to left">Direita → Esquerda</option>
              <option value="to bottom">Cima → Baixo</option>
              <option value="to top">Baixo → Cima</option>
              <option value="to bottom right">Diagonal ↘</option>
              <option value="to bottom left">Diagonal ↙</option>
              <option value="to top right">Diagonal ↗</option>
              <option value="to top left">Diagonal ↖</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor Inicial
              </label>
              <input
                type="color"
                value={settings.gradientStartColor || '#3b82f6'}
                onChange={(e) => handleInputChange('gradientStartColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cor Final
              </label>
              <input
                type="color"
                value={settings.gradientEndColor || '#8b5cf6'}
                onChange={(e) => handleInputChange('gradientEndColor', e.target.value)}
                className="w-full h-10 border border-gray-300 rounded-md"
              />
            </div>
          </div>

          {/* Preview */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Prévia do Degradê
            </label>
            <div
              className="w-full h-20 rounded-md border border-gray-300"
              style={{
                background: `linear-gradient(${settings.gradientDirection || 'to right'}, ${settings.gradientStartColor || '#3b82f6'}, ${settings.gradientEndColor || '#8b5cf6'})`
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor do Texto
            </label>
            <input
              type="color"
              value={settings.textColor || '#ffffff'}
              onChange={(e) => handleInputChange('textColor', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      {/* Image Background */}
      {settings.backgroundType === 'image' && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              URL da Imagem de Fundo
            </label>
            <input
              type="url"
              value={settings.backgroundImage || ''}
              onChange={(e) => handleInputChange('backgroundImage', e.target.value)}
              placeholder="https://exemplo.com/imagem.jpg"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Posição da Imagem
            </label>
            <select
              value={settings.backgroundPosition || 'center'}
              onChange={(e) => handleInputChange('backgroundPosition', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="center">Centro</option>
              <option value="top">Topo</option>
              <option value="bottom">Inferior</option>
              <option value="left">Esquerda</option>
              <option value="right">Direita</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tamanho da Imagem
            </label>
            <select
              value={settings.backgroundSize || 'cover'}
              onChange={(e) => handleInputChange('backgroundSize', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="cover">Cobrir</option>
              <option value="contain">Conter</option>
              <option value="auto">Automático</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cor do Texto
            </label>
            <input
              type="color"
              value={settings.textColor || '#ffffff'}
              onChange={(e) => handleInputChange('textColor', e.target.value)}
              className="w-full h-10 border border-gray-300 rounded-md"
            />
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Alinhamento
        </label>
        <select
          value={settings.alignment || 'center'}
          onChange={(e) => handleInputChange('alignment', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="left">Esquerda</option>
          <option value="center">Centro</option>
          <option value="right">Direita</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Altura
          </label>
          <input
            type="text"
            value={settings.height || ''}
            onChange={(e) => handleInputChange('height', e.target.value)}
            placeholder="400px, 50vh, auto"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Espaçamento Interno
          </label>
          <input
            type="text"
            value={typeof settings.padding === 'string' ? settings.padding : ''}
            onChange={(e) => handleInputChange('padding', e.target.value)}
            placeholder="20px, 2rem"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );

  const renderSpecificSettings = () => {
    switch (component.type) {
      case ComponentType.HERO:
        return (
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.showButtons || false}
                  onChange={(e) => handleInputChange('showButtons', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Mostrar Botões</span>
              </label>
            </div>
            
            {settings.showButtons && (
              <div className="space-y-4 pl-6 border-l-2 border-gray-200">
                <h5 className="text-sm font-medium text-gray-700">Configurações dos Botões</h5>
                
                {/* Botão Principal */}
                <div className="space-y-2">
                  <h6 className="text-xs font-medium text-gray-600">Botão Principal</h6>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Texto</label>
                      <input
                        type="text"
                        value={settings.primaryButtonText || 'Saiba Mais'}
                        onChange={(e) => handleInputChange('primaryButtonText', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Link</label>
                      <input
                        type="text"
                        value={settings.primaryButtonLink || '#'}
                        onChange={(e) => handleInputChange('primaryButtonLink', e.target.value)}
                        placeholder="/pagina ou https://..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Cor de Fundo</label>
                      <input
                        type="color"
                        value={settings.primaryButtonBackground || '#3b82f6'}
                        onChange={(e) => handleInputChange('primaryButtonBackground', e.target.value)}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Cor do Texto</label>
                      <input
                        type="color"
                        value={settings.primaryButtonTextColor || '#ffffff'}
                        onChange={(e) => handleInputChange('primaryButtonTextColor', e.target.value)}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>

                {/* Botão Secundário */}
                <div className="space-y-2">
                  <h6 className="text-xs font-medium text-gray-600">Botão Secundário</h6>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Texto</label>
                      <input
                        type="text"
                        value={settings.secondaryButtonText || 'Visite-nos'}
                        onChange={(e) => handleInputChange('secondaryButtonText', e.target.value)}
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Link</label>
                      <input
                        type="text"
                        value={settings.secondaryButtonLink || '#'}
                        onChange={(e) => handleInputChange('secondaryButtonLink', e.target.value)}
                        placeholder="/pagina ou https://..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Cor de Fundo</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={settings.secondaryButtonBackground || '#ffffff'}
                          onChange={(e) => handleInputChange('secondaryButtonBackground', e.target.value)}
                          className="w-16 h-8 border border-gray-300 rounded cursor-pointer"
                        />
                        <label className="flex items-center text-xs">
                          <input
                            type="checkbox"
                            checked={settings.secondaryButtonBackground === 'transparent' || !settings.secondaryButtonBackground}
                            onChange={(e) => handleInputChange('secondaryButtonBackground', e.target.checked ? 'transparent' : '#ffffff')}
                            className="mr-1"
                          />
                          Transparente
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-700 mb-1">Cor da Borda</label>
                      <input
                        type="color"
                        value={settings.secondaryButtonBorderColor || '#ffffff'}
                        onChange={(e) => handleInputChange('secondaryButtonBorderColor', e.target.value)}
                        className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-700 mb-1">Cor do Texto</label>
                    <input
                      type="color"
                      value={settings.secondaryButtonTextColor || '#ffffff'}
                      onChange={(e) => handleInputChange('secondaryButtonTextColor', e.target.value)}
                      className="w-full h-8 border border-gray-300 rounded cursor-pointer"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case ComponentType.DEVOTIONAL:
        return (
          <div className="space-y-4">
            {/* Configurações do Texto da Reflexão */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título da Reflexão
              </label>
              <input
                type="text"
                value={settings.devotionalTitle || 'Reflexão Diária'}
                onChange={(e) => handleInputChange('devotionalTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Versículo
              </label>
              <textarea
                value={settings.verseText || '"Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais."'}
                onChange={(e) => handleInputChange('verseText', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Referência Bíblica
              </label>
              <input
                type="text"
                value={settings.verseReference || 'Jeremias 29:11'}
                onChange={(e) => handleInputChange('verseReference', e.target.value)}
                placeholder="Ex: João 3:16"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reflexão/Aplicação
              </label>
              <textarea
                value={settings.devotionalReflection || 'Deus tem planos maravilhosos para nossas vidas. Mesmo nos momentos difíceis, podemos confiar que Ele está trabalhando para o nosso bem e nos conduzindo ao propósito que Ele preparou para nós.'}
                onChange={(e) => handleInputChange('devotionalReflection', e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Configurações do Botão */}
            <div className="pt-4 border-t border-gray-200">
              <label className="flex items-center space-x-2 mb-4">
                <input
                  type="checkbox"
                  checked={settings.showButton !== false}
                  onChange={(e) => handleInputChange('showButton', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Mostrar Botão</span>
              </label>

              {settings.showButton !== false && (
                <div className="space-y-3 pl-6 border-l-2 border-gray-200">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Texto do Botão</label>
                    <input
                      type="text"
                      value={settings.buttonText || 'Ver Mais Devocionais'}
                      onChange={(e) => handleInputChange('buttonText', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Link do Botão</label>
                    <input
                      type="text"
                      value={settings.buttonLink || '/devotionals'}
                      onChange={(e) => handleInputChange('buttonLink', e.target.value)}
                      placeholder="/devotionals ou https://..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Cor de Fundo do Botão</label>
                      <input
                        type="color"
                        value={settings.buttonBackground || '#2563eb'}
                        onChange={(e) => handleInputChange('buttonBackground', e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 mb-1">Cor do Texto do Botão</label>
                      <input
                        type="color"
                        value={settings.buttonTextColor || '#ffffff'}
                        onChange={(e) => handleInputChange('buttonTextColor', e.target.value)}
                        className="w-full h-10 border border-gray-300 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case ComponentType.EVENTS:
      case ComponentType.BLOG:
      case ComponentType.GALLERY:
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Itens para Mostrar
                </label>
                <input
                  type="number"
                  value={settings.itemsToShow || 3}
                  onChange={(e) => handleInputChange('itemsToShow', parseInt(e.target.value))}
                  min="1"
                  max="12"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Colunas
                </label>
                <select
                  value={typeof settings.columns === 'number' ? settings.columns : (settings.columns as { desktop?: number })?.desktop || 3}
                  onChange={(e) => handleInputChange('columns', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={1}>1 Coluna</option>
                  <option value={2}>2 Colunas</option>
                  <option value={3}>3 Colunas</option>
                  <option value={4}>4 Colunas</option>
                </select>
              </div>
            </div>

            {(component.type === ComponentType.EVENTS || component.type === ComponentType.BLOG) && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordenar Por
                  </label>
                  <select
                    value={settings.sortBy || 'date'}
                    onChange={(e) => handleInputChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="date">Data</option>
                    <option value="title">Título</option>
                    <option value="popularity">Popularidade</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ordem
                  </label>
                  <select
                    value={settings.sortOrder || 'desc'}
                    onChange={(e) => handleInputChange('sortOrder', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="asc">Crescente</option>
                    <option value="desc">Decrescente</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        );

      case ComponentType.TESTIMONIALS:
        return (
          <div className="space-y-4">
            <div>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={settings.autoplay || false}
                  onChange={(e) => handleInputChange('autoplay', e.target.checked)}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Reprodução Automática</span>
              </label>
            </div>

            {settings.autoplay && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Intervalo (ms)
                </label>
                <input
                  type="number"
                  value={settings.interval || 5000}
                  onChange={(e) => handleInputChange('interval', parseInt(e.target.value))}
                  min="1000"
                  step="1000"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </div>
        );

      case ComponentType.VIDEO:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL do Vídeo
              </label>
              <input
                type="url"
                value={settings.videoUrl || ''}
                onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                placeholder="https://youtube.com/watch?v=..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        );

      case ComponentType.MAP:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Endereço
              </label>
              <input
                type="text"
                value={settings.mapAddress || ''}
                onChange={(e) => handleInputChange('mapAddress', e.target.value)}
                placeholder="Rua da Igreja, 123, Cidade - Estado"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Endereço completo para localização no Google Maps
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Latitude (opcional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={settings.mapLatitude || ''}
                  onChange={(e) => handleInputChange('mapLatitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="-23.5505"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Longitude (opcional)
                </label>
                <input
                  type="number"
                  step="any"
                  value={settings.mapLongitude || ''}
                  onChange={(e) => handleInputChange('mapLongitude', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="-46.6333"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome da Igreja
              </label>
              <input
                type="text"
                value={settings.churchName || ''}
                onChange={(e) => handleInputChange('churchName', e.target.value)}
                placeholder="Nossa Igreja"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nível de Zoom
              </label>
              <input
                type="range"
                min="10"
                max="20"
                value={settings.mapZoom || 15}
                onChange={(e) => handleInputChange('mapZoom', parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>Distante (10)</span>
                <span>Zoom: {settings.mapZoom || 15}</span>
                <span>Próximo (20)</span>
              </div>
            </div>
          </div>
        );

      case ComponentType.CUSTOM_HTML:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                HTML Personalizado
              </label>
              <textarea
                value={settings.customHTML || ''}
                onChange={(e) => handleInputChange('customHTML', e.target.value)}
                rows={10}
                placeholder="<div>Seu HTML aqui...</div>"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CSS Personalizado
              </label>
              <textarea
                value={settings.customCSS || ''}
                onChange={(e) => handleInputChange('customCSS', e.target.value)}
                rows={5}
                placeholder=".minha-classe { color: red; }"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getComponentIcon = () => {
    switch (component.type) {
      case ComponentType.HERO: return '🎯';
      case ComponentType.DEVOTIONAL: return '📖';
      case ComponentType.EVENTS: return '📅';
      case ComponentType.BLOG: return '✍️';
      case ComponentType.GALLERY: return '🖼️';
      case ComponentType.TESTIMONIALS: return '💬';
      case ComponentType.VIDEO: return '🎥';
      case ComponentType.MAP: return '📍';
      case ComponentType.CUSTOM_HTML: return '💻';
      default: return '⚙️';
    }
  };

  const getComponentLabel = () => {
    switch (component.type) {
      case ComponentType.HERO: return 'Hero Section';
      case ComponentType.DEVOTIONAL: return 'Devocional';
      case ComponentType.EVENTS: return 'Eventos';
      case ComponentType.BLOG: return 'Blog';
      case ComponentType.GALLERY: return 'Galeria';
      case ComponentType.TESTIMONIALS: return 'Testemunhos';
      case ComponentType.VIDEO: return 'Vídeo';
      case ComponentType.MAP: return 'Mapa';
      case ComponentType.CUSTOM_HTML: return 'HTML Customizado';
      default: return 'Componente';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
      {/* Header with gradient */}
      <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-6">
        <div className="flex justify-between items-start">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="text-4xl">{getComponentIcon()}</span>
              <div>
                <h3 className="text-2xl font-bold text-white">
                  Configurações
                </h3>
                <p className="text-indigo-100 text-sm mt-1">
                  {getComponentLabel()}
                </p>
              </div>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-lg transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-gray-50">
        <div className="space-y-6">
          {/* Configurações Básicas */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-indigo-500 rounded-full"></div>
              <h4 className="text-lg font-semibold text-gray-900">📝 Conteúdo</h4>
            </div>
            {renderBasicSettings()}
          </div>

          {/* Configurações Específicas */}
          {renderSpecificSettings() && (
            <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-1 h-6 bg-purple-500 rounded-full"></div>
                <h4 className="text-lg font-semibold text-gray-900">✨ Configurações Específicas</h4>
              </div>
              {renderSpecificSettings()}
            </div>
          )}

          {/* Configurações de Estilo */}
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <div className="flex items-center gap-2 mb-5">
              <div className="w-1 h-6 bg-pink-500 rounded-full"></div>
              <h4 className="text-lg font-semibold text-gray-900">🎨 Estilo Visual</h4>
            </div>
            {renderStyleSettings()}
          </div>
        </div>
      </div>

      {/* Footer with actions */}
      <div className="flex justify-between items-center gap-4 p-6 border-t border-gray-200 bg-white">
        <div className="text-sm text-gray-500">
          💡 As alterações serão aplicadas imediatamente
        </div>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 font-medium transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 rounded-lg text-white font-semibold shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            💾 Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};
