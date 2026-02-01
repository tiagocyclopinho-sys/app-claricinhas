import React, { useMemo, useState } from 'react'
import { TrendingUp, Receipt, Scissors, ShoppingBag, AlertCircle, Calendar } from 'lucide-react'
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import './Dashboard.css'

function Dashboard({ despesas, vendas, producao, setActivePage }) {
    const [dateRange, setDateRange] = useState({
        start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
        end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    })

    const stats = useMemo(() => {
        const start = parseISO(dateRange.start)
        const end = parseISO(dateRange.end)

        const filteredDespesas = despesas.filter(d => {
            const date = parseISO(d.dataVencimento || d.dataCriacao)
            return isWithinInterval(date, { start, end })
        })

        const filteredVendas = vendas.filter(v => {
            const date = parseISO(v.dataVenda)
            return isWithinInterval(date, { start, end })
        })

        const totalDespesas = filteredDespesas.reduce((acc, curr) => acc + Number(curr.valorTotal), 0)
        const totalVendas = filteredVendas.reduce((acc, curr) => acc + Number(curr.valorTotal), 0)

        // Parcelas a vencer (próximos 7 dias)
        const alertDate = new Date()
        alertDate.setDate(alertDate.getDate() + 7)

        const parcelasVencendo = vendas.flatMap(v =>
            (v.parcelas || [])
                .filter(p => !p.paga && isWithinInterval(parseISO(p.vencimento), { start: new Date(), end: alertDate }))
                .map(p => ({ ...p, cliente: v.cliente }))
        )

        return { totalDespesas, totalVendas, parcelasVencendo }
    }, [despesas, vendas, dateRange])

    return (
        <div className="dashboard-page">
            <header className="page-header">
                <div>
                    <h1>Olá, Bem-vinda! 👋</h1>
                    <p className="subtitle">Aqui está o resumo da Claricinhas hoje.</p>
                </div>

                <div className="date-filter glass-card">
                    <Calendar size={18} />
                    <input
                        type="date"
                        value={dateRange.start}
                        onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                    />
                    <span>até</span>
                    <input
                        type="date"
                        value={dateRange.end}
                        onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                    />
                </div>
            </header>

            <div className="stats-grid">
                <div className="stat-card glass-card">
                    <div className="stat-icon sales">
                        <TrendingUp size={24} />
                    </div>
                    <div className="stat-info">
                        <p>Vendas no Período</p>
                        <h3>R$ {stats.totalVendas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                <div className="stat-card glass-card">
                    <div className="stat-icon expenses">
                        <Receipt size={24} />
                    </div>
                    <div className="stat-info">
                        <p>Despesas no Período</p>
                        <h3>R$ {stats.totalDespesas.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                <div className="stat-card glass-card balance">
                    <div className="stat-info">
                        <p>Saldo Resultante</p>
                        <h3 style={{ color: stats.totalVendas - stats.totalDespesas >= 0 ? 'var(--success)' : 'var(--danger)' }}>
                            R$ {(stats.totalVendas - stats.totalDespesas).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </h3>
                    </div>
                </div>
            </div>

            <div className="dashboard-content">
                <section className="dashboard-section glass-card">
                    <div className="section-header">
                        <h3><AlertCircle size={20} color="var(--warning)" /> Alertas de Parcelas (Vencem logo)</h3>
                    </div>
                    <div className="alerts-list">
                        {stats.parcelasVencendo.length > 0 ? (
                            stats.parcelasVencendo.map((p, i) => (
                                <div key={i} className="alert-item">
                                    <span>{p.cliente}</span>
                                    <span className="alert-date">Vence em {format(parseISO(p.vencimento), 'dd/MM/yyyy')}</span>
                                    <span className="alert-value">R$ {Number(p.valor).toFixed(2)}</span>
                                </div>
                            ))
                        ) : (
                            <p className="empty-msg">Nenhuma parcela vencendo nos próximos 7 dias.</p>
                        )}
                    </div>
                </section>

                <section className="quick-actions">
                    <h3>Ações Rápidas</h3>
                    <div className="actions-grid">
                        <button onClick={() => setActivePage('despesas')} className="action-btn glass-card">
                            <Receipt /> Registrar Despesa
                        </button>
                        <button onClick={() => setActivePage('producao')} className="action-btn glass-card">
                            <Scissors /> Nova Produção
                        </button>
                        <button onClick={() => setActivePage('vendas')} className="action-btn glass-card">
                            <ShoppingBag /> Nova Venda
                        </button>
                    </div>
                </section>
            </div>
        </div>
    )
}

export default Dashboard
