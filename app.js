/**
 * CalmPulse - Real-time Breathing Companion
 * Mobile-optimized breathing app with heart rate monitoring
 */

class CalmPulse {
    constructor() {
        this.isSessionActive = false;
        this.isPaused = false;
        this.currentPattern = '478';
        this.sessionStartTime = null;
        this.breathCount = 0;
        this.heartRateData = [];
        this.initialBPM = null;
        this.animationId = null;
        this.breathingTimer = null;
        this.sessionTimer = null;
        this.heartRateTimer = null;
        this.mediaStream = null;
        this.isHeartRateEnabled = false;
        this.audioContext = null;
        this.currentPhase = 'ready';
        this.phaseStartTime = 0;
        
        // Breathing patterns (in seconds)
        this.patterns = {
            '478': { 
                inhale: 4, 
                hold: 7, 
                exhale: 8, 
                name: '4-7-8 Relaxing',
                description: 'Deep relaxation'
            },
            'box': { 
                inhale: 4, 
                hold: 4, 
                exhale: 4, 
                hold2: 4, 
                name: 'Box Breathing',
                description: 'Focus & control'
            },
            'coherent': { 
                inhale: 5, 
                exhale: 5, 
                name: 'Coherent Breathing',
                description: 'Balance & harmony'
            }
        };
        
        this.init();
    }

