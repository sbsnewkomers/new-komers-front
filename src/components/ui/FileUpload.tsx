import React, { useRef } from 'react';
import Image from 'next/image';
import { Upload, X } from 'lucide-react';

interface FileUploadProps {
  value?: string;
  onChange: (file: File | null) => void;
  accept?: string;
  maxSize?: number; // in bytes
  className?: string;
  placeholder?: string;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  value,
  onChange,
  accept = 'image/*',
  maxSize = 2 * 1024 * 1024, // 2MB
  className = '',
  placeholder = 'Cliquez pour uploader une image'
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const acceptedMimeTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size
    if (file.size > maxSize) {
      alert(`Le fichier est trop volumineux. La taille maximale est de ${maxSize / 1024 / 1024}MB`);
      return;
    }

    // Check file type (align with backend allowed formats)
    if (!acceptedMimeTypes.includes(file.type)) {
      alert('Formats autorisés: JPG, PNG, GIF, WEBP');
      return;
    }

    onChange(file);
    // Allow selecting the same file again later if needed.
    event.target.value = '';
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="hidden"
      />
      
      {value ? (
        <div className="relative group">
          {value.startsWith('http') ? (
            <Image
              src={value}
              alt="Logo"
              width={80}
              height={80}
              className="object-cover rounded-lg border border-slate-200"
            />
          ) : (
            <Image
              src={`${process.env.NEXT_PUBLIC_API_BASE_URL}/uploads/${value}`}
              alt="Logo"
              width={80}
              height={80}
              className="object-cover rounded-lg border border-slate-200"
            />
          )}
          <div className="absolute -top-2 -right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              type="button"
              onClick={handleClick}
              className="rounded-full bg-slate-700 p-1 text-white"
              title="Remplacer le logo"
              aria-label="Remplacer le logo"
            >
              <Upload className="h-3 w-3" />
            </button>
            <button
              type="button"
              onClick={handleRemove}
              className="rounded-full bg-red-500 p-1 text-white"
              title="Supprimer le logo"
              aria-label="Supprimer le logo"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          className="flex items-center justify-center w-full h-20 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 transition-colors"
        >
          <div className="flex flex-col items-center text-slate-500">
            <Upload className="h-6 w-6 mb-1" />
            <span className="text-xs">{placeholder}</span>
          </div>
        </button>
      )}
    </div>
  );
};
