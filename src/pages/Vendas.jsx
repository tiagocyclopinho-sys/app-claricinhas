import React, { useState, useMemo } from 'react'
import { ShoppingBag, Plus, UserPlus, Star, Clock, X, Phone, Trash2, BookOpen } from 'lucide-react'
import { format, parseISO, differenceInDays, addMonths } from 'date-fns'
import './Vendas.css'

function Vendas({ vendas, onAddVenda, onDeleteVenda, clientes, onAddCliente, onDeleteCliente, producao, onUpdateProducao }) {
    const [showVendaModal, setShowVendaModal] = useState(false)
    const [showClienteModal, setShowClienteModal] = useState(false)
    const [showManageClients, setShowManageClients] = useState(false)
    const [filterVip, setFilterVip] = useState(false)

    // Estado para controle de itens na venda atual
    const [itemAdicionando, setItemAdicionando] = useState({ id: '', qtd: 1 })

    // Estados dos formulários
    const [vendaForm, setVendaForm] = useState({
        clienteId: '',
        itensSelecionados: [], // Array de { idProducao, nome, tamanho, quantidade, valorUnitario }
        valorTotal: 0,
        metodoPagamento: 'Dinheiro',
        numParcelas: 1,
        primeiroVencimento: format(new Date(), 'yyyy-MM-dd')
    })

    const [clienteForm, setClienteForm] = useState({
        nome: '',
        telefone: '',
        vip: false
    })

    const filteredVendas = useMemo(() => {
        if (!filterVip) return vendas
        return vendas.filter(v => {
            const cliente = clientes.find(c => c.id.toString() === v.clienteId?.toString())
            return cliente?.vip
        })
    }, [vendas, clientes, filterVip])

    const handleAddCliente = (e) => {
        e.preventDefault()
        const newCliente = { ...clienteForm }
        onAddCliente(newCliente)
        setShowClienteModal(false)
        setClienteForm({ nome: '', telefone: '', vip: false })
    }

    const handleAddItemAoCarrinho = () => {
        if (!itemAdicionando.id || itemAdicionando.qtd <= 0) return

        const itemEstoque = producao.find(p => p.id.toString() === itemAdicionando.id.toString())
        if (!itemEstoque) return

        if (itemAdicionando.qtd > itemEstoque.quantidade) {
            alert(`Quantidade insuficiente em estoque! Disponível: ${itemEstoque.quantidade}`)
            return
        }

        const novoItem = {
            idProducao: itemEstoque.id,
            nome: itemEstoque.nome,
            tamanho: itemEstoque.tamanho,
            quantidade: Number(itemAdicionando.qtd),
            valorUnitario: Number(itemEstoque.valorUnitario)
        }

        const novosItens = [...vendaForm.itensSelecionados, novoItem]
        const novoTotal = novosItens.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0)

        setVendaForm({
            ...vendaForm,
            itensSelecionados: novosItens,
            valorTotal: novoTotal
        })
        setItemAdicionando({ id: '', qtd: 1 })
    }

    const removerItemCarrinho = (index) => {
        const novosItens = vendaForm.itensSelecionados.filter((_, i) => i !== index)
        const novoTotal = novosItens.reduce((acc, curr) => acc + (curr.quantidade * curr.valorUnitario), 0)
        setVendaForm({ ...vendaForm, itensSelecionados: novosItens, valorTotal: novoTotal })
    }

    const handleImportContacts = async () => {
        const supported = 'contacts' in navigator && 'ContactsManager' in window
        if (!supported) {
            alert('A importação de contatos não é suportada neste navegador ou dispositivo.')
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
                    const telLimpo = telefone.replace(/[^\d+]/g, '')
                    onAddCliente({ nome, telefone: telLimpo, vip: false })
                })
                alert(`${contacts.length} contato(s) importado(s)!`)
            }
        } catch (err) {
            if (err.name !== 'AbortError') console.error(err)
        }
    }

    const handleAddVenda = async (e) => {
        e.preventDefault()
        if (vendaForm.itensSelecionados.length === 0) {
            alert('Adicione pelo menos um item à venda!')
            return
        }

        const cliente = clientes.find(c => c.id.toString() === vendaForm.clienteId.toString())

        // Gerar parcelas se for crediário ou crédito parcelado
        let parcelas = []
        if (vendaForm.metodoPagamento === 'Crediário' || (vendaForm.metodoPagamento === 'Crédito' && Number(vendaForm.numParcelas) > 1)) {
            const totalParcelas = Number(vendaForm.numParcelas)
            const valorParcela = (Number(vendaForm.valorTotal) / totalParcelas).toFixed(2)
            for (let i = 0; i < totalParcelas; i++) {
                parcelas.push({
                    id: i,
                    valor: valorParcela,
                    vencimento: format(addMonths(parseISO(vendaForm.primeiroVencimento), i), 'yyyy-MM-dd'),
                    paga: vendaForm.metodoPagamento === 'Crédito'
                })
            }
        }

        // Formatar descrição dos itens
        const itensDesc = vendaForm.itensSelecionados.map(it => `${it.quantidade}x ${it.nome} (${it.tamanho})`).join(', ')

        const newVenda = {
            ...vendaForm,
            itens: itensDesc,
            cliente: cliente?.nome || 'Desconhecido',
            dataVenda: format(new Date(), 'yyyy-MM-dd'),
            parcelas
        }

        // Deduzir do estoque
        for (const item of vendaForm.itensSelecionados) {
            const itemEstoque = producao.find(p => p.id === item.idProducao)
            if (itemEstoque) {
                const novaQtd = itemEstoque.quantidade - item.quantidade
                const novoValorTotal = (novaQtd * itemEstoque.valorUnitario).toFixed(2)
                await onUpdateProducao(item.idProducao, {
                    quantidade: novaQtd,
                    valor_total: novoValorTotal
                })
            }
        }

        onAddVenda(newVenda)
        setShowVendaModal(false)
        setVendaForm({
            clienteId: '',
            itensSelecionados: [],
            valorTotal: 0,
            metodoPagamento: 'Dinheiro',
            numParcelas: 1,
            primeiroVencimento: format(new Date(), 'yyyy-MM-dd')
        })
    }

    const getUrgencyClass = (vencimento) => {
        const diff = differenceInDays(parseISO(vencimento), new Date())
        if (diff < 0) return 'overdue'
        if (diff <= 3) return 'urgent'
        return 'normal'
    }

    const getUrgencyText = (vencimento) => {
        const diff = differenceInDays(parseISO(vencimento), new Date())
        if (diff < 0) return `Atrasado ${Math.abs(diff)}d`
        if (diff === 0) return 'Vence HOJE'
        if (diff <= 3) return `Vence em ${diff}d`
        return null
    }

    return (
        <div className="vendas-page">
            <header className="page-header">
                <h1>Vendas</h1>
                <div className="header-actions">
                    {('contacts' in navigator) && (
                        <button className="secondary-btn" onClick={handleImportContacts}>
                            <BookOpen size={18} /> Importar
                        </button>
                    )}
                    <button className="secondary-btn" onClick={() => setShowClienteModal(true)}>
                        <UserPlus size={18} /> Novo Cliente
                    </button>
                    <button className="add-btn" onClick={() => setShowVendaModal(true)}>
                        <Plus size={20} /> Nova Venda
                    </button>
                </div>
            </header>

            <div className="filters-bar glass-card">
                <button
                    className={`filter-chip ${filterVip ? 'active' : ''}`}
                    onClick={() => setFilterVip(!filterVip)}
                >
                    <Star size={16} fill={filterVip ? "currentColor" : "none"} /> Apenas Clientes VIP
                </button>
                <button className="secondary-btn" onClick={() => setShowManageClients(true)} style={{ marginLeft: 'auto', padding: '0.4rem 1rem' }}>
                    <UserPlus size={16} /> Gerenciar Clientes
                </button>
            </div>

            <div className="vendas-list">
                {filteredVendas.length > 0 ? (
                    filteredVendas.map(venda => (
                        <div key={venda.id} className="venda-card glass-card">
                            <div className="venda-main">
                                <div className="venda-header">
                                    <div className="venda-meta">
                                        <span className="venda-date">{format(parseISO(venda.dataVenda), 'dd/MM/yyyy')}</span>
                                        <span className="venda-client-tag"> • 👤 {venda.cliente || 'Consumidor'}</span>
                                    </div>
                                    <button className="delete-card-btn" onClick={() => onDeleteVenda(venda.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                                <h3 className="venda-title">{venda.itens || 'Venda sem descrição'}</h3>

                                <div className="venda-footer">
                                    <span className={`metodo-badge ${venda.metodoPagamento.toLowerCase()}`}>
                                        {venda.metodoPagamento}
                                    </span>
                                    <span className="venda-valor">R$ {Number(venda.valorTotal).toFixed(2)}</span>
                                </div>
                            </div>

                            {(venda.metodoPagamento === 'Crediário' || (venda.metodoPagamento === 'Crédito' && venda.parcelas?.length > 1)) && (
                                <div className="parcelas-section">
                                    <h4>Parcelas</h4>
                                    <div className="parcelas-grid">
                                        {venda.parcelas.map((p, idx) => (
                                            <div key={idx} className={`parcela-item ${getUrgencyClass(p.vencimento)} ${p.paga ? 'paga' : ''}`}>
                                                <div className="p-info">
                                                    <span>{idx + 1}ª - R$ {p.valor}</span>
                                                    <span className="p-date">{format(parseISO(p.vencimento), 'dd/MM/yyyy')}</span>
                                                </div>
                                                {!p.paga && <span className="p-alert">{getUrgencyText(p.vencimento)}</span>}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <p className="empty-msg">Nenhuma venda registrada.</p>
                )}
            </div>

            {/* Modal Novo Cliente */}
            {showClienteModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card">
                        <div className="modal-header">
                            <h2>Cadastrar Cliente</h2>
                            <button onClick={() => setShowClienteModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleAddCliente}>
                            <div className="form-group">
                                <label>Nome Completo</label>
                                <input
                                    type="text"
                                    required
                                    value={clienteForm.nome}
                                    onChange={(e) => setClienteForm({ ...clienteForm, nome: e.target.value })}
                                />
                            </div>
                            <div className="form-group">
                                <label>Telefone</label>
                                <input
                                    type="tel"
                                    required
                                    value={clienteForm.telefone}
                                    onChange={(e) => setClienteForm({ ...clienteForm, telefone: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    id="vip"
                                    checked={clienteForm.vip}
                                    onChange={(e) => setClienteForm({ ...clienteForm, vip: e.target.checked })}
                                />
                                <label htmlFor="vip"><Star size={16} /> Cliente VIP</label>
                            </div>
                            <button type="submit" className="submit-btn">Salvar Cliente</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Nova Venda */}
            {showVendaModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card wide-modal">
                        <div className="modal-header">
                            <h2>Registrar Nova Venda</h2>
                            <button onClick={() => setShowVendaModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleAddVenda}>
                            <div className="form-group">
                                <label>Cliente</label>
                                <select
                                    required
                                    value={vendaForm.clienteId}
                                    onChange={(e) => setVendaForm({ ...vendaForm, clienteId: e.target.value })}
                                >
                                    <option value="">Selecione um cliente...</option>
                                    {clientes.map(c => (
                                        <option key={c.id} value={c.id}>{c.nome} {c.vip ? '⭐' : ''}</option>
                                    ))}
                                </select>
                                {clientes.length === 0 && <p className="hint">Cadastre um cliente primeiro.</p>}
                            </div>

                            <div className="form-section-title">Itens da Venda</div>

                            <div className="add-item-box glass-card">
                                <div className="form-group">
                                    <label>Peça em Estoque</label>
                                    <select
                                        value={itemAdicionando.id}
                                        onChange={(e) => setItemAdicionando({ ...itemAdicionando, id: e.target.value })}
                                    >
                                        <option value="">Escolha a peça...</option>
                                        {producao.filter(p => p.quantidade > 0).map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.nome} ({p.tamanho}) - Qtd: {p.quantidade} - R$ {Number(p.valorUnitario).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="form-group" style={{ maxWidth: '80px' }}>
                                    <label>Qtd</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={itemAdicionando.qtd}
                                        onChange={(e) => setItemAdicionando({ ...itemAdicionando, qtd: e.target.value })}
                                    />
                                </div>
                                <button type="button" className="add-item-btn" onClick={handleAddItemAoCarrinho}>
                                    <Plus size={18} />
                                </button>
                            </div>

                            <div className="selected-items-list">
                                {vendaForm.itensSelecionados.length > 0 ? (
                                    vendaForm.itensSelecionados.map((item, idx) => (
                                        <div key={idx} className="selected-item">
                                            <span>{item.quantidade}x {item.nome} ({item.tamanho})</span>
                                            <span>R$ {(item.quantidade * item.valorUnitario).toFixed(2)}</span>
                                            <button type="button" onClick={() => removerItemCarrinho(idx)}><Trash2 size={14} /></button>
                                        </div>
                                    ))
                                ) : (
                                    <p className="empty-hint">Nenhum item selecionado</p>
                                )}
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Valor Total</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        readOnly
                                        value={vendaForm.valorTotal}
                                        style={{ background: 'rgba(255,255,255,0.05)', fontWeight: 'bold' }}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Forma de Pagamento</label>
                                    <select
                                        value={vendaForm.metodoPagamento}
                                        onChange={(e) => setVendaForm({ ...vendaForm, metodoPagamento: e.target.value })}
                                    >
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Pix">Pix</option>
                                        <option value="Débito">Débito</option>
                                        <option value="Crédito">Crédito</option>
                                        <option value="Crediário">Crediário</option>
                                    </select>
                                </div>
                            </div>

                            {(vendaForm.metodoPagamento === 'Crediário' || vendaForm.metodoPagamento === 'Crédito') && (
                                <div className="form-row anim-in">
                                    <div className="form-group">
                                        <label>Nº de Parcelas</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={vendaForm.numParcelas}
                                            onChange={(e) => setVendaForm({ ...vendaForm, numParcelas: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>1º Vencimento</label>
                                        <input
                                            type="date"
                                            value={vendaForm.primeiroVencimento}
                                            onChange={(e) => setVendaForm({ ...vendaForm, primeiroVencimento: e.target.value })}
                                        />
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="submit-btn" disabled={!vendaForm.clienteId || vendaForm.itensSelecionados.length === 0}>
                                Registrar Venda
                            </button>
                        </form>
                    </div>
                </div>
            )}
            {/* Modal Gerenciar Clientes */}
            {showManageClients && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card" style={{ maxWidth: '500px' }}>
                        <div className="modal-header">
                            <h2>Lista de Clientes</h2>
                            <button onClick={() => setShowManageClients(false)}><X /></button>
                        </div>
                        <div className="clients-manage-list" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {clientes.map(c => (
                                <div key={c.id} className="client-manage-item" style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '1rem',
                                    borderBottom: '1px solid var(--glass-border)'
                                }}>
                                    <div>
                                        <strong>{c.nome}</strong>
                                        <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{c.telefone}</p>
                                    </div>
                                    <button className="delete-table-btn" onClick={() => onDeleteCliente(c.id)}>
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Vendas