    /**
     * Initialize the application
     */
    init() {
        this.bindEvents();
        this.setupServiceWorker();
        this.detectMobile();
        console.log('CalmPulse initialized');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Setup screen buttons
        document.getElementById('startSessionBtn')?.addEventListener('click', () => this.startSession(true));
        document.getElementById('skipHeartRateBtn')?.addEventListener('click', () => this.startSession(false));
        
        // Emergency button
        document.getElementById('emergencyBtn')?.addEventListener('click', () => this.startEmergencyMode());
        
        // Control buttons
        document.getElementById('pauseBtn')?.addEventListener('click', () => this.togglePause());
        document.getElementById('endBtn')?.addEventListener('click', () => this.endSession());
        
        // Pattern selection
        document.querySelectorAll('.pattern-option').forEach(option => {
            option.addEventListener('click', () => {
                this.setPattern(option.dataset.pattern);
            });
        });

        // Handle visibility change (for mobile background behavior)
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isSessionActive) {
                // Keep session running in background
                this.handleBackgroundMode();
            }
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 500);
        });

        // Touch events for better mobile interaction
        this.setupTouchEvents();
        
        // Prevent default touch behaviors that interfere with app
        document.addEventListener('touchmove', (e) => {
            if (e.target.closest('.breathing-interface')) {
                e.preventDefault();
            }
        }, { passive: false });
    }

    /**
     * Setup touch events for mobile optimization
     */
    setupTouchEvents() {
        // Add touch feedback to buttons
        document.querySelectorAll('.btn, .pattern-option, .emergency-btn').forEach(element => {
            element.addEventListener('touchstart', (e) => {
                element.style.transform = 'scale(0.95)';
            });
            
            element.addEventListener('touchend', (e) => {
                setTimeout(() => {
                    element.style.transform = '';
                }, 150);
            });
        });
    }

    /**
     * Detect if running on mobile device
     */
    detectMobile() {
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (isMobile) {
            document.body.classList.add('mobile');
            // Enable mobile-specific features
            this.enableMobileOptimizations();
        }
    }

    /**
     * Enable mobile-specific optimizations
     */
    enableMobileOptimizations() {
        // Prevent zoom on input focus
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.content = 'width=device-width, initial-scale=1.0, user-scalable=no, maximum-scale=1.0';
        }

        // Wake lock to prevent screen from sleeping during sessions
        this.requestWakeLock();
    }

    /**
     * Request wake lock to keep screen on during breathing sessions
     */
    async requestWakeLock() {
        try {
            if ('wakeLock' in navigator) {
                this.wakeLock = await navigator.wakeLock.request('screen');
                console.log('Wake lock activated');
            }
        } catch (err) {
            console.log('Wake lock not supported or failed:', err);
        }
    }

    /**
     * Release wake lock
     */
    releaseWakeLock() {
        if (this.wakeLock) {
            this.wakeLock.release();
            this.wakeLock = null;
            console.log('Wake lock released');
        }
    }

    /**
     * Setup service worker for PWA functionality
     */
    setupServiceWorker() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(registration => console.log('SW registered'))
                .catch(error => console.log('SW registration failed'));
        }
    }

    /**
     * Handle app going to background
     */
    handleBackgroundMode() {
        // Continue timers but pause visual animations
        if (this.isSessionActive && !this.isPaused) {
            console.log('App backgrounded, continuing session');
        }
    }

    /**
     * Handle orientation change
     */
    handleOrientationChange() {
        // Recalculate layout for breathing circle
        const circle = document.getElementById('breathingCircle');
        if (circle) {
            // Force reflow
            circle.style.display = 'none';
            circle.offsetHeight; // Trigger reflow
            circle.style.display = '';
        }
    }

    /**
     * Initialize audio context
     */
    async initAudio() {
        try {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                await Tone.start();
                console.log('Audio initialized');
            }
        } catch (error) {
            console.log('Audio initialization failed:', error);
        }
    }

    /**
     * Start heart rate monitoring using camera
     */
    async startHeartRateMonitoring() {
        this.showLoading('Initializing camera...');
        
        try {
            // Request camera access
            this.mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'environment',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                },
                audio: false
            });

            // Create video element for processing
            const video = document.createElement('video');
            video.srcObject = this.mediaStream;
            video.autoplay = true;
            video.muted = true;
            video.playsInline = true; // Important for iOS

            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 100;
            canvas.height = 100;

            // Wait for video to be ready
            await new Promise((resolve) => {
                video.addEventListener('loadedmetadata', resolve);
            });

            this.hideLoading();
            this.isHeartRateEnabled = true;

            // Start heart rate detection
            this.startHeartRateDetection(video, canvas, ctx);
            console.log('Heart rate monitoring started');

        } catch (error) {
            this.hideLoading();
            console.log('Camera access denied or not available:', error);
            this.isHeartRateEnabled = false;
            this.showHeartRateError();
        }
    }

    /**
     * Start heart rate detection processing
     */
    startHeartRateDetection(video, canvas, ctx) {
        let samples = [];
        let lastSampleTime = 0;
        const sampleRate = 30; // samples per second
        const sampleWindow = 256; // number of samples to analyze
        
        const processFrame = () => {
            if (!this.isSessionActive || !this.isHeartRateEnabled) return;

            const now = Date.now();
            if (now - lastSampleTime >= 1000 / sampleRate) {
                // Draw video frame to canvas
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                
                // Get image data
                const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
                const data = imageData.data;
                
                // Calculate average red channel value
                let redSum = 0;
                for (let i = 0; i < data.length; i += 4) {
                    redSum += data[i]; // Red channel
                }
                const redAverage = redSum / (data.length / 4);
                
                // Add to samples
                samples.push(redAverage);
                if (samples.length > sampleWindow) {
                    samples.shift();
                }
                
                // Calculate BPM if we have enough samples
                if (samples.length >= sampleWindow) {
                    const bpm = this.calculateBPM(samples, sampleRate);
                    if (bpm > 0) {
                        this.updateHeartRate(bpm);
                    }
                }
                
                lastSampleTime = now;
            }
            
            if (this.isSessionActive && this.isHeartRateEnabled) {
                requestAnimationFrame(processFrame);
            }
        };

        processFrame();
    }

    /**
     * Calculate BPM from samples using FFT-like approach
     */
    calculateBPM(samples, sampleRate) {
        // Simple peak detection algorithm
        // In a production app, you'd use proper FFT
        
        const peaks = [];
        const minPeakDistance = sampleRate * 0.3; // Minimum 0.3 seconds between peaks
        
        for (let i = 1; i < samples.length - 1; i++) {
            if (samples[i] > samples[i - 1] && samples[i] > samples[i + 1]) {
                // Check if this peak is far enough from the last one
                if (peaks.length === 0 || i - peaks[peaks.length - 1] > minPeakDistance) {
                    peaks.push(i);
                }
            }
        }
        
        if (peaks.length < 2) return 0;
        
        // Calculate average interval between peaks
        let totalInterval = 0;
        for (let i = 1; i < peaks.length; i++) {
            totalInterval += peaks[i] - peaks[i - 1];
        }
        
        const avgInterval = totalInterval / (peaks.length - 1);
        const bpm = Math.round((60 * sampleRate) / avgInterval);
        
        // Validate BPM is in reasonable range
        return (bpm >= 40 && bpm <= 150) ? bpm : 0;
    }

    /**
     * Update heart rate display
     */
    updateHeartRate(bpm) {
        const bpmElement = document.getElementById('bpmValue');
        const pulseIndicator = document.getElementById('pulseIndicator');
        const heartTrend = document.getElementById('heartTrend');
        
        if (!bpmElement) return;
        
        bpmElement.textContent = bpm;
        this.heartRateData.push(bpm);
        
        // Store initial BPM for comparison
        if (this.initialBPM === null) {
            this.initialBPM = bpm;
        }
        
        // Color coding for heart rate
        bpmElement.className = 'bpm-value';
        if (bpm < 65) {
            bpmElement.classList.add('good');
        } else if (bpm < 75) {
            bpmElement.classList.add('normal');
        }

        // Update pulse indicator
        if (pulseIndicator) {
            pulseIndicator.style.display = 'block';
            pulseIndicator.style.animationDuration = `${60/bpm}s`;
        }

        // Update trend
        if (heartTrend && this.initialBPM) {
            const change = this.initialBPM - bpm;
            if (change > 5) {
                heartTrend.innerHTML = '<span style="color: #51cf66;">↓ Relaxing</span>';
            } else if (change < -5) {
                heartTrend.innerHTML = '<span style="color: #ff6b6b;">↑ Rising</span>';
            } else {
                heartTrend.innerHTML = '<span style="color: #ffd43b;">→ Stable</span>';
            }
        }

        // Update session stats
        this.updateSessionStats();
    }

    /**
     * Show heart rate error message
     */
    showHeartRateError() {
        const heartRateDisplay = document.querySelector('.heart-rate-display');
        if (heartRateDisplay) {
            heartRateDisplay.innerHTML = `
                <div class="heart-icon">📱</div>
                <div class="bpm-value">--</div>
                <div class="bpm-label">Camera Unavailable</div>
                <div class="heart-trend">
                    <span class="trend-text">Manual session</span>
                </div>
            `;
        }
    }

    /**
     * Set breathing pattern
     */
    setPattern(patternName) {
        if (!this.patterns[patternName]) return;
        
        this.currentPattern = patternName;
        
        // Update UI
        document.querySelectorAll('.pattern-option').forEach(option => {
            option.classList.remove('active');
        });
        
        const selectedOption = document.querySelector(`[data-pattern="${patternName}"]`);
        if (selectedOption) {
            selectedOption.classList.add('active');
        }

        // Restart breathing cycle if active
        if (this.isSessionActive && !this.isPaused) {
            this.startBreathingCycle();
        }
        
        console.log(`Pattern changed to: ${this.patterns[patternName].name}`);
    }

    /**
     * Start a breathing session
     */
    async startSession(enableHeartRate = true) {
        try {
            // Initialize audio
            await this.initAudio();
            
            // Start heart rate monitoring if requested
            if (enableHeartRate) {
                await this.startHeartRateMonitoring();
            } else {
                this.isHeartRateEnabled = false;
            }
            
            // Switch to breathing interface
            document.getElementById('setupScreen')?.classList.add('hidden');
            document.getElementById('breathingInterface')?.classList.remove('hidden');
            document.getElementById('sessionStats')?.classList.add('show');
            
            // Initialize session
            this.isSessionActive = true;
            this.isPaused = false;
            this.sessionStartTime = Date.now();
            this.breathCount = 0;
            this.heartRateData = [];
            this.initialBPM = null;
            
            // Start breathing cycle and session timer
            this.startBreathingCycle();
            this.startSessionTimer();
            
            // Request wake lock
            this.requestWakeLock();
            
            console.log('Session started');
            
        } catch (error) {
            console.error('Failed to start session:', error);
            this.showError('Failed to start session. Please try again.');
        }
    }

    /**
     * Start breathing cycle animation and timing
     */
    startBreathingCycle() {
        const pattern = this.patterns[this.currentPattern];
        const circle = document.getElementById('breathingCircle');
        const breathText = document.getElementById('breathText');
        const breathProgress = document.getElementById('breathProgress');
        
        if (!circle || !breathText) return;
        
        let phase = 'inhale';
        let phaseTime = 0;
        let currentDuration = pattern.inhale;
        
        // Clear existing timer
        if (this.breathingTimer) {
            clearInterval(this.breathingTimer);
        }
        
        this.breathingTimer = setInterval(() => {
            if (this.isPaused) return;
            
            phaseTime += 0.1;
            
            // Update progress indicator
            if (breathProgress) {
                const progress = (phaseTime / currentDuration) * 360;
                breathProgress.style.transform = `translate(-50%, -50%) rotate(${progress}deg)`;
            }
            
            if (phaseTime >= currentDuration) {
                // Move to next phase
                this.nextBreathingPhase(pattern, phase, circle, breathText, breathProgress);
                phase = this.currentPhase;
                phaseTime = 0;
                currentDuration = this.getCurrentPhaseDuration(pattern, phase);
            }
        }, 100);

        // Start first phase
        this.setBreathingPhase('inhale', circle, breathText);
        this.playBreathSound('inhale');
    }

    /**
     * Move to next breathing phase
     */
    nextBreathingPhase(pattern, currentPhase, circle, breathText, breathProgress) {
        let nextPhase;
        
        switch (currentPhase) {
            case 'inhale':
                if (pattern.hold) {
                    nextPhase = 'hold';
                } else {
                    nextPhase = 'exhale';
                }
                break;
            case 'hold':
                nextPhase = 'exhale';
                break;
            case 'exhale':
                if (pattern.hold2) {
                    nextPhase = 'hold2';
                } else {
                    nextPhase = 'inhale';
                    this.breathCount++;
                    this.updateSessionStats();
                }
                break;
            case 'hold2':
                nextPhase = 'inhale';
                this.breathCount++;
                this.updateSessionStats();
                break;
            default:
                nextPhase = 'inhale';
        }
        
        this.currentPhase = nextPhase;
        this.setBreathingPhase(nextPhase, circle, breathText);
        this.playBreathSound(nextPhase);
        
        // Reset progress indicator
        if (breathProgress) {
            breathProgress.style.transform = 'translate(-50%, -50%) rotate(0deg)';
        }
    }

    /**
     * Set breathing phase visual state
     */
    setBreathingPhase(phase, circle, breathText) {
        // Update text
        const phaseTexts = {
            'inhale': 'Breathe In',
            'hold': 'Hold',
            'hold2': 'Hold',
            'exhale': 'Breathe Out'
        };
        
        breathText.textContent = phaseTexts[phase] || phase;
        
        // Update circle animation
        circle.className = 'breathing-circle';
        if (phase === 'inhale') {
            circle.classList.add('inhale');
        } else if (phase === 'exhale') {
            circle.classList.add('exhale');
        }
        
        // Add haptic feedback on mobile
        this.triggerHapticFeedback();
    }

    /**
     * Get duration for current phase
     */
    getCurrentPhaseDuration(pattern, phase) {
        switch (phase) {
            case 'inhale': return pattern.inhale;
            case 'hold': return pattern.hold || 0;
            case 'hold2': return pattern.hold2 || 0;
            case 'exhale': return pattern.exhale;
            default: return 4;
        }
    }

    /**
     * Play breath sound
     */
    playBreathSound(phase) {
        if (!this.audioContext) return;
        
        try {
            const frequency = phase === 'inhale' ? 220 : 180;
            const oscillator = new Tone.Oscillator({
                frequency: frequency,
                type: 'sine'
            });
            
            const gain = new Tone.Gain(0.1);
            oscillator.connect(gain);
            gain.toDestination();
            
            oscillator.start();
            oscillator.stop('+0.3');
            
        } catch (error) {
            console.log('Audio playback error:', error);
        }
    }

    /**
     * Trigger haptic feedback on supported devices
     */
    triggerHapticFeedback() {
        if ('vibrate' in navigator) {
            navigator.vibrate(50); // 50ms vibration
        }
    }

    /**
     * Start session timer
     */
    startSessionTimer() {
        this.sessionTimer = setInterval(() => {
            if (this.isPaused || !this.sessionStartTime) return;
            
            const elapsed = Math.floor((Date.now() - this.sessionStartTime) / 1000);
            const minutes = Math.floor(elapsed / 60);
            const seconds = elapsed % 60;
            
            const timeElement = document.getElementById('sessionTime');
            if (timeElement) {
                timeElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }

    /**
     * Update session statistics
     */
    updateSessionStats() {
        // Update breath count
        const breathCountElement = document.getElementById('breathCount');
        if (breathCountElement) {
            breathCountElement.textContent = this.breathCount;
        }

        // Update average BPM
        if (this.heartRateData.length > 0) {
            const avg = Math.round(this.heartRateData.reduce((a, b) => a + b) / this.heartRateData.length);
            const avgElement = document.getElementById('avgBpm');
            if (avgElement) {
                avgElement.textContent = avg;
            }
        }

        // Update BPM change
        if (this.initialBPM && this.heartRateData.length > 0) {
            const currentBPM = this.heartRateData[this.heartRateData.length - 1];
            const change = this.initialBPM - currentBPM;
            const changeElement = document.getElementById('bpmChange');
            if (changeElement) {
                changeElement.textContent = change > 0 ? `-${change}` : `+${Math.abs(change)}`;
                changeElement.style.color = change > 0 ? '#51cf66' : '#ff6b6b';
            }
        }
    }

    /**
     * Toggle pause/resume session
     */
    togglePause() {
        if (!this.isSessionActive) return;
        
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        const breathText = document.getElementById('breathText');
        const circle = document.getElementById('breathingCircle');
        
        if (this.isPaused) {
            // Pause session
            if (pauseBtn) {
                pauseBtn.innerHTML = `
                    <span class="btn-icon">▶️</span>
                    <span class="btn-text">Resume</span>
                `;
            }
            if (breathText) breathText.textContent = 'Paused';
            if (circle) circle.className = 'breathing-circle';
            
        } else {
            // Resume session
            if (pauseBtn) {
                pauseBtn.innerHTML = `
                    <span class="btn-icon">⏸️</span>
                    <span class="btn-text">Pause</span>
                `;
            }
            this.startBreathingCycle();
        }
        
        console.log(this.isPaused ? 'Session paused' : 'Session resumed');
    }

    /**
     * End the current session
     */
    endSession() {
        if (!this.isSessionActive) return;
        
        // Stop all timers and streams
        this.isSessionActive = false;
        this.isPaused = false;
        
        if (this.breathingTimer) {
            clearInterval(this.breathingTimer);
            this.breathingTimer = null;
        }
        
        if (this.sessionTimer) {
            clearInterval(this.sessionTimer);
            this.sessionTimer = null;
        }
        
        if (this.mediaStream) {
            this.mediaStream.getTracks().forEach(track => track.stop());
            this.mediaStream = null;
        }
        
        // Release wake lock
        this.releaseWakeLock();
        
        // Show session summary
        this.showSessionSummary();
        
        // Reset to setup screen
        setTimeout(() => {
            document.getElementById('breathingInterface')?.classList.add('hidden');
            document.getElementById('setupScreen')?.classList.remove('hidden');
            document.getElementById('sessionStats')?.classList.remove('show');
            
            // Reset UI state
            this.resetUI();
        }, 3000);
        
        console.log('Session ended');
    }

    /**
     * Show session summary
     */
    showSessionSummary() {
        const sessionDuration = this.sessionStartTime ? 
            Math.floor((Date.now() - this.sessionStartTime) / 1000) : 0;
        const minutes = Math.floor(sessionDuration / 60);
        const seconds = sessionDuration % 60;
        
        const avgBPM = this.heartRateData.length > 0 ? 
            Math.round(this.heartRateData.reduce((a, b) => a + b) / this.heartRateData.length) : null;
        
        const bpmChange = this.initialBPM && avgBPM ? this.initialBPM - avgBPM : null;
        
        let summary = `🎉 Session Complete!\n\n`;
        summary += `⏱️ Duration: ${minutes}:${seconds.toString().padStart(2, '0')}\n`;
        summary += `🫁 Breaths: ${this.breathCount}\n`;
        
        if (avgBPM) {
            summary += `❤️ Average BPM: ${avgBPM}\n`;
        }
        
        if (bpmChange !== null) {
            summary += `📈 BPM Change: ${bpmChange > 0 ? '-' : '+'}${Math.abs(bpmChange)}\n`;
            if (bpmChange > 5) {
                summary += `\n🌟 Great job! Your heart rate decreased significantly.`;
            }
        }
        
        summary += `\n\nKeep practicing for better results! 🧘‍♀️`;
        
        alert(summary);
    }

    /**
     * Reset UI to initial state
     */
    resetUI() {
        // Reset breathing circle
        const circle = document.getElementById('breathingCircle');
        const breathText = document.getElementById('breathText');
        
        if (circle) circle.className = 'breathing-circle';
        if (breathText) breathText.textContent = 'Ready';
        
        // Reset pause button
        const pauseBtn = document.getElementById('pauseBtn');
        if (pauseBtn) {
            pauseBtn.innerHTML = `
                <span class="btn-icon">⏸️</span>
                <span class="btn-text">Pause</span>
            `;
        }
        
        // Reset heart rate display
        const bpmValue = document.getElementById('bpmValue');
        if (bpmValue) bpmValue.textContent = '--';
        
        // Reset background
        document.body.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    /**
     * Start emergency mode for panic attacks
     */
    startEmergencyMode() {
        console.log('Emergency mode activated');
        
        // Set to 4-7-8 breathing (most calming)
        this.setPattern('478');
        
        // Change to calming blue background
        document.body.style.background = 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)';
        
        // Start session without heart rate to reduce setup time
        this.startSession(false);
        
        // Auto-end after 2 minutes
        setTimeout(() => {
            if (this.isSessionActive) {
                this.endSession();
            }
        }, 120000);
        
        // Show emergency message
        setTimeout(() => {
            const breathText = document.getElementById('breathText');
            if (breathText && this.currentPhase === 'ready') {
                breathText.textContent = 'Emergency Mode Active';
            }
        }, 500);
    }

    /**
     * Show loading overlay
     */
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loadingOverlay');
        const text = document.querySelector('.loading-text');
        
        if (overlay) {
            overlay.classList.remove('hidden');
            if (text) text.textContent = message;
        }
    }

    /**
     * Hide loading overlay
     */
    hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.classList.add('hidden');
        }
    }

    /**
     * Show error message
     */
    showError(message) {
        alert(`Error: ${message}`);
    }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.calmPulse = new CalmPulse();
});

// Handle app installation prompt (PWA)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or banner
    console.log('App can be installed');
});

// Export for potential module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CalmPulse;
}