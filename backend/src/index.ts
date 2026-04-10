import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import authRoutes from './routes/auth.routes'
import dashboardRoutes from './routes/dashboard.routes'
import usersRoutes from './routes/users.routes'
import productsRoutes from './routes/products.routes'
import categoriesRoutes from './routes/categories.routes'
import fornecedoresRoutes from './routes/fornecedores.routes'
import movimentacoesRoutes from './routes/movimentacoes.routes'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

app.use('/api/auth', authRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/users', usersRoutes)
app.use('/api/produtos', productsRoutes)
app.use('/api/categories', categoriesRoutes)
app.use('/api/fornecedores', fornecedoresRoutes)
app.use('/api/movimentacoes', movimentacoesRoutes)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log('Connected to Supabase')
})
