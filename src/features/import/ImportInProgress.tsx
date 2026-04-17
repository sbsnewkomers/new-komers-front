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
    <Card className="bg-white overflow-hidden">
      <div className="border-b border-slate-100 px-6 py-4 flex items-center gap-3">
        <div className="rounded-lg bg-amber-50 p-2">
          <Loader2 className="h-4 w-4 text-amber-600 animate-spin" />
        </div>
        <h3 className="font-semibold text-primary">Imports en cours</h3>
        <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700 ring-1 ring-amber-200">
          {imports.length}
        </span>
      </div>
      <CardContent className="p-6!">
        <div className="space-y-4">
          {imports.map((imp) => (
            <div key={imp.id} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-slate-400" />
                  <span className="text-sm font-medium text-slate-700">
                    {imp.name}
                  </span>
                </div>
                <span className="text-xs font-medium text-slate-500">
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