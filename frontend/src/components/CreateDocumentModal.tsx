import { useState } from 'react'

interface Props {
    onClose: () => void
    onCreate: (title: string) => Promise<void>
}

export default function CreateDocumentModal({ onClose, onCreate }: Props) {
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!title.trim()) return
        setLoading(true)
        setError('')
        try {
            await onCreate(title.trim())
            onClose()
        } catch {
            setError('Failed to create document')
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
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h2 className="text-white font-bold text-lg mb-5">New Document</h2>

                {error && (
                    <div className="mb-4 px-4 py-2.5 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-zinc-400 text-sm mb-1.5">
                            Document title
                        </label>
                        <input
                            autoFocus
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Untitled document"
                            className="w-full bg-zinc-800 border border-zinc-700 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-white transition-colors placeholder:text-zinc-600"
                        />
                    </div>

                    <div className="flex gap-3 pt-1">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 bg-zinc-800 text-zinc-300 font-medium rounded-lg py-2.5 text-sm hover:bg-zinc-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !title.trim()}
                            className="flex-1 bg-white text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Creating...' : 'Create'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}