import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, FileUp } from "lucide-react";
import { useRef } from "react";

interface UploadZoneProps {
  type: "excel";
  accept: string;
  inputId: string;
  title: string;
  subtitle: string;
  formats: string;
  dragOver: boolean;
  onDrop: (e: React.DragEvent, type: "excel") => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onFileInput: (e: React.ChangeEvent<HTMLInputElement>, type: "excel") => void;
  disabled?: boolean;
  fileName?: string;
}

export function UploadZone({
  type,
  accept,
  inputId,
  title,
  subtitle,
  formats,
  dragOver,
  onDrop,
  onDragOver,
  onDragLeave,
  onFileInput,
  disabled = false,
  fileName,
}: UploadZoneProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleBrowseClick = () => {
    if (disabled) return;
    fileInputRef.current?.click();
  };

  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 group border border-white/10 ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "cursor-pointer hover:border-white/20"
      } ${
        dragOver
          ? "ring-2 ring-(--nebula-gold-light)/40 scale-[1.01] bg-white/5"
          : ""
      }`}
      onDrop={disabled ? undefined : (e) => onDrop(e, type)}
      onDragOver={disabled ? undefined : onDragOver}
      onDragLeave={disabled ? undefined : onDragLeave}
    >
      <div className="absolute inset-0 bg-linear-to-br from-white/5 to-transparent pointer-events-none" />
      <CardContent className="p-0! flex flex-col items-center justify-center min-h-[230px] relative">
        <div
          className={`mb-4 rounded-2xl border border-white/10 p-2 transition-all duration-300 ${
            dragOver
              ? "bg-white/10 scale-110 ring-1 ring-(--nebula-gold-light)/35"
              : "bg-white/5 group-hover:bg-white/10 group-hover:scale-105"
          }`}
        >
          <Upload
            className={`h-6 w-6 transition-colors duration-300 ${
              dragOver ? "text-(--nebula-gold-light)" : "text-(--nebula-gold-light) group-hover:text-white"
            }`}
          />
        </div>
        <h3 className="text-base font-semibold text-white mb-1">{title}</h3>

        {fileName ? (
          <div className="flex items-center gap-2 mb-3 px-3 py-1.5 rounded-xl border border-emerald-400/30 bg-emerald-500/10">
            <FileUp className="h-4 w-4 text-emerald-200 shrink-0" />
            <span className="text-xs font-medium text-emerald-100 truncate max-w-[200px]" title={fileName}>
              {fileName}
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                  fileInputRef.current.click();
                }
              }}
              className="text-xs text-emerald-200 hover:text-white underline shrink-0"
            >
              Changer
            </button>
          </div>
        ) : (
          <p className="text-sm text-(--nebula-muted) mb-1">{subtitle}</p>
        )}

        <p className="text-xs text-(--nebula-muted) mb-5">
          Formats supportés : <span className="font-medium text-white/80">{formats}</span>
        </p>

        {disabled && (
          <p className="text-xs text-amber-200 font-medium mb-3">
            Vous n&apos;avez pas les droits pour importer des données.
          </p>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          className="hidden"
          id={inputId}
          disabled={disabled}
          onChange={(e) => onFileInput(e, type)}
        />
        <Button
          type="button"
          variant="outline"
          onClick={handleBrowseClick}
          disabled={disabled}
          className="cursor-pointer gap-2"
        >
          <FileUp className="h-4 w-4" />
          Parcourir les fichiers
        </Button>
      </CardContent>
    </Card>
  );
}
