import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Despesas from './pages/Despesas'
import Producao from './pages/Producao'
import Vendas from './pages/Vendas'
import Clientes from './pages/Clientes'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
    const [activePage, setActivePage] = useState('dashboard')
    const [despesas, setDespesas] = useState([])
    const [producao, setProducao] = useState([])
    const [vendas, setVendas] = useState([])
    const [clientes, setClientes] = useState([])
    const [loading, setLoading] = useState(true)
    const [dbError, setDbError] = useState(null) // Guardar a mensagem de erro

    // Lógica para o botão Voltar do aparelho
    useEffect(() => {
        const handleBackButton = (e) => {
            if (activePage !== 'dashboard') {
                e.preventDefault()
                setActivePage('dashboard')
                window.history.pushState({ page: 'dashboard' }, '')
            }
        }
        window.addEventListener('popstate', handleBackButton)
        if (window.history.state?.page !== activePage) {
            window.history.pushState({ page: activePage }, '')
        }
        return () => window.removeEventListener('popstate', handleBackButton)
    }, [activePage])

    // Carregar dados iniciais (Tenta Supabase -> Fallback LocalStorage)
    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async (retryCount = 0) => {
        setLoading(true)
        setDbError(null)
        console.log(`[FetchData] Iniciando tentativa ${retryCount + 1}`)

        try {
            // 🚀 Busca paralela para máxima performance
            const [resD, resP, resV, resC] = await Promise.all([
                supabase.from('despesas').select('*').order('created_at', { ascending: false }),
                supabase.from('producao').select('*').order('created_at', { ascending: false }),
                supabase.from('vendas').select('*').order('created_at', { ascending: false }),
                supabase.from('clientes').select('*').order('nome')
            ])

            const errors = []
            if (resD.error) errors.push(`Despesas: ${resD.error.message}`)
            if (resP.error) errors.push(`Produção: ${resP.error.message}`)
            if (resV.error) errors.push(`Vendas: ${resV.error.message}`)
            if (resC.error) errors.push(`Clientes: ${resC.error.message}`)

            if (errors.length > 0) {
                console.warn('[FetchData] Erros detectados:', errors)
                if (retryCount < 2) {
                    console.log('[FetchData] Agendando nova tentativa em 2s...')
                    setTimeout(() => fetchData(retryCount + 1), 2000)
                    return // Sai sem desativar o Loading, a próxima tentativa cuidará disso
                }
                throw new Error(errors.join(' | '))
            }

            console.log('[FetchData] Dados recebidos com sucesso. Mapeando...')

            const d = resD.data || []
            const p = resP.data || []
            const v = resV.data || []
            const c = resC.data || []

            // Mapeamentos seguros
            const mappedD = d.map(item => ({
                ...item,
                valorTotal: item.valor_total || item.valor || 0,
                dataVencimento: item.data_vencimento || (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0])
            }))

            const mappedP = p.map(item => ({
                ...item,
                valorUnitario: item.valor_unitario || 0,
                valorTotal: item.valor_total || 0
            }))

            const mappedV = v.map(item => ({
                ...item,
                valorTotal: item.valor_total || item.valor || 0,
                dataVenda: item.data_venda || (item.created_at ? item.created_at.split('T')[0] : new Date().toISOString().split('T')[0]),
                cliente: item.cliente_nome || item.cliente || 'Consumidor',
                metodoPagamento: item.metodo_pagamento || 'Dinheiro'
            }))

            setDespesas(mappedD)
            setProducao(mappedP)
            setVendas(mappedV)
            setClientes(c)

            // Backup silencioso
            try {
                localStorage.setItem('claricinhas_backup', JSON.stringify({
                    despesas: mappedD, producao: mappedP, vendas: mappedV, clientes: c, lastUpdate: new Date().toISOString()
                }))
            } catch (e) { console.warn('Falha no backup local:', e) }

            console.log('[FetchData] Sucesso total.')
            setLoading(false)

        } catch (error) {
            console.error('[FetchData] Erro Crítico:', error)
            setDbError(error.message || 'Falha na conexão')

            // Tenta carregar backup se o banco falhou de vez
            const saved = localStorage.getItem('claricinhas_backup')
            if (saved) {
                try {
                    console.log('[FetchData] Carregando dados do backup local...')
                    const backup = JSON.parse(saved)
                    setDespesas(backup.despesas || [])
                    setProducao(backup.producao || [])
                    setVendas(backup.vendas || [])
                    setClientes(backup.clientes || [])
                } catch (e) {
                    console.error('[FetchData] Backup corrompido:', e)
                }
            }
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
                const mapped = {
                    ...data[0],
                    valorTotal: data[0].valor_total,
                    dataVencimento: data[0].data_vencimento,
                    formaPagamento: data[0].forma_pagamento
                }
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
                const mapped = {
                    ...data[0],
                    valorTotal: data[0].valor_total,
                    dataVenda: data[0].data_venda,
                    cliente: data[0].cliente_nome,
                    metodoPagamento: data[0].metodo_pagamento
                }
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

    const updateCliente = async (id, updates) => {
        try {
            const { data, error } = await supabase.from('clientes').update(updates).eq('id', id).select()
            if (error) throw error
            if (data) {
                setClientes(clientes.map(c => c.id === id ? data[0] : c))
                // Também atualizar o nome do cliente nas vendas se o nome mudou (opcional, mas bom para consistência visual)
                if (updates.nome) {
                    setVendas(vendas.map(v => v.clienteId === id ? { ...v, cliente: updates.nome } : v))
                }
            }
        } catch (error) {
            console.error('Erro ao atualizar cliente:', error)
            alert('Erro ao atualizar no banco de dados: ' + error.message)
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

    const updateProducao = async (id, novosDados) => {
        try {
            // Se for decremento de quantidade, garantir que chamamos com o valor atualizado
            const { data, error } = await supabase
                .from('producao')
                .update(novosDados)
                .eq('id', id)
                .select()

            if (error) throw error
            if (data) {
                const updated = { ...data[0], valorTotal: data[0].valor_total, valorUnitario: data[0].valor_unitario }
                setProducao(producao.map(p => p.id === id ? updated : p))
            }
        } catch (error) {
            console.error('Erro ao atualizar produção:', error)
            alert('Erro ao atualizar estoque: ' + error.message)
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
            case 'producao': return <Producao producao={producao} onAdd={addProducao} onDelete={deleteProducao} onUpdate={updateProducao} />
            case 'vendas': return <Vendas vendas={vendas} onAddVenda={addVenda} onDeleteVenda={deleteVenda} clientes={clientes} onAddCliente={addCliente} onDeleteCliente={deleteCliente} onUpdateCliente={updateCliente} producao={producao} onUpdateProducao={updateProducao} />
            case 'clientes': return <Clientes clientes={clientes} onAdd={addCliente} onDelete={deleteCliente} onUpdate={updateCliente} />
            default: return <Dashboard />
        }
    }

    return (
        <div className="app-container">
            {dbError && (
                <div className="db-error-banner">
                    <span>⚠️ {dbError === true ? 'Banco Offline' : `Erro: ${dbError}`}</span>
                    <button onClick={fetchData}>Tentar Reconectar</button>
                    <button onClick={() => setDbError(null)} style={{ background: 'transparent', color: 'white', border: '1px solid white', borderRadius: '50%', width: '24px', height: '24px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                </div>
            )}
            <div className="background-overlay"></div>
            <Sidebar activePage={activePage} setActivePage={setActivePage} />
            <main className="main-content">
                {renderPage()}
            </main>
        </div>
    )
}

export default App
