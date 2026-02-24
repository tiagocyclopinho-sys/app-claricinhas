import React, { useState, useMemo } from 'react'
import { Receipt, Plus, Filter, Search, X, Trash2 } from 'lucide-react'
import { format, parseISO, startOfMonth, endOfMonth, isWithinInterval } from 'date-fns'
import './Despesas.css'

function Despesas({ despesas, onAdd, onDelete }) {
    const [showModal, setShowModal] = useState(false)
    const [filterPeriod, setFilterPeriod] = useState('mes') // mes, tudo
    const [filterMetodo, setFilterMetodo] = useState('todos')

    const [formData, setFormData] = useState({
        descricao: '',
        categoria: 'matéria-prima',
        valorTotal: '',
        formaPagamento: 'Dinheiro',
        parcelado: false,
        numParcelas: 1,
        dataVencimento: format(new Date(), 'yyyy-MM-dd'),
        status: 'Pendente'
    })

    const formatDateSafe = (dateStr, formatStr = 'dd/MM/yyyy') => {
        try {
            if (!dateStr) return '-'
            const d = parseISO(dateStr)
            if (isNaN(d.getTime())) return '-'
            return format(d, formatStr)
        } catch { return '-' }
    }

    const filteredDespesas = useMemo(() => {
        let list = despesas || []

        if (filterPeriod === 'mes') {
            const start = startOfMonth(new Date())
            const end = endOfMonth(new Date())
            list = list.filter(d => {
                try {
                    const date = parseISO(d.dataVencimento)
                    return isWithinInterval(date, { start, end })
                } catch { return false }
            })
        }

        if (filterMetodo !== 'todos') {
            list = list.filter(d => d.formaPagamento === filterMetodo)
        }

        return list
    }, [despesas, filterPeriod, filterMetodo])

    const totalMes = useMemo(() => {
        return filteredDespesas.reduce((acc, curr) => acc + Number(curr.valorTotal), 0)
    }, [filteredDespesas])

    const handleSubmit = (e) => {
        e.preventDefault()
        const newDespesa = {
            ...formData,
            valorParcela: formData.parcelado ? (Number(formData.valorTotal) / Number(formData.numParcelas)).toFixed(2) : formData.valorTotal
        }
        onAdd(newDespesa)
        setShowModal(false)
        setFormData({
            descricao: '',
            categoria: 'matéria-prima',
            valorTotal: '',
            formaPagamento: 'Dinheiro',
            parcelado: false,
            numParcelas: 1,
            dataVencimento: format(new Date(), 'yyyy-MM-dd'),
            status: 'Pendente'
        })
    }

    return (
        <div className="despesas-page">
            <header className="page-header">
                <h1>Despesas</h1>
                <button className="add-btn" onClick={() => setShowModal(true)}>
                    <Plus size={20} /> Nova Despesa
                </button>
            </header>

            <div className="filters-bar glass-card">
                <div className="filter-group">
                    <label>Período:</label>
                    <select value={filterPeriod} onChange={(e) => setFilterPeriod(e.target.value)}>
                        <option value="mes">Este Mês</option>
                        <option value="tudo">Tudo</option>
                    </select>
                </div>
                <div className="filter-group">
                    <label>Pagamento:</label>
                    <select value={filterMetodo} onChange={(e) => setFilterMetodo(e.target.value)}>
                        <option value="todos">Todos</option>
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="Pix">Pix</option>
                        <option value="Débito">Débito</option>
                        <option value="Crédito">Crédito</option>
                    </select>
                </div>
                <div className="total-badge">
                    <span>Total no filtro:</span>
                    <strong>R$ {totalMes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong>
                </div>
            </div>

            <div className="table-container glass-card">
                <table>
                    <thead>
                        <tr>
                            <th>Descrição</th>
                            <th>Categoria</th>
                            <th>Valor</th>
                            <th>Pagamento</th>
                            <th>Vencimento</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredDespesas.length > 0 ? (
                            filteredDespesas.map(d => (
                                <tr key={d.id}>
                                    <td>{d.descricao}</td>
                                    <td><span className="badge category">{d.categoria}</span></td>
                                    <td>R$ {Number(d.valorTotal).toFixed(2)}</td>
                                    <td>{d.formaPagamento} {d.parcelado && `(${d.numParcelas}x)`}</td>
                                    <td>{formatDateSafe(d.dataVencimento)}</td>
                                    <td>
                                        <span className={`badge status ${(d.status || 'Pendente').toLowerCase()}`}>
                                            {d.status || 'Indefinido'}
                                        </span>
                                    </td>
                                    <td>
                                        <button className="delete-table-btn" onClick={() => onDelete(d.id)} title="Excluir">
                                            <Trash2 size={18} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="empty-row">Nenhuma despesa encontrada.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-content glass-card">
                        <div className="modal-header">
                            <h2>Cadastrar Nova Despesa</h2>
                            <button onClick={() => setShowModal(false)}><X /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label>Descrição</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.descricao}
                                    onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                                    placeholder="Ex: Aluguel, Tecido Malha..."
                                />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Categoria</label>
                                    <select
                                        value={formData.categoria}
                                        onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                                    >
                                        <option value="aluguel">Aluguel</option>
                                        <option value="matéria-prima">Matéria-prima</option>
                                        <option value="energia">Energia</option>
                                        <option value="transporte">Transporte</option>
                                        <option value="retirada">Retirada</option>
                                        <option value="outros">Outros</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Valor Total</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        required
                                        value={formData.valorTotal}
                                        onChange={(e) => setFormData({ ...formData, valorTotal: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Forma de Pagamento</label>
                                    <select
                                        value={formData.formaPagamento}
                                        onChange={(e) => setFormData({ ...formData, formaPagamento: e.target.value })}
                                    >
                                        <option value="Dinheiro">Dinheiro</option>
                                        <option value="Pix">Pix</option>
                                        <option value="Débito">Débito</option>
                                        <option value="Crédito">Crédito</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label>Vencimento</label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.dataVencimento}
                                        onChange={(e) => setFormData({ ...formData, dataVencimento: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="form-check">
                                <input
                                    type="checkbox"
                                    id="parcelado"
                                    checked={formData.parcelado}
                                    onChange={(e) => setFormData({ ...formData, parcelado: e.target.checked })}
                                />
                                <label htmlFor="parcelado">Despesa Parcelada?</label>
                            </div>

                            {formData.parcelado && (
                                <div className="form-row anim-in">
                                    <div className="form-group">
                                        <label>Nº de Parcelas</label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={formData.numParcelas}
                                            onChange={(e) => setFormData({ ...formData, numParcelas: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Valor da Parcela</label>
                                        <input
                                            type="text"
                                            disabled
                                            value={formData.valorTotal && formData.numParcelas ? (Number(formData.valorTotal) / Number(formData.numParcelas)).toFixed(2) : '0.00'}
                                        />
                                    </div>
                                </div>
                            )}

                            <div className="form-group">
                                <label>Status</label>
                                <select
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                >
                                    <option value="Pendente">Pendente</option>
                                    <option value="Paga">Paga</option>
                                </select>
                            </div>

                            <button type="submit" className="submit-btn">Salvar Despesa</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Despesas
