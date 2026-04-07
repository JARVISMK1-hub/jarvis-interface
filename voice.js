// JARVIS Voice System - Movie-Quality Voice
console.log('🚀 JARVIS Voice Loading - Movie Voice Mode');

class JarvisVoice {
    constructor() {
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.conversationMode = false;
        this.voices = [];
        this.jarvisVoice = null;
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
        
        // Load voices for better selection
        this.loadVoices();
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
        setTimeout(() => this.loadVoices(), 100);
        
        this.setupUI();
        console.log('✅ JARVIS Voice ready');
    }
    
    loadVoices() {
        this.voices = this.synthesis.getVoices();
        
        if (this.voices.length === 0) {
            console.log('⏳ Waiting for voices...');
            return;
        }
        
        console.log(`📢 ${this.voices.length} voices available`);
        
        // Select best JARVIS-like voice (British male preferred)
        const preferences = [
            'Google UK English Male',
            'Daniel',
            'Microsoft David',
            'Alex',
            'Google US English'
        ];
        
        for (let name of preferences) {
            this.jarvisVoice = this.voices.find(v => v.name.includes(name));
            if (this.jarvisVoice) {
                console.log(`🎙️ Selected: ${this.jarvisVoice.name}`);
                break;
            }
        }
        
        // Fallback
        if (!this.jarvisVoice) {
            this.jarvisVoice = this.voices.find(v => v.lang.startsWith('en-')) || this.voices[0];
            console.log(`🎙️ Using fallback: ${this.jarvisVoice?.name || 'default'}`);
        }
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
            await this.speak('I encountered an error, sir.');
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
            
            // Clean text for natural speech
            const cleanText = text
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
                .replace(/#{1,6}\s/g, '')
                .replace(/```[\s\S]*?```/g, 'code block')
                .replace(/`([^`]+)`/g, '$1')
                .replace(/\n+/g, '. ')
                .trim();
            
            if (!cleanText) {
                console.warn('⚠️ No text to speak');
                resolve();
                return;
            }
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            // Set voice if available
            if (this.jarvisVoice) {
                utterance.voice = this.jarvisVoice;
                console.log(`🎙️ Using: ${this.jarvisVoice.name}`);
            }
            
            // ===== MOVIE JARVIS VOICE SETTINGS =====
            // Natural, conversational pace like the movies
            utterance.rate = 1.2;       // Faster, more natural (movie JARVIS speaks quickly)
            utterance.pitch = 0.8;       // Slightly deeper, professional
            utterance.volume = 1.0;      // Maximum volume
            utterance.lang = 'en-GB';    // British English (JARVIS accent)
            
            console.log('🎬 Movie JARVIS settings:', {
                rate: utterance.rate,
                pitch: utterance.pitch,
                volume: utterance.volume,
                voice: this.jarvisVoice?.name || 'default'
            });
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.updateStatus('JARVIS speaking...');
                this.updateButton('speaking');
                console.log('🔊 Speech started');
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.updateStatus('');
                this.updateButton('idle');
                console.log('✅ Speech ended');
                resolve();
            };
            
            utterance.onerror = (event) => {
                console.error('❌ Speech error:', event.error);
                this.isSpeaking = false;
                this.updateButton('idle');
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
    console.log('🎬 Initializing JARVIS - Movie Voice Mode');
    jarvisVoice = new JarvisVoice();
});

console.log('✅ voice.js loaded - Movie JARVIS Voice Active');
