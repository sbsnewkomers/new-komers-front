import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Plug, Sparkles, ArrowRight } from "lucide-react";

export function ApiTabContent() {
  return (
    <Card className="nebula-glass overflow-hidden border border-white/10">
      <CardContent className="py-16! flex flex-col items-center justify-center">
        <div className="mb-6 flex flex-wrap items-center justify-center gap-4">
          <div className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4">
            <span className="font-bold text-white">Sage</span>
          </div>
          <div className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4">
            <span className="font-bold text-emerald-200">Pennylane</span>
          </div>
          <div className="z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-(--nebula-gold-light)/35 bg-white/10 shadow-lg ring-4 ring-white/10">
            <Plug className="h-8 w-8 text-(--nebula-gold-light)" />
          </div>
          <div className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4">
            <span className="font-bold text-sky-200">Cegid</span>
          </div>
          <div className="flex h-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 px-4">
            <span className="font-bold text-emerald-100">QuickBooks</span>
          </div>
        </div>
        <h3 className="mb-1 text-base font-semibold text-white">
          Connecteurs API
        </h3>
        <p className="mb-6 max-w-sm text-center text-sm text-(--nebula-muted)">
          Configurez vos connecteurs pour synchroniser automatiquement vos données comptables depuis vos logiciels.
        </p>
        <Link href="/import/connectors">
          <Button
            variant="outline"
            className="gap-2 border-(--nebula-gold-light)/40 text-(--nebula-gold-light) hover:bg-white/10"
          >
            <Sparkles className="h-4 w-4" />
            Configurer les connecteurs
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}