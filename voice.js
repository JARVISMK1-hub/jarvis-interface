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
        
        this.init();
    }
    
    init() {
        // Speech Recognition Setup
        if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
            this.recognition = new SpeechRecognition();
            this.recognition.continuous = false;
            this.recognition.interimResults = true;
            this.recognition.lang = 'en-US';
            this.recognition.maxAlternatives = 1;
            
            this.recognition.onstart = () => this.onListenStart();
            this.recognition.onresult = (event) => this.onResult(event);
            this.recognition.onerror = (event) => this.onError(event);
            this.recognition.onend = () => this.onListenEnd();
        } else {
            console.error('Speech recognition not supported in this browser');
            alert('Voice features require Chrome, Edge, or Safari');
        }
        
        // Load TTS voices
        this.loadVoices();
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => this.loadVoices();
        }
        
        this.setupUI();
    }
    
    loadVoices() {
        this.voices = this.synthesis.getVoices();
        
        // JARVIS-like voice preferences (British/professional male voices)
        const preferences = [
            'Google UK English Male',
            'Daniel',
            'Microsoft David Desktop',
            'Alex',
            'Google US English'
        ];
        
        for (let name of preferences) {
            this.jarvisVoice = this.voices.find(v => v.name.includes(name));
            if (this.jarvisVoice) {
                console.log('JARVIS voice selected:', this.jarvisVoice.name);
                break;
            }
        }
        
        // Fallback to any English voice
        if (!this.jarvisVoice) {
            this.jarvisVoice = this.voices.find(v => v.lang.startsWith('en-')) || this.voices[0];
            console.log('Fallback voice selected:', this.jarvisVoice?.name);
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
            // Space bar for push-to-talk (only when not typing)
            if (e.code === 'Space' && !e.repeat && 
                document.activeElement.tagName !== 'INPUT' && 
                document.activeElement.tagName !== 'TEXTAREA') {
                e.preventDefault();
                if (!this.isListening) this.startListening();
            }
            
            // Escape to stop everything
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
        
        // Stop any ongoing speech
        if (this.isSpeaking) {
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
        
        try {
            this.recognition.start();
        } catch (e) {
            console.error('Recognition start error:', e);
            // Recognition might already be running
            if (e.message.includes('already started')) {
                this.stopListening();
                setTimeout(() => this.startListening(), 100);
            }
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
            console.log('Final transcript:', transcript);
            this.processTranscript(transcript);
        } else {
            // Show interim results
            this.updateStatus(`"${transcript}"`);
        }
    }
    
    onError(event) {
        console.error('Speech recognition error:', event.error);
        
        const errors = {
            'no-speech': 'No speech detected',
            'audio-capture': 'No microphone found',
            'not-allowed': 'Microphone access denied - please allow microphone access',
            'network': 'Network error occurred',
            'aborted': 'Speech recognition aborted'
        };
        
        this.updateStatus(errors[event.error] || `Error: ${event.error}`);
        
        setTimeout(() => {
            if (!this.isListening) this.updateStatus('');
        }, 3000);
    }
    
    onListenEnd() {
        this.isListening = false;
        this.updateButton('idle');
        
        // Auto-restart in conversation mode (but not if speaking)
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
                headers: { 
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: transcript,
                    user: 'Jakob Brunsell'
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const data = await response.json();
            
            if (data.response) {
                // Display messages in chat
                this.displayMessage('user', transcript);
                this.displayMessage('assistant', data.response);
                
                // Speak the response
                await this.speak(data.response);
            } else {
                throw new Error('No response from JARVIS');
            }
        } catch (error) {
            console.error('Error processing transcript:', error);
            this.updateStatus('Error processing request');
            await this.speak('I encountered an error processing your request.');
        }
        
        this.updateButton('idle');
        
        // Continue conversation if in auto mode
        if (this.conversationMode) {
            setTimeout(() => this.startListening(), 1000);
        }
    }
    
    speak(text) {
        return new Promise((resolve) => {
            // Cancel any ongoing speech
            this.synthesis.cancel();
            
            // Clean text for better speech output
            const cleanText = this.cleanTextForSpeech(text);
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            if (this.jarvisVoice) {
                utterance.voice = this.jarvisVoice;
            }
            
            // JARVIS-like voice settings
            utterance.rate = 0.95;  // Slightly slower for clarity
            utterance.pitch = 0.85; // Lower pitch for authority
            utterance.volume = 1.0;
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.updateStatus('JARVIS speaking...');
                this.updateButton('speaking');
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.updateStatus('');
                this.updateButton('idle');
                resolve();
            };
            
            utterance.onerror = (event) => {
                console.error('Speech synthesis error:', event);
                this.isSpeaking = false;
                this.updateButton('idle');
                resolve();
            };
            
            this.synthesis.speak(utterance);
        });
    }
    
    cleanTextForSpeech(text) {
        return text
            .replace(/\*\*/g, '')              // Remove markdown bold
            .replace(/\*/g, '')                // Remove markdown italic
            .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1') // Remove markdown links
            .replace(/#{1,6}\s/g, '')          // Remove markdown headers
            .replace(/```[\s\S]*?```/g, 'code block') // Replace code blocks
            .replace(/`([^`]+)`/g, '$1')       // Remove inline code markers
            .replace(/\n+/g, '. ')             // Replace newlines with pauses
            .trim();
    }
    
    displayMessage(role, content) {
        // Dispatch custom event for chat UI to handle
        const event = new CustomEvent('addMessage', {
            detail: { role, content }
        });
        window.dispatchEvent(event);
        
        // Also log to console for debugging
        console.log(`${role}: ${content}`);
    }
    
    updateStatus(message) {
        const statusEl = document.getElementById('voiceStatus');
        if (statusEl) {
            statusEl.textContent = message;
        }
    }
    
    updateButton(state) {
        const btn = document.getElementById('voiceBtn');
        if (!btn) return;
        
        btn.classList.remove('listening', 'processing', 'speaking');
        
        if (state !== 'idle') {
            btn.classList.add(state);
        }
    }
}

// Initialize JARVIS Voice when DOM is ready
let jarvisVoice;
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing JARVIS Voice...');
    jarvisVoice = new JarvisVoice();
});
