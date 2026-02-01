import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Despesas from './pages/Despesas'
import Producao from './pages/Producao'
import Vendas from './pages/Vendas'
import './App.css'

function App() {
    const [activePage, setActivePage] = useState('dashboard')

    // Mock de dados centralizado
    const [despesas, setDespesas] = useState(() => {
        const saved = localStorage.getItem('claricinhas_despesas')
        return saved ? JSON.parse(saved) : []
    })

    const [producao, setProducao] = useState(() => {
        const saved = localStorage.getItem('claricinhas_producao')
        return saved ? JSON.parse(saved) : []
    })

    const [vendas, setVendas] = useState(() => {
        const saved = localStorage.getItem('claricinhas_vendas')
        return saved ? JSON.parse(saved) : []
    })

    const [clientes, setClientes] = useState(() => {
        const saved = localStorage.getItem('claricinhas_clientes')
        return saved ? JSON.parse(saved) : []
    })

    // Persistência
    useEffect(() => {
        localStorage.setItem('claricinhas_despesas', JSON.stringify(despesas))
    }, [despesas])

    useEffect(() => {
        localStorage.setItem('claricinhas_producao', JSON.stringify(producao))
    }, [producao])

    useEffect(() => {
        localStorage.setItem('claricinhas_vendas', JSON.stringify(vendas))
    }, [vendas])

    useEffect(() => {
        localStorage.setItem('claricinhas_clientes', JSON.stringify(clientes))
    }, [clientes])

    const renderPage = () => {
        switch (activePage) {
            case 'dashboard': return <Dashboard despesas={despesas} vendas={vendas} producao={producao} setActivePage={setActivePage} />
            case 'despesas': return <Despesas despesas={despesas} setDespesas={setDespesas} />
            case 'producao': return <Producao producao={producao} setProducao={setProducao} />
            case 'vendas': return <Vendas vendas={vendas} setVendas={setVendas} clientes={clientes} setClientes={setClientes} />
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
