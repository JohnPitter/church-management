// Presentation Component - Media Upload Field
// URL input with optional file upload to Firebase Storage (image/audio)

import React, { useRef, useState } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '@/config/firebase';
import toast from 'react-hot-toast';

interface MediaUploadFieldProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  accept: string; // e.g. 'image/*' or 'audio/*'
  storageFolder: string; // e.g. 'devotional-media'
  placeholder?: string;
  maxSizeMB?: number;
}

const DEFAULT_MAX_SIZE_MB = 15;

export const MediaUploadField: React.FC<MediaUploadFieldProps> = ({
  label,
  value,
  onChange,
  accept,
  storageFolder,
  placeholder,
  maxSizeMB = DEFAULT_MAX_SIZE_MB
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const isImage = accept.includes('image');

  const handleFileSelected = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${maxSizeMB}MB.`);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setUploading(true);
    try {
      const safeName = file.name.replace(/[^\w.\-]/g, '_');
      const storageRef = ref(storage, `${storageFolder}/${Date.now()}_${safeName}`);
      const snapshot = await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(snapshot.ref);
      onChange(downloadURL);
      toast.success('Upload concluído com sucesso');
    } catch (error) {
      console.error('Error uploading media file:', error);
      toast.error('Erro ao enviar arquivo. Tente novamente.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex gap-2">
        <input
          type="url"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500"
          placeholder={placeholder}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap"
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Enviando...
            </>
          ) : (
            <>📤 Upload</>
          )}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelected}
          className="hidden"
        />
      </div>

      {value && (
        <div className="mt-2 flex items-center gap-3">
          {isImage ? (
            <img src={value} alt="Pré-visualização" className="h-16 w-16 object-cover rounded border border-gray-200" />
          ) : (
            <audio controls src={value} className="h-8 max-w-full">
              Seu navegador não suporta áudio.
            </audio>
          )}
          <button
            type="button"
            onClick={() => onChange('')}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Remover
          </button>
        </div>
      )}
    </div>
  );
};

export default MediaUploadField;
