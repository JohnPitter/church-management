// Presentation Component - Devotional Detail Modal
// Modal for viewing devotional details

import React from 'react';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Devotional } from '../../modules/church-management/devotionals/domain/entities/Devotional';

interface DevotionalDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  devotional: Devotional;
}

export const DevotionalDetailModal: React.FC<DevotionalDetailModalProps> = ({
  isOpen,
  onClose,
  devotional
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
        <div className="mt-3">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div>
              <h3 className="text-2xl font-bold text-gray-900">
                {devotional.title}
              </h3>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <span>{devotional.category.icon}</span>
                  {devotional.category.name}
                </span>
                <span>Por {devotional.author}</span>
                <span>
                  {formatDate(devotional.publishDate, "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </span>
                <span className="flex items-center gap-1">
                  ⏱️ {devotional.readingTime} min
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-6">
            {/* Bible Verse */}
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
              <h4 className="font-semibold text-indigo-900 mb-2">
                📖 {devotional.bibleReference}
              </h4>
              <p className="text-indigo-800 italic">
                "{devotional.bibleVerse}"
              </p>
            </div>

            {/* Image */}
            {devotional.imageUrl && (
              <div className="rounded-lg overflow-hidden">
                <img 
                  src={devotional.imageUrl} 
                  alt={devotional.title}
                  className="w-full h-64 object-cover"
                />
              </div>
            )}

            {/* Main Content */}
            <div>
              <h4 className="text-lg font-semibold text-gray-900 mb-3">
                Mensagem
              </h4>
              <div className="prose prose-gray max-w-none">
                <p className="whitespace-pre-wrap text-gray-700">
                  {devotional.content}
                </p>
              </div>
            </div>

            {/* Reflection */}
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <h4 className="text-lg font-semibold text-yellow-900 mb-3">
                💭 Reflexão
              </h4>
              <p className="text-yellow-800 whitespace-pre-wrap">
                {devotional.reflection}
              </p>
            </div>

            {/* Prayer */}
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <h4 className="text-lg font-semibold text-purple-900 mb-3">
                🙏 Oração
              </h4>
              <p className="text-purple-800 whitespace-pre-wrap">
                {devotional.prayer}
              </p>
            </div>

            {/* Tags */}
            {devotional.tags.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  Tags
                </h4>
                <div className="flex flex-wrap gap-2">
                  {devotional.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Audio Player */}
            {devotional.audioUrl && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">
                  🎧 Ouvir Devocional
                </h4>
                <audio controls className="w-full">
                  <source src={devotional.audioUrl} type="audio/mpeg" />
                  Seu navegador não suporta o elemento de áudio.
                </audio>
              </div>
            )}

            {/* Stats */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  👁️ {devotional.viewCount} visualizações
                </span>
                <span className="flex items-center gap-1">
                  ❤️ {devotional.likes.length} curtidas
                </span>
                <span className="flex items-center gap-1">
                  🔖 {devotional.bookmarks.length} favoritos
                </span>
              </div>
              <div className="text-sm text-gray-500">
                {devotional.isPublished ? (
                  <span className="text-green-600">✅ Publicado</span>
                ) : (
                  <span className="text-yellow-600">📝 Rascunho</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md shadow-sm text-sm font-medium hover:bg-gray-700"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
export default DevotionalDetailModal;
