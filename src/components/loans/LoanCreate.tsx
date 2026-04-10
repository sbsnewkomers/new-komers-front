import React from 'react';
import { Calculator, FileSpreadsheet, TrendingUp, Database, PenTool } from 'lucide-react';

interface LoanCreateProps {
    onMethodSelect: (method: 'calculator' | 'import' | 'manual') => void;
}

export function LoanCreate({ onMethodSelect }: LoanCreateProps) {
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center">
                <div className="flex items-center justify-center gap-2 mb-4">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                    <h1 className="text-2xl font-bold text-gray-900">Créer un nouvel emprunt</h1>
                </div>
                <p className="text-gray-600 max-w-2xl mx-auto">
                    Choisissez la méthode qui vous convient le mieux pour créer votre échéancier de prêt
                </p>
            </div>

            {/* Method Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div
                    className="group cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={() => onMethodSelect('calculator')}
                >
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 border-2 border-blue-200 rounded-xl p-6 h-full hover:shadow-lg hover:border-blue-400 transition-all duration-300">
                        <div className="text-center">
                            <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-200 transition-colors">
                                <Calculator className="h-8 w-8 text-blue-600" />
                            </div>
                            <h3 className="font-bold text-lg text-blue-900 mb-2">Calculatrice Intégrée</h3>
                            <div className="space-y-2 text-sm text-blue-700">
                                <p>La méthode la plus rapide</p>
                                <p className="text-blue-600">
                                    Générer automatiquement un échéancier à partir des caractéristiques du prêt (capital, taux, durée)
                                </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-blue-200">
                                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                                    Recommandé
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="group cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={() => onMethodSelect('import')}
                >
                    <div className="bg-gradient-to-br from-green-50 to-green-100 border-2 border-green-200 rounded-xl p-6 h-full hover:shadow-lg hover:border-green-400 transition-all duration-300">
                        <div className="text-center">
                            <div className="bg-green-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-green-200 transition-colors">
                                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                            </div>
                            <h3 className="font-bold text-lg text-green-900 mb-2">Import Excel/CSV</h3>
                            <div className="space-y-2 text-sm text-green-700">
                                <p>Importez vos données existantes</p>
                                <p className="text-green-600">
                                    Importer un échéancier depuis un fichier Excel ou CSV déjà préparé
                                </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-green-200">
                                <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full">
                                    Format standard
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div
                    className="group cursor-pointer transition-all duration-300 hover:scale-105"
                    onClick={() => onMethodSelect('manual')}
                >
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 border-2 border-purple-200 rounded-xl p-6 h-full hover:shadow-lg hover:border-purple-400 transition-all duration-300">
                        <div className="text-center">
                            <div className="bg-purple-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-purple-200 transition-colors">
                                <PenTool className="h-8 w-8 text-purple-600" />
                            </div>
                            <h3 className="font-bold text-lg text-purple-900 mb-2">Saisie Manuelle</h3>
                            <div className="space-y-2 text-sm text-purple-700">
                                <p>Contrôle total</p>
                                <p className="text-purple-600">
                                    Saisir manuellement chaque échéance ou ajuster un échéancier existant
                                </p>
                            </div>
                            <div className="mt-4 pt-4 border-t border-purple-200">
                                <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                                    Personnalisé
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Help Section */}
            <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
                <div className="flex items-start gap-4">
                    <div className="bg-blue-100 rounded-full p-2">
                        <Database className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-gray-900 mb-2">Conseil de choix</h4>
                        <ul className="space-y-1 text-sm text-gray-600">
                            <li>· <strong>Calculatrice</strong> : Idéal pour les nouveaux prêts avec paramètres standards</li>
                            <li>· <strong>Import</strong> : Parfait si vous avez déjà un échéancier dans un tableur</li>
                            <li>· <strong>Manuel</strong> : Pour les cas complexes ou ajustements précis</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}