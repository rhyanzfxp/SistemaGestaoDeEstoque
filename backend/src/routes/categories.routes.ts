import { Router } from 'express';
import { supabase } from '../config/supabase';
import { authMiddleware, requireRole } from '../middleware/auth.middleware'; 

const router = Router();

router.get('/', authMiddleware, async (req, res) => {
  try {
    const { data: categorias, error } = await supabase
      .from('categorias')
      .select('*')
      .order('nome')

    if (error) throw error

    res.json(categorias)
  } catch (error) {
    res.status(500).json({ error: 'Erro ao buscar categorias' })
  }
});

router.post('/', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req, res) => {
  try {
    const { nome, tipo, perecivel, prazo_alerta } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }

    const { data: novaCategoria, error } = await supabase
      .from('categorias')
      .insert({
        nome,
        tipo,
        perecivel: !!perecivel,
        prazo_alerta: prazo_alerta !== undefined && prazo_alerta !== '' 
          ? Number(prazo_alerta) 
          : (perecivel ? 3 : 30)
      })
      .select()
      .single()

    if (error) throw error

    res.status(201).json(novaCategoria);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao criar categoria' });
  }
});

router.put('/:id', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, tipo, perecivel, prazo_alerta } = req.body;

    const updateData: any = {}
    if (nome) updateData.nome = nome
    if (tipo) updateData.tipo = tipo
    if (perecivel !== undefined) updateData.perecivel = !!perecivel
    if (prazo_alerta !== undefined && prazo_alerta !== '') updateData.prazo_alerta = Number(prazo_alerta)

    const { data: categoriaAtualizada, error } = await supabase
      .from('categorias')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    if (!categoriaAtualizada) {
      return res.status(404).json({ error: 'Categoria não encontrada' });
    }

    res.json(categoriaAtualizada);
  } catch (error) {
    res.status(500).json({ error: 'Erro ao atualizar categoria' });
  }
});

export default router;