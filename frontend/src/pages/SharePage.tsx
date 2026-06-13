import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsApi, DocumentFull } from '../api/documents'
import { useAuthStore } from '../store/authStore'

export default function SharePage() {
    const { token } = useParams<{ token: string }>()
    const navigate = useNavigate()
    const isAuthenticated = useAuthStore((s) => s.isAuthenticated)
    const [doc, setDoc] = useState<DocumentFull | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')

    useEffect(() => {
        if (!token) return
        documentsApi.getByShareToken(token).then((d) => {
            setDoc(d)
            setLoading(false)
        }).catch(() => {
            setError('Document not found or access denied')
            setLoading(false)
        })
    }, [token])

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
            </div>
        )
    }

    if (error || !doc) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="text-center">
                    <p className="text-zinc-400 text-lg mb-4">{error || 'Document not found'}</p>
                    <button
                        onClick={() => navigate('/')}
                        className="text-white underline text-sm"
                    >
                        Go home
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-black flex flex-col items-center justify-center px-4">
            <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
                <h1 className="text-white font-black text-2xl mb-2">CollabPad</h1>
                <p className="text-zinc-400 text-sm mb-6">You've been invited to view a document</p>

                <div className="bg-zinc-800 rounded-xl p-4 mb-6 text-left">
                    <p className="text-white font-semibold">{doc.title}</p>
                    <p className="text-zinc-500 text-xs mt-1">by {doc.owner.username}</p>
                </div>

                {isAuthenticated ? (
                    <button
                        onClick={() => navigate(`/document/${doc.id}`)}
                        className="w-full bg-white text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-zinc-200 transition-colors"
                    >
                        Open document
                    </button>
                ) : (
                    <div className="space-y-3">
                        <button
                            onClick={() => navigate(`/login?redirect=/document/${doc.id}`)}
                            className="w-full bg-white text-black font-semibold rounded-lg py-2.5 text-sm hover:bg-zinc-200 transition-colors"
                        >
                            Sign in to open
                        </button>
                        <button
                            onClick={() => navigate(`/register?redirect=/document/${doc.id}`)}
                            className="w-full bg-zinc-800 text-white font-medium rounded-lg py-2.5 text-sm hover:bg-zinc-700 transition-colors"
                        >
                            Create account
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}