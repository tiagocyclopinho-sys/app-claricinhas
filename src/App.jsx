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

            if (d) setDespesas(d)
            if (p) setProducao(p)
            if (v) setVendas(v)
            if (c) setClientes(c)
        } catch (error) {
            console.error('Erro ao carregar dados:', error)
        } finally {
            setLoading(false)
        }
    }

    // Funções de atualização que salvam no Supabase
    const addDespesa = async (item) => {
        const { data, error } = await supabase.from('despesas').insert([item]).select()
        if (!error) setDespesas([data[0], ...despesas])
    }

    const addProducao = async (item) => {
        const { data, error } = await supabase.from('producao').insert([item]).select()
        if (!error) setProducao([data[0], ...producao])
    }

    const addVenda = async (item) => {
        const { data, error } = await supabase.from('vendas').insert([item]).select()
        if (!error) setVendas([data[0], ...vendas])
    }

    const addCliente = async (item) => {
        const { data, error } = await supabase.from('clientes').insert([item]).select()
        if (!error) setClientes([data[0], ...clientes])
    }

    const renderPage = () => {
        if (loading) return <div className="loading-screen glass-card">Carregando sincronização...</div>

        switch (activePage) {
            case 'dashboard': return <Dashboard despesas={despesas} vendas={vendas} producao={producao} setActivePage={setActivePage} />
            case 'despesas': return <Despesas despesas={despesas} onAdd={addDespesa} />
            case 'producao': return <Producao producao={producao} onAdd={addProducao} />
            case 'vendas': return <Vendas vendas={vendas} onAddVenda={addVenda} clientes={clientes} onAddCliente={addCliente} />
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
