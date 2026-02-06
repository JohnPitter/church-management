// Canva Design Home Layout - Vibrante e Colorido
// Complete ready-to-use layout with vibrant design

import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useSettings } from '../../contexts/SettingsContext';
import { HomeSectionVisibility } from '@modules/content-management/home-settings/domain/entities/HomeSettings';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BibleVerse } from '@/data/verses';

interface CanvaHomeLayoutProps {
  sections: HomeSectionVisibility;
  currentTime: Date;
  verseOfDay: BibleVerse;
}

export const CanvaHomeLayout: React.FC<CanvaHomeLayoutProps> = ({
  sections,
  currentTime,
  verseOfDay
}) => {
  const { currentUser } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#f7f7f7' }}>
      {/* Hero Section */}
      {sections.hero && (
        <div className="relative overflow-hidden bg-gradient-to-br from-red-400 via-pink-400 to-purple-400">
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-300 rounded-full -mr-32 -mt-32 opacity-50"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-cyan-300 rounded-full -ml-24 -mb-24 opacity-50"></div>

          <div className="relative container mx-auto px-4 py-16 text-center">
            {/* Time */}
            <p className="text-sm text-white/90 mb-2">
              {format(currentTime, "EEEE, d 'de' MMMM 'de' yyyy", { locale: ptBR })}
            </p>
            <p className="text-5xl font-light text-white mb-8">
              {format(currentTime, 'HH:mm:ss')}
            </p>

            {/* Title */}
            <h1 className="text-6xl md:text-7xl font-bold mb-6 text-white drop-shadow-lg">
              Seja bem-vindo! {settings?.churchName || 'Nossa Igreja'} ✨
            </h1>
            <p className="text-xl md:text-2xl text-white/95 max-w-3xl mx-auto leading-relaxed mb-8">
              Juntos construímos uma comunidade de amor, fé e transformação
            </p>

            {/* Login/Register Buttons - Only show when not authenticated */}
            {!currentUser && (
              <div className="flex justify-center gap-4 flex-wrap">
                <Link
                  to="/login"
                  className="bg-white text-purple-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-purple-50 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
                >
                  🔐 Entrar
                </Link>
                <Link
                  to="/register"
                  className="bg-purple-800 text-white px-8 py-3 rounded-full font-bold text-lg hover:bg-purple-900 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105 border-2 border-white/30"
                >
                  ✨ Criar Conta
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4">
        {/* Quick Actions */}
        {sections.quickActions && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto -mt-12 mb-16">
            <button
              onClick={() => navigate('/live')}
              className="bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 text-white relative overflow-hidden group"
            >
              <div className="absolute top-2 right-2 z-20">
                <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full animate-pulse">
                  AO VIVO
                </span>
              </div>
              <div className="relative z-10">
                <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">🎥</div>
                <h3 className="text-2xl font-bold mb-1">Ao Vivo Agora</h3>
                <p className="text-sm opacity-90">Assista nosso culto</p>
              </div>
            </button>

            <button
              onClick={() => navigate('/events')}
              className="bg-gradient-to-r from-purple-500 via-violet-500 to-indigo-500 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 text-white group"
            >
              <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">🎉</div>
              <h3 className="text-2xl font-bold mb-1">Próximos Eventos</h3>
              <p className="text-sm opacity-90">Não perca nada</p>
            </button>

            <button
              onClick={() => navigate('/blog')}
              className="bg-gradient-to-r from-cyan-500 via-teal-500 to-emerald-500 rounded-2xl p-6 shadow-2xl hover:shadow-3xl transform hover:scale-105 transition-all duration-300 text-white group"
            >
              <div className="text-5xl mb-3 transform group-hover:scale-110 transition-transform">✨</div>
              <h3 className="text-2xl font-bold mb-1">Blog & Reflexões</h3>
              <p className="text-sm opacity-90">Inspire-se</p>
            </button>
          </div>
        )}

        {/* Verse of Day */}
        {sections.verseOfDay && (
          <div className="max-w-4xl mx-auto mb-12">
            <div className="bg-gradient-to-r from-yellow-300 to-orange-300 rounded-2xl shadow-2xl p-8">
              <div className="flex items-start gap-4">
                <div className="text-5xl">📖</div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">Palavra do Dia</h3>
                  <p className="text-lg text-gray-800 italic mb-3">"{verseOfDay.text}"</p>
                  <p className="text-sm text-gray-700 font-semibold">{verseOfDay.reference}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Welcome Banner */}
        {sections.welcomeBanner && currentUser && (
          <div className="bg-gradient-to-r from-fuchsia-600 via-purple-600 to-indigo-600 rounded-2xl shadow-2xl p-8 mb-16 text-white relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-24 -mt-24"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16"></div>
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-3">Olá, {currentUser.displayName || currentUser.email}! 👋</h2>
              <p className="text-xl opacity-90">
                Que alegria ter você aqui! Explore tudo que preparamos especialmente para você hoje.
              </p>
            </div>
          </div>
        )}

        {/* Features Grid */}
        {sections.features && (
          <>
            <div className="text-center mb-12">
              <h2 className="text-5xl font-bold mb-4 bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 bg-clip-text text-transparent">
                Explore Nossa Comunidade 🚀
              </h2>
              <p className="text-xl text-gray-600">Descubra tudo que temos para você</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {[
                { title: 'Eventos', desc: 'Programe-se', icon: '📅', link: '/events', gradient: 'from-blue-400 to-cyan-400' },
                { title: 'Blog', desc: 'Mensagens inspiradoras', icon: '📖', link: '/blog', gradient: 'from-green-400 to-emerald-400' },
                { title: 'Projetos', desc: 'Faça a diferença', icon: '🤝', link: '/projects', gradient: 'from-purple-400 to-pink-400' },
                { title: 'Transmissões', desc: 'Cultos ao vivo', icon: '📺', link: '/live', gradient: 'from-red-400 to-orange-400' },
                { title: 'Aniversariantes', desc: 'Comemore conosco', icon: '🎂', link: '/birthdays', gradient: 'from-yellow-400 to-amber-400' },
                { title: 'Liderança', desc: 'Nossa equipe', icon: '👥', link: '/leadership', gradient: 'from-indigo-400 to-blue-400' },
                { title: 'Devocionais', desc: 'Alimento diário', icon: '🙏', link: '/devotionals', gradient: 'from-pink-400 to-rose-400' },
                { title: 'Fórum', desc: 'Converse com todos', icon: '💬', link: '/forum', gradient: 'from-teal-400 to-cyan-400' },
                { title: 'Perfil', desc: 'Suas informações', icon: '👤', link: '/profile', gradient: 'from-gray-400 to-slate-400' }
              ].map((feature, idx) => (
                <button
                  key={idx}
                  onClick={() => navigate(feature.link)}
                  className={`group relative bg-gradient-to-br ${feature.gradient} rounded-2xl p-8 shadow-xl hover:shadow-2xl transform hover:-translate-y-2 hover:rotate-1 transition-all duration-400`}
                >
                  <div className="text-6xl mb-4 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 group-hover:scale-105 transition-transform">
                    {feature.title}
                  </h3>
                  <p className="text-white/90">{feature.desc}</p>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Social Media */}
        {sections.socialMedia && (
          <div className="text-center py-12 mb-8">
            <h3 className="text-3xl font-bold text-gray-900 mb-6">Siga-nos nas Redes Sociais 🌐</h3>
            <div className="flex justify-center gap-6">
              {[
                { icon: '📘', name: 'Facebook', color: 'from-blue-600 to-blue-700' },
                { icon: '📷', name: 'Instagram', color: 'from-pink-600 to-purple-600' },
                { icon: '▶️', name: 'YouTube', color: 'from-red-600 to-red-700' },
                { icon: '💬', name: 'WhatsApp', color: 'from-green-600 to-green-700' }
              ].map((social, idx) => (
                <button
                  key={idx}
                  className={`bg-gradient-to-br ${social.color} text-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transform hover:scale-110 transition-all`}
                >
                  <div className="text-4xl">{social.icon}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
