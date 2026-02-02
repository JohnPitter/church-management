// Apple Design Home Layout - Inspired by Apple's Minimalist Excellence
// Reference: apple.com/br/iphone-17
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { HomeSectionVisibility } from '@modules/content-management/home-settings/domain/entities/HomeSettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BibleVerse } from '@/data/verses';

interface AppleHomeLayoutProps {
  sections: HomeSectionVisibility;
  currentTime: Date;
  verseOfDay: BibleVerse;
}

export const AppleHomeLayout: React.FC<AppleHomeLayoutProps> = ({ sections, currentTime, verseOfDay }) => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section - Apple Style: Massive typography with breathing room */}
      {sections.hero && (
        <section className="relative overflow-hidden">
          <div className="container mx-auto px-6 py-32 md:py-40 lg:py-48">
            <div className="text-center max-w-5xl mx-auto">
              <p className="text-sm md:text-base text-gray-500 tracking-wide uppercase mb-8 font-medium">
                {format(currentTime, "EEEE, d 'de' MMMM", { locale: ptBR })}
              </p>
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-semibold text-black mb-8 tracking-tight leading-none">
                {settings?.churchName || 'Nossa Igreja'}
              </h1>
              <p className="text-xl md:text-3xl lg:text-4xl text-gray-600 font-light leading-snug mb-12">
                Onde a fé encontra comunidade.
              </p>

              {/* Login/Register Buttons - Only show when not authenticated */}
              {!currentUser && (
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link
                    to="/login"
                    className="bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-900 transition-colors shadow-lg"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/register"
                    className="bg-white text-black px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-100 transition-colors border border-gray-300 shadow-sm"
                  >
                    Criar Conta
                  </Link>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Verse of Day - Card-based with generous spacing */}
      {sections.verseOfDay && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-3xl p-10 md:p-16 shadow-sm">
              <div className="mb-4">
                <span className="inline-block px-3 py-1 bg-white rounded-full text-xs font-medium text-gray-700 shadow-sm">
                  Versículo do Dia
                </span>
              </div>
              <blockquote className="text-2xl md:text-3xl lg:text-4xl font-light text-gray-900 leading-relaxed mb-8 italic">
                "{verseOfDay.text}"
              </blockquote>
              <p className="text-base md:text-lg text-gray-600 font-medium">{verseOfDay.reference}</p>
            </div>
          </div>
        </section>
      )}

      {/* Welcome Banner - High contrast black section */}
      {sections.welcomeBanner && currentUser && (
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="bg-black text-white rounded-3xl p-10 md:p-14">
              <h2 className="text-3xl md:text-5xl font-semibold mb-4 tracking-tight">
                Bem-vindo de volta,<br/>{currentUser.displayName || 'visitante'}
              </h2>
              <p className="text-lg md:text-xl text-gray-300 font-light">
                Que bom ter você aqui hoje.
              </p>
            </div>
          </div>
        </section>
      )}

      {/* Quick Actions - Apple's card-based navigation */}
      {sections.quickActions && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-black mb-16 tracking-tight text-center">
              Explore
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { title: 'Eventos', desc: 'Confira nossa programação completa', link: '/events', icon: '📅' },
                { title: 'Mensagens', desc: 'Reflexões e ensinamentos', link: '/blog', icon: '✍️' },
                { title: 'Ao Vivo', desc: 'Assista nossas transmissões', link: '/live', icon: '📺' },
                { title: 'Projetos', desc: 'Faça parte da transformação', link: '/projects', icon: '🎯' },
                { title: 'Devocionais', desc: 'Conteúdo diário inspirador', link: '/devotionals', icon: '📖' },
                { title: 'Aniversários', desc: 'Celebre com a comunidade', link: '/birthdays', icon: '🎂' }
              ].map((action, i) => (
                <button
                  key={i}
                  onClick={() => navigate(action.link)}
                  className="group bg-gradient-to-br from-gray-50 to-gray-100 hover:from-gray-100 hover:to-gray-200 rounded-3xl p-8 transition-all duration-300 text-left shadow-sm hover:shadow-md"
                >
                  <div className="text-4xl mb-4">{action.icon}</div>
                  <h3 className="text-xl md:text-2xl font-semibold text-black mb-2 group-hover:text-blue-600 transition-colors">
                    {action.title}
                  </h3>
                  <p className="text-base text-gray-600 font-light leading-relaxed">
                    {action.desc}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Features Grid - Product showcase style */}
      {sections.features && (
        <section className="py-16 md:py-24 bg-gray-50">
          <div className="container mx-auto px-6 max-w-7xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-semibold text-black mb-6 tracking-tight">
                Tudo para sua jornada espiritual
              </h2>
              <p className="text-xl md:text-2xl text-gray-600 font-light max-w-3xl mx-auto">
                Recursos pensados para conectar você com Deus e com a comunidade
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {/* Large feature cards */}
              <div className="bg-white rounded-3xl p-10 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-5xl mb-6">📱</div>
                <h3 className="text-2xl md:text-3xl font-semibold text-black mb-4">
                  Conectado sempre
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed font-light mb-6">
                  Acesse transmissões ao vivo, mensagens e eventos onde você estiver.
                </p>
                <button
                  onClick={() => navigate('/live')}
                  className="text-blue-600 font-medium hover:underline text-lg"
                >
                  Saiba mais →
                </button>
              </div>

              <div className="bg-white rounded-3xl p-10 shadow-sm hover:shadow-md transition-shadow">
                <div className="text-5xl mb-6">🤝</div>
                <h3 className="text-2xl md:text-3xl font-semibold text-black mb-4">
                  Comunidade ativa
                </h3>
                <p className="text-lg text-gray-600 leading-relaxed font-light mb-6">
                  Participe de projetos sociais e faça a diferença na vida de muitos.
                </p>
                <button
                  onClick={() => navigate('/projects')}
                  className="text-blue-600 font-medium hover:underline text-lg"
                >
                  Participar →
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Events Section */}
      {sections.events && (
        <section className="py-16 md:py-24">
          <div className="container mx-auto px-6 max-w-6xl">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-semibold text-black mb-4 tracking-tight">
                Próximos eventos
              </h2>
              <p className="text-xl text-gray-600 font-light">
                Não perca os momentos especiais da nossa comunidade
              </p>
            </div>
            <div className="text-center">
              <button
                onClick={() => navigate('/events')}
                className="inline-block bg-black text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-gray-900 transition-colors shadow-lg"
              >
                Ver calendário completo
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Contact/Social - Minimal footer style */}
      {sections.contact && (
        <section className="py-20 md:py-32 bg-gray-50">
          <div className="container mx-auto px-6 max-w-4xl text-center">
            <h2 className="text-3xl md:text-4xl font-semibold text-black mb-6">
              Vamos conversar
            </h2>
            <p className="text-lg md:text-xl text-gray-600 font-light mb-10">
              Estamos aqui para você. Entre em contato e faça parte da nossa família.
            </p>
            <div className="flex justify-center gap-4 flex-wrap">
              <button className="bg-white px-8 py-4 rounded-full text-base font-medium text-black hover:bg-gray-100 transition-colors shadow-sm">
                Fale conosco
              </button>
              <button className="bg-blue-600 px-8 py-4 rounded-full text-base font-medium text-white hover:bg-blue-700 transition-colors shadow-sm">
                Visite-nos
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Social Media Links */}
      {sections.socialMedia && (
        <section className="py-12 border-t border-gray-200">
          <div className="container mx-auto px-6 max-w-4xl">
            <div className="flex justify-center gap-8 flex-wrap">
              {['Instagram', 'Facebook', 'YouTube', 'Twitter'].map((social) => (
                <button
                  key={social}
                  className="text-gray-600 hover:text-black font-medium transition-colors text-base"
                >
                  {social}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
