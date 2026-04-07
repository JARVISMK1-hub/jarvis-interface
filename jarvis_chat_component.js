// JARVIS Chat Component with Full Conversation History
// This component maintains conversation context and auto-scrolls as messages appear
// Place this in your jarvis-interface project

class JARVISChat {
    constructor(containerId, apiUrl = 'https://jarvis-backend-j123.onrender.com') {
        this.container = document.getElementById(containerId);
        this.apiUrl = apiUrl;
        this.messages = []; // Full conversation history
        this.conversationId = this.generateConversationId();
        this.userId = 'sir';
        this.isProcessing = false;
        
        this.init();
    }
    
    generateConversationId() {
        const timestamp = new Date().toISOString().replace(/[-:]/g, '').split('.')[0];
        return `conv_${timestamp}`;
    }
    
    init() {
        this.render();
        this.attachEventListeners();
        this.addWelcomeMessage();
    }
    
    render() {
        this.container.innerHTML = `
            <div class="jarvis-chat-container">
                <div class="chat-header">
                    <div class="status-indicator active"></div>
                    <span class="chat-title">JARVIS</span>
                    <button class="clear-chat-btn" id="clearChatBtn">Clear</button>
                </div>
                
                <div class="messages-container" id="messagesContainer">
                    <!-- Messages will be inserted here -->
                </div>
                
                <div class="input-container">
                    <textarea 
                        id="messageInput" 
                        placeholder="Speak to JARVIS, Sir..."
                        rows="1"
                    ></textarea>
                    <button id="sendBtn" class="send-btn">
                        <span class="send-icon">➤</span>
                    </button>
                </div>
            </div>
        `;
        
        this.addStyles();
    }
    
