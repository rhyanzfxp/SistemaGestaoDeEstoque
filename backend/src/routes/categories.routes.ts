import { Router, Request, Response } from 'express';
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
    const { nome, tipo, perecivel } = req.body;

    if (!nome || !tipo) {
      return res.status(400).json({ error: 'Nome e tipo são obrigatórios' });
    }

    const { data: novaCategoria, error } = await supabase
      .from('categorias')
      .insert({
        nome,
        tipo,
        perecivel: !!perecivel
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
    const { nome, tipo, perecivel } = req.body;

    const updateData: any = {}
    if (nome) updateData.nome = nome
    if (tipo) updateData.tipo = tipo
    if (perecivel !== undefined) updateData.perecivel = !!perecivel

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

router.delete('/:id', authMiddleware, requireRole('ADMIN', 'GESTAO'), async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    console.log('DELETE recebido para ID:', id);

    const { data: produtos } = await supabase
      .from('produtos')
      .select('id')
      .eq('categoria_id', id)
      .limit(1);

    if (produtos && produtos.length > 0) {
      return res.status(400).json({ 
        error: 'Não é possível excluir esta categoria pois existem produtos vinculados a ela' 
      });
    }

    const { error } = await supabase
      .from('categorias')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro Supabase:', error);
      throw error;
    }

    console.log('Categoria excluída com sucesso');
    res.json({ message: 'Categoria excluída com sucesso' });
  } catch (error: any) {
    console.error('Erro ao excluir categoria:', error);
    res.status(500).json({ error: error.message || 'Erro ao excluir categoria' });
  }
});

export default router;