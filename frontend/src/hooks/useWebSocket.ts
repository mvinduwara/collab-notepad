import { useEffect, useRef, useCallback } from 'react'
import { Client, IMessage } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '../store/authStore'

interface UseWebSocketOptions {
    onOperation?: (msg: any) => void
    onCursor?: (msg: any) => void
    onPresence?: (msg: any) => void
    onSync?: (msg: any) => void
    onError?: (msg: any) => void
}

export function useWebSocket(documentId: number, options: UseWebSocketOptions) {
    const token = useAuthStore((s) => s.token)
    const clientRef = useRef<Client | null>(null)
    const connectedRef = useRef(false)

    const sendOperation = useCallback((payload: any) => {
        if (clientRef.current?.connected) {
            clientRef.current.publish({
                destination: '/app/document.operation',
                body: JSON.stringify(payload),
            })
        }
    }, [])

    const sendCursor = useCallback((payload: any) => {
        if (clientRef.current?.connected) {
            clientRef.current.publish({
                destination: '/app/document.cursor',
                body: JSON.stringify(payload),
            })
        }
    }, [])

    const sendJoin = useCallback((payload: any) => {
        if (clientRef.current?.connected) {
            clientRef.current.publish({
                destination: '/app/document.join',
                body: JSON.stringify(payload),
            })
        }
    }, [])

    const sendLeave = useCallback((payload: any) => {
        if (clientRef.current?.connected) {
            clientRef.current.publish({
                destination: '/app/document.leave',
                body: JSON.stringify(payload),
            })
        }
    }, [])

    useEffect(() => {
        if (!token) return

        const client = new Client({
            webSocketFactory: () => new SockJS('/ws'),
            connectHeaders: { Authorization: `Bearer ${token}` },
            reconnectDelay: 3000,

            onConnect: () => {
                connectedRef.current = true

                client.subscribe(`/topic/document.${documentId}.operations`, (msg: IMessage) => {
                    options.onOperation?.(JSON.parse(msg.body))
                })

                client.subscribe(`/topic/document.${documentId}.cursors`, (msg: IMessage) => {
                    options.onCursor?.(JSON.parse(msg.body))
                })

                client.subscribe(`/topic/document.${documentId}.presence`, (msg: IMessage) => {
                    options.onPresence?.(JSON.parse(msg.body))
                })

                client.subscribe('/user/queue/document.sync', (msg: IMessage) => {
                    options.onSync?.(JSON.parse(msg.body))
                })

                client.subscribe('/user/queue/errors', (msg: IMessage) => {
                    options.onError?.(JSON.parse(msg.body))
                })

                client.publish({
                    destination: '/app/document.join',
                    body: JSON.stringify({ documentId }),
                })
            },

            onDisconnect: () => {
                connectedRef.current = false
            },

            onStompError: (frame) => {
                console.error('STOMP error', frame)
            },
        })

        client.activate()
        clientRef.current = client

        return () => {
            if (client.connected) {
                client.publish({
                    destination: '/app/document.leave',
                    body: JSON.stringify({ documentId }),
                })
            }
            client.deactivate()
        }
    }, [documentId, token])

    return { sendOperation, sendCursor, sendJoin, sendLeave }
}