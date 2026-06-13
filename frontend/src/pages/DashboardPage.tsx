import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { useDocuments } from '../hooks/useDocuments'
import DocumentCard from '../components/DocumentCard'
import CreateDocumentModal from '../components/CreateDocumentModal'
import DeleteConfirmModal from '../components/DeleteConfirmModal'
import { useDocumentStore } from '../store/documentStore'

export default function DashboardPage() {
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const logout = useAuthStore((s) => s.logout)
    const { documents, loading, error, createDocument, deleteDocument } = useDocuments()
    const [showCreate, setShowCreate] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<{ id: number; title: string } | null>(null)
    const [search, setSearch] = useState('')

    const filtered = documents.filter((d) =>
        d.title.toLowerCase().includes(search.toLowerCase())
    )

    const handleLogout = () => {
        logout()
        navigate('/login')
    }

    const handleCreate = async (title: string) => {
        const doc = await createDocument(title)
        navigate(`/document/${doc.id}`)
    }

    const handleDelete = async () => {
        if (!deleteTarget) return
        await deleteDocument(deleteTarget.id)
        setDeleteTarget(null)
    }

    return (
        <div className="min-h-screen bg-black">
            <header className="border-b border-zinc-800 px-6 py-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <h1 className="text-white font-black text-xl tracking-tight">
                        CollabPad
                    </h1>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div
                                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-black"
                                style={{ backgroundColor: user?.color ?? '#fff' }}
                            >
                                {user?.username?.[0]?.toUpperCase()}
                            </div>
                            <span className="text-zinc-400 text-sm">{user?.username}</span>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="text-zinc-500 hover:text-white text-sm transition-colors"
                        >
                            Sign out
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-8 gap-4">
                    <div className="flex-1 max-w-sm">
                        <input
                            type="text"
                            placeholder="Search documents..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full bg-zinc-900 border border-zinc-800 text-white rounded-lg px-4 py-2.5 text-sm outline-none focus:border-zinc-600 transition-colors placeholder:text-zinc-600"
                        />
                    </div>
                    <button
                        onClick={() => setShowCreate(true)}
                        className="bg-white text-black font-semibold rounded-lg px-5 py-2.5 text-sm hover:bg-zinc-200 transition-colors flex items-center gap-2"
                    >
                        <span className="text-lg leading-none">+</span>
                        New document
                    </button>
                </div>

                {loading && (
                    <div className="text-center py-20">
                        <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin mx-auto" />
                    </div>
                )}

                {error && (
                    <div className="text-center py-20 text-red-400 text-sm">{error}</div>
                )}

                {!loading && !error && filtered.length === 0 && (
                    <div className="text-center py-24">
                        <p className="text-zinc-600 text-lg font-medium">
                            {search ? 'No documents match your search' : 'No documents yet'}
                        </p>
                        {!search && (
                            <p className="text-zinc-700 text-sm mt-2">
                                Create your first document to get started
                            </p>
                        )}
                    </div>
                )}

                {!loading && !error && filtered.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filtered.map((doc) => (
                            <DocumentCard
                                key={doc.id}
                                doc={doc}
                                onDelete={(id) =>
                                    setDeleteTarget({ id, title: doc.title })
                                }
                            />
                        ))}
                    </div>
                )}
            </main>

            {showCreate && (
                <CreateDocumentModal
                    onClose={() => setShowCreate(false)}
                    onCreate={handleCreate}
                />
            )}

            {deleteTarget && (
                <DeleteConfirmModal
                    title={deleteTarget.title}
                    onClose={() => setDeleteTarget(null)}
                    onConfirm={handleDelete}
                />
            )}
        </div>
    )
}