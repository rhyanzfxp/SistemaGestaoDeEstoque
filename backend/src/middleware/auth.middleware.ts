import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

type Perfil = 'ADMIN' | 'GESTAO'

interface JwtPayload {
  id: string
  perfil: Perfil
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido' })
  }

  const token = authHeader.substring(7)

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: 'Token inválido ou expirado' })
  }
}

export const requireRole = (...roles: Perfil[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Não autenticado' })
    }

    if (!roles.includes(req.user.perfil)) {
      return res.status(403).json({ error: 'Acesso negado: perfil sem permissão para esta operação' })
    }

    next()
  }
}


export const PERFIS_ESCRITA: Perfil[] = ['ADMIN', 'GESTAO']
export const PERFIS_ADMIN: Perfil[] = ['ADMIN', 'GESTAO']
export const PERFIS_LEITURA: Perfil[] = ['ADMIN', 'GESTAO']

