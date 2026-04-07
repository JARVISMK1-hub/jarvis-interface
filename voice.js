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
        } else {
            console.error('Speech recognition not supported');
        }
        
        // Load voices - CRITICAL FIX
        this.loadVoices();
        
        // Voices load asynchronously, so we need to wait for them
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => {
                console.log('Voices loaded');
                this.loadVoices();
            };
        }
        
        // Force load voices after a delay (Safari fix)
        setTimeout(() => this.loadVoices(), 100);
        
        this.setupUI();
    }
    
    loadVoices() {
        this.voices = this.synthesis.getVoices();
        console.log('Available voices:', this.voices.length);
        
        if (this.voices.length === 0) {
            console.warn('No voices loaded yet, will retry...');
            return;
        }
        
        // JARVIS-like voice preferences (British/Professional male voices)
        const preferences = [
            'Google UK English Male',
            'Daniel',
            'Microsoft David Desktop',
            'Alex',
            'Google US English',
            'Microsoft Mark'
        ];
        
        for (let name of preferences) {
            this.jarvisVoice = this.voices.find(v => v.name.includes(name));
            if (this.jarvisVoice) {
                console.log('Selected voice:', this.jarvisVoice.name);
                break;
            }
        }
        
        // Fallback to any English male voice
        if (!this.jarvisVoice) {
            this.jarvisVoice = this.voices.find(v => 
                v.lang.startsWith('en-') && v.name.toLowerCase().includes('male')
            );
        }
        
        // Final fallback to first English voice
        if (!this.jarvisVoice) {
            this.jarvisVoice = this.voices.find(v => v.lang.startsWith('en-'));
        }
        
        // Absolute fallback
        if (!this.jarvisVoice && this.voices.length > 0) {
            this.jarvisVoice = this.voices[0];
        }
        
        if (this.jarvisVoice) {
            console.log('JARVIS voice ready:', this.jarvisVoice.name);
        } else {
            console.error('No voice available!');
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
        } catch (e) {
            console.error('Recognition start error:', e);
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
            
            const data = await response.json();
            
            if (data.response) {
                this.displayMessage('user', transcript);
                this.displayMessage('assistant', data.response);
                
                // CRITICAL: Wait for voices to load before speaking
                if (this.voices.length === 0) {
                    console.log('Waiting for voices to load...');
                    await this.waitForVoices();
                }
                
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
    
    // NEW: Wait for voices to load
    waitForVoices() {
        return new Promise((resolve) => {
            let attempts = 0;
            const checkVoices = () => {
                this.loadVoices();
                if (this.voices.length > 0 || attempts > 10) {
                    resolve();
                } else {
                    attempts++;
                    setTimeout(checkVoices, 100);
                }
            };
            checkVoices();
        });
    }
    
    speak(text) {
        return new Promise((resolve) => {
            // Cancel any ongoing speech
            this.synthesis.cancel();
            
            // Clean text for speech
            const cleanText = text
                .replace(/\*\*/g, '')
                .replace(/\*/g, '')
                .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
                .replace(/#{1,6}\s/g, '')
                .replace(/```[\s\S]*?```/g, 'code block')
                .replace(/`([^`]+)`/g, '$1')
                .trim();
            
            if (!cleanText) {
                console.warn('No text to speak');
                resolve();
                return;
            }
            
            console.log('Speaking:', cleanText.substring(0, 50) + '...');
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            // Set voice if available
            if (this.jarvisVoice) {
                utterance.voice = this.jarvisVoice;
                console.log('Using voice:', this.jarvisVoice.name);
            } else {
                console.warn('No JARVIS voice set, using default');
            }
            
            // JARVIS-like voice settings
            utterance.rate = 0.95;
            utterance.pitch = 0.85;
            utterance.volume = 1.0;
            utterance.lang = 'en-GB'; // British English
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.updateStatus('JARVIS speaking...');
                this.updateButton('speaking');
                console.log('Speech started');
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.updateStatus('');
                this.updateButton('idle');
                console.log('Speech ended');
                resolve();
            };
            
            utterance.onerror = (event) => {
                console.error('Speech error:', event);
                this.isSpeaking = false;
                this.updateStatus('');
                this.updateButton('idle');
                resolve();
            };
            
            // Small delay to ensure synthesis is ready
            setTimeout(() => {
                this.synthesis.speak(utterance);
            }, 50);
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
    jarvisVoice = new JarvisVoice();
    
    // Test voice synthesis on first user interaction
    document.addEventListener('click', function testVoice() {
        if (jarvisVoice && jarvisVoice.voices.length === 0) {
            jarvisVoice.loadVoices();
        }
        document.removeEventListener('click', testVoice);
    }, { once: true });
});
