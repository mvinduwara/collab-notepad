import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { documentsApi, DocumentFull } from '../api/documents'
import { useAuthStore } from '../store/authStore'
import { useWebSocket } from '../hooks/useWebSocket'
import ShareModal from '../components/ShareModal'
import VersionHistoryPanel from '../components/VersionHistoryPanel'

interface ActiveUser {
    userId: number
    username: string
    color: string
}

interface CursorInfo {
    userId: number
    username: string
    color: string
    position: number
}

export default function EditorPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()
    const user = useAuthStore((s) => s.user)
    const documentId = Number(id)

    const [document, setDocument] = useState<DocumentFull | null>(null)
    const [content, setContent] = useState('')
    const [title, setTitle] = useState('')
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [savingVersion, setSavingVersion] = useState(false)
    const [activeUsers, setActiveUsers] = useState<ActiveUser[]>([])
    const [cursors, setCursors] = useState<Map<number, CursorInfo>>(new Map())
    const [showShare, setShowShare] = useState(false)
    const [showVersions, setShowVersions] = useState(false)
    const [connected, setConnected] = useState(false)
    const [error, setError] = useState('')

    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const contentRef = useRef('')
    const revisionRef = useRef<number>(0)
    const isRemoteUpdate = useRef(false)
    const titleSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
    const lastSentCursor = useRef<number>(-1)

    useEffect(() => {
        documentsApi.get(documentId).then((doc) => {
            setDocument(doc)
            setTitle(doc.title)
            setLoading(false)
        }).catch(() => {
            navigate('/')
        })
    }, [documentId])

    const handleOperation = useCallback((msg: any) => {
        if (msg.userId === user?.userId) return

        isRemoteUpdate.current = true
        const textarea = textareaRef.current
        const cursorPos = textarea?.selectionStart ?? 0

        let newContent = contentRef.current

        if (msg.type === 'INSERT' && msg.text) {
            const pos = Math.min(msg.position, newContent.length)
            newContent = newContent.substring(0, pos) + msg.text + newContent.substring(pos)
        } else if (msg.type === 'DELETE') {
            const pos = Math.min(msg.position, newContent.length)
            const end = Math.min(pos + msg.length, newContent.length)
            newContent = newContent.substring(0, pos) + newContent.substring(end)
        }

        contentRef.current = newContent
        setContent(newContent)
        revisionRef.current = msg.revision

        if (textarea) {
            let adjustedCursor = cursorPos
            if (msg.type === 'INSERT' && msg.position <= cursorPos) {
                adjustedCursor += (msg.text?.length ?? 0)
            } else if (msg.type === 'DELETE' && msg.position < cursorPos) {
                adjustedCursor -= Math.min(msg.length, cursorPos - msg.position)
            }
            requestAnimationFrame(() => {
                textarea.setSelectionRange(adjustedCursor, adjustedCursor)
                isRemoteUpdate.current = false
            })
        } else {
            isRemoteUpdate.current = false
        }
    }, [user?.userId])

    const handleSync = useCallback((msg: any) => {
        if (msg.type === 'RETAIN' && msg.text !== undefined) {
            contentRef.current = msg.text ?? ''
            setContent(msg.text ?? '')
            revisionRef.current = msg.revision ?? 0
            setConnected(true)
        }
    }, [])

    const handlePresence = useCallback((msg: any) => {
        setActiveUsers(msg.activeUsers ?? [])
    }, [])

    const handleCursor = useCallback((msg: any) => {
        if (msg.userId === user?.userId) return
        setCursors((prev) => {
            const next = new Map(prev)
            next.set(msg.userId, {
                userId: msg.userId,
                username: msg.username,
                color: msg.color,
                position: msg.position,
            })
            return next
        })
    }, [user?.userId])

    const handleWsError = useCallback((msg: any) => {
        setError(msg.message)
    }, [])

    const { sendOperation, sendCursor } = useWebSocket(documentId, {
        onOperation: handleOperation,
        onSync: handleSync,
        onPresence: handlePresence,
        onCursor: handleCursor,
        onError: handleWsError,
    })

    const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        if (isRemoteUpdate.current) return

        const newValue = e.target.value
        const cursorPos = e.target.selectionStart
        const oldContent = contentRef.current

        let type: 'INSERT' | 'DELETE'
        let position: number
        let text: string | undefined
        let length: number

        if (newValue.length > oldContent.length) {
            type = 'INSERT'
            const diff = newValue.length - oldContent.length
            position = cursorPos - diff
            text = newValue.substring(position, cursorPos)
            length = 0
        } else {
            type = 'DELETE'
            const diff = oldContent.length - newValue.length
            position = cursorPos
            length = diff
            text = undefined
        }

        contentRef.current = newValue
        setContent(newValue)

        sendOperation({
            documentId,
            type,
            position,
            text,
            length,
            revision: revisionRef.current,
        })
    }, [documentId, sendOperation])

    const handleCursorMove = useCallback((e: React.SyntheticEvent<HTMLTextAreaElement>) => {
        const pos = (e.target as HTMLTextAreaElement).selectionStart
        if (pos === lastSentCursor.current) return
        lastSentCursor.current = pos
        sendCursor({ documentId, position: pos })
    }, [documentId, sendCursor])

    const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newTitle = e.target.value
        setTitle(newTitle)
        if (titleSaveTimer.current) clearTimeout(titleSaveTimer.current)
        titleSaveTimer.current = setTimeout(async () => {
            try {
                await documentsApi.update(documentId, { title: newTitle })
            } catch {}
        }, 800)
    }

    const handleSaveVersion = async () => {
        setSavingVersion(true)
        try {
            await documentsApi.saveVersion(documentId)
        } finally {
            setSavingVersion(false)
        }
    }

    const handleRestoreVersion = (restoredContent: string) => {
        contentRef.current = restoredContent
        setContent(restoredContent)
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-white rounded-full animate-spin" />
            </div>
        )
    }

    const canEdit = document?.owner.id === user?.userId ||
        document?.collaborators.some(
            (c) => c.userId === user?.userId && c.permission === 'EDIT'
        )

    return (
        <div className="min-h-screen bg-black flex flex-col">
            <header className="border-b border-zinc-800 px-4 py-3 flex items-center gap-4">
                <button
                    onClick={() => navigate('/')}
                    className="text-zinc-500 hover:text-white transition-colors text-sm flex items-center gap-1.5"
                >
                    ← Back
                </button>

                <div className="flex-1 min-w-0">
                    <input
                        type="text"
                        value={title}
                        onChange={handleTitleChange}
                        disabled={!canEdit}
                        className="bg-transparent text-white font-semibold text-sm outline-none w-full max-w-sm disabled:cursor-default placeholder:text-zinc-600"
                        placeholder="Untitled"
                    />
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-zinc-600'}`} />
                        <span className="text-zinc-500 text-xs">
              {connected ? 'Live' : 'Connecting...'}
            </span>
                    </div>

                    <div className="flex -space-x-2">
                        {activeUsers.slice(0, 5).map((u) => (
                            <div
                                key={u.userId}
                                title={u.username}
                                className="w-7 h-7 rounded-full border-2 border-black flex items-center justify-center text-xs font-bold text-black"
                                style={{ backgroundColor: u.color }}
                            >
                                {u.username[0].toUpperCase()}
                            </div>
                        ))}
                        {activeUsers.length > 5 && (
                            <div className="w-7 h-7 rounded-full border-2 border-black bg-zinc-700 flex items-center justify-center text-xs text-white">
                                +{activeUsers.length - 5}
                            </div>
                        )}
                    </div>

                    {canEdit && (
                        <button
                            onClick={handleSaveVersion}
                            disabled={savingVersion}
                            className="text-zinc-400 hover:text-white text-xs transition-colors disabled:opacity-50"
                        >
                            {savingVersion ? 'Saving...' : 'Save version'}
                        </button>
                    )}

                    <button
                        onClick={() => setShowVersions((v) => !v)}
                        className="text-zinc-400 hover:text-white text-xs transition-colors"
                    >
                        History
                    </button>

                    {document?.owner.id === user?.userId && (
                        <button
                            onClick={() => setShowShare(true)}
                            className="bg-white text-black font-semibold rounded-lg px-4 py-1.5 text-xs hover:bg-zinc-200 transition-colors"
                        >
                            Share
                        </button>
                    )}
                </div>
            </header>

            {error && (
                <div className="bg-red-500/10 border-b border-red-500/30 px-6 py-2 text-red-400 text-sm flex items-center justify-between">
                    <span>{error}</span>
                    <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">×</button>
                </div>
            )}

            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden">
                    <div className="relative flex-1 overflow-hidden">
                        {cursors.size > 0 && (
                            <div className="absolute top-2 left-6 flex flex-wrap gap-2 z-10 pointer-events-none">
                                {Array.from(cursors.values()).map((c) => (
                                    <span
                                        key={c.userId}
                                        className="text-xs px-2 py-0.5 rounded-full font-medium text-black"
                                        style={{ backgroundColor: c.color }}
                                    >
                    {c.username} @ {c.position}
                  </span>
                                ))}
                            </div>
                        )}

                        <textarea
                            ref={textareaRef}
                            value={content}
                            onChange={handleChange}
                            onSelect={handleCursorMove}
                            onClick={handleCursorMove}
                            onKeyUp={handleCursorMove}
                            disabled={!canEdit}
                            placeholder={canEdit ? 'Start typing...' : 'View only'}
                            spellCheck={false}
                            className="w-full h-full bg-black text-white text-base font-mono leading-relaxed resize-none outline-none px-10 py-8 disabled:cursor-default placeholder:text-zinc-700"
                        />
                    </div>

                    <div className="border-t border-zinc-800 px-6 py-2 flex items-center justify-between">
            <span className="text-zinc-600 text-xs">
              {content.length} chars · {content.split(/\s+/).filter(Boolean).length} words
            </span>
                        <span className="text-zinc-700 text-xs">
              rev {revisionRef.current}
            </span>
                    </div>
                </div>

                {showVersions && (
                    <div className="w-72 border-l border-zinc-800 bg-zinc-950 flex flex-col">
                        <VersionHistoryPanel
                            documentId={documentId}
                            onRestore={handleRestoreVersion}
                            onClose={() => setShowVersions(false)}
                        />
                    </div>
                )}
            </div>

            {showShare && document && (
                <ShareModal
                    document={document}
                    onClose={() => setShowShare(false)}
                    onUpdate={setDocument}
                />
            )}
        </div>
    )
}