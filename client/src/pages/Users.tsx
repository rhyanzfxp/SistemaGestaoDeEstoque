import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Users as UsersIcon, Plus, Edit2, Trash2, X, Check, AlertCircle, RefreshCw } from 'lucide-react'

interface User {
  id: string
  nome: string
  email: string
  perfil: 'ADMIN' | 'GESTAO'
  ativo: boolean
  created_at?: string
}

interface FormData {
  nome: string
  email: string
  password: string
  perfil: 'ADMIN' | 'GESTAO'
}

export default function Users() {
  const { token, user } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [formData, setFormData] = useState<FormData>({
    nome: '',
    email: '',
    password: '',
    perfil: 'GESTAO'
  })

  // Check if user is ADMIN
  const isAdmin = user?.perfil === 'ADMIN'

  // Fetch users
  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Erro ao buscar usuários')
      const data = await response.json()
      setUsers(data)
    } catch (err) {
      setError('Erro ao carregar usuários')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (isAdmin) {
      fetchUsers()
    }
  }, [token, isAdmin])

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (!formData.nome || !formData.email || (!editingId && !formData.password)) {
        setError('Preencha todos os campos obrigatórios')
        return
      }

      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/users/${editingId}` : '/api/users'
      const body = editingId
        ? { nome: formData.nome, email: formData.email, perfil: formData.perfil }
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na operação')
      }

      setSuccess(editingId ? 'Usuário atualizado com sucesso!' : 'Usuário criado com sucesso!')
      setFormData({ nome: '', email: '', password: '', perfil: 'GESTAO' })
      setEditingId(null)
      setShowModal(false)
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar usuário')
    }
  }

  // Handle edit
  const handleEdit = (u: User) => {
    setFormData({
      nome: u.nome,
      email: u.email,
      password: '',
      perfil: u.perfil
    })
    setEditingId(u.id)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja deletar este usuário?')) return

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erro ao deletar')

      setSuccess('Usuário deletado com sucesso!')
      fetchUsers()
    } catch (err: any) {
      setError(err.message || 'Erro ao deletar usuário')
    }
  }

  // Close modal
  const closeModal = () => {
    setShowModal(false)
    setEditingId(null)
    setFormData({ nome: '', email: '', password: '', perfil: 'GESTAO' })
    setError('')
    setSuccess('')
  }

  if (!isAdmin) {
    return (
      <div className="users-access-denied">
        <style>{usersStyles}</style>
        <div className="users-denied-content">
          <AlertCircle size={48} color="#f59e0b" />
          <h2>Acesso Negado</h2>
          <p>Apenas administradores podem gerenciar usuários</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="users-loading">
        <style>{usersStyles}</style>
        <RefreshCw size={32} color="#3b82f6" className="users-spinner" />
        <p>Carregando usuários...</p>
      </div>
    )
  }

  return (
    <>
      <style>{usersStyles}</style>
      <div className="users-root">
        <div className="users-header">
          <div>
            <h1 className="users-title">Gerenciar Usuários</h1>
            <p className="users-subtitle">Criar, editar e deletar usuários do sistema</p>
          </div>
          <button
            onClick={() => {
              setEditingId(null)
              setFormData({ nome: '', email: '', password: '', perfil: 'GESTAO' })
              setError('')
              setSuccess('')
              setShowModal(true)
            }}
            className="users-btn-create"
          >
            <Plus size={18} />
            Novo Usuário
          </button>
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="users-message users-message--success">
            <Check size={18} />
            {success}
          </div>
        )}
        {error && (
          <div className="users-message users-message--error">
            <AlertCircle size={18} />
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="users-table-wrapper">
          {users.length > 0 ? (
            <table className="users-table">
              <thead>
                <tr>
                  <th>Nome</th>
                  <th>E-mail</th>
                  <th>Perfil</th>
                  <th>Status</th>
                  <th>Data Criação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="users-table__row">
                    <td className="users-table__cell">
                      <span className="users-name">{u.nome}</span>
                    </td>
                    <td className="users-table__cell">{u.email}</td>
                    <td className="users-table__cell">
                      <span
                        className={`users-badge users-badge--${u.perfil.toLowerCase()}`}
                      >
                        {u.perfil === 'ADMIN' ? 'Administrador' : 'Gestão'}
                      </span>
                    </td>
                    <td className="users-table__cell">
                      <span className={`users-status ${u.ativo ? 'users-status--active' : 'users-status--inactive'}`}>
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="users-table__cell users-text-muted">
                      {u.created_at
                        ? new Date(u.created_at).toLocaleDateString('pt-BR')
                        : '-'}
                    </td>
                    <td className="users-table__cell users-actions">
                      <button
                        onClick={() => handleEdit(u)}
                        className="users-action-btn users-action-btn--edit"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(u.id)}
                        className="users-action-btn users-action-btn--delete"
                        title="Deletar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="users-empty">
              <UsersIcon size={48} color="#94a3b8" />
              <p className="users-empty-title">Nenhum usuário cadastrado</p>
              <p className="users-empty-sub">Clique em "Novo Usuário" para criar um</p>
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="users-modal-overlay" onClick={closeModal}>
            <div className="users-modal" onClick={(e) => e.stopPropagation()}>
              <div className="users-modal__header">
                <h2>{editingId ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                <button onClick={closeModal} className="users-modal__close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="users-form">
                <div className="users-form__group">
                  <label>Nome *</label>
                  <input
                    type="text"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    placeholder="Digite o nome completo"
                    className="users-input"
                  />
                </div>

                <div className="users-form__group">
                  <label>E-mail *</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="Digite o e-mail"
                    className="users-input"
                  />
                </div>

                {!editingId && (
                  <div className="users-form__group">
                    <label>Senha *</label>
                    <input
                      type="password"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="Digite a senha"
                      className="users-input"
                    />
                  </div>
                )}

                <div className="users-form__group">
                  <label>Perfil *</label>
                  <select
                    value={formData.perfil}
                    onChange={(e) => setFormData({ ...formData, perfil: e.target.value as 'ADMIN' | 'GESTAO' })}
                    className="users-input"
                  >
                    <option value="GESTAO">Gestão</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                </div>

                <div className="users-form__actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="users-btn-cancel"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="users-btn-submit"
                  >
                    {editingId ? 'Atualizar' : 'Criar'} Usuário
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  )
}

const usersStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .users-root {
    flex: 1;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #dbeafe 100%);
    position: relative;
    overflow-x: hidden;
    font-family: 'DM Sans', sans-serif;
    padding: 36px 28px;
  }

  .users-loading, .users-access-denied {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #dbeafe 100%);
    gap: 16px;
    color: #64748b;
  }

  .users-spinner {
    animation: users-spin 1.1s linear infinite;
  }

  @keyframes users-spin {
    to { transform: rotate(360deg); }
  }

  .users-denied-content {
    text-align: center;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .users-denied-content h2 {
    font-family: 'Sora', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    margin: 8px 0 0;
  }

  .users-denied-content p {
    font-size: 14px;
    color: #64748b;
  }

  .users-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }

  .users-title {
    font-family: 'Sora', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }

  .users-subtitle {
    font-size: 14px;
    color: #64748b;
  }

  .users-btn-create {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.18s, transform 0.15s;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
  }

  .users-btn-create:hover {
    opacity: 0.88;
    transform: translateY(-2px);
  }

  .users-message {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 500;
    animation: users-slideDown 0.3s ease;
  }

  @keyframes users-slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .users-message--success {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .users-message--error {
    background: rgba(244, 63, 94, 0.12);
    color: #be123c;
    border: 1px solid rgba(244, 63, 94, 0.2);
  }

  .users-table-wrapper {
    background: #ffffff;
    border: 1px solid rgba(59, 130, 246, 0.15);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  }

  .users-table {
    width: 100%;
    border-collapse: collapse;
  }

  .users-table thead {
    background: rgba(59, 130, 246, 0.08);
    border-bottom: 1px solid rgba(59, 130, 246, 0.15);
  }

  .users-table th {
    padding: 16px 18px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .users-table__row {
    border-bottom: 1px solid rgba(59, 130, 246, 0.08);
    transition: background 0.15s;
  }

  .users-table__row:hover {
    background: rgba(59, 130, 246, 0.04);
  }

  .users-table__cell {
    padding: 16px 18px;
    font-size: 14px;
    color: #0f172a;
  }

  .users-name {
    font-weight: 600;
    color: #0f172a;
  }

  .users-text-muted {
    color: #64748b;
  }

  .users-badge {
    display: inline-block;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
  }

  .users-badge--admin {
    background: rgba(59, 130, 246, 0.15);
    color: #1e40af;
  }

  .users-badge--gestao {
    background: rgba(16, 185, 129, 0.15);
    color: #059669;
  }

  .users-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
  }

  .users-status--active {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
  }

  .users-status--active::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
  }

  .users-status--inactive {
    background: rgba(148, 163, 184, 0.12);
    color: #64748b;
  }

  .users-status--inactive::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #94a3b8;
  }

  .users-actions {
    display: flex;
    gap: 8px;
  }

  .users-action-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.18s, background 0.18s;
    flex-shrink: 0;
  }

  .users-action-btn--edit {
    background: rgba(59, 130, 246, 0.12);
    color: #2563eb;
  }

  .users-action-btn--edit:hover {
    background: rgba(59, 130, 246, 0.2);
  }

  .users-action-btn--delete {
    background: rgba(244, 63, 94, 0.12);
    color: #dc2626;
  }

  .users-action-btn--delete:hover {
    background: rgba(244, 63, 94, 0.2);
  }

  .users-empty {
    text-align: center;
    padding: 80px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .users-empty-title {
    font-size: 16px;
    font-weight: 600;
    color: #64748b;
    margin-top: 16px;
  }

  .users-empty-sub {
    font-size: 13px;
    color: #94a3b8;
  }

  /* Modal Styles */
  .users-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: users-fadeIn 0.2s ease;
  }

  @keyframes users-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .users-modal {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 480px;
    width: 90%;
    animation: users-slideUp 0.3s ease;
  }

  @keyframes users-slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .users-modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  }

  .users-modal__header h2 {
    font-family: 'Sora', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
  }

  .users-modal__close {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background 0.15s;
    color: #64748b;
  }

  .users-modal__close:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .users-form {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .users-form__group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .users-form__group label {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }

  .users-input {
    padding: 11px 14px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #0f172a;
    transition: border-color 0.15s, background 0.15s;
    background: #f8fafc;
  }

  .users-input:focus {
    outline: none;
    border-color: #2563eb;
    background: #ffffff;
  }

  .users-form__actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  .users-btn-cancel {
    flex: 1;
    padding: 11px 16px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 10px;
    background: transparent;
    color: #475569;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .users-btn-cancel:hover {
    opacity: 0.7;
  }

  .users-btn-submit {
    flex: 1;
    padding: 11px 16px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #ffffff;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .users-btn-submit:hover {
    opacity: 0.88;
  }

  @media (max-width: 640px) {
    .users-root {
      padding: 20px 16px;
    }

    .users-header {
      flex-direction: column;
    }

    .users-title {
      font-size: 24px;
    }

    .users-table {
      font-size: 12px;
    }

    .users-table th, .users-table__cell {
      padding: 12px 10px;
    }

    .users-modal {
      width: 95%;
    }
  }
`
