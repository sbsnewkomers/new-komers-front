import { useState } from 'react';

export function useDeleteConfirm() {
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [loanToDelete, setLoanToDelete] = useState<string | null>(null);

    const confirmDelete = (loanId: string) => {
        setLoanToDelete(loanId);
        setDeleteConfirmOpen(true);
    };

    const cancelDelete = () => {
        setDeleteConfirmOpen(false);
        setLoanToDelete(null);
    };

    const closeDialog = () => {
        setDeleteConfirmOpen(false);
        setLoanToDelete(null);
    };

    return {
        deleteConfirmOpen,
        loanToDelete,
        confirmDelete,
        cancelDelete,
        closeDialog
    };
}