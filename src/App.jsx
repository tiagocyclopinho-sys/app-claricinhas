import React, { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Despesas from './pages/Despesas'
import Producao from './pages/Producao'
import Vendas from './pages/Vendas'
import Clientes from './pages/Clientes'
import Dados from './pages/Dados'
import { supabase } from './supabaseClient'
import './App.css'

function App() {
    // Inicialização otimista: Tenta carregar do backup local primeiro para não abrir "vazio"
    const getInitialData = (key) => {
        try {
            const saved = localStorage.getItem('claricinhas_backup');
            if (saved) {
                const backup = JSON.parse(saved);
                return backup[key] || [];
            }
        } catch (e) { console.error('Erro ao ler backup inicial:', e); }
        return [];
    };

    const [activePage, setActivePage] = useState('dashboard')
    const [despesas, setDespesas] = useState(() => getInitialData('despesas'))
    const [producao, setProducao] = useState(() => getInitialData('producao'))
    const [vendas, setVendas] = useState(() => getInitialData('vendas'))
    const [clientes, setClientes] = useState(() => getInitialData('clientes'))
    const [loading, setLoading] = useState(true)
    const [dbError, setDbError] = useState(null) // Guardar a mensagem de erro
    const [lastSync, setLastSync] = useState(null)

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

    const [showBypass, setShowBypass] = useState(false)

    // Carregar dados iniciais (Tenta Supabase -> Fallback LocalStorage)
    useEffect(() => {
        fetchData()

        // Mostrar botão de bypass após 5 segundos
        const bypassTimer = setTimeout(() => setShowBypass(true), 5000)

        // FAIL-SAFE: Se em 12 segundos não carregou, força a saída do loading
        const failSafeTimer = setTimeout(() => {
            console.warn('[Fail-Safe] Forcando entrada no app por timeout.')
            setLoading(false)
        }, 12000)

        return () => {
            clearTimeout(bypassTimer)
            clearTimeout(failSafeTimer)
        }
    }, [])

    const fetchData = async (retryCount = 0) => {
        setLoading(true)
        setDbError(null)
        console.log(`[FetchData] Iniciando busca granular (Tentativa ${retryCount + 1})...`)

        let syncCount = 0;
        const tables = [
            {
                name: 'despesas',
                setter: setDespesas,
                mapper: data => data.map(item => ({
                    ...item,
                    valorTotal: item.valor_total || item.valor || 0,
                    dataVencimento: item.data_vencimento || (item.created_at?.split('T')[0]) || new Date().toISOString().split('T')[0]
                }))
            },
            {
                name: 'producao',
                setter: setProducao,
                mapper: data => data.map(item => ({
                    ...item,
                    valorUnitario: item.valor_unitario || 0,
                    valorTotal: item.valor_total || 0
                }))
            },
            {
                name: 'vendas',
                setter: setVendas,
                mapper: data => data.map(item => ({
                    ...item,
                    valorTotal: item.valor_total || item.valor || 0,
                    dataVenda: item.data_venda || (item.created_at?.split('T')[0]) || new Date().toISOString().split('T')[0],
                    cliente: item.cliente_nome || item.cliente || 'Consumidor',
                    metodoPagamento: item.metodo_pagamento || 'Dinheiro'
                }))
            },
            {
                name: 'clientes',
                setter: setClientes,
                mapper: data => data
            }
        ];

        // Processa cada tabela individualmente
        const promises = tables.map(async (t) => {
            try {
                // Tenta buscar sem ordenação complexa para garantir velocidade
                const { data, error } = await supabase.from(t.name).select('*');

                if (error) {
                    console.error(`[FetchData] Erro em ${t.name}:`, error.message);
                    return { name: t.name, status: 'error' };
                }

                if (data) {
                    const mapped = t.mapper(data);
                    t.setter(mapped);
                    syncCount++;
                    console.log(`[FetchData] ${t.name} carregado: ${data.length} itens.`);
                    return { name: t.name, status: 'success', data: mapped };
                }
            } catch (err) {
                console.error(`[FetchData] Falha crítica em ${t.name}:`, err.message);
                return { name: t.name, status: 'exception' };
            }
        });

        const results = await Promise.all(promises);

        // Se alguma tabela carregou com sucesso
        if (syncCount > 0) {
            setLoading(false);
            setLastSync(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));

            // Salva backup atualizado
            try {
                const currentBackup = {
                    despesas: results.find(r => r?.name === 'despesas')?.data || despesas,
                    producao: results.find(r => r?.name === 'producao')?.data || producao,
                    vendas: results.find(r => r?.name === 'vendas')?.data || vendas,
                    clientes: results.find(r => r?.name === 'clientes')?.data || clientes,
                    lastUpdate: new Date().toISOString()
                };
                localStorage.setItem('claricinhas_backup', JSON.stringify(currentBackup));
            } catch (e) { console.warn('Erro ao atualizar backup:', e); }

        } else if (retryCount < 1) {
            console.log('[FetchData] Nenhuma tabela respondeu. Tentando novamente...');
            setTimeout(() => fetchData(retryCount + 1), 3000);
        } else {
            console.error('[FetchData] Falha total em todas as tabelas após retentativas.');
            setDbError('O banco de dados não está respondendo. Usando dados locais.');
            setLoading(false);
        }
    }

    const loadLocalBackup = () => {
        const saved = localStorage.getItem('claricinhas_backup');
        if (saved) {
            try {
                const backup = JSON.parse(saved);
                if (backup.despesas) setDespesas(backup.despesas);
                if (backup.producao) setProducao(backup.producao);
                if (backup.vendas) setVendas(backup.vendas);
                if (backup.clientes) setClientes(backup.clientes);
                return true;
            } catch (e) { console.error('Erro ao ler backup manual:', e); }
        }
        return false;
    };

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
                    {showBypass && (
                        <button
                            onClick={() => {
                                loadLocalBackup();
                                setLoading(false);
                                setDbError('Modo Offline: Usando dados salvos localmente.');
                                console.log('Bypass manual ativado pelo usuário - Carregou backup local');
                            }}
                            className="bypass-button"
                            style={{
                                marginTop: '20px',
                                padding: '10px 20px',
                                background: 'rgba(255,255,255,0.2)',
                                border: '1px solid white',
                                color: 'white',
                                borderRadius: '20px',
                                fontSize: '0.9rem',
                                cursor: 'pointer'
                            }}
                        >
                            Entrar sem Sincronizar
                        </button>
                    )}
                </div>
            </div>
        )

        switch (activePage) {
            case 'dashboard': return <Dashboard despesas={despesas} vendas={vendas} producao={producao} clientes={clientes} setActivePage={setActivePage} />
            case 'despesas': return <Despesas despesas={despesas} onAdd={addDespesa} onDelete={deleteDespesa} />
            case 'producao': return <Producao producao={producao} onAdd={addProducao} onDelete={deleteProducao} onUpdate={updateProducao} />
            case 'vendas': return <Vendas vendas={vendas} onAddVenda={addVenda} onDeleteVenda={deleteVenda} clientes={clientes} onAddCliente={addCliente} onDeleteCliente={deleteCliente} onUpdateCliente={updateCliente} producao={producao} onUpdateProducao={updateProducao} />
            case 'clientes': return <Clientes clientes={clientes} onAdd={addCliente} onDelete={deleteCliente} onUpdate={updateCliente} />
            case 'dados': return <Dados despesas={despesas} producao={producao} vendas={vendas} clientes={clientes} />
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
            <Sidebar
                activePage={activePage}
                setActivePage={setActivePage}
                counts={{
                    despesas: despesas.length,
                    producao: producao.length,
                    vendas: vendas.length,
                    clientes: clientes.length
                }}
                lastSync={lastSync}
                dbStatus={loading ? 'loading' : 'online'}
            />
            <main className="main-content">
                {renderPage()}
            </main>
        </div>
    )
}

export default App
