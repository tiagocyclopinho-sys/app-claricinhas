import React from 'react'
import { LayoutDashboard, Receipt, Scissors, ShoppingBag, Menu, X } from 'lucide-react'
import './Sidebar.css'

function Sidebar({ activePage, setActivePage }) {
    const [isOpen, setIsOpen] = React.useState(false)

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'despesas', label: 'Despesas', icon: Receipt },
        { id: 'producao', label: 'Produção', icon: Scissors },
        { id: 'vendas', label: 'Vendas', icon: ShoppingBag },
    ]

    const toggleSidebar = () => setIsOpen(!isOpen)

    return (
        <>
            <button className="mobile-toggle" onClick={toggleSidebar}>
                {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>

            <aside className={`sidebar glass-card ${isOpen ? 'open' : ''}`}>
                <div className="sidebar-header">
                    <img src="/logo.png" alt="Claricinhas Logo" className="sidebar-logo" />
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
                            </button>
                        )
                    })}
                </nav>
            </aside>

            {isOpen && <div className="sidebar-overlay" onClick={toggleSidebar}></div>}
        </>
    )
}

export default Sidebar
