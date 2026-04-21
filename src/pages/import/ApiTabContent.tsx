import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plug, Sparkles, ArrowRight } from "lucide-react";

function ApiTabContent() {
  return (
    <Card className="bg-white">
      <CardContent className="py-16! flex flex-col items-center justify-center">
        <div className="mb-6 flex items-center justify-center gap-4">
          <div className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
            <span className="font-bold text-slate-800">Sage</span>
          </div>
          <div className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
            <span className="font-bold text-emerald-600">Pennylane</span>
          </div>
          <div className="flex z-10 h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-md ring-4 ring-white">
            <Plug className="h-8 w-8 text-primary" />
          </div>
          <div className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
            <span className="font-bold text-blue-600">Cegid</span>
          </div>
          <div className="flex h-12 items-center justify-center rounded-xl border border-slate-200 bg-white px-4 shadow-sm">
            <span className="font-bold text-green-600">QuickBooks</span>
          </div>
        </div>
        <h3 className="text-base font-semibold text-slate-700 mb-1">
          Connecteurs API
        </h3>
        <p className="text-sm text-slate-500 mb-6 text-center max-w-sm">
          Configurez vos connecteurs pour synchroniser automatiquement vos données comptables depuis vos logiciels.
        </p>
        <Link href="/import/connectors">
          <Button className="gap-2 bg-primary text-white hover:bg-primary/90">
            <Sparkles className="h-4 w-4" />
            Configurer les connecteurs
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default ApiTabContent;