import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Despesas from './pages/Despesas'
import Producao from './pages/Producao'
import Vendas from './pages/Vendas'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
    const [activePage, setActivePage] = useState('dashboard')
    const [despesas, setDespesas] = useState([])
    const [producao, setProducao] = useState([])
    const [vendas, setVendas] = useState([])
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)

    // Carregar dados iniciais do Supabase
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        try {
            const { data: d } = await supabase.from('despesas').select('*').order('created_at', { ascending: false })
            const { data: p } = await supabase.from('producao').select('*').order('created_at', { ascending: false })
            const { data: v } = await supabase.from('vendas').select('*').order('created_at', { ascending: false })
            const { data: c } = await supabase.from('clientes').select('*').order('nome')

            // Ajustar nomes das colunas de snake_case para camelCase (opcional, para não quebrar a UI)
            if (d) setDespesas(d.map(item => ({
                ...item,
                valorTotal: item.valor_total,
                formaPagamento: item.forma_pagamento,
                numParcelas: item.num_parcelas,
                dataVencimento: item.data_vencimento,
                valorParcela: item.valor_parcela
            })))
            if (p) setProducao(p.map(item => ({
                ...item,
                valorUnitario: item.valor_unitario,
                valorTotal: item.valor_total
            })))
            if (v) setVendas(v.map(item => ({
                ...item,
                valorTotal: item.valor_total,
                metodoPagamento: item.metodo_pagamento,
                numParcelas: item.num_parcelas,
                dataVenda: item.data_venda
            })))
            if (c) setClientes(c)
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    // Funções de atualização que salvam no Supabase
    const addDespesa = async (item) => {
        try {
            const dbItem = {
                descricao: item.descricao,
                categoria: item.categoria,
                valor_total: item.valorTotal,
                valor_parcela: item.valorParcela,
                forma_pagamento: item.formaPagamento,
                parcelado: item.parcelado,
                num_parcelas: item.numParcelas,
                data_vencimento: item.dataVencimento,
                status: item.status
            }
            const { data, error } = await supabase.from('despesas').insert([dbItem]).select()
            if (error) throw error
            if (data) {
                const mapped = { ...data[0], valorTotal: data[0].valor_total, dataVencimento: data[0].data_vencimento }
                setDespesas([mapped, ...despesas])
                alert('Despesa salva com sucesso!')
            }
        } catch (error) {
            console.error('Erro ao adicionar despesa:', error)
            alert('Erro ao salvar no banco de dados: ' + error.message)
        }
    }

    const addProducao = async (item) => {
        try {
            const dbItem = {
                nome: item.nome,
                tipo: item.tipo,
                quantidade: item.quantidade,
                tamanho: item.tamanho,
                valor_unitario: item.valorUnitario,
                valor_total: item.valorTotal,
                imagem: item.imagem
            }
            const { data, error } = await supabase.from('producao').insert([dbItem]).select()
            if (error) throw error
            if (data) {
                const mapped = { ...data[0], valorTotal: data[0].valor_total, valorUnitario: data[0].valor_unitario }
                setProducao([mapped, ...producao])
                alert('Item de produção salvo!')
            }
        } catch (error) {
            console.error('Erro ao adicionar produção:', error)
            alert('Erro ao salvar no banco de dados: ' + error.message)
        }
    }

    const addVenda = async (item) => {
        try {
            const dbItem = {
                cliente_nome: item.cliente,
                itens: item.itens,
                valor_total: item.valorTotal,
                metodo_pagamento: item.metodoPagamento,
                num_parcelas: item.numParcelas,
                data_venda: item.dataVenda,
                parcelas: item.parcelas
            }
            const { data, error } = await supabase.from('vendas').insert([dbItem]).select()
            if (error) throw error
            if (data) {
                const mapped = { ...data[0], valorTotal: data[0].valor_total, dataVenda: data[0].data_venda, cliente: data[0].cliente_nome }
                setVendas([mapped, ...vendas])
                alert('Venda registrada com sucesso!')
            }
        } catch (error) {
            console.error('Erro ao adicionar venda:', error)
            alert('Erro ao salvar no banco de dados: ' + error.message)
        }
    }

    const addCliente = async (item) => {
        try {
            const { data, error } = await supabase.from('clientes').insert([item]).select()
            if (error) throw error
            if (data) {
                setClientes([data[0], ...clientes])
                alert('Cliente cadastrado!')
            }
        } catch (error) {
            console.error('Erro ao adicionar cliente:', error)
            alert('Erro ao salvar no banco de dados: ' + error.message)
        }
    }

    const deleteDespesa = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta despesa?')) return
        try {
            const { error } = await supabase.from('despesas').delete().eq('id', id)
            if (error) throw error
            setDespesas(despesas.filter(d => d.id !== id))
        } catch (error) {
            alert('Erro ao excluir: ' + error.message)
        }
    }

    const deleteProducao = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir este item da produção?')) return
        try {
            const { error } = await supabase.from('producao').delete().eq('id', id)
            if (error) throw error
            setProducao(producao.filter(p => p.id !== id))
        } catch (error) {
            alert('Erro ao excluir: ' + error.message)
        }
    }

    const deleteVenda = async (id) => {
        if (!window.confirm('Tem certeza que deseja excluir esta venda?')) return
        try {
            const { error } = await supabase.from('vendas').delete().eq('id', id)
            if (error) throw error
            setVendas(vendas.filter(v => v.id !== id))
        } catch (error) {
            alert('Erro ao excluir: ' + error.message)
        }
    }

    const deleteCliente = async (id) => {
        if (!window.confirm('Ao excluir um cliente, as vendas dele não serão apagadas, mas perderão a referência. Deseja continuar?')) return
        try {
            const { error } = await supabase.from('clientes').delete().eq('id', id)
            if (error) throw error
            setClientes(clientes.filter(c => c.id !== id))
        } catch (error) {
            alert('Erro ao excluir: ' + error.message)
        }
    }

    const renderPage = () => {
        if (loading) return (
            <div className="loading-screen">
                <div className="loading-content">
                    <img src="/4.png" alt="Claricinhas" className="loading-logo pulse" />
                    <div className="loading-text">
                        <span>Sincronizando</span>
                        <div className="dots">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                    </div>
                </div>
            </div>
        )

        switch (activePage) {
            case 'dashboard': return <Dashboard despesas={despesas} vendas={vendas} producao={producao} setActivePage={setActivePage} />
            case 'despesas': return <Despesas despesas={despesas} onAdd={addDespesa} onDelete={deleteDespesa} />
            case 'producao': return <Producao producao={producao} onAdd={addProducao} onDelete={deleteProducao} />
            case 'vendas': return <Vendas vendas={vendas} onAddVenda={addVenda} onDeleteVenda={deleteVenda} clientes={clientes} onAddCliente={addCliente} onDeleteCliente={deleteCliente} />
            default: return <Dashboard />
        }
    }

    return (
        <div className="app-container">
            <div className="background-overlay"></div>
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <main className="main-content">
                {renderPage()}
            </main>
        </div>
    )
}

export default App
