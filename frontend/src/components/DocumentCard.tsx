import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { DocumentSummary } from '../api/documents'
import { useAuthStore } from '../store/authStore'

interface Props {
    doc: DocumentSummary
    onDelete: (id: number) => void
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    return `${days}d ago`
}

export default function DocumentCard({ doc, onDelete }: Props) {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const isOwner = doc.ownerUsername === user?.username
    const [menuOpen, setMenuOpen] = useState(false)

    return (
        <div
            className="group bg-zinc-900 border border-zinc-800 rounded-xl p-5 hover:border-zinc-600 transition-all cursor-pointer relative"
            onClick={() => navigate(`/document/${doc.id}`)}
        >
            <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-base truncate">
                        {doc.title}
                    </h3>
                    <p className="text-zinc-500 text-xs mt-1">
                        by {doc.ownerUsername}
                        {!isOwner && (
                            <span className="ml-2 px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
                shared
              </span>
                        )}
                    </p>
                </div>

                {isOwner && (
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                        <button
                            onClick={() => setMenuOpen((v) => !v)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-800 transition-colors opacity-0 group-hover:opacity-100"
                        >
                            ···
                        </button>

                        {menuOpen && (
                            <>
                                <div
                                    className="fixed inset-0 z-10"
                                    onClick={() => setMenuOpen(false)}
                                />
                                <div className="absolute right-0 top-9 z-20 bg-zinc-800 border border-zinc-700 rounded-lg py-1 w-36 shadow-xl">
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false)
                                            navigate(`/document/${doc.id}`)
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                                    >
                                        Open
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMenuOpen(false)
                                            onDelete(doc.id)
                                        }}
                                        className="w-full text-left px-3 py-2 text-sm text-red-400 hover:bg-zinc-700 transition-colors"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-4">
                <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-600" />
                    <span className="text-zinc-500 text-xs">
            {doc.collaboratorCount > 0
                ? `${doc.collaboratorCount} collaborator${doc.collaboratorCount > 1 ? 's' : ''}`
                : 'Only you'}
          </span>
                </div>
                <span className="text-zinc-600 text-xs">{timeAgo(doc.updatedAt)}</span>
            </div>
        </div>
    )
}