import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import dashboardRoutes from './routes/dashboard.routes'
import usersRoutes from './routes/users.routes'
import { initializeMockData } from './config/mockDataBase'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', usersRoutes)

initializeMockData()

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Mock data initialized')
})
