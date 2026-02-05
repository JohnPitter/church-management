// Presentation Page - About Us
// Public institutional page with church/organization information
// Statistics and content are configurable via Admin Settings

import React from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

// Default values when settings are not configured
const defaultStatistics = [
  { value: '10+', label: 'Anos de História', icon: '📅' },
  { value: '100+', label: 'Membros Ativos', icon: '👥' },
  { value: '5+', label: 'Ministérios', icon: '⛪' },
  { value: '500+', label: 'Vidas Impactadas', icon: '❤️' }
];

const defaultMission = 'Nossa igreja tem como missão transformar vidas através do amor de Deus, promovendo comunhão, discipulado e serviço à comunidade. Acreditamos que cada pessoa é especial e tem um propósito único a ser descoberto e desenvolvido.';

const defaultVision = 'Ser uma igreja relevante, que impacta positivamente a sociedade através do evangelho de Jesus Cristo, formando discípulos que façam a diferença em suas famílias, trabalho e comunidade.';

export const AboutPage: React.FC = () => {
  const { settings, loading } = useSettings();
  const _churchName = settings?.churchName || 'Nossa Igreja';

  // Get configurable content from settings
  const mission = settings?.about?.mission || defaultMission;
  const vision = settings?.about?.vision || defaultVision;
  const statistics = settings?.about?.statistics || defaultStatistics;

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-blue-950 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        <div className="relative container mx-auto px-6 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Sobre Nós
            </h1>
            <p className="text-lg md:text-xl text-blue-100 font-light leading-relaxed max-w-2xl mx-auto">
              Conheça nossa história, missão e valores
            </p>
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

      {/* Mission Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nossa Missão
              </h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 shadow-lg">
              <p className="text-lg md:text-xl text-gray-700 leading-relaxed text-center">
                {mission}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nossos Valores
              </h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[
                {
                  icon: '❤️',
                  title: 'Amor',
                  description: 'O amor é a base de tudo o que fazemos. Amamos a Deus e ao próximo como a nós mesmos.'
                },
                {
                  icon: '🤝',
                  title: 'Comunhão',
                  description: 'Valorizamos o relacionamento entre irmãos, construindo uma família espiritual unida.'
                },
                {
                  icon: '📖',
                  title: 'Palavra',
                  description: 'A Bíblia é nossa única regra de fé e prática, guiando todas as nossas decisões.'
                },
                {
                  icon: '🙏',
                  title: 'Oração',
                  description: 'Cultivamos uma vida de intimidade com Deus através da oração constante.'
                },
                {
                  icon: '🌱',
                  title: 'Discipulado',
                  description: 'Investimos no crescimento espiritual de cada pessoa, formando novos líderes.'
                },
                {
                  icon: '🌍',
                  title: 'Missões',
                  description: 'Temos compromisso com a expansão do Reino de Deus em nossa cidade e no mundo.'
                }
              ].map((value, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
                >
                  <div className="text-4xl mb-4">{value.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Vision Section */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nossa Visão
              </h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </div>
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl p-8 md:p-12 shadow-xl text-white">
              <p className="text-lg md:text-xl leading-relaxed text-center">
                {vision}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-blue-50 to-indigo-50">
        <div className="container mx-auto px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Nossa História em Números
              </h2>
              <div className="w-24 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {statistics.map((stat, index) => (
                <div key={index} className="text-center group">
                  <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform">
                    {stat.icon}
                  </div>
                  <div className="text-3xl md:text-4xl font-bold text-blue-600 mb-2">
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

      {/* Call to Action */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Venha nos Conhecer!
            </h2>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              Você é bem-vindo(a) a participar de nossos cultos e atividades.
              Será uma alegria recebê-lo(a) em nossa comunidade!
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link
                to="/events"
                className="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition-all shadow-lg hover:shadow-xl inline-block"
              >
                Ver Próximos Eventos
              </Link>
              <Link
                to="/"
                className="bg-gray-100 text-gray-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all inline-block"
              >
                Voltar ao Início
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
