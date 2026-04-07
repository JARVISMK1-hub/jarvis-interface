// JARVIS Voice System - MAXIMUM VOLUME VERSION
console.log('🚀 JARVIS Voice Loading...');

class JarvisVoice {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.conversationMode = false;
        this.API_BASE = 'https://jarvis-backend-j123.onrender.com';
        
        console.log('✅ JarvisVoice initialized');
        this.init();
    }
    
    init() {
        // Speech Recognition
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            
            this.recognition.onstart = () => this.onListenStart();
            this.recognition.onresult = (event) => this.onResult(event);
            this.recognition.onerror = (event) => this.onError(event);
            this.recognition.onend = () => this.onListenEnd();
            
            console.log('✅ Speech recognition ready');
        }
        
        this.setupUI();
        console.log('✅ JARVIS Voice ready');
    }
    
    setupUI() {
        const voiceBtn = document.getElementById('voiceBtn');
        const conversationToggle = document.getElementById('conversationMode');
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleListening());
        }
        
        if (conversationToggle) {
            conversationToggle.addEventListener('change', (e) => {
                this.conversationMode = e.target.checked;
                this.updateStatus(this.conversationMode ? 'Conversation mode active' : '');
            });
        }
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' && !e.repeat && 
                document.activeElement.tagName !== 'INPUT' && 
                document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                if (!this.isListening) this.startListening();
            }
            
            if (e.code === 'Escape') {
                this.stopEverything();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space' && this.isListening && !this.conversationMode) {
                e.preventDefault();
                this.stopListening();
            }
        });
    }
    
    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    startListening() {
        if (!this.recognition) {
            this.updateStatus('Speech recognition not supported');
            return;
        }
        
        if (this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
        
        try {
            this.recognition.start();
            console.log('🎤 Listening...');
        } catch (e) {
            console.error('Error:', e);
        }
    }
    
    stopListening() {
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    stopEverything() {
        this.stopListening();
        this.synthesis.cancel();
        this.isSpeaking = false;
        this.updateStatus('');
        this.updateButton('idle');
    }
    
    onListenStart() {
        this.isListening = true;
        this.updateButton('listening');
        this.updateStatus('Listening...');
    }
    
    onResult(event) {
        const results = event.results;
        const current = results[results.length - 1];
        const transcript = current[0].transcript;
        
        if (current.isFinal) {
            console.log('📝 Heard:', transcript);
            this.processTranscript(transcript);
        } else {
            this.updateStatus(`"${transcript}"`);
        }
    }
    
    onError(event) {
        console.error('Speech error:', event.error);
        const errors = {
            'no-speech': 'No speech detected',
            'audio-capture': 'No microphone found',
            'not-allowed': 'Microphone access denied',
            'network': 'Network error'
        };
        this.updateStatus(errors[event.error] || `Error: ${event.error}`);
        setTimeout(() => this.updateStatus(''), 3000);
    }
    
    onListenEnd() {
        this.isListening = false;
        this.updateButton('idle');
        
        if (this.conversationMode && !this.isSpeaking) {
            setTimeout(() => this.startListening(), 500);
        }
    }
    
    async processTranscript(transcript) {
        this.updateStatus('Processing...');
        this.updateButton('processing');
        
        try {
            const response = await fetch(`${this.API_BASE}/api/voice/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: transcript,
                    user: 'Jakob Brunsell'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('💬 Response:', data.response);
            
            if (data.response) {
                this.displayMessage('user', transcript);
                this.displayMessage('assistant', data.response);
                await this.speak(data.response);
            }
        } catch (error) {
            console.error('Error:', error);
            this.updateStatus('Error processing request');
            await this.speak('I encountered an error.');
        }
        
        this.updateButton('idle');
        
        if (this.conversationMode) {
            setTimeout(() => this.startListening(), 1000);
        }
    }
    
    speak(text) {
        return new Promise((resolve) => {
            console.log('🗣️ Speaking:', text.substring(0, 50) + '...');
            
            // Cancel any ongoing speech
            this.synthesis.cancel();
            
            // Clean text
            const cleanText = text
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
                .replace(/#{1,6}\s/g, '')
                .replace(/```[\s\S]*?```/g, 'code block')
                .replace(/`([^`]+)`/g, '$1')
                .trim();
            
            if (!cleanText) {
                resolve();
                return;
            }
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            // MAXIMUM VOLUME SETTINGS
            utterance.volume = 1.0;  // Maximum volume (0.0 to 1.0)
            utterance.rate = 1.0;    // Normal speed (increased from 0.95 for clarity)
            utterance.pitch = 0.9;   // Slightly deeper (increased from 0.85 for better projection)
            utterance.lang = 'en-GB'; // British English
            
            console.log('🔊 Volume set to MAXIMUM (1.0)');
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.updateStatus('JARVIS speaking...');
                this.updateButton('speaking');
                console.log('🔊 Speech started at MAX VOLUME');
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.updateStatus('');
                this.updateButton('idle');
                console.log('✅ Speech ended');
                resolve();
            };
            
            utterance.onerror = (event) => {
                console.error('Speech error:', event.error);
                this.isSpeaking = false;
                resolve();
            };
            
            // Speak immediately
            this.synthesis.speak(utterance);
        });
    }
    
    displayMessage(role, content) {
        const event = new CustomEvent('addMessage', {
            detail: { role, content }
        });
        window.dispatchEvent(event);
    }
    
    updateStatus(message) {
        const el = document.getElementById('voiceStatus');
        if (el) el.textContent = message;
    }
    
    updateButton(state) {
        const btn = document.getElementById('voiceBtn');
        if (!btn) return;
        
        btn.classList.remove('listening', 'processing', 'speaking');
        if (state !== 'idle') btn.classList.add(state);
    }
}

// Initialize
let jarvisVoice;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🎬 Initializing JARVIS...');
    jarvisVoice = new JarvisVoice();
});

console.log('✅ voice.js loaded');
