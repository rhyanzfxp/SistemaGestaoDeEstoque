import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import http from 'http'
import authRoutes from './routes/auth.routes'
import dashboardRoutes from './routes/dashboard.routes'
import usersRoutes from './routes/users.routes'
import productsRoutes from './routes/products.routes'
import categoriesRoutes from './routes/categories.routes'
import movimentacoesRoutes from './routes/movimentacoes.routes'
import alertasRoutes, { runEstoqueMinimoJob, runVencimentoJob } from './routes/alertas.routes'
import relatoriosRoutes from './routes/relatorios.routes'
import { initSocket } from './utils/socket'

dotenv.config()

const app = express()
const server = http.createServer(app)
const PORT = process.env.PORT || 3000

initSocket(server)

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/produtos', productsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/movimentacoes', movimentacoesRoutes)
app.use('/api/alertas', alertasRoutes)
app.use('/api/relatorios', relatoriosRoutes)

const HORA_EM_MS = 60 * 60 * 1000

async function iniciarJobs() {
  await runEstoqueMinimoJob()
  await runVencimentoJob()

  setInterval(runEstoqueMinimoJob, HORA_EM_MS)
  setInterval(runVencimentoJob, HORA_EM_MS)

  console.log('[CronJob] Jobs de alerta iniciados (intervalo: 1h)')
}

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Connected to Supabase')
  iniciarJobs()
})
