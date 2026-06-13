import { create } from 'zustand'
import { DocumentSummary, DocumentFull } from '../api/documents'

interface DocumentState {
    documents: DocumentSummary[]
    currentDocument: DocumentFull | null
    loading: boolean
    error: string | null
    setDocuments: (docs: DocumentSummary[]) => void
    setCurrentDocument: (doc: DocumentFull | null) => void
    addDocument: (doc: DocumentSummary) => void
    removeDocument: (id: number) => void
    updateDocumentInList: (id: number, updates: Partial<DocumentSummary>) => void
    setLoading: (loading: boolean) => void
    setError: (error: string | null) => void
}

export const useDocumentStore = create<DocumentState>((set) => ({
    documents: [],
    currentDocument: null,
    loading: false,
    error: null,

    setDocuments: (documents) => set({ documents }),
    setCurrentDocument: (doc) => set({ currentDocument: doc }),

    addDocument: (doc) =>
        set((state) => ({ documents: [doc, ...state.documents] })),

    removeDocument: (id) =>
        set((state) => ({
            documents: state.documents.filter((d) => d.id !== id),
        })),

    updateDocumentInList: (id, updates) =>
        set((state) => ({
            documents: state.documents.map((d) =>
                d.id === id ? { ...d, ...updates } : d
            ),
        })),

    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),
}))