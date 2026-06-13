import api from './client'

export interface DocumentSummary {
    id: number
    title: string
    shareToken: string
    ownerUsername: string
    collaboratorCount: number
    createdAt: string
    updatedAt: string
}

export interface DocumentFull {
    id: number
    title: string
    content: string
    shareToken: string
    sharePermission: 'VIEW' | 'EDIT'
    owner: { id: number; username: string; color: string }
    collaborators: Collaborator[]
    createdAt: string
    updatedAt: string
}

export interface Collaborator {
    userId: number
    username: string
    color: string
    permission: 'VIEW' | 'EDIT'
    joinedAt: string
}

export interface Version {
    id: number
    versionNumber: number
    content: string
    savedByUsername: string
    createdAt: string
}

export const documentsApi = {
    list: () =>
        api.get<DocumentSummary[]>('/documents').then((r) => r.data),

    get: (id: number) =>
        api.get<DocumentFull>(`/documents/${id}`).then((r) => r.data),

    create: (data: { title: string; content?: string; sharePermission?: string }) =>
        api.post<DocumentFull>('/documents', data).then((r) => r.data),

    update: (id: number, data: Partial<{ title: string; content: string; sharePermission: string }>) =>
        api.put<DocumentFull>(`/documents/${id}`, data).then((r) => r.data),

    delete: (id: number) =>
        api.delete(`/documents/${id}`),

    getByShareToken: (token: string) =>
        api.get<DocumentFull>(`/documents/share/${token}`).then((r) => r.data),

    addCollaborator: (id: number, data: { usernameOrEmail: string; permission: string }) =>
        api.post<DocumentFull>(`/documents/${id}/collaborators`, data).then((r) => r.data),

    removeCollaborator: (id: number, userId: number) =>
        api.delete(`/documents/${id}/collaborators/${userId}`),

    saveVersion: (id: number) =>
        api.post(`/documents/${id}/versions`),

    getVersions: (id: number) =>
        api.get<Version[]>(`/documents/${id}/versions`).then((r) => r.data),

    restoreVersion: (id: number, versionNumber: number) =>
        api.post<DocumentFull>(`/documents/${id}/versions/${versionNumber}/restore`).then((r) => r.data),
}