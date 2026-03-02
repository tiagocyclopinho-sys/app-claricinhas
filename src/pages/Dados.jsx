import React, { useState } from 'react'
import { Database, Download, Upload, Trash2, AlertTriangle, CheckCircle2 } from 'lucide-react'
import './Dados.css'

function Dados({ despesas, producao, vendas, clientes }) {
    const [status, setStatus] = useState({ type: '', message: '' })

    const handleExport = () => {
        const data = {
            despesas,
            producao,
            vendas,
            clientes,
            exportDate: new Date().toISOString(),
            version: '1.0.0'
        }
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `backup_claricinhas_${new Date().toISOString().split('T')[0]}.json`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        setStatus({ type: 'success', message: 'Backup exportado com sucesso!' })
    }

    const handleImport = (e) => {
        const file = e.target.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = (event) => {
            try {
                const data = JSON.parse(event.target.result)
                if (!data.despesas && !data.vendas) {
                    throw new Error('Formato de arquivo inválido.')
                }

                // Aqui poderíamos chamar uma função de 'mega update' no App.jsx
                // Por enquanto, vamos apenas avisar que os dados foram lidos
                console.log('Dados importados:', data)
                alert('Atenção: A função de importação sobrescreve dados locais. Entre em contato com o suporte para concluir a migração para o Banco de Dados se necessário.')

                setStatus({ type: 'success', message: 'Arquivo lido. Sincronize com o banco para salvar.' })
            } catch (err) {
                setStatus({ type: 'error', message: 'Erro ao ler arquivo: ' + err.message })
            }
        }
        reader.readAsText(file)
    }

    return (
        <div className="dados-page">
            <header className="page-header">
                <h1>Gerenciamento de Dados</h1>
            </header>

            <div className="dados-grid">
                <section className="dados-card glass-card">
                    <div className="card-icon export">
                        <Download size={32} />
                    </div>
                    <h3>Exportar Backup</h3>
                    <p>Baixe todos os dados do sistema (vendas, estoque, clientes) em um arquivo JSON para segurança.</p>
                    <button className="add-btn" onClick={handleExport}>
                        Gerar Arquivo .json
                    </button>
                </section>

                <section className="dados-card glass-card">
                    <div className="card-icon import">
                        <Upload size={32} />
                    </div>
                    <h3>Importar Dados</h3>
                    <p>Carregue dados de um arquivo de backup anterior.</p>
                    <div className="file-input-wrapper">
                        <input type="file" accept=".json" onChange={handleImport} id="import-json" />
                        <label htmlFor="import-json" className="secondary-btn">
                            Selecionar Arquivo
                        </label>
                    </div>
                </section>

                <section className="dados-card glass-card warning">
                    <div className="card-icon danger">
                        <AlertTriangle size={32} />
                    </div>
                    <h3>Limpar Cache</h3>
                    <p>Apaga o backup local do navegador. Não afeta os dados no Supabase.</p>
                    <button className="delete-card-btn" style={{ width: '100%' }} onClick={() => {
                        if (window.confirm('Deseja limpar o backup local?')) {
                            localStorage.removeItem('claricinhas_backup');
                            alert('Cache limpo.');
                        }
                    }}>
                        Limpar Agora
                    </button>
                </section>
            </div>

            {status.message && (
                <div className={`status-banner ${status.type}`}>
                    {status.type === 'success' ? <CheckCircle2 size={20} /> : <AlertTriangle size={20} />}
                    {status.message}
                </div>
            )}
        </div>
    )
}

export default Dados
