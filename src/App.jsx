import { useState, useEffect } from 'react'
import axios from 'axios'
import './App.css'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
const USER_ID = 1 // Em produção, viria do sistema de autenticação

function App() {
  const [accounts, setAccounts] = useState([])
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const [recipientId, setRecipientId] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadAccounts()
    
    // Verificar se acabou de conectar uma conta
    const params = new URLSearchParams(window.location.search)
    if (params.get('connected') === 'success') {
      alert('✅ Conta conectada com sucesso!')
      window.history.replaceState({}, '', '/')
      loadAccounts()
    } else if (params.get('error')) {
      alert('❌ Erro ao conectar conta: ' + params.get('error'))
      window.history.replaceState({}, '', '/')
    }
  }, [])

  useEffect(() => {
    if (selectedAccount) {
      loadMessages(selectedAccount.id)
      
      // Auto-refresh a cada 5 segundos
      const interval = setInterval(() => {
        loadMessages(selectedAccount.id)
      }, 5000)
      
      return () => clearInterval(interval)
    }
  }, [selectedAccount])

  const loadAccounts = async () => {
    try {
      const response = await axios.get(`${API_URL}/instagram/accounts?userId=${USER_ID}`)
      setAccounts(response.data.accounts)
    } catch (error) {
      console.error('Erro ao carregar contas:', error)
    }
  }

  const loadMessages = async (accountId) => {
    try {
      const response = await axios.get(`${API_URL}/instagram/messages?accountId=${accountId}`)
      setMessages(response.data.messages)
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error)
    }
  }

  const connectAccount = () => {
    window.location.href = `${API_URL}/instagram/login?userId=${USER_ID}`
  }

  const sendMessage = async () => {
    if (!selectedAccount || !recipientId || !newMessage) {
      alert('Preencha todos os campos')
      return
    }

    setLoading(true)
    try {
      await axios.post(`${API_URL}/instagram/send-message`, {
        accountId: selectedAccount.id,
        recipientId,
        message: newMessage
      })
      
      alert('✅ Mensagem enviada!')
      setNewMessage('')
      loadMessages(selectedAccount.id)
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error)
      alert('❌ Erro ao enviar mensagem: ' + (error.response?.data?.error || error.message))
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (timestamp) => {
    if (!timestamp) return '-'
    const date = new Date(parseInt(timestamp))
    return date.toLocaleString('pt-BR')
  }

  return (
    <div className="app">
      <header className="header">
        <h1>📱 Instagram Test - Meta Developers</h1>
        <p>Sistema de teste para automação de DMs e comentários</p>
      </header>

      <div className="container">
        {/* Seção de Contas */}
        <div className="section">
          <div className="section-header">
            <h2>Contas Conectadas</h2>
            <button onClick={connectAccount} className="btn-primary">
              + Conectar Instagram
            </button>
          </div>

          <div className="accounts-list">
            {accounts.length === 0 ? (
              <p className="empty-state">Nenhuma conta conectada. Clique em "Conectar Instagram" para começar.</p>
            ) : (
              accounts.map(account => (
                <div 
                  key={account.id} 
                  className={`account-card ${selectedAccount?.id === account.id ? 'active' : ''}`}
                  onClick={() => setSelectedAccount(account)}
                >
                  <div className="account-info">
                    <h3>@{account.username}</h3>
                    <p>{account.page_name}</p>
                    <small>ID: {account.instagram_account_id}</small>
                  </div>
                  <div className="account-status">
                    <span className="status-badge">Ativa</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Seção de Mensagens */}
        {selectedAccount && (
          <div className="section">
            <div className="section-header">
              <h2>Mensagens - @{selectedAccount.username}</h2>
              <button onClick={() => loadMessages(selectedAccount.id)} className="btn-secondary">
                🔄 Atualizar
              </button>
            </div>

            {/* Enviar Mensagem */}
            <div className="send-message">
              <h3>Enviar Mensagem</h3>
              <input
                type="text"
                placeholder="ID do destinatário (ex: 909062018212935)"
                value={recipientId}
                onChange={(e) => setRecipientId(e.target.value)}
                className="input"
              />
              <textarea
                placeholder="Digite sua mensagem..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                className="textarea"
                rows="3"
              />
              <button 
                onClick={sendMessage} 
                disabled={loading}
                className="btn-primary"
              >
                {loading ? 'Enviando...' : '✉️ Enviar Mensagem'}
              </button>
            </div>

            {/* Lista de Mensagens */}
            <div className="messages-list">
              <h3>Mensagens Recebidas ({messages.length})</h3>
              {messages.length === 0 ? (
                <p className="empty-state">Nenhuma mensagem recebida ainda.</p>
              ) : (
                <div className="messages-container">
                  {messages.map(msg => (
                    <div key={msg.id} className="message-card">
                      <div className="message-header">
                        <strong>De: {msg.sender_id}</strong>
                        <span className="message-time">{formatDate(msg.timestamp)}</span>
                      </div>
                      <div className="message-body">
                        <p>{msg.text}</p>
                      </div>
                      {msg.replied && (
                        <div className="message-reply">
                          <small>✅ Respondida: {msg.reply_text}</small>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default App
