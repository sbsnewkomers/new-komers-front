import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";
import { FileText, Loader2 } from "lucide-react";
import { ImportProgress  } from "./types";
interface ImportInProgressProps {
  imports: ImportProgress[];
}

export function ImportInProgress({ imports }: ImportInProgressProps) {
  if (imports.length === 0) return null;

  return (
    <Card className="nebula-glass overflow-hidden border border-white/10">
      <div className="flex items-center gap-3 border-b border-white/10 px-6 py-4">
        <div className="rounded-lg border border-amber-400/30 bg-amber-500/15 p-2">
          <Loader2 className="h-4 w-4 animate-spin text-amber-200" />
        </div>
        <h3 className="font-semibold text-white">Imports en cours</h3>
        <span className="ml-auto rounded-full border border-amber-400/30 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-100">
          {imports.length}
        </span>
      </div>
      <CardContent className="p-6!">
        <div className="space-y-4">
          {imports.map((imp) => (
            <div key={imp.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-(--nebula-muted)" />
                  <span className="text-sm font-medium text-white">
                    {imp.name}
                  </span>
                </div>
                <span className="text-xs font-medium text-(--nebula-muted)">
                  {imp.progress}%
                </span>
              </div>
              <Progress value={imp.progress} max={100} className="h-2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}