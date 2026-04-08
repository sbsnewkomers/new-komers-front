import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription } from '@/components/ui/AlertDialog';
import { AlertCircle } from 'lucide-react';

interface ErrorDialogProps {
    error: string | null;
}

export function ErrorDialog({ error }: ErrorDialogProps) {
    if (!error) return null;

    return (
        <AlertDialog open={true}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                        Erreur
                    </AlertDialogTitle>
                    <AlertDialogDescription className="text-red-800">
                        {error}
                    </AlertDialogDescription>
                </AlertDialogHeader>
            </AlertDialogContent>
        </AlertDialog>
    );
}