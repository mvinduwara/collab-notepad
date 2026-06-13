import api from './client'

export interface RegisterPayload {
    username: string
    email: string
    password: string
}

export interface LoginPayload {
    email: string
    password: string
}

export interface AuthResponse {
    token: string
    username: string
    email: string
    userId: number
    color: string
}

export const authApi = {
    register: (data: RegisterPayload) =>
        api.post<AuthResponse>('/auth/register', data).then((r) => r.data),

    login: (data: LoginPayload) =>
        api.post<AuthResponse>('/auth/login', data).then((r) => r.data),
}