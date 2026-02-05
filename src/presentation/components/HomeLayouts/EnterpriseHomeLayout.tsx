// Enterprise Design Home Layout - Inspired by Lagoinha Global
// Reference: l2.lagoinha.com
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { HomeSectionVisibility } from '@modules/content-management/home-settings/domain/entities/HomeSettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BibleVerse } from '@/data/verses';

interface EnterpriseHomeLayoutProps {
  sections: HomeSectionVisibility;
  currentTime: Date;
  verseOfDay: BibleVerse;
}

export const EnterpriseHomeLayout: React.FC<EnterpriseHomeLayoutProps> = ({ sections, currentTime, verseOfDay }) => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Professional gradient header with institutional messaging */}
      {sections.hero && (
        <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          </div>
          <div className="relative container mx-auto px-6 py-20 md:py-28 lg:py-32">
            <div className="max-w-5xl mx-auto text-center">
              <p className="text-sm md:text-base text-blue-200 mb-6 font-medium tracking-wide uppercase">
                {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 tracking-tight leading-tight">
                BEM-VINDO AO<br/>
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-200 to-white">
                  {settings?.churchName || 'NOSSA IGREJA'}
                </span>
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl text-blue-100 font-light leading-relaxed max-w-3xl mx-auto mb-10">
                Uma comunidade global comprometida em transformar vidas através da fé, esperança e amor
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={() => navigate('/events')}
                  className="bg-white text-blue-900 px-8 py-4 rounded-full font-semibold hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl"
                >
                  Conheça nossos eventos
                </button>
                <button
                  onClick={() => navigate('/about')}
                  className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-blue-900 transition-all"
                >
                  Sobre nós
                </button>
              </div>

              {/* Login/Register Buttons - Only show when not authenticated */}
              {!currentUser && (
                <div className="flex justify-center gap-4 flex-wrap mt-8 pt-8 border-t border-blue-700/50">
                  <Link
                    to="/login"
                    className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-lg hover:shadow-xl"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-full font-semibold hover:bg-white hover:text-blue-900 transition-all"
                  >
                    Criar Conta
                  </Link>
                </div>
              )}
            </div>
          </div>
          {/* Decorative bottom wave */}
          <div className="absolute bottom-0 left-0 right-0">
            <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className="w-full h-16 md:h-20">
              <path d="M0,0V46.29c47.79,22.2,103.59,32.17,158,28,70.36-5.37,136.33-33.31,206.8-37.5C438.64,32.43,512.34,53.67,583,72.05c69.27,18,138.3,24.88,209.4,13.08,36.15-6,69.85-17.84,104.45-29.34C989.49,25,1113-14.29,1200,52.47V0Z" opacity=".25" fill="white"></path>
              <path d="M0,0V15.81C13,36.92,27.64,56.86,47.69,72.05,99.41,111.27,165,111,224.58,91.58c31.15-10.15,60.09-26.07,89.67-39.8,40.92-19,84.73-46,130.83-49.67,36.26-2.85,70.9,9.42,98.6,31.56,31.77,25.39,62.32,62,103.63,73,40.44,10.79,81.35-6.69,119.13-24.28s75.16-39,116.92-43.05c59.73-5.85,113.28,22.88,168.9,38.84,30.2,8.66,59,6.17,87.09-7.5,22.43-10.89,48-26.93,60.65-49.24V0Z" opacity=".5" fill="white"></path>
              <path d="M0,0V5.63C149.93,59,314.09,71.32,475.83,42.57c43-7.64,84.23-20.12,127.61-26.46,59-8.63,112.48,12.24,165.56,35.4C827.93,77.22,886,95.24,951.2,90c86.53-7,172.46-45.71,248.8-84.81V0Z" fill="white"></path>
            </svg>
          </div>
        </section>
      )}

      {/* Statistics Section - Institutional credibility */}
      {sections.statistics && (
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-4">
                Nossa Comunidade em Números
              </h2>
              <p className="text-center text-gray-600 mb-12 text-lg">
                Impacto real através da fé
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                {[
                  { value: '2.500+', label: 'Membros Ativos', icon: '👥', colorClass: 'text-blue-600' },
                  { value: '15', label: 'Projetos Sociais', icon: '🤝', colorClass: 'text-green-600' },
                  { value: '38+', label: 'Anos de História', icon: '📅', colorClass: 'text-purple-600' },
                  { value: '10k+', label: 'Vidas Transformadas', icon: '❤️', colorClass: 'text-red-600' }
                ].map((stat, i) => (
                  <div key={i} className="text-center group">
                    <div className="text-5xl md:text-6xl mb-4 transform group-hover:scale-110 transition-transform">
                      {stat.icon}
                    </div>
                    <div className={`text-4xl md:text-5xl font-bold mb-2 ${stat.colorClass}`}>
                      {stat.value}
                    </div>
                    <div className="text-sm md:text-base text-gray-600 font-medium">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Verse of the Day - Featured content card */}
      {sections.verseOfDay && (
        <section className="py-16 md:py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto">
              <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 border-l-4 border-blue-600">
                <div className="flex items-start gap-6">
                  <div className="flex-shrink-0 w-16 h-16 bg-blue-600 rounded-xl flex items-center justify-center text-3xl">
                    📖
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-blue-600 uppercase tracking-wide mb-3">
                      Palavra do Dia
                    </h3>
                    <blockquote className="text-xl md:text-2xl lg:text-3xl text-gray-900 font-light italic leading-relaxed mb-6">
                      "{verseOfDay.text}"
                    </blockquote>
                    <p className="text-base md:text-lg font-semibold text-gray-700">
                      {verseOfDay.reference}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Welcome Banner - Personalized greeting */}
      {sections.welcomeBanner && currentUser && (
        <section className="py-12 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto flex items-center justify-between flex-wrap gap-6">
              <div className="text-white">
                <h3 className="text-2xl md:text-3xl font-bold mb-2">
                  Olá, {currentUser.displayName || currentUser.email}!
                </h3>
                <p className="text-blue-100 text-lg">
                  É ótimo ter você de volta. Confira as novidades da comunidade.
                </p>
              </div>
              <button
                onClick={() => navigate('/painel')}
                className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition-colors shadow-lg"
              >
                Acessar Painel
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Services Grid - Organized resource navigation */}
      {sections.features && (
        <section className="py-16 md:py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-7xl mx-auto">
              <div className="text-center mb-12">
                <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-4">
                  Serviços e Recursos
                </h2>
                <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
                  Tudo o que você precisa para crescer espiritualmente e se conectar com a comunidade
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { title: 'Agenda de Eventos', desc: 'Participe dos nossos encontros', link: '/events', icon: '📅', gradient: 'from-blue-500 to-blue-600' },
                  { title: 'Mensagens e Blog', desc: 'Reflexões e ensinamentos', link: '/blog', icon: '✍️', gradient: 'from-purple-500 to-purple-600' },
                  { title: 'Transmissões Online', desc: 'Assista aos cultos ao vivo', link: '/live', icon: '📺', gradient: 'from-red-500 to-red-600' },
                  { title: 'Projetos Sociais', desc: 'Faça a diferença', link: '/projects', icon: '🤝', gradient: 'from-green-500 to-green-600' },
                  { title: 'Devocionais Diários', desc: 'Alimento espiritual', link: '/devotionals', icon: '📖', gradient: 'from-yellow-500 to-orange-500' },
                  { title: 'Aniversariantes', desc: 'Celebre conosco', link: '/birthdays', icon: '🎂', gradient: 'from-pink-500 to-rose-600' },
                  { title: 'Nossa Liderança', desc: 'Conheça a equipe', link: '/leadership', icon: '👔', gradient: 'from-indigo-500 to-indigo-600' },
                  { title: 'Membros', desc: 'Área exclusiva', link: '/profile', icon: '🔐', gradient: 'from-gray-600 to-gray-700' }
                ].map((service, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(service.link)}
                    className="group bg-white rounded-xl shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-100"
                  >
                    <div className={`bg-gradient-to-br ${service.gradient} p-6 text-white`}>
                      <div className="text-5xl mb-3">{service.icon}</div>
                      <h3 className="text-lg font-bold mb-1">{service.title}</h3>
                    </div>
                    <div className="p-5 bg-white">
                      <p className="text-sm text-gray-600">{service.desc}</p>
                      <div className="mt-3 text-blue-600 font-semibold text-sm group-hover:translate-x-2 transition-transform inline-block">
                        Acessar →
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions - High visibility CTAs */}
      {sections.quickActions && (
        <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
                Ações Rápidas
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  {
                    title: 'Fazer Doação',
                    desc: 'Contribua com nossos projetos',
                    link: '/donate',
                    icon: '💝',
                    hoverBg: 'hover:bg-green-50',
                    hoverBorder: 'hover:border-green-500'
                  },
                  {
                    title: 'Oração',
                    desc: 'Compartilhe seu pedido',
                    link: '/prayer',
                    icon: '🙏',
                    hoverBg: 'hover:bg-purple-50',
                    hoverBorder: 'hover:border-purple-500'
                  },
                  {
                    title: 'Fale Conosco',
                    desc: 'Estamos aqui para você',
                    link: '/contact',
                    icon: '💬',
                    hoverBg: 'hover:bg-blue-50',
                    hoverBorder: 'hover:border-blue-500'
                  }
                ].map((action, i) => (
                  <button
                    key={i}
                    onClick={() => navigate(action.link)}
                    className={`bg-white rounded-xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent text-left ${action.hoverBg} ${action.hoverBorder}`}
                  >
                    <div className="text-5xl mb-4">{action.icon}</div>
                    <h3 className="text-xl font-bold text-gray-900 mb-2">{action.title}</h3>
                    <p className="text-gray-600">{action.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Events Highlight */}
      {sections.events && (
        <section className="py-16 md:py-20 bg-white">
          <div className="container mx-auto px-6">
            <div className="max-w-5xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
                Próximos Eventos
              </h2>
              <p className="text-lg text-gray-600 mb-10">
                Não perca os momentos especiais da nossa comunidade
              </p>
              <button
                onClick={() => navigate('/events')}
                className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-10 py-4 rounded-full text-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg hover:shadow-xl"
              >
                Ver Calendário Completo
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Testimonials Section */}
      {sections.testimonials && (
        <section className="py-16 md:py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
                Histórias que Inspiram
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {[
                  { text: 'Esta comunidade transformou minha vida completamente. Encontrei não apenas fé, mas uma família.', author: 'Maria Silva' },
                  { text: 'Os projetos sociais me deram propósito e a oportunidade de fazer a diferença no mundo.', author: 'João Santos' }
                ].map((testimonial, i) => (
                  <div key={i} className="bg-white rounded-xl p-8 shadow-lg">
                    <div className="text-4xl text-blue-600 mb-4">"</div>
                    <p className="text-lg text-gray-700 italic mb-6">{testimonial.text}</p>
                    <p className="font-semibold text-gray-900">— {testimonial.author}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Contact Section */}
      {sections.contact && (
        <section className="py-16 md:py-20 bg-gray-900 text-white">
          <div className="container mx-auto px-6">
            <div className="max-w-4xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                Vamos Conversar
              </h2>
              <p className="text-lg text-gray-300 mb-10">
                Tire suas dúvidas, conheça mais sobre nós ou simplesmente diga olá
              </p>
              <div className="flex justify-center gap-4 flex-wrap">
                <button
                  onClick={() => navigate('/contact')}
                  className="flex items-center gap-3 bg-white text-gray-900 px-8 py-4 rounded-lg font-semibold hover:bg-gray-100 transition-colors"
                >
                  <span className="text-2xl">✉️</span>
                  Enviar Mensagem
                </button>
                <button
                  onClick={() => {
                    const address = settings?.churchAddress;
                    if (address) {
                      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank');
                    } else {
                      navigate('/contact');
                    }
                  }}
                  className="flex items-center gap-3 bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg font-semibold hover:bg-white hover:text-gray-900 transition-all"
                >
                  <span className="text-2xl">📍</span>
                  Nossa Localização
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Social Media Footer */}
      {sections.socialMedia && (
        <section className="py-16 bg-gradient-to-br from-gray-50 to-gray-100">
          <div className="container mx-auto px-6">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12">
                Siga-nos nas Redes Sociais
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  {
                    title: 'Instagram',
                    desc: 'Fotos e Stories',
                    icon: '📸',
                    hoverBg: 'hover:bg-pink-50',
                    hoverBorder: 'hover:border-pink-500'
                  },
                  {
                    title: 'Facebook',
                    desc: 'Nossa comunidade',
                    icon: '👥',
                    hoverBg: 'hover:bg-blue-50',
                    hoverBorder: 'hover:border-blue-500'
                  },
                  {
                    title: 'YouTube',
                    desc: 'Vídeos e Lives',
                    icon: '🎬',
                    hoverBg: 'hover:bg-red-50',
                    hoverBorder: 'hover:border-red-500'
                  },
                  {
                    title: 'X (Twitter)',
                    desc: 'Atualizações',
                    icon: '🐦',
                    hoverBg: 'hover:bg-gray-100',
                    hoverBorder: 'hover:border-gray-500'
                  }
                ].map((social, i) => (
                  <div
                    key={i}
                    className={`bg-white rounded-xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border-2 border-transparent text-center cursor-pointer ${social.hoverBg} ${social.hoverBorder}`}
                  >
                    <div className="text-5xl mb-4">{social.icon}</div>
                    <h3 className="text-lg font-bold text-gray-900 mb-1">{social.title}</h3>
                    <p className="text-gray-600 text-sm">{social.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
