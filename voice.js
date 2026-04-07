// JARVIS Voice System Test
console.log('=== VOICE.JS LOADED SUCCESSFULLY ===');
console.log('If you see this message, voice.js is loading correctly');

class JarvisVoice {
    constructor() {
        console.log('STEP 1: JarvisVoice constructor called');
        this.recognition = null;
        this.synthesis = window.speechSynthesis;
        this.isListening = false;
        this.isSpeaking = false;
        this.conversationMode = false;
        this.voices = [];
        this.jarvisVoice = null;
        this.API_BASE = 'https://jarvis-backend-j123.onrender.com';
        
        console.log('STEP 2: Starting initialization...');
        this.init();
    }
    
    init() {
        console.log('STEP 3: Init method called');
        
        // Speech Recognition Setup
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
            
            console.log('STEP 4: Speech recognition initialized');
        } else {
            console.error('STEP 4 FAILED: Speech recognition not supported');
        }
        
        // Load TTS voices
        console.log('STEP 5: Loading voices...');
        this.loadVoices();
        
        // Voices load asynchronously
        if (this.synthesis.onvoiceschanged !== undefined) {
            this.synthesis.onvoiceschanged = () => {
                console.log('STEP 6: Voices changed event fired');
                this.loadVoices();
            };
        }
        
        // Force load voices after delay
        setTimeout(() => {
            console.log('STEP 7: Delayed voice load attempt');
            this.loadVoices();
        }, 100);
        
