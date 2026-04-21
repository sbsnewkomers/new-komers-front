import React from 'react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter } from '@/components/ui/AlertDialog';
import { Button } from '@/components/ui/Button';
import { AlertCircle } from 'lucide-react';

interface DeleteConfirmDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onConfirm: () => void;
    onCancel: () => void;
    itemType?: 'emprunt' | 'actif';
}

export function DeleteConfirmDialog({ open, onOpenChange, onConfirm, onCancel, itemType = 'emprunt' }: DeleteConfirmDialogProps) {
    const getItemText = () => {
        switch (itemType) {
            case 'actif':
                return 'cet actif';
            case 'emprunt':
            default:
                return 'cet emprunt';
        }
    };

    return (
        <AlertDialog open={open} onOpenChange={onOpenChange}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2 text-red-600">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        Confirmer la suppression
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer {getItemText()} ? Cette action est irréversible.
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <Button variant="outline" onClick={onCancel}>
                        Annuler
                    </Button>
                    <Button variant="destructive" onClick={onConfirm}>
                        Supprimer
                    </Button>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}