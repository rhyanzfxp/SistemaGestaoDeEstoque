import { Server } from 'socket.io'
import { Server as HttpServer } from 'http'

let io: Server | null = null

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*', // Na produção, restrinja isso para o domínio do frontend
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH']
    }
  })

  io.on('connection', (socket) => {
    console.log(`Cliente conectado via Socket.IO: ${socket.id}`)

    socket.on('disconnect', () => {
      console.log(`Cliente desconectado: ${socket.id}`)
    })
  })

  return io
}

export const getIO = (): Server => {
  if (!io) {
    console.warn('Socket.IO não inicializado!')
    return { emit: () => {} } as unknown as Server
  }
  return io
}
