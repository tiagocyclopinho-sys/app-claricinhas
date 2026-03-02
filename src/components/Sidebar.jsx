import React from 'react'
import { LayoutDashboard, Receipt, Scissors, ShoppingBag, Menu, X, Users, Database, RefreshCw } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ activePage, setActivePage, counts, lastSync, dbStatus }) {
    const [isOpen, setIsOpen] = React.useState(false)

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'despesas', label: 'Despesas', icon: Receipt, count: counts?.despesas },
        { id: 'producao', label: 'Produção', icon: Scissors, count: counts?.producao },
        { id: 'vendas', label: 'Vendas', icon: ShoppingBag, count: counts?.vendas },
        { id: 'clientes', label: 'Clientes', icon: Users, count: counts?.clientes },
        { id: 'dados', label: 'Backup / Dados', icon: Database },
    ]

    const toggleSidebar = () => setIsOpen(!isOpen)

    return (
        <>
            <button className="mobile-toggle" onClick={toggleSidebar}>
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside className={`sidebar glass-card ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/4.png" alt="Claricinhas Logo" className="sidebar-logo" />
                </div>

                <nav className="sidebar-nav">
                    {menuItems.map((item) => {
                        const Icon = item.icon
                        return (
                            <button
                                key={item.id}
                                className={`nav-item ${activePage === item.id ? 'active' : ''}`}
                                onClick={() => {
                                    setActivePage(item.id)
                                    setIsOpen(false)
                                }}
                            >
                                <Icon size={20} />
                                <span>{item.label}</span>
                                {item.count !== undefined && (
                                    <span className="nav-badge">{item.count}</span>
                                )}
                            </button>
                        )
                    })}
                </nav>

                <div className="sidebar-footer">
                    <div className="sync-info">
                        <RefreshCw size={14} className={dbStatus === 'loading' ? 'spin' : ''} />
                        <div>
                            <p className="sync-label">Status: {dbStatus === 'online' ? 'Online' : 'Sincronizando...'}</p>
                            {lastSync && <p className="sync-time">Lib. {lastSync}</p>}
                        </div>
                    </div>
                </div>
            </aside>

            {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
        </>
    )
}

export default Sidebar