        console.log('STEP 8: Setting up UI...');
        this.setupUI();
    }
    
    loadVoices() {
        this.voices = this.synthesis.getVoices();
        console.log(`VOICE LOAD: Found ${this.voices.length} voices`);
        
        if (this.voices.length === 0) {
            console.warn('WARNING: No voices loaded yet, will retry...');
            return;
        }
        
        // Log all available voices
        console.log('Available voices:', this.voices.map(v => v.name));
        
        // JARVIS-like voice preferences
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
                console.log(`SUCCESS: Selected JARVIS voice: ${this.jarvisVoice.name}`);
                break;
            }
        }
        
        // Fallback to any English male voice
        if (!this.jarvisVoice) {
            this.jarvisVoice = this.voices.find(v => 
                v.lang.startsWith('en-') && v.name.toLowerCase().includes('male')
            );
            if (this.jarvisVoice) {
                console.log(`FALLBACK: Using male voice: ${this.jarvisVoice.name}`);
            }
        }
        
        // Final fallback to first English voice
        if (!this.jarvisVoice) {
            this.jarvisVoice = this.voices.find(v => v.lang.startsWith('en-'));
            if (this.jarvisVoice) {
                console.log(`FALLBACK: Using English voice: ${this.jarvisVoice.name}`);
            }
        }
        
        // Absolute fallback
        if (!this.jarvisVoice && this.voices.length > 0) {
            this.jarvisVoice = this.voices[0];
            console.log(`FALLBACK: Using default voice: ${this.jarvisVoice.name}`);
        }
        
        if (!this.jarvisVoice) {
            console.error('ERROR: No voice available for JARVIS!');
        }
    }
    
    setupUI() {
        console.log('STEP 9: Setting up UI elements...');
        
        const voiceBtn = document.getElementById('voiceBtn');
        const conversationToggle = document.getElementById('conversationMode');
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleListening());
            console.log('STEP 10: Voice button connected');
        } else {
            console.error('STEP 10 FAILED: Voice button not found in DOM');
        }
        
        if (conversationToggle) {
            conversationToggle.addEventListener('change', (e) => {
                this.conversationMode = e.target.checked;
                this.updateStatus(this.conversationMode ? 'Conversation mode active' : '');
                console.log(`Conversation mode: ${this.conversationMode}`);
            });
            console.log('STEP 11: Conversation toggle connected');
        } else {
            console.error('STEP 11 FAILED: Conversation toggle not found');
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
        
        console.log('STEP 12: Keyboard shortcuts configured');
        console.log('=== JARVIS VOICE INITIALIZATION COMPLETE ===');
    }
    
    toggleListening() {
        console.log('Toggle listening called');
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
    
    startListening() {
        console.log('START LISTENING called');
        
        if (!this.recognition) {
            console.error('ERROR: No recognition object');
            this.updateStatus('Speech recognition not supported');
            return;
        }
        
        if (this.isSpeaking) {
            console.log('Cancelling ongoing speech...');
            this.synthesis.cancel();
            this.isSpeaking = false;
        }
        
        try {
            this.recognition.start();
            console.log('Recognition started successfully');
        } catch (e) {
            console.error('Recognition start error:', e);
        }
    }
    
    stopListening() {
        console.log('STOP LISTENING called');
        if (this.recognition && this.isListening) {
            this.recognition.stop();
        }
    }
    
    stopEverything() {
        console.log('STOP EVERYTHING called');
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
        console.log('LISTENING STARTED');
    }
    
    onResult(event) {
        const results = event.results;
        const current = results[results.length - 1];
        const transcript = current[0].transcript;
        
        if (current.isFinal) {
            console.log('FINAL TRANSCRIPT:', transcript);
            this.processTranscript(transcript);
        } else {
            console.log('Interim:', transcript);
            this.updateStatus(`"${transcript}"`);
        }
    }
    
    onError(event) {
        console.error('SPEECH ERROR:', event.error);
        
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
        console.log('LISTENING ENDED');
        
        if (this.conversationMode && !this.isSpeaking) {
            setTimeout(() => this.startListening(), 500);
        }
    }
    
    async processTranscript(transcript) {
        console.log('PROCESSING TRANSCRIPT:', transcript);
        this.updateStatus('Processing...');
        this.updateButton('processing');
        
        try {
            console.log('Sending to backend:', `${this.API_BASE}/api/voice/chat`);
            
            const response = await fetch(`${this.API_BASE}/api/voice/chat`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message: transcript,
                    user: 'Jakob Brunsell'
                })
            });
            
            console.log('Response status:', response.status);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            const data = await response.json();
            console.log('Received response:', data);
            
            if (data.response) {
                this.displayMessage('user', transcript);
                this.displayMessage('assistant', data.response);
                
                // Wait for voices if needed
                if (this.voices.length === 0) {
                    console.log('Waiting for voices to load...');
                    await this.waitForVoices();
                }
                
                console.log('About to speak response...');
                await this.speak(data.response);
            }
        } catch (error) {
            console.error('ERROR processing transcript:', error);
            this.updateStatus('Error processing request');
            await this.speak('I encountered an error.');
        }
        
        this.updateButton('idle');
        
        if (this.conversationMode) {
            setTimeout(() => this.startListening(), 1000);
        }
    }
    
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
            console.log('=== SPEAK FUNCTION CALLED ===');
            console.log('Text to speak:', text);
            
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
                console.warn('WARNING: No text to speak after cleaning');
                resolve();
                return;
            }
            
            console.log('Clean text:', cleanText);
            console.log('Creating utterance...');
            
            const utterance = new SpeechSynthesisUtterance(cleanText);
            
            // Set voice if available
            if (this.jarvisVoice) {
                utterance.voice = this.jarvisVoice;
                console.log('Using voice:', this.jarvisVoice.name);
            } else {
                console.warn('WARNING: No JARVIS voice set, using default');
            }
            
            // JARVIS-like voice settings
            utterance.rate = 0.95;
            utterance.pitch = 0.85;
            utterance.volume = 1.0;
            utterance.lang = 'en-GB';
            
            console.log('Utterance settings:', {
                rate: utterance.rate,
                pitch: utterance.pitch,
                volume: utterance.volume,
                lang: utterance.lang
            });
            
            utterance.onstart = () => {
                this.isSpeaking = true;
                this.updateStatus('JARVIS speaking...');
                this.updateButton('speaking');
                console.log('=== SPEECH STARTED ===');
            };
            
            utterance.onend = () => {
                this.isSpeaking = false;
                this.updateStatus('');
                this.updateButton('idle');
                console.log('=== SPEECH ENDED ===');
                resolve();
            };
            
            utterance.onerror = (event) => {
                console.error('=== SPEECH ERROR ===');
                console.error('Error event:', event);
                console.error('Error type:', event.error);
                this.isSpeaking = false;
                this.updateStatus('');
                this.updateButton('idle');
                resolve();
            };
            
            // Small delay to ensure synthesis is ready
            setTimeout(() => {
                console.log('Calling synthesis.speak()...');
                this.synthesis.speak(utterance);
                console.log('Utterance queued');
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

// Initialize JARVIS Voice
console.log('=== INITIALIZING JARVIS VOICE ===');
let jarvisVoice;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM LOADED - Creating JarvisVoice instance...');
    jarvisVoice = new JarvisVoice();
    
    // Test voice synthesis on first user interaction
    document.addEventListener('click', function testVoice() {
        console.log('First click detected, loading voices...');
        if (jarvisVoice && jarvisVoice.voices.length === 0) {
            jarvisVoice.loadVoices();
        }
        document.removeEventListener('click', testVoice);
    }, { once: true });
    
    console.log('=== INITIALIZATION SCRIPT COMPLETE ===');
});

console.log('=== VOICE.JS FILE FULLY LOADED ===');
