import { useEffect } from 'react'
import { documentsApi } from '../api/documents'
import { useDocumentStore } from '../store/documentStore'

export function useDocuments() {
    const {
        documents,
        loading,
        error,
        setDocuments,
        setLoading,
        setError,
        addDocument,
        removeDocument,
    } = useDocumentStore()

    const fetchDocuments = async () => {
        setLoading(true)
        setError(null)
        try {
            const data = await documentsApi.list()
            setDocuments(data)
        } catch {
            setError('Failed to load documents')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchDocuments()
    }, [])

    const createDocument = async (title: string) => {
        const doc = await documentsApi.create({ title })
        addDocument({
            id: doc.id,
            title: doc.title,
            shareToken: doc.shareToken,
            ownerUsername: doc.owner.username,
            collaboratorCount: doc.collaborators.length,
            createdAt: doc.createdAt,
            updatedAt: doc.updatedAt,
        })
        return doc
    }

    const deleteDocument = async (id: number) => {
        await documentsApi.delete(id)
        removeDocument(id)
    }

    return { documents, loading, error, createDocument, deleteDocument, fetchDocuments }
}