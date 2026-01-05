// Presentation Component - Component Renderer
// Renders different types of home page components

import React, { useState } from 'react';
import { HomeComponent, ComponentType } from '../../../modules/content-management/home-builder/domain/entities/HomeBuilder';
import { PrayerRequestService } from '../../../infrastructure/services/PrayerRequestService';
import { OpenStreetMap } from '../OpenStreetMap';

// SISTEMA DE COMPONENTES ULTRA-CONTROLADO - FORÇA SEPARAÇÃO ABSOLUTA
const getComponentContainer = (variant: 'light' | 'colored' | 'custom' = 'light', isDarkMode: boolean = false, customBg?: string): React.CSSProperties => ({
  // Container principal - ISOLAMENTO EXTREMO
  width: '100%',
  display: 'block',
  position: 'static', // Força posicionamento estático
  float: 'none', // Remove qualquer float
  clear: 'both', // Limpa floats anteriores

  // Espaçamento normal entre componentes
  marginTop: '0',
  marginBottom: '0', // Sem margin bottom - border será o separador
  marginLeft: '0',
  marginRight: '0',

  // Padding interno moderado
  paddingTop: '40px',
  paddingBottom: '40px',
  paddingLeft: '0',
  paddingRight: '0',
  
  // CONTROLE DE CONTEÚDO - MELHORADO
  overflow: 'visible', // Permite que o conteúdo seja visível
  contain: 'layout style paint', // CSS containment completo
  isolation: 'isolate', // Cria contexto de stacking isolado
  
  // ALTURA CONTROLADA - Automática baseada no conteúdo
  minHeight: 'auto', // Altura mínima automática
  height: 'auto', // Altura automática baseada no conteúdo
  maxHeight: 'none', // Sem limite máximo
  
  // FLEXBOX PROPERTIES
  flexShrink: 0, // Não permite compressão
  flexGrow: 0, // Não permite expansão automática
  flexBasis: 'auto', // Base automática
  
  // SISTEMA DE CORES ROBUSTO
  backgroundColor: customBg || (
    variant === 'colored' 
      ? (isDarkMode ? '#1e293b' : '#f8fafc')
      : variant === 'light'
      ? (isDarkMode ? '#0f172a' : '#ffffff')
      : (isDarkMode ? '#111827' : '#f9fafb')
  ),
  
  // BORDAS GROSSAS PARA SEPARAÇÃO VISUAL - MELHORADAS
  borderTop: `8px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  borderBottom: `8px solid ${isDarkMode ? '#334155' : '#e2e8f0'}`,
  borderLeft: 'none',
  borderRight: 'none',
  
  // Z-INDEX PARA GARANTIR CAMADAS
  zIndex: 'auto',
  
  // TRANSIÇÕES
  transition: 'all 0.3s ease',
  
  // TRANSFORM PARA FORÇAR NOVA CAMADA
  transform: 'translateZ(0)', // Força hardware acceleration e nova camada
  willChange: 'auto'
});

const getContentWrapper = (maxWidth: string = '1200px'): React.CSSProperties => ({
  maxWidth,
  margin: '0 auto',
  padding: '0 24px', // Padding horizontal aumentado
  width: '100%',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'flex-start',
  position: 'relative',
  zIndex: 1
});


const getComponentTitle = (isDarkMode: boolean = false, align: 'left' | 'center' | 'right' = 'center'): React.CSSProperties => ({
  fontSize: '2.5rem',
  fontWeight: '800',
  marginBottom: '48px',
  textAlign: align,
  color: isDarkMode ? '#f8fafc' : '#1e293b',
  transition: 'color 0.3s ease',
  lineHeight: '1.2',
  letterSpacing: '-0.025em'
});

const getCardContainer = (isDarkMode: boolean = false): React.CSSProperties => ({
  backgroundColor: isDarkMode ? '#334155' : '#ffffff',
  borderRadius: '24px',
  padding: '40px',
  boxShadow: isDarkMode 
    ? '0 25px 50px rgba(0, 0, 0, 0.4)' 
    : '0 25px 50px rgba(0, 0, 0, 0.08)',
  border: `1px solid ${isDarkMode ? '#475569' : '#e2e8f0'}`,
  transition: 'all 0.3s ease',
  overflow: 'hidden',
  position: 'relative'
});

// Função para gerar estilo de fundo com suporte a gradiente
const getBackgroundStyle = (settings: any): React.CSSProperties => {
  const baseStyle: React.CSSProperties = {};

  // Tipo de fundo: sólido, gradiente ou imagem
  if (settings.backgroundType === 'gradient') {
    // Gradiente
    const direction = settings.gradientDirection || 'to right';
    const startColor = settings.gradientStartColor || '#3b82f6';
    const endColor = settings.gradientEndColor || '#8b5cf6';
    baseStyle.background = `linear-gradient(${direction}, ${startColor}, ${endColor})`;
  } else if (settings.backgroundType === 'image' && settings.backgroundImage) {
    // Imagem de fundo
    baseStyle.backgroundImage = `url(${settings.backgroundImage})`;
    baseStyle.backgroundPosition = settings.backgroundPosition || 'center';
    baseStyle.backgroundSize = settings.backgroundSize || 'cover';
    baseStyle.backgroundRepeat = 'no-repeat';
  } else {
    // Cor sólida (padrão)
    baseStyle.backgroundColor = settings.backgroundColor || '#ffffff';
  }

  // Cor do texto
  if (settings.textColor) {
    baseStyle.color = settings.textColor;
  }

  return baseStyle;
};

// Função para Newsletter e componentes customizáveis
const getCustomComponentContainer = (backgroundColor?: string, textColor?: string, settings?: any): React.CSSProperties => {
  const baseContainer = getComponentContainer('custom');

  // Se temos settings com gradiente/imagem, usa a função de background
  if (settings) {
    const backgroundStyle = getBackgroundStyle(settings);
    return {
      ...baseContainer,
      ...backgroundStyle,
      borderTop: settings.backgroundType === 'gradient'
        ? `3px solid ${settings.gradientStartColor || '#3b82f6'}`
        : `3px solid ${backgroundColor || '#3b82f6'}`,
      borderBottom: settings.backgroundType === 'gradient'
        ? `3px solid ${settings.gradientEndColor || '#8b5cf6'}`
        : `3px solid ${backgroundColor || '#3b82f6'}`
    };
  }

  // Fallback para compatibilidade com código existente
  return {
    ...baseContainer,
    backgroundColor: backgroundColor || '#3b82f6',
    color: textColor || '#ffffff',
    borderTop: `3px solid ${backgroundColor || '#3b82f6'}`,
    borderBottom: `3px solid ${backgroundColor || '#3b82f6'}`
  };
};


// ÍCONES SVG REAIS DAS REDES SOCIAIS
const getSocialIcon = (socialName: string, size: number = 32) => {
  const iconStyle = {
    width: `${size}px`,
    height: `${size}px`,
    fill: 'currentColor'
  };

  switch (socialName.toLowerCase()) {
    case 'facebook':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
        </svg>
      );
    case 'instagram':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24">
          <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
        </svg>
      );
    case 'youtube':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
        </svg>
      );
    case 'whatsapp':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.488"/>
        </svg>
      );
    case 'twitter':
    case 'x':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
        </svg>
      );
    case 'tiktok':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24">
          <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
        </svg>
      );
    case 'linkedin':
      return (
        <svg style={iconStyle} viewBox="0 0 24 24">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
        </svg>
      );
    default:
      return (
        <svg style={iconStyle} viewBox="0 0 24 24">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
        </svg>
      );
  }
};

// Prayer Request Form Component - Moved outside to prevent re-creation
const PrayerRequestForm: React.FC<{ settings: any; isEditMode: boolean }> = ({ settings, isEditMode }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    request: '',
    isAnonymous: false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const prayerRequestService = new PrayerRequestService();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isEditMode) return;

    setIsSubmitting(true);
    setMessage('');

    try {
      const result = await prayerRequestService.submitPrayerRequest({
        name: formData.name,
        email: formData.email || undefined,
        request: formData.request,
        isAnonymous: formData.isAnonymous
      });

      if (result.success) {
        setShowSuccess(true);
        setFormData({ name: '', email: '', request: '', isAnonymous: false });
        setMessage(result.message);
        setTimeout(() => setShowSuccess(false), 5000);
      } else {
        setMessage(result.message);
      }
    } catch (error) {
      setMessage('Erro ao enviar pedido. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (showSuccess) {
    return (
      <div style={getComponentContainer('colored', false)}>
        <div style={getContentWrapper()}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
            padding: '32px'
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '16px' }}>✅</div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#059669', marginBottom: '16px' }}>Pedido Enviado!</h3>
              <p style={{ color: '#374151', marginBottom: '24px' }}>{message}</p>
              <button
                onClick={() => setShowSuccess(false)}
                style={{
                  backgroundColor: '#2563eb',
                  color: 'white',
                  padding: '8px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  transition: 'background-color 0.3s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Enviar Outro Pedido
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={getComponentContainer('colored', false)}>
      <div style={getContentWrapper()}>
        <h2 style={getComponentTitle(false)}>
          {settings.title || 'Pedidos de Oração'}
        </h2>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
          padding: '32px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🙏</div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '16px' }}>Como podemos orar por você?</h3>
            <p style={{ color: '#6b7280' }}>Compartilhe seu pedido de oração conosco. Nossa equipe orará por você.</p>
          </div>
          
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <input
                  type="checkbox"
                  name="isAnonymous"
                  checked={formData.isAnonymous}
                  onChange={handleChange}
                  disabled={isEditMode || isSubmitting}
                  style={{
                    borderRadius: '4px',
                    border: '1px solid #d1d5db'
                  }}
                />
                <span style={{ fontSize: '0.875rem', color: '#374151' }}>Enviar pedido anônimo</span>
              </label>
            </div>

            {!formData.isAnonymous && (
              <>
                <div>
                  <input 
                    type="text" 
                    name="name"
                    placeholder="Seu nome *" 
                    value={formData.name}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      outline: 'none',
                      fontSize: '1rem'
                    }}
                    disabled={isEditMode || isSubmitting}
                    required
                  />
                </div>
                <div>
                  <input 
                    type="email" 
                    name="email"
                    placeholder="Seu e-mail (opcional)" 
                    value={formData.email}
                    onChange={handleChange}
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      outline: 'none',
                      fontSize: '1rem'
                    }}
                    disabled={isEditMode || isSubmitting}
                  />
                </div>
              </>
            )}

            <div>
              <textarea 
                name="request"
                placeholder="Compartilhe seu pedido de oração... *"
                rows={4}
                value={formData.request}
                onChange={handleChange}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  outline: 'none',
                  fontSize: '1rem',
                  resize: 'vertical'
                }}
                disabled={isEditMode || isSubmitting}
                required
                minLength={10}
                maxLength={2000}
              />
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#6b7280', marginTop: '4px' }}>
                {formData.request.length}/2000 caracteres
              </div>
            </div>

            {message && (
              <div style={{
                padding: '12px',
                borderRadius: '8px',
                fontSize: '0.875rem',
                backgroundColor: message.includes('sucesso') ? '#dcfce7' : '#fee2e2',
                color: message.includes('sucesso') ? '#15803d' : '#dc2626'
              }}>
                {message}
              </div>
            )}

            <button 
              type="submit"
              style={{
                width: '100%',
                backgroundColor: isEditMode || isSubmitting || !formData.request.trim() || (!formData.isAnonymous && !formData.name.trim()) ? '#9ca3af' : '#2563eb',
                color: 'white',
                padding: '12px',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '600',
                cursor: isEditMode || isSubmitting || !formData.request.trim() || (!formData.isAnonymous && !formData.name.trim()) ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.3s',
                opacity: isEditMode || isSubmitting || !formData.request.trim() || (!formData.isAnonymous && !formData.name.trim()) ? '0.5' : '1'
              }}
              disabled={isEditMode || isSubmitting || !formData.request.trim() || (!formData.isAnonymous && !formData.name.trim())}
              onMouseOver={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#1d4ed8';
                }
              }}
              onMouseOut={(e) => {
                if (!e.currentTarget.disabled) {
                  e.currentTarget.style.backgroundColor = '#2563eb';
                }
              }}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Pedido'}
            </button>
          </form>

          <p style={{ fontSize: '0.75rem', color: '#6b7280', textAlign: 'center', marginTop: '16px' }}>
            Seus dados são tratados com total confidencialidade e usados apenas para oração.
          </p>
        </div>
      </div>
    </div>
  );
};

interface ComponentRendererProps {
  component: HomeComponent;
  isEditMode?: boolean;
  isDarkMode?: boolean;
  onEdit?: (component: HomeComponent) => void;
  onDelete?: (componentId: string) => void;
  onToggle?: (componentId: string) => void;
}

export const ComponentRenderer: React.FC<ComponentRendererProps> = ({
  component,
  isEditMode = false,
  isDarkMode = false,
  onEdit,
  onDelete,
  onToggle
}) => {
  const { type, settings, enabled } = component;

  // Don't render if component is disabled and not in edit mode
  if (!enabled && !isEditMode) {
    return null;
  }

  const renderControls = () => {
    if (!isEditMode) return null;

    return (
      <div className="absolute top-2 right-2 flex gap-2 bg-white rounded-lg shadow-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
        <button
          onClick={() => onEdit?.(component)}
          className="p-2 text-blue-600 hover:bg-blue-50 rounded"
          title="Editar"
        >
          ✏️
        </button>
        <button
          onClick={() => onToggle?.(component.id)}
          className={`p-2 hover:bg-gray-50 rounded ${enabled ? 'text-green-600' : 'text-gray-400'}`}
          title={enabled ? 'Ocultar' : 'Mostrar'}
        >
          {enabled ? '👁️' : '🙈'}
        </button>
        <button
          onClick={() => onDelete?.(component.id)}
          className="p-2 text-red-600 hover:bg-red-50 rounded"
          title="Excluir"
        >
          🗑️
        </button>
      </div>
    );
  };

  const getComponentStyle = (): React.CSSProperties => {
    // NOVA ESTRUTURA: Removemos interferências de estilos antigos
    // Todo o styling agora é controlado pelas novas funções helper
    return {
      position: 'relative',
      width: '100%',
      display: 'block',
      clear: 'both'
    };
  };

  const getTextAlignment = () => {
    switch (settings.alignment) {
      case 'left': return 'text-left';
      case 'right': return 'text-right';
      case 'center':
      default: return 'text-center';
    }
  };

  const containerClasses = `
    ${isEditMode ? 'relative group border-2 border-dashed border-gray-300 hover:border-blue-400' : ''}
    ${!enabled && isEditMode ? 'opacity-50' : ''}
    ${getTextAlignment()}
  `;

  const renderComponent = () => {
    switch (type) {
      case ComponentType.MENU:
        return (
          <nav style={{
            ...getComponentContainer('custom', false, settings.backgroundColor || '#ffffff'),
            padding: '16px 0',
            position: 'sticky',
            top: 0,
            zIndex: 1000,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <div style={{
              ...getContentWrapper('1400px'),
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              {/* Logo */}
              <div style={{
                fontSize: '1.5rem',
                fontWeight: 'bold',
                color: settings.textColor || '#000000'
              }}>
                {settings.title || 'Igreja'}
              </div>

              {/* Menu Links */}
              <div style={{
                display: 'flex',
                gap: '32px',
                alignItems: 'center'
              }}>
                <a href="/" style={{ color: settings.textColor || '#000000', textDecoration: 'none', fontWeight: '500' }}>Início</a>
                <a href="/events" style={{ color: settings.textColor || '#000000', textDecoration: 'none', fontWeight: '500' }}>Eventos</a>
                <a href="/blog" style={{ color: settings.textColor || '#000000', textDecoration: 'none', fontWeight: '500' }}>Blog</a>
                <a href="/about" style={{ color: settings.textColor || '#000000', textDecoration: 'none', fontWeight: '500' }}>Sobre</a>
                <a href="/contact" style={{ color: settings.textColor || '#000000', textDecoration: 'none', fontWeight: '500' }}>Contato</a>
              </div>
            </div>
          </nav>
        );

      case ComponentType.HERO:
        return (
          <div style={getComponentContainer('custom', isDarkMode, settings.backgroundColor || (isDarkMode ? '#1e293b' : '#3b82f6'))}>
            <div style={{
              ...getContentWrapper('1400px'),
              minHeight: settings.height || '600px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              position: 'relative',
              backgroundImage: settings.backgroundImage ? `url(${settings.backgroundImage})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat'
            }}>
              
              {/* Overlay para melhor legibilidade */}
              {(settings.backgroundImage || !settings.backgroundColor) && (
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.4)',
                  zIndex: 1
                }} />
              )}
              
              {/* Conteúdo principal */}
              <div style={{
                position: 'relative',
                zIndex: 2,
                color: settings.textColor || '#ffffff',
                maxWidth: '800px'
              }}>
                
                {/* Título principal */}
                <h1 style={{
                  fontSize: '4rem',
                  fontWeight: '900',
                  marginBottom: '24px',
                  lineHeight: '1.1',
                  letterSpacing: '-0.02em',
                  textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
                }}>
                  {settings.title || 'Bem-vindo à Nossa Igreja'}
                </h1>
                
                {/* Subtítulo */}
                <p style={{
                  fontSize: '1.5rem',
                  marginBottom: '48px',
                  opacity: 0.9,
                  lineHeight: '1.6',
                  fontWeight: '400',
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
                }}>
                  {settings.subtitle || 'Um lugar de fé, esperança e comunhão'}
                </p>
                
                {/* Botões de ação */}
                {settings.showButtons && (
                  <div style={{
                    display: 'flex',
                    gap: '24px',
                    justifyContent: 'center',
                    flexWrap: 'wrap'
                  }}>
                    <a
                      href={isEditMode ? '#' : (settings.primaryButtonLink || '#')}
                      onClick={isEditMode ? (e) => e.preventDefault() : undefined}
                      style={{
                        backgroundColor: settings.primaryButtonBackground || '#ffffff',
                        color: settings.primaryButtonTextColor || '#1e293b',
                        padding: '18px 36px',
                        borderRadius: '16px',
                        textDecoration: 'none',
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '160px',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
                        transition: 'all 0.3s ease',
                        border: 'none'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.transform = 'translateY(-3px)';
                        e.currentTarget.style.boxShadow = '0 15px 40px rgba(0, 0, 0, 0.3)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 10px 30px rgba(0, 0, 0, 0.2)';
                      }}
                    >
                      {settings.primaryButtonText || 'Saiba Mais'}
                    </a>
                    
                    <a
                      href={isEditMode ? '#' : (settings.secondaryButtonLink || '#')}
                      onClick={isEditMode ? (e) => e.preventDefault() : undefined}
                      style={{
                        backgroundColor: settings.secondaryButtonBackground || 'transparent',
                        color: settings.secondaryButtonTextColor || '#ffffff',
                        padding: '18px 36px',
                        borderRadius: '16px',
                        textDecoration: 'none',
                        fontSize: '1.125rem',
                        fontWeight: '700',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: '160px',
                        border: `2px solid ${settings.secondaryButtonBorderColor || '#ffffff'}`,
                        transition: 'all 0.3s ease'
                      }}
                      onMouseOver={(e) => {
                        e.currentTarget.style.backgroundColor = settings.secondaryButtonBorderColor || '#ffffff';
                        e.currentTarget.style.color = settings.backgroundColor || '#1e293b';
                        e.currentTarget.style.transform = 'translateY(-3px)';
                      }}
                      onMouseOut={(e) => {
                        e.currentTarget.style.backgroundColor = settings.secondaryButtonBackground || 'transparent';
                        e.currentTarget.style.color = settings.secondaryButtonTextColor || '#ffffff';
                        e.currentTarget.style.transform = 'translateY(0)';
                      }}
                    >
                      {settings.secondaryButtonText || 'Visite-nos'}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case ComponentType.WELCOME:
        return (
          <div style={getComponentContainer('light', isDarkMode, settings.backgroundColor)}>
            <div style={getContentWrapper('1200px')}>
              <div style={{...getCardContainer(isDarkMode), textAlign: 'center'}}>
                <div style={{ 
                  fontSize: '4rem', 
                  marginBottom: '24px',
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}>👋</div>
                <h2 style={{
                  fontSize: '2.5rem',
                  fontWeight: 'bold',
                  marginBottom: '24px',
                  color: isDarkMode ? '#f9fafb' : '#111827',
                  transition: 'color 0.3s'
                }}>
                  {settings.title || 'Seja Bem-Vindo'}
                </h2>
                <p style={{ 
                  fontSize: '1.25rem', 
                  color: isDarkMode ? '#d1d5db' : '#4b5563', 
                  lineHeight: '1.75',
                  marginBottom: '32px',
                  maxWidth: '800px',
                  margin: '0 auto 32px auto',
                  transition: 'color 0.3s' 
                }}>
                  {settings.description || 'Nossa igreja é um lugar de acolhimento e crescimento espiritual onde você encontrará uma família em Cristo.'}
                </p>
                
                {/* Botões de ação */}
                <div style={{
                  display: 'flex',
                  gap: '16px',
                  justifyContent: 'center',
                  flexWrap: 'wrap'
                }}>
                  <button style={{
                    backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
                    color: 'white',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}>
                    📖 Conheça Nossa História
                  </button>
                  <button style={{
                    backgroundColor: 'transparent',
                    color: isDarkMode ? '#60a5fa' : '#2563eb',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    border: `2px solid ${isDarkMode ? '#60a5fa' : '#2563eb'}`,
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s'
                  }}>
                    🤝 Participe Conosco
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case ComponentType.SERVICES:
        return (
          <div 
            style={{ 
              width: '100%',
              backgroundColor: settings.backgroundColor || (isDarkMode ? '#1f2937' : '#f8fafc'),
              padding: '100px 0',
              margin: '64px 0',
              position: 'static',
              display: 'block',
              flexShrink: 0,
              clear: 'both',
              overflow: 'hidden',
              isolation: 'isolate',
              zIndex: 'auto',
              transition: 'background-color 0.3s',
              minHeight: '400px'
            }}
          >
            <div style={getContentWrapper('1400px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Nossas Programações'}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px'
              }}>
                {[1, 2, 3].map(i => (
                  <div key={i} style={{
                    backgroundColor: isDarkMode ? '#374151' : 'white',
                    borderRadius: '12px',
                    padding: '28px',
                    boxShadow: isDarkMode 
                      ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                      : '0 8px 20px rgba(0, 0, 0, 0.1)',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>🕐</div>
                    <h3 style={{ 
                      fontSize: '1.25rem', 
                      fontWeight: '600', 
                      marginBottom: '8px',
                      color: isDarkMode ? '#f9fafb' : '#111827'
                    }}>Culto {i}</h3>
                    <p style={{ 
                      color: isDarkMode ? '#d1d5db' : '#6b7280', 
                      marginBottom: '16px' 
                    }}>Horário e descrição do culto</p>
                    <span style={{ 
                      color: isDarkMode ? '#60a5fa' : '#2563eb', 
                      fontWeight: '500' 
                    }}>Saiba mais</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case ComponentType.EVENTS:
        return (
          <div style={getComponentContainer('light', isDarkMode, settings.backgroundColor)}
          >
            <div style={getContentWrapper('1400px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Próximos Eventos'}
              </h2>
              <div className="events-grid" style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))',
                gap: 'clamp(16px, 4vw, 32px)'
              }}>
                {[1, 2, 3].slice(0, settings.itemsToShow || 3).map(i => (
                  <div key={i} className="event-card" style={{
                    backgroundColor: isDarkMode ? '#374151' : 'white',
                    borderRadius: 'clamp(8px, 2vw, 12px)',
                    overflow: 'hidden',
                    boxShadow: isDarkMode
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                      : '0 4px 12px rgba(0, 0, 0, 0.1)',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    transition: 'all 0.3s',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = isDarkMode
                      ? '0 12px 24px rgba(0, 0, 0, 0.4)'
                      : '0 12px 24px rgba(0, 0, 0, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = isDarkMode
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                      : '0 4px 12px rgba(0, 0, 0, 0.1)';
                  }}
                  >
                    <div style={{
                      height: 'clamp(140px, 30vw, 192px)',
                      backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db',
                      backgroundImage: 'linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%)'
                    }}></div>
                    <div style={{ padding: 'clamp(16px, 4vw, 24px)' }}>
                      <div style={{
                        display: 'inline-block',
                        backgroundColor: isDarkMode ? 'rgba(96, 165, 250, 0.1)' : 'rgba(37, 99, 235, 0.1)',
                        padding: '4px 12px',
                        borderRadius: '6px',
                        marginBottom: '8px'
                      }}>
                        <span style={{
                          fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                          color: isDarkMode ? '#60a5fa' : '#2563eb',
                          fontWeight: '600',
                          letterSpacing: '0.5px'
                        }}>15 JAN</span>
                      </div>
                      <h3 style={{
                        fontSize: 'clamp(1rem, 3vw, 1.25rem)',
                        fontWeight: '600',
                        marginTop: '8px',
                        marginBottom: '8px',
                        color: isDarkMode ? '#f9fafb' : '#111827',
                        lineHeight: '1.4',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical'
                      }}>Evento {i}</h3>
                      <p style={{
                        color: isDarkMode ? '#d1d5db' : '#6b7280',
                        fontSize: 'clamp(0.875rem, 2.5vw, 1rem)',
                        lineHeight: '1.6',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        marginBottom: '12px'
                      }}>Descrição do evento que pode ser um pouco mais longa</p>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        color: isDarkMode ? '#60a5fa' : '#2563eb',
                        fontSize: 'clamp(0.875rem, 2.5vw, 0.9375rem)',
                        fontWeight: '500'
                      }}>
                        <span>Ver detalhes</span>
                        <span style={{ fontSize: '0.875rem' }}>→</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case ComponentType.BLOG:
        return (
          <div 
            style={{ 
              width: '100%',
              backgroundColor: settings.backgroundColor || (isDarkMode ? '#1f2937' : '#f8fafc'),
              padding: '100px 0',
              margin: '64px 0',
              position: 'static',
              display: 'block',
              flexShrink: 0,
              clear: 'both',
              overflow: 'hidden',
              isolation: 'isolate',
              zIndex: 'auto',
              transition: 'background-color 0.3s',
              minHeight: '400px'
            }}
          >
            <div style={getContentWrapper('1400px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Últimas Mensagens'}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                gap: '32px'
              }}>
                {[1, 2, 3].slice(0, settings.itemsToShow || 3).map(i => (
                  <article key={i} style={{
                    backgroundColor: isDarkMode ? '#374151' : 'white',
                    borderRadius: '12px',
                    overflow: 'hidden',
                    boxShadow: isDarkMode 
                      ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                      : '0 8px 20px rgba(0, 0, 0, 0.1)',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ height: '192px', backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db' }}></div>
                    <div style={{ padding: '24px' }}>
                      <h3 style={{ 
                        fontSize: '1.25rem', 
                        fontWeight: '600', 
                        marginBottom: '12px',
                        color: isDarkMode ? '#f9fafb' : '#111827'
                      }}>Mensagem {i}</h3>
                      <p style={{ 
                        color: isDarkMode ? '#d1d5db' : '#6b7280', 
                        marginBottom: '16px' 
                      }}>Resumo da mensagem...</p>
                      <span style={{ 
                        color: isDarkMode ? '#60a5fa' : '#2563eb', 
                        fontWeight: '500' 
                      }}>Ler mais</span>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </div>
        );

      case ComponentType.TESTIMONIALS:
        return (
          <div 
            style={{ 
              width: '100%',
              backgroundColor: settings.backgroundColor || (isDarkMode ? '#1f2937' : '#f8fafc'),
              padding: '100px 0',
              margin: '64px 0',
              position: 'static',
              display: 'block',
              flexShrink: 0,
              clear: 'both',
              overflow: 'hidden',
              isolation: 'isolate',
              zIndex: 'auto',
              transition: 'background-color 0.3s',
              minHeight: '400px'
            }}
          >
            <div style={getContentWrapper('1400px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Testemunhos'}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                gap: '32px'
              }}>
                {[1, 2, 3].slice(0, settings.itemsToShow || 3).map(i => (
                  <div key={i} style={{
                    backgroundColor: isDarkMode ? '#374151' : 'white',
                    borderRadius: '12px',
                    padding: '32px',
                    boxShadow: isDarkMode 
                      ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                      : '0 8px 20px rgba(0, 0, 0, 0.1)',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{ 
                      fontSize: '4rem', 
                      color: isDarkMode ? '#60a5fa' : '#2563eb', 
                      marginBottom: '16px',
                      lineHeight: '1' 
                    }}>"</div>
                    <p style={{
                      fontSize: '1.125rem',
                      color: isDarkMode ? '#d1d5db' : '#374151',
                      marginBottom: '24px',
                      fontStyle: 'italic',
                      lineHeight: '1.6',
                      transition: 'color 0.3s'
                    }}>
                      {i === 1 
                        ? "Esta igreja transformou minha vida. Encontrei não apenas uma comunidade, mas uma família que me acolheu com amor."
                        : i === 2 
                        ? "Os ensinamentos e o cuidado pastoral me ajudaram a crescer espiritualmente e enfrentar os desafios da vida."
                        : "Aqui descobri o verdadeiro significado de servir ao próximo e viver em comunhão com Deus e os irmãos."}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                      <div style={{
                        width: '56px',
                        height: '56px',
                        backgroundColor: isDarkMode ? '#4b5563' : '#d1d5db',
                        borderRadius: '50%',
                        marginRight: '16px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.5rem'
                      }}>👤</div>
                      <div>
                        <h4 style={{ 
                          fontWeight: '600',
                          color: isDarkMode ? '#f9fafb' : '#111827',
                          marginBottom: '4px',
                          transition: 'color 0.3s'
                        }}>
                          {i === 1 ? 'Maria Silva' : i === 2 ? 'João Santos' : 'Ana Costa'}
                        </h4>
                        <p style={{ 
                          color: isDarkMode ? '#9ca3af' : '#6b7280',
                          fontSize: '0.875rem',
                          transition: 'color 0.3s'
                        }}>
                          {i === 1 ? 'Membra há 3 anos' : i === 2 ? 'Membro há 5 anos' : 'Membra há 2 anos'}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case ComponentType.CONTACT:
        return (
          <div style={getComponentContainer('light', isDarkMode, settings.backgroundColor)}
          >
            <div style={getContentWrapper('1400px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Entre em Contato'}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
                marginBottom: '40px'
              }}>
                <div style={{
                  backgroundColor: isDarkMode ? '#374151' : 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  textAlign: 'center',
                  boxShadow: isDarkMode 
                    ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 20px rgba(0, 0, 0, 0.1)',
                  border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📍</div>
                  <h3 style={{ 
                    fontWeight: '600', 
                    marginBottom: '12px',
                    color: isDarkMode ? '#f9fafb' : '#111827',
                    fontSize: '1.25rem',
                    transition: 'color 0.3s'
                  }}>Endereço</h3>
                  <p style={{ 
                    color: isDarkMode ? '#d1d5db' : '#6b7280',
                    transition: 'color 0.3s'
                  }}>
                    {'Rua da Igreja, 123\nCentro - São Paulo/SP\nCEP: 01234-567'}
                  </p>
                </div>
                <div style={{
                  backgroundColor: isDarkMode ? '#374151' : 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  textAlign: 'center',
                  boxShadow: isDarkMode 
                    ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 20px rgba(0, 0, 0, 0.1)',
                  border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📞</div>
                  <h3 style={{ 
                    fontWeight: '600', 
                    marginBottom: '12px',
                    color: isDarkMode ? '#f9fafb' : '#111827',
                    fontSize: '1.25rem',
                    transition: 'color 0.3s'
                  }}>Telefone</h3>
                  <p style={{ 
                    color: isDarkMode ? '#d1d5db' : '#6b7280',
                    transition: 'color 0.3s'
                  }}>
                    {'(11) 1234-5678\n(11) 9876-5432'}
                  </p>
                </div>
                <div style={{
                  backgroundColor: isDarkMode ? '#374151' : 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  textAlign: 'center',
                  boxShadow: isDarkMode 
                    ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                    : '0 8px 20px rgba(0, 0, 0, 0.1)',
                  border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                  transition: 'all 0.3s'
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '20px' }}>📧</div>
                  <h3 style={{ 
                    fontWeight: '600', 
                    marginBottom: '12px',
                    color: isDarkMode ? '#f9fafb' : '#111827',
                    fontSize: '1.25rem',
                    transition: 'color 0.3s'
                  }}>Email</h3>
                  <p style={{ 
                    color: isDarkMode ? '#d1d5db' : '#6b7280',
                    transition: 'color 0.3s'
                  }}>
                    {'contato@igreja.com\npastor@igreja.com'}
                  </p>
                </div>
              </div>
              
              {/* Horários de Funcionamento */}
              <div style={{
                backgroundColor: isDarkMode ? '#374151' : 'white',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: isDarkMode 
                  ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                  : '0 8px 20px rgba(0, 0, 0, 0.1)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                transition: 'all 0.3s'
              }}>
                <div style={{ fontSize: '3rem', marginBottom: '20px' }}>🕐</div>
                <h3 style={{ 
                  fontWeight: '600', 
                  marginBottom: '20px',
                  color: isDarkMode ? '#f9fafb' : '#111827',
                  fontSize: '1.25rem',
                  transition: 'color 0.3s'
                }}>Horários de Atendimento</h3>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <div>
                    <h4 style={{ 
                      fontWeight: '500',
                      color: isDarkMode ? '#60a5fa' : '#2563eb',
                      marginBottom: '8px'
                    }}>Segunda a Sexta</h4>
                    <p style={{ 
                      color: isDarkMode ? '#d1d5db' : '#6b7280',
                      fontSize: '0.875rem'
                    }}>08:00 - 17:00</p>
                  </div>
                  <div>
                    <h4 style={{ 
                      fontWeight: '500',
                      color: isDarkMode ? '#60a5fa' : '#2563eb',
                      marginBottom: '8px'
                    }}>Sábado</h4>
                    <p style={{ 
                      color: isDarkMode ? '#d1d5db' : '#6b7280',
                      fontSize: '0.875rem'
                    }}>08:00 - 12:00</p>
                  </div>
                  <div>
                    <h4 style={{ 
                      fontWeight: '500',
                      color: isDarkMode ? '#60a5fa' : '#2563eb',
                      marginBottom: '8px'
                    }}>Domingo</h4>
                    <p style={{ 
                      color: isDarkMode ? '#d1d5db' : '#6b7280',
                      fontSize: '0.875rem'
                    }}>07:00 - 21:00</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case ComponentType.SPACER:
        return (
          <div 
            className="w-full"
            style={{ height: settings.height || '32px' }}
          >
            {isEditMode && (
              <div className="h-full flex items-center justify-center text-gray-400 border-2 border-dashed border-gray-300">
                Espaçamento ({settings.height || '32px'})
              </div>
            )}
          </div>
        );

      case ComponentType.DIVIDER:
        return (
          <div className="py-6">
            <div className="max-w-4xl mx-auto px-4">
              <hr className="border-gray-300" />
            </div>
          </div>
        );

      case ComponentType.CUSTOM_HTML:
        return (
          <div
            dangerouslySetInnerHTML={{
              __html: settings.customHTML || '<p>HTML personalizado aqui</p>'
            }}
          />
        );

      case ComponentType.GALLERY:
        return (
          <div 
            style={{ 
              width: '100%',
              backgroundColor: settings.backgroundColor || (isDarkMode ? '#1f2937' : '#f8fafc'),
              padding: '100px 0',
              margin: '64px 0',
              position: 'static',
              display: 'block',
              flexShrink: 0,
              clear: 'both',
              overflow: 'hidden',
              isolation: 'isolate',
              zIndex: 'auto',
              transition: 'background-color 0.3s',
              minHeight: '400px'
            }}
          >
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 16px' }}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Galeria de Fotos'}
              </h2>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: '28px'
              }}>
                {[1, 2, 3, 4, 5, 6, 7, 8].slice(0, settings.itemsToShow || 8).map(i => (
                  <div key={i} style={{
                    position: 'relative',
                    overflow: 'hidden',
                    borderRadius: '12px',
                    boxShadow: isDarkMode 
                      ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                      : '0 8px 20px rgba(0, 0, 0, 0.15)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'
                  }}>
                    <div style={{
                      aspectRatio: '4/3',
                      backgroundColor: isDarkMode ? '#374151' : '#e5e7eb',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexDirection: 'column',
                      color: isDarkMode ? '#9ca3af' : '#6b7280',
                      position: 'relative',
                      backgroundImage: i % 4 === 1 
                        ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                        : i % 4 === 2
                        ? 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
                        : i % 4 === 3
                        ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                        : 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                      transition: 'all 0.3s'
                    }}>
                      <div style={{ 
                        fontSize: '3rem', 
                        marginBottom: '12px',
                        color: 'white',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>📸</div>
                      <h3 style={{ 
                        fontSize: '1.125rem', 
                        fontWeight: '600',
                        color: 'white',
                        textAlign: 'center',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)',
                        margin: '0'
                      }}>
                        {i === 1 ? 'Cultos e Celebrações' 
                         : i === 2 ? 'Eventos Especiais'
                         : i === 3 ? 'Atividades da Comunidade'
                         : i === 4 ? 'Ministério Infantil'
                         : i === 5 ? 'Grupo de Jovens'
                         : i === 6 ? 'Projetos Sociais'
                         : i === 7 ? 'Retiros e Acampamentos'
                         : 'Momentos Especiais'}
                      </h3>
                      <p style={{
                        fontSize: '0.875rem',
                        color: 'rgba(255,255,255,0.9)',
                        textAlign: 'center',
                        marginTop: '8px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.3)'
                      }}>
                        {i} {i === 1 ? 'foto' : 'fotos'}
                      </p>
                      
                      {/* Hover overlay */}
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.4)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.3s'
                      }}>
                        <span style={{
                          color: 'white',
                          fontSize: '1rem',
                          fontWeight: '600',
                          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                        }}>Ver Galeria</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Botão Ver Mais */}
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <button style={{
                  backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
                  color: 'white',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}>
                  📱 Ver Todas as Fotos
                </button>
              </div>
            </div>
          </div>
        );

      case ComponentType.MAP:
        return (
          <div style={getComponentContainer('colored', isDarkMode, settings.backgroundColor)}>
            <div style={getContentWrapper('1200px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Como Chegar'}
              </h2>
              
              {/* Container principal do mapa - NOVO DESIGN LIMPO */}
              <div style={{
                backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                borderRadius: '20px',
                padding: '40px',
                boxShadow: isDarkMode 
                  ? '0 20px 50px rgba(0, 0, 0, 0.3)' 
                  : '0 20px 50px rgba(0, 0, 0, 0.08)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                transition: 'all 0.3s ease',
                overflow: 'hidden',
                position: 'relative'
              }}>
                
                {/* Seção de Endereço - COMPACTA */}
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '32px',
                  padding: '20px',
                  backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc',
                  borderRadius: '16px',
                  border: isDarkMode ? '1px solid #374151' : '1px solid #e2e8f0'
                }}>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    marginBottom: '12px',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                  }}>📍</div>
                  <h3 style={{
                    fontSize: '1.4rem',
                    fontWeight: '700',
                    marginBottom: '8px',
                    color: isDarkMode ? '#f8fafc' : '#1e293b',
                    transition: 'color 0.3s'
                  }}>Nossa Localização</h3>
                  <p style={{ 
                    fontSize: '1.1rem', 
                    color: isDarkMode ? '#cbd5e1' : '#475569',
                    margin: '0',
                    fontWeight: '500',
                    transition: 'color 0.3s'
                  }}>
                    {settings.mapAddress || 'Rua da Igreja, 123 - Centro, São Paulo/SP'}
                  </p>
                </div>

                {/* Container do Mapa - OTIMIZADO */}
                <div style={{ 
                  backgroundColor: '#ffffff', 
                  borderRadius: '16px', 
                  boxShadow: '0 10px 30px rgba(0, 0, 0, 0.1)',
                  overflow: 'hidden',
                  marginBottom: '32px',
                  height: '450px',
                  width: '100%',
                  position: 'relative',
                  border: '3px solid ' + (isDarkMode ? '#374151' : '#e2e8f0')
                }}>
                  <OpenStreetMap
                    address={settings.mapAddress || 'São Paulo, SP'}
                    latitude={settings.mapLatitude}
                    longitude={settings.mapLongitude}
                    zoom={settings.mapZoom || 15}
                    height="100%"
                    churchName={settings.churchName || 'Nossa Igreja'}
                  />
                </div>

                {/* Seção de Ações - REDESENHADA */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  marginBottom: '32px'
                }}>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.mapAddress || 'São Paulo, SP')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#1976d2',
                      color: 'white',
                      padding: '20px 32px',
                      borderRadius: '16px',
                      textDecoration: 'none',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: '0 8px 25px rgba(25, 118, 210, 0.3)',
                      border: 'none',
                      transition: 'all 0.3s ease',
                      textAlign: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(25, 118, 210, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(25, 118, 210, 0.3)';
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🗺️</span>
                    Ver no Google Maps
                  </a>
                  
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(settings.mapAddress || 'São Paulo, SP')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      backgroundColor: '#16a34a',
                      color: 'white',
                      padding: '20px 32px',
                      borderRadius: '16px',
                      textDecoration: 'none',
                      fontSize: '1.1rem',
                      fontWeight: '700',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '12px',
                      boxShadow: '0 8px 25px rgba(22, 163, 74, 0.3)',
                      border: 'none',
                      transition: 'all 0.3s ease',
                      textAlign: 'center'
                    }}
                    onMouseOver={(e) => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.boxShadow = '0 12px 35px rgba(22, 163, 74, 0.4)';
                    }}
                    onMouseOut={(e) => {
                      e.currentTarget.style.transform = 'translateY(0)';
                      e.currentTarget.style.boxShadow = '0 8px 25px rgba(22, 163, 74, 0.3)';
                    }}
                  >
                    <span style={{ fontSize: '1.5rem' }}>🧭</span>
                    Como Chegar
                  </a>
                </div>

                {/* Informações Práticas - REDESENHADA */}
                <div style={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc',
                  borderRadius: '16px',
                  padding: '24px',
                  border: isDarkMode ? '1px solid #374151' : '1px solid #e2e8f0'
                }}>
                  <h4 style={{
                    fontSize: '1.2rem',
                    fontWeight: '700',
                    marginBottom: '20px',
                    textAlign: 'center',
                    color: isDarkMode ? '#f8fafc' : '#1e293b',
                    transition: 'color 0.3s'
                  }}>📋 Informações Úteis</h4>
                  
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '20px'
                  }}>
                    <div style={{
                      textAlign: 'center',
                      padding: '16px',
                      backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                      borderRadius: '12px',
                      border: isDarkMode ? '1px solid #4b5563' : '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🚌</div>
                      <strong style={{ 
                        color: isDarkMode ? '#60a5fa' : '#1976d2',
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '1rem'
                      }}>Transporte Público</strong>
                      <span style={{ 
                        color: isDarkMode ? '#cbd5e1' : '#64748b',
                        fontSize: '0.9rem'
                      }}>Estação Metro Sé</span>
                    </div>
                    
                    <div style={{
                      textAlign: 'center',
                      padding: '16px',
                      backgroundColor: isDarkMode ? '#374151' : '#ffffff',
                      borderRadius: '12px',
                      border: isDarkMode ? '1px solid #4b5563' : '1px solid #e2e8f0'
                    }}>
                      <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🅿️</div>
                      <strong style={{ 
                        color: isDarkMode ? '#60a5fa' : '#1976d2',
                        display: 'block',
                        marginBottom: '4px',
                        fontSize: '1rem'
                      }}>Estacionamento</strong>
                      <span style={{ 
                        color: isDarkMode ? '#cbd5e1' : '#64748b',
                        fontSize: '0.9rem'
                      }}>Gratuito no local</span>
                    </div>
                  </div>
                </div>
                
              </div>
            </div>
          </div>
        );

      case ComponentType.VIDEO:
        return (
          <div 
            style={{ 
              width: '100%',
              backgroundColor: settings.backgroundColor || (isDarkMode ? '#111827' : '#ffffff'),
              padding: '80px 0', // Increased padding even more
              margin: '48px 0', // Increased margin for better separation
              position: 'static',
              zIndex: 'auto',
              display: 'block',
              flexShrink: 0,
              clear: 'both',
              overflow: 'hidden', // Changed to hidden to prevent overflow
              isolation: 'isolate',
              transition: 'background-color 0.3s',
              minHeight: '400px' // Increased minimum height
            }}
          >
            <div style={getContentWrapper('1200px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Vídeo'}
              </h2>
              
              {/* Container do Vídeo */}
              <div style={{
                width: '100%',
                maxWidth: '900px',
                margin: '0 auto',
                backgroundColor: '#000000',
                borderRadius: '12px',
                overflow: 'hidden',
                boxShadow: isDarkMode 
                  ? '0 8px 24px rgba(0, 0, 0, 0.5)' 
                  : '0 8px 24px rgba(0, 0, 0, 0.25)',
                border: isDarkMode ? '2px solid #374151' : '2px solid #e5e7eb',
                position: 'relative'
              }}>
                <div style={{
                  aspectRatio: '16 / 9',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#000000',
                  position: 'relative'
                }}>
                  <div style={{ 
                    textAlign: 'center', 
                    color: 'white',
                    padding: '20px',
                    position: 'relative',
                    zIndex: 2
                  }}>
                    <div style={{ 
                      fontSize: '4rem', 
                      marginBottom: '20px',
                      filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))'
                    }}>
                      ▶️
                    </div>
                    <h3 style={{ 
                      fontSize: '1.5rem', 
                      fontWeight: '700', 
                      marginBottom: '12px',
                      textShadow: '0 2px 4px rgba(0,0,0,0.5)'
                    }}>
                      Player de Vídeo
                    </h3>
                    <p style={{ 
                      color: '#9ca3af',
                      fontSize: '0.875rem'
                    }}>
                      {settings.videoUrl ? `URL: ${settings.videoUrl}` : 'Configure a URL do vídeo'}
                    </p>
                  </div>
                  
                  {/* Overlay gradient para melhor visualização */}
                  <div style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    background: 'radial-gradient(circle, transparent 40%, rgba(0,0,0,0.4) 100%)',
                    pointerEvents: 'none'
                  }} />
                </div>
              </div>
              
              {/* Espaçamento inferior */}
              <div style={{ height: '32px' }} />
            </div>
          </div>
        );

      case ComponentType.SCHEDULE:
        return (
          <div style={getComponentContainer('light', isDarkMode, settings.backgroundColor)}
          >
            <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 16px' }}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Programação Semanal'}
              </h2>
              
              {/* Grade principal da programação */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
                gap: '24px',
                marginBottom: '40px'
              }}>
                {[
                  { day: 'Domingo', time: '09:00', event: 'Culto Matutino', desc: 'Culto familiar com escola dominical', icon: '🌅' },
                  { day: 'Domingo', time: '19:00', event: 'Culto Noturno', desc: 'Culto de celebração e adoração', icon: '🌙' },
                  { day: 'Quarta-feira', time: '19:30', event: 'Culto de Oração', desc: 'Momento de intercessão e comunhão', icon: '🙏' },
                  { day: 'Sexta-feira', time: '19:30', event: 'Culto de Jovens', desc: 'Encontro dos jovens e adolescentes', icon: '👥' },
                  { day: 'Sábado', time: '15:00', event: 'Ministério Infantil', desc: 'Atividades para crianças', icon: '👶' },
                  { day: 'Terça-feira', time: '14:00', event: 'Grupo de Mulheres', desc: 'Estudo bíblico e fellowship', icon: '👩' }
                ].slice(0, settings.itemsToShow || 6).map((schedule, i) => (
                  <div key={i} style={{
                    backgroundColor: isDarkMode ? '#374151' : 'white',
                    borderRadius: '12px',
                    padding: '28px',
                    boxShadow: isDarkMode 
                      ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                      : '0 8px 20px rgba(0, 0, 0, 0.1)',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    transition: 'all 0.3s',
                    position: 'relative',
                    overflow: 'hidden'
                  }}>
                    {/* Linha colorida no topo */}
                    <div style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      height: '4px',
                      background: i % 4 === 0 
                        ? 'linear-gradient(90deg, #3b82f6, #8b5cf6)'
                        : i % 4 === 1
                        ? 'linear-gradient(90deg, #10b981, #059669)'
                        : i % 4 === 2
                        ? 'linear-gradient(90deg, #f59e0b, #d97706)'
                        : 'linear-gradient(90deg, #ef4444, #dc2626)'
                    }} />
                    
                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ 
                        fontSize: '2.5rem', 
                        marginRight: '20px',
                        padding: '12px',
                        backgroundColor: isDarkMode ? '#4b5563' : '#f3f4f6',
                        borderRadius: '12px',
                        transition: 'background-color 0.3s'
                      }}>
                        {schedule.icon}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginBottom: '8px'
                        }}>
                          <h3 style={{ 
                            fontWeight: 'bold', 
                            fontSize: '1.25rem',
                            color: isDarkMode ? '#f9fafb' : '#111827',
                            margin: '0',
                            transition: 'color 0.3s'
                          }}>
                            {schedule.day}
                          </h3>
                          <span style={{
                            backgroundColor: isDarkMode ? '#1f2937' : '#f0f9ff',
                            color: isDarkMode ? '#60a5fa' : '#0369a1',
                            padding: '4px 12px',
                            borderRadius: '20px',
                            fontSize: '0.875rem',
                            fontWeight: '600',
                            transition: 'all 0.3s'
                          }}>
                            {schedule.time}
                          </span>
                        </div>
                        <h4 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: isDarkMode ? '#60a5fa' : '#2563eb',
                          marginBottom: '8px',
                          transition: 'color 0.3s'
                        }}>
                          {schedule.event}
                        </h4>
                        <p style={{ 
                          color: isDarkMode ? '#d1d5db' : '#6b7280',
                          fontSize: '0.875rem',
                          lineHeight: '1.5',
                          margin: '0',
                          transition: 'color 0.3s'
                        }}>
                          {schedule.desc}
                        </p>
                      </div>
                    </div>
                    
                    {/* Indicador de participação */}
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      paddingTop: '16px',
                      borderTop: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`,
                      fontSize: '0.875rem'
                    }}>
                      <span style={{ 
                        color: isDarkMode ? '#9ca3af' : '#6b7280',
                        transition: 'color 0.3s'
                      }}>
                        📍 Presencial e Online
                      </span>
                      <span style={{ 
                        color: isDarkMode ? '#34d399' : '#059669',
                        fontWeight: '500',
                        transition: 'color 0.3s'
                      }}>
                        Aberto a todos
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Informações adicionais */}
              <div style={{
                backgroundColor: isDarkMode ? '#374151' : 'white',
                borderRadius: '12px',
                padding: '32px',
                textAlign: 'center',
                boxShadow: isDarkMode 
                  ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                  : '0 8px 20px rgba(0, 0, 0, 0.1)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                transition: 'all 0.3s'
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '16px' }}>📋</div>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  color: isDarkMode ? '#f9fafb' : '#111827',
                  marginBottom: '12px',
                  transition: 'color 0.3s'
                }}>
                  Informações Importantes
                </h3>
                <p style={{
                  color: isDarkMode ? '#d1d5db' : '#6b7280',
                  marginBottom: '20px',
                  lineHeight: '1.6',
                  transition: 'color 0.3s'
                }}>
                  Todos os cultos são transmitidos ao vivo em nossas redes sociais. 
                  Para participar presencialmente, consulte as medidas de segurança vigentes.
                </p>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                  marginTop: '24px'
                }}>
                  <div>
                    <span style={{
                      color: isDarkMode ? '#60a5fa' : '#2563eb',
                      fontWeight: '600'
                    }}>📺 Transmissão:</span>
                    <p style={{
                      color: isDarkMode ? '#d1d5db' : '#6b7280',
                      fontSize: '0.875rem',
                      margin: '4px 0 0 0'
                    }}>YouTube e Facebook</p>
                  </div>
                  <div>
                    <span style={{
                      color: isDarkMode ? '#60a5fa' : '#2563eb',
                      fontWeight: '600'
                    }}>🎵 Louvor:</span>
                    <p style={{
                      color: isDarkMode ? '#d1d5db' : '#6b7280',
                      fontSize: '0.875rem',
                      margin: '4px 0 0 0'
                    }}>30min antes de cada culto</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case ComponentType.DEVOTIONAL:
        return (
          <div 
            style={{ 
              width: '100%',
              backgroundColor: settings.backgroundColor || (isDarkMode ? '#111827' : '#f8fafc'),
              padding: '80px 0', // Increased padding even more
              margin: '48px 0', // Increased margin for better separation
              position: 'static',
              display: 'block',
              flexShrink: 0,
              clear: 'both',
              overflow: 'hidden', // Changed to hidden to prevent overflow
              isolation: 'isolate',
              zIndex: 'auto',
              transition: 'background-color 0.3s',
              minHeight: '400px' // Increased minimum height
            }}
          >
            <div style={getContentWrapper('1200px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Devocional do Dia'}
              </h2>
              <div style={{
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #374151 0%, #4b5563 100%)'
                  : 'linear-gradient(135deg, #dbeafe 0%, #e0e7ff 100%)',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: isDarkMode 
                  ? '0 12px 28px rgba(0, 0, 0, 0.4)' 
                  : '0 12px 28px rgba(0, 0, 0, 0.1)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
                transition: 'all 0.3s'
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '32px', flexWrap: 'wrap' }}>
                  <div style={{ 
                    fontSize: '5rem',
                    padding: '20px',
                    backgroundColor: isDarkMode ? '#1f2937' : 'white',
                    borderRadius: '16px',
                    boxShadow: isDarkMode 
                      ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
                      : '0 4px 12px rgba(0, 0, 0, 0.1)',
                    minWidth: 'fit-content'
                  }}>📖</div>
                  <div style={{ flex: 1, minWidth: '300px' }}>
                    <h3 style={{
                      fontSize: '2rem',
                      fontWeight: 'bold',
                      marginBottom: '20px',
                      color: isDarkMode ? '#f9fafb' : '#1f2937',
                      transition: 'color 0.3s'
                    }}>{settings.devotionalTitle || 'Reflexão Diária'}</h3>
                    <blockquote style={{
                      fontSize: '1.25rem',
                      color: isDarkMode ? '#e5e7eb' : '#374151',
                      marginBottom: '24px',
                      lineHeight: '1.75',
                      fontStyle: 'italic',
                      padding: '20px',
                      backgroundColor: isDarkMode ? '#1f2937' : 'white',
                      borderRadius: '12px',
                      borderLeft: `4px solid ${isDarkMode ? '#60a5fa' : '#3b82f6'}`,
                      transition: 'all 0.3s'
                    }}>
                      {settings.verseText || '"Porque eu bem sei os pensamentos que tenho a vosso respeito, diz o Senhor; pensamentos de paz e não de mal, para vos dar o fim que esperais."'}
                    </blockquote>
                    <p style={{
                      fontSize: '0.875rem',
                      color: isDarkMode ? '#60a5fa' : '#2563eb',
                      fontWeight: '600',
                      marginBottom: '20px',
                      transition: 'color 0.3s'
                    }}>📖 {settings.verseReference || 'Jeremias 29:11'}</p>
                    <p style={{
                      color: isDarkMode ? '#d1d5db' : '#4b5563',
                      lineHeight: '1.6',
                      fontSize: '1rem',
                      transition: 'color 0.3s'
                    }}>
                      {settings.devotionalReflection || 'Deus tem planos maravilhosos para nossas vidas. Mesmo nos momentos difíceis, podemos confiar que Ele está trabalhando para o nosso bem e nos conduzindo ao propósito que Ele preparou para nós.'}
                    </p>
                  </div>
                </div>
                
                {/* Botão para mais devocionais */}
                {settings.showButton !== false && (
                <div style={{ textAlign: 'center', marginTop: '32px' }}>
                  <a
                    href={isEditMode ? '#' : (settings.buttonLink || '/devotionals')}
                    onClick={isEditMode ? (e) => e.preventDefault() : undefined}
                    style={{
                      backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
                      color: 'white',
                      padding: '12px 32px',
                      borderRadius: '8px',
                      border: 'none',
                      fontSize: '1rem',
                      fontWeight: '600',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)',
                      textDecoration: 'none',
                      display: 'inline-block'
                    }}
                  >
                    📚 Ver Mais Devocionais
                  </a>
                </div>
                )}
              </div>
            </div>
          </div>
        );

      case ComponentType.PRAYER_REQUEST:
        return <PrayerRequestForm settings={settings} isEditMode={isEditMode} />;

      case ComponentType.DONATION:
        return (
          <div 
            style={{ 
              width: '100%',
              backgroundColor: settings.backgroundColor || (isDarkMode ? '#1f2937' : '#f0fdf4'),
              padding: '100px 0',
              margin: '64px 0',
              position: 'static',
              display: 'block',
              flexShrink: 0,
              clear: 'both',
              overflow: 'hidden',
              isolation: 'isolate',
              zIndex: 'auto',
              transition: 'background-color 0.3s',
              minHeight: '400px'
            }}
          >
            <div style={getContentWrapper('1200px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Contribuições'}
              </h2>
              <div style={{
                background: isDarkMode 
                  ? 'linear-gradient(135deg, #374151 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #dcfce7 0%, #dbeafe 100%)',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: isDarkMode 
                  ? '0 12px 28px rgba(0, 0, 0, 0.4)' 
                  : '0 12px 28px rgba(0, 0, 0, 0.1)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e2e8f0',
                transition: 'all 0.3s'
              }}>
                <div style={{ textAlign: 'center', marginBottom: '40px' }}>
                  <div style={{ 
                    fontSize: '5rem', 
                    marginBottom: '20px',
                    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))'
                  }}>💝</div>
                  <h3 style={{
                    fontSize: '2rem',
                    fontWeight: 'bold',
                    marginBottom: '16px',
                    color: isDarkMode ? '#f9fafb' : '#1f2937',
                    transition: 'color 0.3s'
                  }}>Apoie Nosso Ministério</h3>
                  <p style={{
                    color: isDarkMode ? '#e5e7eb' : '#374151',
                    fontSize: '1.125rem',
                    lineHeight: '1.6',
                    maxWidth: '600px',
                    margin: '0 auto',
                    transition: 'color 0.3s'
                  }}>
                    Sua contribuição ajuda a expandir o Reino de Deus, transformar vidas e apoiar os projetos sociais da nossa comunidade.
                  </p>
                </div>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                  gap: '24px',
                  marginBottom: '40px'
                }}>
                  {[
                    { icon: '🏦', title: 'PIX', desc: 'Transferência instantânea e segura', key: 'chave@igreja.com' },
                    { icon: '💳', title: 'Cartão', desc: 'Débito, crédito ou recorrente', details: 'Parcelamento disponível' },
                    { icon: '🏛️', title: 'Depósito', desc: 'Transferência bancária tradicional', details: 'Banco: 001 | Agência: 1234' }
                  ].map((method, i) => (
                    <div key={i} style={{
                      backgroundColor: isDarkMode ? '#1f2937' : 'white',
                      borderRadius: '12px',
                      padding: '28px',
                      textAlign: 'center',
                      boxShadow: isDarkMode 
                        ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                        : '0 8px 20px rgba(0, 0, 0, 0.1)',
                      border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                      transition: 'all 0.3s'
                    }}>
                      <div style={{ fontSize: '3rem', marginBottom: '16px' }}>{method.icon}</div>
                      <h4 style={{
                        fontWeight: 'bold',
                        fontSize: '1.25rem',
                        marginBottom: '8px',
                        color: isDarkMode ? '#f9fafb' : '#1f2937',
                        transition: 'color 0.3s'
                      }}>{method.title}</h4>
                      <p style={{
                        color: isDarkMode ? '#d1d5db' : '#6b7280',
                        marginBottom: method.key || method.details ? '12px' : '0',
                        transition: 'color 0.3s'
                      }}>{method.desc}</p>
                      {(method.key || method.details) && (
                        <p style={{
                          fontSize: '0.875rem',
                          color: isDarkMode ? '#60a5fa' : '#2563eb',
                          fontWeight: '500',
                          transition: 'color 0.3s'
                        }}>
                          {method.key || method.details}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
                
                <div style={{ textAlign: 'center' }}>
                  <button style={{
                    backgroundColor: '#059669',
                    color: 'white',
                    padding: '16px 40px',
                    borderRadius: '12px',
                    border: 'none',
                    fontSize: '1.125rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 6px 16px rgba(5, 150, 105, 0.3)'
                  }}>
                    💖 Contribuir Agora
                  </button>
                  <p style={{
                    fontSize: '0.875rem',
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    marginTop: '16px',
                    transition: 'color 0.3s'
                  }}>
                    🔒 Transação segura e protegida
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case ComponentType.SOCIAL_MEDIA:
        return (
          <div style={getComponentContainer('colored', isDarkMode, settings.backgroundColor)}
          >
            <div style={getContentWrapper('1200px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Siga-nos nas Redes Sociais'}
              </h2>
              
              <div style={{
                backgroundColor: isDarkMode ? '#374151' : 'white',
                borderRadius: '16px',
                padding: '40px',
                boxShadow: isDarkMode 
                  ? '0 12px 28px rgba(0, 0, 0, 0.4)' 
                  : '0 12px 28px rgba(0, 0, 0, 0.1)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                transition: 'all 0.3s',
                textAlign: 'center'
              }}>
                <p style={{
                  fontSize: '1.125rem',
                  color: isDarkMode ? '#d1d5db' : '#6b7280',
                  marginBottom: '40px',
                  transition: 'color 0.3s'
                }}>
                  {getSocialIcon('default', 20)} Conecte-se conosco e acompanhe todas as novidades, eventos e mensagens inspiradoras
                </p>
                
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '32px',
                  marginBottom: '32px'
                }}>
                  {[
                    { name: 'Facebook', bgColor: '#1877f2', followers: '2.5k' },
                    { name: 'Instagram', bgColor: '#e4405f', followers: '1.8k' },
                    { name: 'YouTube', bgColor: '#ff0000', followers: '950' },
                    { name: 'WhatsApp', bgColor: '#25d366', followers: 'Grupo' }
                  ].map(social => (
                    <div key={social.name} style={{ textAlign: 'center' }}>
                      <div style={{
                        backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
                        borderRadius: '12px',
                        padding: '24px',
                        marginBottom: '16px',
                        border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                        transition: 'all 0.3s'
                      }}>
                        <a
                          href={isEditMode ? '#' : '#'}
                          style={{
                            backgroundColor: social.bgColor,
                            width: '64px',
                            height: '64px',
                            borderRadius: '50%',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'white',
                            fontSize: '1.75rem',
                            marginBottom: '16px',
                            textDecoration: 'none',
                            transition: 'all 0.3s',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                          }}
                          onClick={isEditMode ? (e) => e.preventDefault() : undefined}
                        >
                          {getSocialIcon(social.name, 24)}
                        </a>
                        <h3 style={{
                          fontSize: '1.125rem',
                          fontWeight: '600',
                          color: isDarkMode ? '#f9fafb' : '#1f2937',
                          marginBottom: '8px',
                          transition: 'color 0.3s'
                        }}>{social.name}</h3>
                        <p style={{
                          fontSize: '0.875rem',
                          color: isDarkMode ? '#9ca3af' : '#6b7280',
                          transition: 'color 0.3s'
                        }}>
                          {social.followers === 'Grupo' ? 'Grupo da Igreja' : `${social.followers} seguidores`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div style={{
                  backgroundColor: isDarkMode ? '#1f2937' : '#f0f9ff',
                  borderRadius: '12px',
                  padding: '20px',
                  border: isDarkMode ? '1px solid #374151' : '1px solid #bfdbfe'
                }}>
                  <p style={{
                    fontSize: '0.875rem',
                    color: isDarkMode ? '#60a5fa' : '#1d4ed8',
                    fontWeight: '500',
                    margin: '0',
                    transition: 'color 0.3s'
                  }}>
                    🔔 Ative as notificações para não perder nenhuma novidade!
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case ComponentType.STATISTICS:
        return (
          <div style={getComponentContainer('light', isDarkMode, settings.backgroundColor)}>
            <div style={getContentWrapper('1400px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Nossa Comunidade'}
              </h2>
              
              <div style={{
                backgroundColor: isDarkMode ? '#374151' : 'white',
                borderRadius: '16px',
                padding: '40px 20px',
                boxShadow: isDarkMode 
                  ? '0 12px 28px rgba(0, 0, 0, 0.4)' 
                  : '0 12px 28px rgba(0, 0, 0, 0.1)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                transition: 'all 0.3s'
              }}>
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '32px'
                }}>
                  {[
                    { number: '500+', label: 'Membros Ativos', icon: '👥', color: '#3b82f6' },
                    { number: '15', label: 'Anos de Ministério', icon: '🎂', color: '#10b981' },
                    { number: '50+', label: 'Projetos Sociais', icon: '🤝', color: '#f59e0b' },
                    { number: '1000+', label: 'Vidas Transformadas', icon: '💝', color: '#ef4444' }
                  ].map((stat, i) => (
                    <div key={i} style={{
                      textAlign: 'center',
                      padding: '24px',
                      backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
                      borderRadius: '12px',
                      border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                      transition: 'all 0.3s'
                    }}>
                      <div style={{
                        fontSize: '3.5rem',
                        marginBottom: '16px',
                        background: `linear-gradient(135deg, ${stat.color}, ${stat.color}80)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                      }}>{stat.icon}</div>
                      <div style={{
                        fontSize: '2.5rem',
                        fontWeight: 'bold',
                        color: stat.color,
                        marginBottom: '8px',
                        transition: 'color 0.3s'
                      }}>{stat.number}</div>
                      <div style={{
                        color: isDarkMode ? '#d1d5db' : '#4b5563',
                        fontWeight: '500',
                        fontSize: '1rem',
                        transition: 'color 0.3s'
                      }}>{stat.label}</div>
                    </div>
                  ))}
                </div>
                
                {/* Mensagem inspiradora */}
                <div style={{
                  textAlign: 'center',
                  marginTop: '40px',
                  padding: '24px',
                  backgroundColor: isDarkMode ? '#1f2937' : '#f0f9ff',
                  borderRadius: '12px',
                  border: isDarkMode ? '1px solid #374151' : '1px solid #bfdbfe'
                }}>
                  <p style={{
                    fontSize: '1.125rem',
                    color: isDarkMode ? '#60a5fa' : '#1d4ed8',
                    fontWeight: '500',
                    fontStyle: 'italic',
                    margin: '0',
                    transition: 'color 0.3s'
                  }}>
                    ✨ "Cada número representa uma vida tocada pelo amor de Cristo"
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      case ComponentType.TEAM:
        return (
          <div 
            style={{ 
              width: '100%',
              backgroundColor: isDarkMode ? '#111827' : '#f8fafc',
              padding: '100px 0',
              margin: '0',
              position: 'relative',
              display: 'block',
              flexShrink: 0,
              clear: 'both',
              overflow: 'visible',
              isolation: 'isolate',
              transition: 'background-color 0.3s'
            }}
          >
            <div style={getContentWrapper('1400px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Nossa Equipe'}
              </h2>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: `repeat(auto-fit, minmax(300px, 1fr))`,
                gap: '32px'
              }}>
                {[
                  { 
                    name: 'Pastor João Silva', 
                    role: 'Pastor Principal', 
                    bio: 'Líder espiritual da comunidade há mais de 20 anos, dedicado ao crescimento espiritual dos membros.',
                    icon: '👨‍💼',
                    specialty: 'Liderança e Ensino'
                  },
                  { 
                    name: 'Pastora Maria Santos', 
                    role: 'Pastora Auxiliar', 
                    bio: 'Responsável pelo ministério de mulheres e famílias, com foco no acolhimento e cuidado pastoral.',
                    icon: '👩‍💼',
                    specialty: 'Ministério Feminino'
                  },
                  { 
                    name: 'Pastor Pedro Costa', 
                    role: 'Pastor de Jovens', 
                    bio: 'Lidera o ministério jovem e adolescente, promovendo atividades e discipulado para a nova geração.',
                    icon: '👨‍🏫',
                    specialty: 'Juventude e Discipulado'
                  },
                  { 
                    name: 'Diaconisa Ana Lima', 
                    role: 'Coordenadora Social', 
                    bio: 'Dirige os projetos sociais da igreja, cuidando das necessidades da comunidade local.',
                    icon: '👩‍❤️‍👨',
                    specialty: 'Ação Social'
                  }
                ].slice(0, settings.itemsToShow || 4).map((member, i) => (
                  <div key={i} style={{
                    backgroundColor: isDarkMode ? '#374151' : 'white',
                    borderRadius: '16px',
                    padding: '32px',
                    textAlign: 'center',
                    boxShadow: isDarkMode 
                      ? '0 12px 28px rgba(0, 0, 0, 0.4)' 
                      : '0 12px 28px rgba(0, 0, 0, 0.1)',
                    border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                    transition: 'all 0.3s'
                  }}>
                    <div style={{
                      width: '96px',
                      height: '96px',
                      backgroundColor: isDarkMode ? '#1f2937' : '#f3f4f6',
                      borderRadius: '50%',
                      margin: '0 auto 20px auto',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '2.5rem',
                      border: `3px solid ${[
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444'
                      ][i % 4]}`,
                      transition: 'all 0.3s'
                    }}>
                      {member.icon}
                    </div>
                    <h3 style={{
                      fontSize: '1.25rem',
                      fontWeight: 'bold',
                      marginBottom: '8px',
                      color: isDarkMode ? '#f9fafb' : '#1f2937',
                      transition: 'color 0.3s'
                    }}>{member.name}</h3>
                    <div style={{
                      backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444'
                      ][i % 4],
                      color: 'white',
                      padding: '4px 16px',
                      borderRadius: '20px',
                      fontSize: '0.875rem',
                      fontWeight: '600',
                      marginBottom: '16px',
                      display: 'inline-block'
                    }}>{member.role}</div>
                    <p style={{
                      color: isDarkMode ? '#d1d5db' : '#4b5563',
                      lineHeight: '1.6',
                      marginBottom: '16px',
                      fontSize: '0.875rem',
                      transition: 'color 0.3s'
                    }}>{member.bio}</p>
                    <div style={{
                      backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb'
                    }}>
                      <span style={{
                        fontSize: '0.75rem',
                        color: isDarkMode ? '#60a5fa' : '#2563eb',
                        fontWeight: '600',
                        transition: 'color 0.3s'
                      }}>
                        🎯 {member.specialty}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Chamada para ação */}
              <div style={{
                textAlign: 'center',
                marginTop: '48px',
                backgroundColor: isDarkMode ? '#374151' : 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: isDarkMode 
                  ? '0 8px 20px rgba(0, 0, 0, 0.3)' 
                  : '0 8px 20px rgba(0, 0, 0, 0.1)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb'
              }}>
                <h3 style={{
                  fontSize: '1.5rem',
                  fontWeight: 'bold',
                  marginBottom: '16px',
                  color: isDarkMode ? '#f9fafb' : '#1f2937',
                  transition: 'color 0.3s'
                }}>Quer Conhecer Nossa Liderança?</h3>
                <p style={{
                  color: isDarkMode ? '#d1d5db' : '#6b7280',
                  marginBottom: '24px',
                  transition: 'color 0.3s'
                }}>Agende uma conversa com nossos pastores e conheça melhor nossa visão e ministérios.</p>
                <button style={{
                  backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
                  color: 'white',
                  padding: '12px 32px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s',
                  boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                }}>
                  🙏 Agendar Conversa
                </button>
              </div>
            </div>
          </div>
        );

      case ComponentType.FAQ:
        return (
          <div 
            style={{ 
              width: '100%',
              backgroundColor: isDarkMode ? '#1f2937' : '#f8fafc',
              padding: '100px 0',
              margin: '0',
              position: 'relative',
              display: 'block',
              flexShrink: 0,
              clear: 'both',
              overflow: 'visible',
              isolation: 'isolate',
              transition: 'background-color 0.3s'
            }}
          >
            <div style={getContentWrapper('1200px')}>
              <h2 style={getComponentTitle(isDarkMode)}>
                {settings.title || 'Perguntas Frequentes'}
              </h2>
              
              <div style={{
                backgroundColor: isDarkMode ? '#374151' : 'white',
                borderRadius: '16px',
                padding: '32px',
                boxShadow: isDarkMode 
                  ? '0 12px 28px rgba(0, 0, 0, 0.4)' 
                  : '0 12px 28px rgba(0, 0, 0, 0.1)',
                border: isDarkMode ? '1px solid #4b5563' : '1px solid #e5e7eb',
                transition: 'all 0.3s'
              }}>
                <div style={{ 
                  textAlign: 'center', 
                  marginBottom: '32px',
                  paddingBottom: '24px',
                  borderBottom: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`
                }}>
                  <div style={{ fontSize: '3rem', marginBottom: '16px' }}>❓</div>
                  <p style={{
                    color: isDarkMode ? '#d1d5db' : '#6b7280',
                    fontSize: '1.125rem',
                    transition: 'color 0.3s'
                  }}>
                    Encontre respostas para as dúvidas mais comuns sobre nossa igreja
                  </p>
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  {[
                    {
                      question: 'Quais são os horários dos cultos?',
                      answer: 'Temos cultos aos domingos às 9h (matutino) e 19h (noturno), quartas-feiras às 19h30 (oração) e sextas-feiras às 19h30 (jovens). Todos são bem-vindos!',
                      icon: '🕰️'
                    },
                    {
                      question: 'Como posso me tornar membro da igreja?',
                      answer: 'Participe do nosso curso de novos membros que acontece no primeiro sábado de cada mês. O curso aborda nossa história, doutrinas e como participar ativamente da comunidade.',
                      icon: '👤'
                    },
                    {
                      question: 'A igreja tem ministério infantil?',
                      answer: 'Sim! Temos programação especial para crianças de 0 a 12 anos durante todos os cultos, com atividades educativas, brincadeiras e ensino bíblico adequado para cada faixa etária.',
                      icon: '👶'
                    },
                    {
                      question: 'Como posso contribuir financeiramente?',
                      answer: 'Oferecemos várias opções: dízimos e ofertas presenciais, PIX, transferência bancária e contribuições online pelo site. Todas as contribuições são voluntárias.',
                      icon: '💖'
                    },
                    {
                      question: 'A igreja oferece atividades durante a semana?',
                      answer: 'Sim! Temos grupos de estudo bíblico, ministério de mulheres, grupo de jovens, coral, banda de louvor e projetos sociais. Consulte nossa programação completa.',
                      icon: '🎵'
                    },
                    {
                      question: 'Posso visitar a igreja sem compromisso?',
                      answer: 'Claro! Todos são muito bem-vindos para conhecer nossa comunidade. Não há nenhum compromisso. Venha como está e sinta-se em casa conosco.',
                      icon: '🙏'
                    }
                  ].map((faq, i) => (
                    <div key={i} style={{
                      backgroundColor: isDarkMode ? '#1f2937' : '#f9fafb',
                      borderRadius: '12px',
                      overflow: 'hidden',
                      border: isDarkMode ? '1px solid #374151' : '1px solid #e5e7eb',
                      transition: 'all 0.3s'
                    }}>
                      <div style={{
                        padding: '20px',
                        borderBottom: `1px solid ${isDarkMode ? '#374151' : '#e5e7eb'}`,
                        backgroundColor: isDarkMode ? '#374151' : 'white'
                      }}>
                        <h3 style={{
                          fontWeight: '600',
                          fontSize: '1.125rem',
                          display: 'flex',
                          alignItems: 'center',
                          margin: '0',
                          color: isDarkMode ? '#f9fafb' : '#1f2937',
                          transition: 'color 0.3s'
                        }}>
                          <span style={{ 
                            marginRight: '12px', 
                            fontSize: '1.25rem',
                            backgroundColor: isDarkMode ? '#1f2937' : '#f0f9ff',
                            padding: '8px',
                            borderRadius: '8px'
                          }}>{faq.icon}</span>
                          {faq.question}
                        </h3>
                      </div>
                      <div style={{ padding: '20px' }}>
                        <p style={{ 
                          color: isDarkMode ? '#d1d5db' : '#4b5563', 
                          margin: '0', 
                          fontSize: '0.95rem',
                          lineHeight: '1.6',
                          transition: 'color 0.3s'
                        }}>{faq.answer}</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Botão para mais informações */}
                <div style={{
                  textAlign: 'center',
                  marginTop: '32px',
                  paddingTop: '24px',
                  borderTop: `1px solid ${isDarkMode ? '#4b5563' : '#e5e7eb'}`
                }}>
                  <p style={{
                    color: isDarkMode ? '#9ca3af' : '#6b7280',
                    marginBottom: '16px',
                    transition: 'color 0.3s'
                  }}>Não encontrou sua dúvida?</p>
                  <button style={{
                    backgroundColor: isDarkMode ? '#3b82f6' : '#2563eb',
                    color: 'white',
                    padding: '12px 32px',
                    borderRadius: '8px',
                    border: 'none',
                    fontSize: '1rem',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 12px rgba(37, 99, 235, 0.3)'
                  }}>
                    📞 Entre em Contato
                  </button>
                </div>
              </div>
            </div>
          </div>
        );

      case ComponentType.NEWSLETTER:
        return (
          <div style={getCustomComponentContainer(settings.backgroundColor, settings.textColor)}
          >
            <div style={getContentWrapper()}>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: '1.875rem', fontWeight: 'bold', marginBottom: '16px', color: 'inherit' }}>
                  {settings.title || 'Receba Nossas Novidades'}
                </h2>
                <p style={{ fontSize: '1.25rem', marginBottom: '32px', opacity: '0.9', color: 'inherit' }}>
                  {settings.description || 'Cadastre-se e receba estudos bíblicos, eventos e inspirações diretamente no seu e-mail'}
                </p>
                <div style={{ maxWidth: '448px', margin: '0 auto' }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'stretch' }}>
                    <input
                      type="email"
                      placeholder="Seu melhor e-mail"
                      style={{
                        flex: '1',
                        padding: '12px 16px',
                        borderRadius: '8px',
                        color: '#111827',
                        backgroundColor: '#ffffff',
                        border: 'none',
                        outline: 'none',
                        fontSize: '14px'
                      }}
                      disabled={isEditMode}
                    />
                    <button
                      style={{
                        backgroundColor: '#eab308',
                        color: '#713f12',
                        padding: '12px 24px',
                        borderRadius: '8px',
                        fontWeight: 'bold',
                        border: 'none',
                        cursor: isEditMode ? 'default' : 'pointer',
                        fontSize: '14px',
                        transition: 'background-color 0.2s'
                      }}
                      disabled={isEditMode}
                      onMouseOver={(e) => !isEditMode && (e.currentTarget.style.backgroundColor = '#ca8a04')}
                      onMouseOut={(e) => !isEditMode && (e.currentTarget.style.backgroundColor = '#eab308')}
                    >
                      Cadastrar
                    </button>
                  </div>
                  <p style={{ fontSize: '14px', marginTop: '12px', opacity: '0.75', color: 'inherit' }}>
                    📧 Enviamos apenas conteúdo relevante. Sem spam.
                  </p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="py-16 bg-yellow-50 border border-yellow-200">
            <div className="max-w-4xl mx-auto px-4 text-center">
              <h3 className="text-xl font-semibold text-yellow-800 mb-2">
                Componente: {type}
              </h3>
              <p className="text-yellow-700">
                Este componente ainda não foi implementado.
              </p>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      <div className={containerClasses} style={getComponentStyle()}>
        {renderControls()}
        {renderComponent()}
      </div>
    </>
  );
};