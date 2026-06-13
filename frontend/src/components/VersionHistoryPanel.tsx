import { useEffect, useState } from 'react'
import { Version, documentsApi } from '../api/documents'

interface Props {
    documentId: number
    onRestore: (content: string) => void
    onClose: () => void
}

function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    })
}

export default function VersionHistoryPanel({ documentId, onRestore, onClose }: Props) {
    const [versions, setVersions] = useState<Version[]>([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState<Version | null>(null)
    const [restoring, setRestoring] = useState(false)

    useEffect(() => {
        documentsApi.getVersions(documentId).then((v) => {
            setVersions(v)
            setLoading(false)
        })
    }, [documentId])

    const handleRestore = async () => {
        if (!selected) return
        setRestoring(true)
        try {
            const doc = await documentsApi.restoreVersion(documentId, selected.versionNumber)
            onRestore(doc.content ?? '')
            onClose()
        } finally {
            setRestoring(false)
        }
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <h3 className="text-white font-semibold text-sm">Version history</h3>
                <button
                    onClick={onClose}
                    className="text-zinc-500 hover:text-white transition-colors text-lg"
                >
                    ×
                </button>
            </div>

            {loading && (
                <div className="flex-1 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
                </div>
            )}

            {!loading && versions.length === 0 && (
                <div className="flex-1 flex items-center justify-center">
                    <p className="text-zinc-600 text-sm text-center px-4">
                        No saved versions yet. Use "Save version" to create a snapshot.
                    </p>
                </div>
            )}

            {!loading && versions.length > 0 && (
                <>
                    <div className="flex-1 overflow-y-auto py-2">
                        {versions.map((v) => (
                            <button
                                key={v.id}
                                onClick={() => setSelected(v)}
                                className={`w-full text-left px-4 py-3 transition-colors ${
                                    selected?.id === v.id
                                        ? 'bg-zinc-800'
                                        : 'hover:bg-zinc-800/50'
                                }`}
                            >
                                <p className="text-white text-sm font-medium">
                                    Version {v.versionNumber}
                                </p>
                                <p className="text-zinc-500 text-xs mt-0.5">
                                    {formatDate(v.createdAt)} · {v.savedByUsername}
                                </p>
                            </button>
                        ))}
                    </div>

                    {selected && (
                        <div className="border-t border-zinc-800 p-4 space-y-3">
                            <div className="bg-zinc-800 rounded-lg p-3 max-h-32 overflow-y-auto">
                                <p className="text-zinc-300 text-xs font-mono whitespace-pre-wrap break-all">
                                    {selected.content || '(empty)'}
                                </p>
                            </div>
                            <button
                                onClick={handleRestore}
                                disabled={restoring}
                                className="w-full bg-white text-black font-semibold rounded-lg py-2 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
                            >
                                {restoring ? 'Restoring...' : `Restore version ${selected.versionNumber}`}
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    )
}