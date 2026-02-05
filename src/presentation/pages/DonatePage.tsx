// Presentation Page - Donate
// Public page for church donations with PIX and bank transfer info

import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useSettings } from '../contexts/SettingsContext';

export const DonatePage: React.FC = () => {
  const { settings } = useSettings();
  const churchName = settings?.churchName || 'Nossa Igreja';
  const [copiedPix, setCopiedPix] = useState(false);

  // Use configured PIX key or fallback to church email
  const pixKey = settings?.pixKey || settings?.churchEmail || 'contato@igreja.com.br';

  // Use configured bank account or defaults
  const bankInfo = {
    bank: settings?.bankAccount?.bankName || 'Banco do Brasil',
    agency: settings?.bankAccount?.agency || '0000-0',
    account: settings?.bankAccount?.accountNumber || '00000-0',
    accountType: settings?.bankAccount?.accountType || 'Corrente',
    holder: churchName,
    cnpj: '00.000.000/0001-00'
  };

  const handleCopyPix = () => {
    navigator.clipboard.writeText(pixKey);
    setCopiedPix(true);
    setTimeout(() => setCopiedPix(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-green-700 via-green-600 to-green-800 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
        </div>
        <div className="relative container mx-auto px-6 py-20 md:py-28">
          <div className="max-w-4xl mx-auto text-center">
            <div className="text-6xl mb-6">💝</div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 tracking-tight">
              Fazer Doação
            </h1>
            <p className="text-lg md:text-xl text-green-100 font-light leading-relaxed max-w-2xl mx-auto">
              Sua contribuição ajuda a manter nossos projetos e transformar vidas
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

      {/* Donation Methods */}
      <section className="py-16 md:py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-2 gap-8">
              {/* PIX */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-lg border border-green-100">
                <div className="text-4xl mb-4">📱</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">PIX</h2>
                <p className="text-gray-600 mb-6">
                  Faça sua doação de forma rápida e segura via PIX
                </p>
                <div className="bg-white rounded-xl p-4 mb-4">
                  <p className="text-sm text-gray-500 mb-2">Chave PIX (E-mail)</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-green-700 font-mono text-sm break-all">
                      {pixKey}
                    </code>
                    <button
                      onClick={handleCopyPix}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
                    >
                      {copiedPix ? 'Copiado!' : 'Copiar'}
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Abra o app do seu banco, selecione PIX e cole a chave acima
                </p>
              </div>

              {/* Bank Transfer */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-lg border border-blue-100">
                <div className="text-4xl mb-4">🏦</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Transferência Bancária</h2>
                <p className="text-gray-600 mb-6">
                  Doe via TED ou DOC para nossa conta
                </p>
                <div className="bg-white rounded-xl p-4 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Banco:</span>
                    <span className="font-medium text-gray-900">{bankInfo.bank}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Agência:</span>
                    <span className="font-medium text-gray-900">{bankInfo.agency}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Conta:</span>
                    <span className="font-medium text-gray-900">{bankInfo.account}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tipo:</span>
                    <span className="font-medium text-gray-900">{bankInfo.accountType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Titular:</span>
                    <span className="font-medium text-gray-900">{bankInfo.holder}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">CNPJ:</span>
                    <span className="font-medium text-gray-900">{bankInfo.cnpj}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Why Donate */}
      <section className="py-16 md:py-20 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Por que Contribuir?
            </h2>
            <div className="w-24 h-1 bg-green-600 mx-auto rounded-full mb-12"></div>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  icon: '⛪',
                  title: 'Manutenção',
                  description: 'Ajude a manter nossa estrutura e espaços de adoração'
                },
                {
                  icon: '🤝',
                  title: 'Projetos Sociais',
                  description: 'Apoie ações que transformam vidas na comunidade'
                },
                {
                  icon: '🌍',
                  title: 'Missões',
                  description: 'Leve esperança a lugares que precisam ouvir a mensagem'
                }
              ].map((item, index) => (
                <div key={index} className="bg-white rounded-xl p-6 shadow-md">
                  <div className="text-4xl mb-4">{item.icon}</div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">{item.title}</h3>
                  <p className="text-gray-600">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Bible Verse */}
      <section className="py-16 md:py-20 bg-gradient-to-br from-green-600 to-green-800 text-white">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <blockquote className="text-xl md:text-2xl font-light italic leading-relaxed mb-6">
              "Cada um dê conforme determinou em seu coração, não com pesar ou por obrigação,
              pois Deus ama quem dá com alegria."
            </blockquote>
            <p className="text-green-200 font-medium">2 Coríntios 9:7</p>
          </div>
        </div>
      </section>

      {/* Back Button */}
      <section className="py-12 bg-white">
        <div className="container mx-auto px-6 text-center">
          <Link
            to="/"
            className="inline-block bg-gray-100 text-gray-700 px-8 py-4 rounded-full font-semibold hover:bg-gray-200 transition-all"
          >
            Voltar ao Início
          </Link>
        </div>
      </section>
    </div>
  );
};

export default DonatePage;