    addStyles() {
        if (document.getElementById('jarvis-chat-styles')) return;
        
        const style = document.createElement('style');
        style.id = 'jarvis-chat-styles';
        style.textContent = `
            .jarvis-chat-container {
                display: flex;
                flex-direction: column;
                height: 100%;
                background: rgba(0, 20, 40, 0.95);
                border: 1px solid #00d4ff;
                border-radius: 8px;
                overflow: hidden;
            }
            
            .chat-header {
                display: flex;
                align-items: center;
                padding: 15px 20px;
                background: rgba(0, 40, 80, 0.8);
                border-bottom: 1px solid #00d4ff;
            }
            
            .status-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-right: 10px;
                background: #ff0000;
            }
            
            .status-indicator.active {
                background: #00ff00;
                box-shadow: 0 0 10px #00ff00;
            }
            
            .chat-title {
                color: #00d4ff;
                font-size: 18px;
                font-weight: bold;
                flex: 1;
            }
            
            .clear-chat-btn {
                background: transparent;
                border: 1px solid #00d4ff;
                color: #00d4ff;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
                transition: all 0.3s;
            }
            
            .clear-chat-btn:hover {
                background: #00d4ff;
                color: #000;
            }
            
            .messages-container {
                flex: 1;
                overflow-y: auto;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 15px;
            }
            
            .message {
                display: flex;
                flex-direction: column;
                max-width: 80%;
                animation: fadeIn 0.3s ease-in;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .message.user {
                align-self: flex-end;
            }
            
            .message.assistant {
                align-self: flex-start;
            }
            
            .message-content {
                padding: 12px 16px;
                border-radius: 8px;
                line-height: 1.5;
                word-wrap: break-word;
            }
            
            .message.user .message-content {
                background: rgba(0, 212, 255, 0.2);
                border: 1px solid #00d4ff;
                color: #fff;
            }
            
            .message.assistant .message-content {
                background: rgba(0, 100, 200, 0.2);
                border: 1px solid #0066cc;
                color: #fff;
            }
            
            .message-timestamp {
                font-size: 10px;
                color: #888;
                margin-top: 4px;
                padding: 0 4px;
            }
            
            .message.user .message-timestamp {
                text-align: right;
            }
            
            .typing-indicator {
                display: flex;
                gap: 4px;
                padding: 12px 16px;
                background: rgba(0, 100, 200, 0.2);
                border: 1px solid #0066cc;
                border-radius: 8px;
                width: fit-content;
            }
            
            .typing-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #00d4ff;
                animation: typing 1.4s infinite;
            }
            
            .typing-dot:nth-child(2) { animation-delay: 0.2s; }
            .typing-dot:nth-child(3) { animation-delay: 0.4s; }
            
            @keyframes typing {
                0%, 60%, 100% { opacity: 0.3; transform: scale(0.8); }
                30% { opacity: 1; transform: scale(1); }
            }
            
            .input-container {
                display: flex;
                gap: 10px;
                padding: 15px 20px;
                background: rgba(0, 40, 80, 0.8);
                border-top: 1px solid #00d4ff;
            }
            
            #messageInput {
                flex: 1;
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid #00d4ff;
                border-radius: 4px;
                color: #fff;
                padding: 10px;
                font-size: 14px;
                resize: none;
                font-family: inherit;
                max-height: 120px;
            }
            
            #messageInput:focus {
                outline: none;
                border-color: #00ffff;
                box-shadow: 0 0 10px rgba(0, 212, 255, 0.3);
            }
            
            .send-btn {
                background: #00d4ff;
                border: none;
                border-radius: 4px;
                width: 50px;
                cursor: pointer;
                transition: all 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .send-btn:hover {
                background: #00ffff;
                box-shadow: 0 0 15px rgba(0, 212, 255, 0.5);
            }
            
            .send-btn:disabled {
                background: #555;
                cursor: not-allowed;
                opacity: 0.5;
            }
            
            .send-icon {
                color: #000;
                font-size: 20px;
                font-weight: bold;
            }
            
            /* Scrollbar styling */
            .messages-container::-webkit-scrollbar {
                width: 8px;
            }
            
            .messages-container::-webkit-scrollbar-track {
                background: rgba(0, 0, 0, 0.3);
            }
            
            .messages-container::-webkit-scrollbar-thumb {
                background: #00d4ff;
                border-radius: 4px;
            }
            
            .messages-container::-webkit-scrollbar-thumb:hover {
                background: #00ffff;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    attachEventListeners() {
        const sendBtn = document.getElementById('sendBtn');
        const messageInput = document.getElementById('messageInput');
        const clearBtn = document.getElementById('clearChatBtn');
        
        sendBtn.addEventListener('click', () => this.sendMessage());
        
        messageInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.sendMessage();
            }
        });
        
        // Auto-resize textarea
        messageInput.addEventListener('input', (e) => {
            e.target.style.height = 'auto';
            e.target.style.height = e.target.scrollHeight + 'px';
        });
        
        clearBtn.addEventListener('click', () => this.clearConversation());
    }
    
    addWelcomeMessage() {
        this.addMessage('assistant', 'Good day, Sir. JARVIS at your service. How may I assist you?');
    }
    
    addMessage(role, content, timestamp = null) {
        const message = {
            role: role,
            content: content,
            timestamp: timestamp || new Date().toISOString()
        };
        
        this.messages.push(message);
        this.renderMessage(message);
        this.scrollToBottom();
    }
    
    renderMessage(message) {
        const messagesContainer = document.getElementById('messagesContainer');
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${message.role}`;
        
        const time = new Date(message.timestamp).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit'
        });
        
        messageDiv.innerHTML = `
            <div class="message-content">${this.formatMessage(message.content)}</div>
            <div class="message-timestamp">${time}</div>
        `;
        
        messagesContainer.appendChild(messageDiv);
    }
    
    formatMessage(content) {
        // Basic formatting - convert line breaks to <br>
        return content.replace(/\n/g, '<br>');
    }
    
    showTypingIndicator() {
        const messagesContainer = document.getElementById('messagesContainer');
        
        const typingDiv = document.createElement('div');
        typingDiv.id = 'typingIndicator';
        typingDiv.className = 'message assistant';
        typingDiv.innerHTML = `
            <div class="typing-indicator">
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
                <div class="typing-dot"></div>
            </div>
        `;
        
        messagesContainer.appendChild(typingDiv);
        this.scrollToBottom();
    }
    
    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    scrollToBottom() {
        const messagesContainer = document.getElementById('messagesContainer');
        setTimeout(() => {
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }, 100);
    }
    
    async sendMessage() {
        const messageInput = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendBtn');
        const message = messageInput.value.trim();
        
        if (!message || this.isProcessing) return;
        
        // Disable input
        this.isProcessing = true;
        sendBtn.disabled = true;
        messageInput.disabled = true;
        
        // Add user message to UI and conversation history
        this.addMessage('user', message);
        
        // Clear input
        messageInput.value = '';
        messageInput.style.height = 'auto';
        
        // Show typing indicator
        this.showTypingIndicator();
        
        try {
            // Send FULL conversation history to backend
            const response = await fetch(`${this.apiUrl}/api/chat/message`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messages: this.messages, // Send entire conversation
                    user_id: this.userId,
                    conversation_id: this.conversationId,
                    use_memory: true
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            // Hide typing indicator
            this.hideTypingIndicator();
            
            // Add assistant response
            this.addMessage('assistant', data.response);
            
            console.log(`✅ Message sent. Total messages: ${data.message_count}`);
            console.log(`💾 Memory context used: ${data.memory_context_used}`);
            
        } catch (error) {
            console.error('Error sending message:', error);
            this.hideTypingIndicator();
            this.addMessage('assistant', 'My apologies, Sir. I encountered an error processing your request. Please try again.');
        } finally {
            // Re-enable input
            this.isProcessing = false;
            sendBtn.disabled = false;
            messageInput.disabled = false;
            messageInput.focus();
        }
    }
    
    clearConversation() {
        if (!confirm('Clear conversation history? This will start a fresh conversation.')) {
            return;
        }
        
        this.messages = [];
        this.conversationId = this.generateConversationId();
        
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        
        this.addWelcomeMessage();
        
        console.log('🗑️ Conversation cleared. New conversation ID:', this.conversationId);
    }
    
    // Public method to get conversation history
    getConversationHistory() {
        return this.messages;
    }
    
    // Public method to load conversation history
    loadConversationHistory(messages) {
        this.messages = messages;
        const messagesContainer = document.getElementById('messagesContainer');
        messagesContainer.innerHTML = '';
        
        messages.forEach(msg => this.renderMessage(msg));
        this.scrollToBottom();
    }
}

// Initialize JARVIS Chat when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Create chat instance
    // Make sure you have a div with id="jarvisChatContainer" in your HTML
    window.jarvisChat = new JARVISChat('jarvisChatContainer');
    
    console.log('🤖 JARVIS Chat initialized with full conversation context');
});

// Export for use in other modules if needed
if (typeof module !== 'undefined' && module.exports) {
    module.exports = JARVISChat;
}
