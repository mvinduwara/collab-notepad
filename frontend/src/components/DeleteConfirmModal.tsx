interface Props {
    title: string
    onClose: () => void
    onConfirm: () => Promise<void>
}

export default function DeleteConfirmModal({ title, onClose, onConfirm }: Props) {
    const [loading, setLoading] = useState(false)

    const handleConfirm = async () => {
        setLoading(true)
        try {
            await onConfirm()
            onClose()
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div
                className="absolute inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                <h2 className="text-white font-bold text-lg mb-2">Delete document</h2>
                <p className="text-zinc-400 text-sm mb-6">
                    Are you sure you want to delete{' '}
                    <span className="text-white font-medium">"{title}"</span>? This
                    cannot be undone.
                </p>
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 bg-zinc-800 text-zinc-300 font-medium rounded-lg py-2.5 text-sm hover:bg-zinc-700 transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleConfirm}
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white font-semibold rounded-lg py-2.5 text-sm hover:bg-red-500 transition-colors disabled:opacity-50"
                    >
                        {loading ? 'Deleting...' : 'Delete'}
                    </button>
                </div>
            </div>
        </div>
    )
}

import { useState } from 'react'