import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Upload, FileUp } from "lucide-react";

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
}: UploadZoneProps) {
  return (
    <Card
      className={`relative overflow-hidden transition-all duration-300 cursor-pointer group ${
        dragOver
          ? "ring-2 ring-primary shadow-lg shadow-primary/10 scale-[1.01] bg-primary/2"
          : "hover:shadow-md hover:border-slate-200"
      }`}
      onDrop={(e) => onDrop(e, type)}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="absolute inset-0 bg-linear-to-br from-primary/2 to-transparent pointer-events-none" />
      <CardContent className="p-0! flex flex-col items-center justify-center min-h-[230px] relative">
        <div
          className={`mb-4 rounded-2xl p-2 transition-all duration-300 ${
            dragOver
              ? "bg-primary/10 scale-110"
              : "bg-slate-50 group-hover:bg-primary/5 group-hover:scale-105"
          }`}
        >
          <Upload
            className={`h-6 w-6 transition-colors duration-300 ${
              dragOver ? "text-primary" : "text-slate-400 group-hover:text-primary/70"
            }`}
          />
        </div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">{title}</h3>
        <p className="text-sm text-slate-500 mb-1">{subtitle}</p>
        <p className="text-xs text-slate-400 mb-5">
          Formats supportés : <span className="font-medium">{formats}</span>
        </p>
        <input
          type="file"
          accept={accept}
          className="hidden"
          id={inputId}
          onChange={(e) => onFileInput(e, type)}
        />
        <label htmlFor={inputId}>
          <Button
            type="button"
            variant="outline"
            className="cursor-pointer gap-2 bg-slate-100! text-slate-600 hover:bg-slate-200! hover:text-slate-600"
          >
            <FileUp className="h-4 w-4" />
            Parcourir les fichiers
          </Button>
        </label>
      </CardContent>
    </Card>
  );
}