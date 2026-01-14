const API_URL = 'https://teste.clerky.com.br/api';
const USER_ID = 1;

let accounts = [];
let selectedAccount = null;
let messages = [];

// Carregar contas ao iniciar
document.addEventListener('DOMContentLoaded', () => {
  loadAccounts();
  checkConnectionStatus();
  setupEventListeners();
});

function setupEventListeners() {
  document.getElementById('connectBtn').addEventListener('click', connectAccount);
  document.getElementById('refreshBtn').addEventListener('click', () => {
    if (selectedAccount) loadMessages(selectedAccount.id);
  });
  document.getElementById('sendBtn').addEventListener('click', sendMessage);
}

async function loadAccounts() {
  try {
    console.log(`📥 Fetching accounts from ${API_URL}/instagram/accounts?userId=${USER_ID}`);
    const response = await fetch(`${API_URL}/instagram/accounts?userId=${USER_ID}`);
    const data = await response.json();
    
    console.log(`📥 Response:`, data);
    console.log(`📥 accounts:`, data.accounts);
    console.log(`📥 Type:`, typeof data.accounts);
    console.log(`📥 Is array:`, Array.isArray(data.accounts));
    console.log(`📥 Length:`, data.accounts?.length);
    
    accounts = data.accounts;
    console.log(`✅ accounts variable set to:`, accounts);
    renderAccounts();
  } catch (error) {
    console.error('❌ Erro ao carregar contas:', error);
  }
}

function renderAccounts() {
  const container = document.getElementById('accountsList');
  
  if (accounts.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma conta conectada. Clique em "Conectar Instagram" para começar.</p>';
    return;
  }
  
  container.innerHTML = accounts.map(account => `
    <div class="account-card ${selectedAccount?.id === account.id ? 'active' : ''}" 
         onclick="selectAccount(${account.id})">
      <div class="account-info">
        <h3>@${account.username}</h3>
        <p>${account.page_name || 'Sem página'}</p>
        <small>ID: ${account.instagram_account_id}</small>
      </div>
      <div class="account-status">
        <span class="status-badge">Ativa</span>
      </div>
    </div>
  `).join('');
}

function selectAccount(accountId) {
  selectedAccount = accounts.find(acc => acc.id === accountId);
  renderAccounts();
  showMessagesSection();
  loadMessages(accountId);
  
  // Auto-refresh
  if (window.messageInterval) clearInterval(window.messageInterval);
  window.messageInterval = setInterval(() => loadMessages(accountId), 5000);
}

function showMessagesSection() {
  document.getElementById('messagesSection').style.display = 'block';
  document.getElementById('messagesTitle').textContent = `Mensagens - @${selectedAccount.username}`;
}

async function loadMessages(accountId) {
  try {
    const response = await fetch(`${API_URL}/instagram/messages?accountId=${accountId}`);
    const data = await response.json();
    messages = data.messages;
    renderMessages();
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
  }
}

function renderMessages() {
  const container = document.getElementById('messagesList');
  document.getElementById('messagesCount').textContent = messages.length;
  
  if (messages.length === 0) {
    container.innerHTML = '<p class="empty-state">Nenhuma mensagem recebida ainda.</p>';
    return;
  }
  
  container.innerHTML = messages.map(msg => `
    <div class="message-card">
      <div class="message-header">
        <strong>De: ${msg.sender_id}</strong>
        <span class="message-time">${formatDate(msg.timestamp)}</span>
      </div>
      <div class="message-body">
        <p>${msg.text || '(sem texto)'}</p>
      </div>
      ${msg.replied ? `
        <div class="message-reply">
          <small>✅ Respondida: ${msg.reply_text}</small>
        </div>
      ` : ''}
    </div>
  `).join('');
}

async function sendMessage() {
  const recipientId = document.getElementById('recipientId').value.trim();
  const messageText = document.getElementById('messageText').value.trim();
  
  if (!selectedAccount || !recipientId || !messageText) {
    alert('Preencha todos os campos');
    return;
  }
  
  const sendBtn = document.getElementById('sendBtn');
  sendBtn.disabled = true;
  sendBtn.textContent = 'Enviando...';
  
  try {
    const response = await fetch(`${API_URL}/instagram/send-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accountId: selectedAccount.id,
        recipientId,
        message: messageText
      })
    });
    
    if (response.ok) {
      alert('✅ Mensagem enviada!');
      document.getElementById('messageText').value = '';
      loadMessages(selectedAccount.id);
    } else {
      const error = await response.json();
      alert('❌ Erro: ' + (error.error || 'Falha ao enviar'));
    }
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    alert('❌ Erro ao enviar mensagem');
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = '✉️ Enviar Mensagem';
  }
}

function connectAccount() {
  window.location.href = `${API_URL}/instagram/login?userId=${USER_ID}`;
}

function checkConnectionStatus() {
  const params = new URLSearchParams(window.location.search);
  if (params.get('connected') === 'success') {
    alert('✅ Conta conectada com sucesso!');
    window.history.replaceState({}, '', '/');
    loadAccounts();
  } else if (params.get('error')) {
    alert('❌ Erro ao conectar conta: ' + params.get('error'));
    window.history.replaceState({}, '', '/');
  }
}

function formatDate(timestamp) {
  if (!timestamp) return '-';
  const date = new Date(parseInt(timestamp));
  return date.toLocaleString('pt-BR');
}
