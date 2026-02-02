import React, { useState, useMemo } from 'react'
import { Scissors, Plus, Filter, Search, X, Image as ImageIcon, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import './Producao.css'

function Producao({ producao, onAdd, onDelete }) {
    const [showModal, setShowModal] = useState(false)
    const [filterTipo, setFilterTipo] = useState('todos')

    const [formData, setFormData] = useState({
        nome: '',
        tipo: 'Facção própria',
        quantidade: '',
        tamanho: 'M',
        valorUnitario: '',
        imagem: null,
        dataCriacao: format(new Date(), 'yyyy-MM-dd')
    })

    const filteredItems = useMemo(() => {
        let list = producao
        if (filterTipo !== 'todos') {
            list = list.filter(p => p.tipo === filterTipo)
        }
        return list
    }, [producao, filterTipo])

    const totalCost = useMemo(() => {
        return filteredItems.reduce((acc, curr) => acc + (Number(curr.quantidade) * Number(curr.valorUnitario)), 0)
    }, [filteredItems])

    const handleSubmit = (e) => {
        e.preventDefault()
        const newItem = {
            ...formData,
            valorTotal: (Number(formData.quantidade) * Number(formData.valorUnitario)).toFixed(2)
        }
        onAdd(newItem)
        setShowModal(false)
        setFormData({
            nome: '',
            tipo: 'Facção própria',
            quantidade: '',
            tamanho: 'M',
            valorUnitario: '',
            imagem: null,
            dataCriacao: format(new Date(), 'yyyy-MM-dd')
        })
    }

    const handleImageChange = (e) => {
        const file = e.target.files[0]
        if (file) {
            const reader = new FileReader()
            reader.onloadend = () => {
                setFormData({ ...formData, imagem: reader.result })
            }
            reader.readAsDataURL(file)
        }
    }

    return (
        <div className="producao-page">
            <header className="page-header">
                <h1>Controle de Produção</h1>
                <button className="add-btn" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Adicionar Item
                </button>
            </header>

            <div className="filters-bar glass-card">
                <div className="filter-group">
                    <label>Tipo:</label>
                    <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="Facção própria">Facção própria</option>
                        <option value="Compra externa">Compra externa</option>
                    </select>
                </div>
                <div className="total-badge">
                    <span>Custo Total:</span>
                    <strong>R$ {totalCost.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
            </div>

            <div className="items-grid">
                {filteredItems.length > 0 ? (
                    filteredItems.map(item => (
                        <div key={item.id} className="product-card glass-card">
                            <div className="product-img">
                                {item.imagem ? <img src={item.imagem} alt={item.nome} /> : <div className="img-placeholder"><ImageIcon size={40} /></div>}
                                <span className={`type-badge ${item.tipo === 'Facção própria' ? 'factory' : 'external'}`}>
                                    {item.tipo}
                                </span>
                            </div>
                            <div className="product-info">
                                <div className="p-header">
                                    <h3>{item.nome}</h3>
                                    <button className="delete-card-btn" onClick={() => onDelete(item.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <p className="product-details">{item.tamanho} • {item.quantidade} unidades</p>
                                <div className="product-price">
                                    <span className="unit-price">R$ {Number(item.valorUnitario).toFixed(2)} un.</span>
                                    <span className="total-price">R$ {Number(item.valorTotal).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <p className="empty-msg">Nenhum item em produção.</p>
                )}
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card">
                        <div className="modal-header">
                            <h2>Novo Item em Produção</h2>
                            <button onClick={() => setShowModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Nome do Item</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nome}
                                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: T-shirt Algodão Branca"
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tipo de Produção</label>
                                    <select
                                        value={formData.tipo}
                                        onChange={(e) => setFormData({ ...formData, tipo: e.target.value })}
                                    >
                                        <option value="Facção própria">Facção própria</option>
                                        <option value="Compra externa">Compra externa</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Tamanho</label>
                                    <select
                                        value={formData.tamanho}
                                        onChange={(e) => setFormData({ ...formData, tamanho: e.target.value })}
                                    >
                                        <option value="P">P</option>
                                        <option value="M">M</option>
                                        <option value="G">G</option>
                                        <option value="GG">GG</option>
                                        <option value="UNICO">UNICO</option>
                                        <option value="INF P">INF P</option>
                                        <option value="INF M">INF M</option>
                                        <option value="INF G">INF G</option>
                                        <option value="INF GG">INF GG</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Quantidade</label>
                                    <input
                                        type="number"
                                        required
                                        value={formData.quantidade}
                                        onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Valor Unitário</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.valorUnitario}
                                        onChange={(e) => setFormData({ ...formData, valorUnitario: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Imagem do Produto</label>
                                <div className="file-input-wrapper">
                                    <input type="file" accept="image/*" onChange={handleImageChange} id="img-input" />
                                    <label htmlFor="img-input" className="file-label">
                                        <ImageIcon size={18} /> {formData.imagem ? 'Trocar Imagem' : 'Selecionar Foto'}
                                    </label>
                                    {formData.imagem && <img src={formData.imagem} className="preview-small" />}
                                </div>
                            </div>

                            <div className="cost-preview">
                                Custo Total Estimado: <span>R$ {(Number(formData.quantidade || 0) * Number(formData.valorUnitario || 0)).toFixed(2)}</span>
                            </div>

                            <button type="submit" className="submit-btn">Adicionar à Produção</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Producao
