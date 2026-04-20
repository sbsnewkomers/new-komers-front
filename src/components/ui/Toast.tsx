// components/ui/Toast.tsx
import { useEffect } from 'react';
import { CheckCircle, XCircle, Info, AlertCircle, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
  onClose: () => void;
  details?: {
    linesCount?: number;
    fileName?: string;
    entityName?: string;
  };
}

export function Toast({ message, type = 'success', duration = 5000, onClose, details }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: <CheckCircle className="h-5 w-5 text-green-500" />,
    error: <XCircle className="h-5 w-5 text-red-500" />,
    info: <Info className="h-5 w-5 text-blue-500" />,
    warning: <AlertCircle className="h-5 w-5 text-yellow-500" />,
  };

  const bgColors = {
    success: 'bg-green-50 border-green-200',
    error: 'bg-red-50 border-red-200',
    info: 'bg-blue-50 border-blue-200',
    warning: 'bg-yellow-50 border-yellow-200',
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-right-5 fade-in duration-300">
      <div className={`rounded-lg shadow-lg border p-4 min-w-[320px] max-w-md ${bgColors[type]}`}>
        <div className="flex items-start gap-3">
          {icons[type]}
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{message}</p>
            {details && (
              <div className="mt-2 text-xs text-gray-600 space-y-1">
                {details.fileName && <p>📄 Fichier : {details.fileName}</p>}
                {details.entityName && <p>🏢 Entité : {details.entityName}</p>}
                {details.linesCount && <p>📊 Lignes importées : {details.linesCount}</p>}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}