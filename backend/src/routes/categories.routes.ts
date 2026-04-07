import { Router } from 'express';
import { mockDatabase } from '../config/mockDataBase';
import { authMiddleware, requireRole } from '../middleware/auth.middleware'; 

const router = Router();

router.get('/', authMiddleware, (req, res) => {
  try {
    res.json(mockDatabase.categorias);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' });
  }
});

router.post('/', authMiddleware, requireRole('ADMIN', 'GESTAO'), (req, res) => {
  try {
    const { nome, tipo, perecivel, prazo_alerta } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }

    const categorias = mockDatabase.categorias;
    const novoId = categorias.length > 0 
      ? Math.max(...categorias.map((c: any) => Number(c.id))) + 1 
      : 1;

    const novaCategoria = {
      id: novoId.toString(),
      nome,
      tipo,
      perecivel: !!perecivel,
      prazo_alerta: prazo_alerta !== undefined && prazo_alerta !== '' 
        ? Number(prazo_alerta) 
        : (perecivel ? 3 : 30)
    };

    mockDatabase.categorias.push(novaCategoria as any);
    res.status(201).json(novaCategoria);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

router.put('/:id', authMiddleware, requireRole('ADMIN', 'GESTAO'), (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo, perecivel, prazo_alerta } = req.body;

    const index = mockDatabase.categorias.findIndex((c: any) => c.id === id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    mockDatabase.categorias[index] = {
      ...mockDatabase.categorias[index],
      nome: nome || mockDatabase.categorias[index].nome,
      tipo: tipo || mockDatabase.categorias[index].tipo,
      perecivel: perecivel !== undefined ? !!perecivel : mockDatabase.categorias[index].perecivel,
      prazo_alerta: prazo_alerta !== undefined && prazo_alerta !== '' 
        ? Number(prazo_alerta) 
        : mockDatabase.categorias[index].prazo_alerta
    };

    res.json(mockDatabase.categorias[index]);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

export default router;