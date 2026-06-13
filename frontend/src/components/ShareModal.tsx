import { useState } from 'react'
import { DocumentFull, documentsApi } from '../api/documents'

interface Props {
    document: DocumentFull
    onClose: () => void
    onUpdate: (doc: DocumentFull) => void
}

export default function ShareModal({ document, onClose, onUpdate }: Props) {
    const [tab, setTab] = useState<'link' | 'people'>('link')
    const [usernameOrEmail, setUsernameOrEmail] = useState('')
    const [permission, setPermission] = useState<'VIEW' | 'EDIT'>('EDIT')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [copied, setCopied] = useState(false)

    const shareUrl = `${window.location.origin}/share/${document.shareToken}`

    const copyLink = () => {
        navigator.clipboard.writeText(shareUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const handleAddCollaborator = async () => {
        if (!usernameOrEmail.trim()) return
        setLoading(true)
        setError('')
        try {
            const updated = await documentsApi.addCollaborator(document.id, {
                usernameOrEmail: usernameOrEmail.trim(),
                permission,
            })
            onUpdate(updated)
            setUsernameOrEmail('')
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to add collaborator')
        } finally {
            setLoading(false)
        }
    }

    const handleRemoveCollaborator = async (userId: number) => {
        try {
            await documentsApi.removeCollaborator(document.id, userId)
            const updated = {
                ...document,
                collaborators: document.collaborators.filter((c) => c.userId !== userId),
            }
            onUpdate(updated)
        } catch {
            setError('Failed to remove collaborator')
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg shadow-2xl">
                <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-zinc-800">
                    <h2 className="text-white font-bold text-lg">Share document</h2>
                    <button
                        onClick={onClose}
                        className="text-zinc-500 hover:text-white text-xl transition-colors"
                    >
                        ×
                    </button>
                </div>

                <div className="flex border-b border-zinc-800">
                    {(['link', 'people'] as const).map((t) => (
                        <button
                            key={t}
                            onClick={() => setTab(t)}
                            className={`flex-1 py-3 text-sm font-medium transition-colors capitalize ${
                                tab === t
                                    ? 'text-white border-b-2 border-white'
                                    : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                        >
                            {t === 'link' ? 'Share link' : 'People'}
                        </button>
                    ))}
                </div>

                <div className="p-6">
                    {tab === 'link' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">
                                    Anyone with this link
                                </label>
                                <div className="flex gap-2">
                                    <input
                                        readOnly
                                        value={shareUrl}
                                        className="flex-1 bg-zinc-800 border border-zinc-700 text-zinc-300 rounded-lg px-3 py-2 text-xs outline-none"
                                    />
                                    <button
                                        onClick={copyLink}
                                        className="bg-white text-black font-semibold rounded-lg px-4 py-2 text-sm hover:bg-zinc-200 transition-colors whitespace-nowrap"
                                    >
                                        {copied ? 'Copied!' : 'Copy'}
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-zinc-400 text-sm mb-2">
                                    Link permission
                                </label>
                                <select
                                    value={document.sharePermission}
                                    onChange={async (e) => {
                                        const updated = await documentsApi.update(document.id, {
                                            sharePermission: e.target.value,
                                        })
                                        onUpdate(updated)
                                    }}
                                    className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none"
                                >
                                    <option value="VIEW">View only</option>
                                    <option value="EDIT">Can edit</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {tab === 'people' && (
                        <div className="space-y-4">
                            {error && (
                                <div className="px-3 py-2 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                                    {error}
                                </div>
                            )}

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={usernameOrEmail}
                                    onChange={(e) => setUsernameOrEmail(e.target.value)}
                                    placeholder="Username or email"
                                    onKeyDown={(e) => e.key === 'Enter' && handleAddCollaborator()}
                                    className="flex-1 bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none focus:border-white transition-colors placeholder:text-zinc-600"
                                />
                                <select
                                    value={permission}
                                    onChange={(e) => setPermission(e.target.value as 'VIEW' | 'EDIT')}
                                    className="bg-zinc-800 border border-zinc-700 text-white rounded-lg px-3 py-2 text-sm outline-none"
                                >
                                    <option value="EDIT">Edit</option>
                                    <option value="VIEW">View</option>
                                </select>
                                <button
                                    onClick={handleAddCollaborator}
                                    disabled={loading || !usernameOrEmail.trim()}
                                    className="bg-white text-black font-semibold rounded-lg px-4 py-2 text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50"
                                >
                                    Add
                                </button>
                            </div>

                            <div className="space-y-2 max-h-52 overflow-y-auto">
                                <div className="flex items-center gap-3 py-2">
                                    <div
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                                        style={{ backgroundColor: document.owner.color }}
                                    >
                                        {document.owner.username[0].toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-white text-sm font-medium truncate">
                                            {document.owner.username}
                                        </p>
                                        <p className="text-zinc-500 text-xs">Owner</p>
                                    </div>
                                </div>

                                {document.collaborators.map((c) => (
                                    <div key={c.userId} className="flex items-center gap-3 py-2">
                                        <div
                                            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-black flex-shrink-0"
                                            style={{ backgroundColor: c.color }}
                                        >
                                            {c.username[0].toUpperCase()}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-white text-sm font-medium truncate">
                                                {c.username}
                                            </p>
                                            <p className="text-zinc-500 text-xs capitalize">
                                                {c.permission.toLowerCase()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => handleRemoveCollaborator(c.userId)}
                                            className="text-zinc-600 hover:text-red-400 text-sm transition-colors"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}