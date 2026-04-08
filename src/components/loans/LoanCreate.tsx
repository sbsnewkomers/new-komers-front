import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Calculator, FileSpreadsheet, Edit } from 'lucide-react';

interface LoanCreateProps {
    onMethodSelect: (method: 'calculator' | 'import' | 'manual') => void;
}

export function LoanCreate({ onMethodSelect }: LoanCreateProps) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Choisissez une méthode de saisie</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onMethodSelect('calculator')}
                    >
                        <CardContent className="pt-6 text-center">
                            <Calculator className="h-12 w-12 mx-auto mb-4 text-primary" />
                            <h3 className="font-semibold mb-2">Calculatrice Intégrée</h3>
                            <p className="text-sm text-muted-foreground">
                                Générer un échéancier à partir des caractéristiques du prêt
                            </p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onMethodSelect('import')}
                    >
                        <CardContent className="pt-6 text-center">
                            <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-primary" />
                            <h3 className="font-semibold mb-2">Import Excel/CSV</h3>
                            <p className="text-sm text-muted-foreground">
                                Importer un échéancier existant depuis un fichier
                            </p>
                        </CardContent>
                    </Card>

                    <Card
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onMethodSelect('manual')}
                    >
                        <CardContent className="pt-6 text-center">
                            <Edit className="h-12 w-12 mx-auto mb-4 text-primary" />
                            <h3 className="font-semibold mb-2">Saisie Manuelle</h3>
                            <p className="text-sm text-muted-foreground">
                                Saisir manuellement ou ajuster les échéances
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </CardContent>
        </Card>
    );
}