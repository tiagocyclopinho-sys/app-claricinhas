import React, { useState } from 'react'
import { Users, UserPlus, Phone, Star, Trash2, X, Search, MessageSquare } from 'lucide-react'
import './Clientes.css'

function Clientes({ clientes, onAdd, onDelete }) {
    const [showModal, setShowModal] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
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
        onAdd(formData)
        setShowModal(false)
        setFormData({ nome: '', telefone: '', vip: false })
    }

    return (
        <div className="clientes-page">
            <header className="page-header">
                <h1>Clientes</h1>
                <button className="add-btn" onClick={() => setShowModal(true)}>
                    <UserPlus size={20} /> Novo Cliente
                </button>
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
                            <h2>Novo Cliente</h2>
                            <button onClick={() => setShowModal(false)}><X /></button>
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
                            <button type="submit" className="submit-btn">Salvar Cliente</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Clientes
