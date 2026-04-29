import { useEffect, useRef } from 'react'
import { io, Socket } from 'socket.io-client'

export function useRealtime(event: string, callback: () => void) {
  const socketRef = useRef<Socket | null>(null)
  

  const callbackRef = useRef(callback)
  
  useEffect(() => {
    callbackRef.current = callback
  }, [callback])

  useEffect(() => {

    socketRef.current = io('/', {
      path: '/socket.io'
    })

    const handleEvent = () => {
      console.log(`[Realtime] Evento recebido: ${event}`)
      callbackRef.current()
    }

    socketRef.current.on(event, handleEvent)

    return () => {
      if (socketRef.current) {
        socketRef.current.off(event, handleEvent)
        socketRef.current.disconnect()
      }
    }
  }, [event])
}
