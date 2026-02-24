import React, { useState, useMemo } from 'react'
import { Scissors, Plus, Filter, Search, X, Image as ImageIcon, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import './Producao.css'

function Producao({ producao, onAdd, onDelete, onUpdate }) {
    const [showModal, setShowModal] = useState(false)
    const [showUpdateModal, setShowUpdateModal] = useState(false)
    const [selectedItem, setSelectedItem] = useState(null)
    const [addQty, setAddQty] = useState('')
    const [filterTipo, setFilterTipo] = useState('todos')
    const [filterTamanho, setFilterTamanho] = useState('todos')
    const [isSubmitting, setIsSubmitting] = useState(false)

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
        if (filterTamanho !== 'todos') {
            list = list.filter(p => p.tamanho === filterTamanho)
        }
        return list
    }, [producao, filterTipo, filterTamanho])

    const totalCost = useMemo(() => {
        return filteredItems.reduce((acc, curr) => acc + (Number(curr.quantidade) * Number(curr.valorUnitario)), 0)
    }, [filteredItems])

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsSubmitting(true)
        try {
            const newItem = {
                ...formData,
                valorTotal: (Number(formData.quantidade) * Number(formData.valorUnitario)).toFixed(2)
            }
            await onAdd(newItem)
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
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
    }

    const handleUpdateQty = async (e) => {
        e.preventDefault()
        if (!selectedItem || !addQty) return

        setIsSubmitting(true)
        try {
            const currentQty = Number(selectedItem.quantidade)
            const addedQty = Number(addQty)
            const newQty = currentQty + addedQty
            const unitPrice = Number(selectedItem.valorUnitario)
            const newTotal = (newQty * unitPrice).toFixed(2)

            await onUpdate(selectedItem.id, {
                quantidade: newQty,
                valor_total: newTotal
            })

            setShowUpdateModal(false)
            setSelectedItem(null)
            setAddQty('')
        } catch (error) {
            console.error(error)
        } finally {
            setIsSubmitting(false)
        }
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

    const uniqueTamanhos = useMemo(() => {
        const sizes = producao.map(p => p.tamanho)
        return ['todos', ...new Set(sizes)]
    }, [producao])

    return (
        <div className="producao-page">
            <header className="page-header">
                <h1>Facção / Compra</h1>
                <div className="header-actions">
                    <button className="secondary-btn" onClick={() => {
                        setSelectedItem(null)
                        setShowUpdateModal(true)
                    }}>
                        <Plus size={18} /> Somar Qtd
                    </button>
                    <button className="add-btn" onClick={() => setShowModal(true)}>
                        <Plus size={20} /> Adicionar Novo
                    </button>
                </div>
            </header>

            <div className="filters-bar glass-card">
                <div className="filters-row">
                    <div className="filter-group">
                        <label>Tipo:</label>
                        <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)}>
                            <option value="todos">Todos</option>
                            <option value="Facção própria">Facção própria</option>
                            <option value="Compra externa">Compra externa</option>
                        </select>
                    </div>
                    <div className="filter-group">
                        <label>Tamanho:</label>
                        <select value={filterTamanho} onChange={(e) => setFilterTamanho(e.target.value)}>
                            {uniqueTamanhos.map(size => (
                                <option key={size} value={size}>{size === 'todos' ? 'Todos' : size}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="total-badge">
                    <span>Valor em Estoque:</span>
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
                                <button className="delete-card-btn mini-delete" onClick={() => onDelete(item.id)}>
                                    <Trash2 size={14} />
                                </button>
                            </div>
                            <div className="product-info">
                                <div className="p-header">
                                    <h3>{item.nome}</h3>
                                    <span className="size-label">{item.tamanho}</span>
                                </div>
                                <p className="product-details">{item.quantidade} unidades em estoque</p>
                                <div className="product-price">
                                    <div className="price-info">
                                        <span className="unit-price">R$ {Number(item.valorUnitario).toFixed(2)} un.</span>
                                        <span className="total-price">R$ {Number(item.valorTotal).toFixed(2)}</span>
                                    </div>
                                    <button className="add-qty-btn-action" onClick={() => {
                                        setSelectedItem(item)
                                        setShowUpdateModal(true)
                                    }}>
                                        <Plus size={16} /> Somar
                                    </button>
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
                                Valor em Estoque: <span>R$ {(Number(formData.quantidade || 0) * Number(formData.valorUnitario || 0)).toFixed(2)}</span>
                            </div>

                            <button type="submit" className="submit-btn" disabled={isSubmitting}>
                                {isSubmitting ? 'Salvando...' : 'Adicionar à Produção'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {showUpdateModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card mini-modal">
                        <div className="modal-header">
                            <h2>Adicionar Unidades</h2>
                            <button onClick={() => {
                                setShowUpdateModal(false)
                                setSelectedItem(null)
                                setAddQty('')
                            }}><X /></button>
                        </div>

                        <form onSubmit={handleUpdateQty}>
                            {!selectedItem ? (
                                <div className="form-group">
                                    <label>Escolher Peça Existente</label>
                                    <select
                                        required
                                        onChange={(e) => setSelectedItem(producao.find(p => p.id.toString() === e.target.value))}
                                        value={selectedItem?.id || ''}
                                    >
                                        <option value="">Selecione a peça...</option>
                                        {producao.map(p => (
                                            <option key={p.id} value={p.id}>{p.nome} ({p.tamanho}) - Atual: {p.quantidade}</option>
                                        ))}
                                    </select>
                                </div>
                            ) : (
                                <p className="update-item-name">{selectedItem.nome} ({selectedItem.tamanho})</p>
                            )}

                            <div className="form-group">
                                <label>Quantidade para somar</label>
                                <input
                                    type="number"
                                    required
                                    autoFocus
                                    value={addQty}
                                    onChange={(e) => setAddQty(e.target.value)}
                                    placeholder="Ex: 5"
                                />
                            </div>

                            {selectedItem && (
                                <div className="qty-preview-info">
                                    <p>Atual: <strong>{selectedItem.quantidade}</strong></p>
                                    <p>Nova: <strong>{Number(selectedItem.quantidade) + Number(addQty || 0)}</strong></p>
                                </div>
                            )}

                            <button type="submit" className="submit-btn" disabled={isSubmitting || !selectedItem}>
                                {isSubmitting ? 'Atualizando...' : 'Confirmar Adição'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}



export default Producao
