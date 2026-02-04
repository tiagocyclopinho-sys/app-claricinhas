import React, { useState } from 'react'
import { Users, UserPlus, Phone, Star, Trash2, X, Search, MessageSquare, BookOpen, Edit2 } from 'lucide-react'
import './Clientes.css'

function Clientes({ clientes, onAdd, onDelete, onUpdate }) {
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [editingId, setEditingId] = useState(null)
    const [formData, setFormData] = useState({
        nome: '',
        telefone: '',
        vip: false
    })

    const filteredClientes = clientes.filter(c =>
        c.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.telefone.includes(searchTerm)
    )

    const handleSubmit = (e) => {
        e.preventDefault()
        if (editingId) {
            onUpdate(editingId, formData)
        } else {
            onAdd(formData)
        }
        handleCloseModal()
    }

    const handleEdit = (cliente) => {
        setEditingId(cliente.id)
        setFormData({
            nome: cliente.nome,
            telefone: cliente.telefone,
            vip: cliente.vip
        })
        setShowModal(true)
    }

    const handleCloseModal = () => {
        setShowModal(false)
        setEditingId(null)
        setFormData({ nome: '', telefone: '', vip: false })
    }

    const handleImportContacts = async () => {
        const supported = 'contacts' in navigator && 'ContactsManager' in window
        if (!supported) {
            alert('A importação de contatos não é suportada neste navegador ou dispositivo. Tente usar no navegador do celular (Chrome/Safari).')
            return
        }

        try {
            const props = ['name', 'tel']
            const options = { multiple: true }
            const contacts = await navigator.contacts.select(props, options)

            if (contacts.length > 0) {
                contacts.forEach(contact => {
                    const nome = contact.name && contact.name[0] ? contact.name[0] : 'Contato Sem Nome'
                    const telefone = contact.tel && contact.tel[0] ? contact.tel[0] : ''

                    // Limpar telefone para o formato do sistema (opcional, mas recomendado)
                    // Remove caracteres não numéricos exceto talvez o +
                    const telLimpo = telefone.replace(/[^\d+]/g, '')

                    onAdd({
                        nome,
                        telefone: telLimpo,
                        vip: false
                    })
                })
                alert(`${contacts.length} contato(s) importado(s) com sucesso!`)
            }
        } catch (err) {
            if (err.name !== 'AbortError') {
                console.error('Erro ao importar contatos:', err)
                alert('Erro ao acessar contatos. Certifique-se de dar as permissões necessárias.')
            }
        }
    }

    return (
        <div className="clientes-page">
            <header className="page-header">
                <h1>Clientes</h1>
                <div className="header-actions" style={{ display: 'flex', gap: '10px' }}>
                    {('contacts' in navigator) && (
                        <button className="secondary-btn" onClick={handleImportContacts} title="Importar da agenda do celular">
                            <BookOpen size={20} /> Importar Agenda
                        </button>
                    )}
                    <button className="add-btn" onClick={() => { setEditingId(null); setShowModal(true); }}>
                        <UserPlus size={20} /> Novo Cliente
                    </button>
                </div>
            </header>

            <div className="filters-bar glass-card">
                <div className="search-group">
                    <Search size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por nome ou telefone..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="table-container glass-card">
                <table>
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Telefone</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredClientes.map(cliente => (
                            <tr key={cliente.id}>
                                <td className="client-name">
                                    {cliente.nome}
                                    {cliente.vip && <Star size={14} fill="var(--accent)" color="var(--accent)" style={{ marginLeft: '8px' }} />}
                                </td>
                                <td>{cliente.telefone}</td>
                                <td>
                                    <span className={`badge ${cliente.vip ? 'vip' : 'basic'}`}>
                                        {cliente.vip ? 'Cliente VIP' : 'Normal'}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            className="action-table-btn edit"
                                            onClick={() => onUpdate(cliente.id, { vip: !cliente.vip })}
                                            title={cliente.vip ? "Remover VIP" : "Tornar VIP"}
                                            style={{ background: cliente.vip ? 'rgba(250, 176, 5, 0.2)' : 'rgba(255, 255, 255, 0.05)', color: cliente.vip ? 'var(--accent)' : 'var(--text-dim)' }}
                                        >
                                            <Star size={18} fill={cliente.vip ? "var(--accent)" : "none"} />
                                        </button>
                                        <button
                                            className="action-table-btn edit"
                                            onClick={() => handleEdit(cliente)}
                                            title="Editar Cliente"
                                            style={{ background: 'rgba(77, 171, 247, 0.1)', color: 'var(--secondary)' }}
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            className="action-table-btn whatsapp"
                                            onClick={() => {
                                                const tel = cliente.telefone.replace(/\D/g, '')
                                                window.open(`https://wa.me/55${tel}`, '_blank')
                                            }}
                                            title="Chamar no WhatsApp"
                                        >
                                            <MessageSquare size={18} />
                                        </button>
                                        <button className="delete-table-btn" onClick={() => onDelete(cliente.id)} title="Excluir">
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card">
                        <div className="modal-header">
                            <h2>{editingId ? 'Editar Cliente' : 'Novo Cliente'}</h2>
                            <button onClick={handleCloseModal}><X /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Telefone</label>
                                <input
                                    type="tel"
                                    placeholder="(00) 00000-0000"
                                    required
                                    value={formData.telefone}
                                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                                />
                            </div>
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    id="vip-check"
                                    checked={formData.vip}
                                    onChange={(e) => setFormData({ ...formData, vip: e.target.checked })}
                                />
                                <label htmlFor="vip-check">Marcar como Cliente VIP</label>
                            </div>
                            <button type="submit" className="submit-btn">
                                {editingId ? 'Salvar Alterações' : 'Salvar Cliente'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Clientes
