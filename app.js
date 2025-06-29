/**
 * CalmPulse - Professional Breathing Companion
 * Clean, focused breathing app for anxiety relief
 */

class CalmPulseApp {
    constructor() {
        this.sessionDuration = 5 * 60; // 5 minutes in seconds
        this.currentTime = 0;
        this.isActive = false;
        this.isPaused = false;
        this.currentPhase = 'ready';
        this.phaseTime = 0;
        this.breathCycles = 0;
        this.sessionTimer = null;
        this.breathingTimer = null;
        
        // 4-7-8 breathing pattern (inhale-hold-exhale in seconds)
        this.pattern = {
            inhale: 4,
            hold: 7,
            exhale: 8
        };
        
        this.totalCycleTime = this.pattern.inhale + this.pattern.hold + this.pattern.exhale;
        this.init();
    }

    init() {
        console.log('CalmPulse initialized');
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Handle page visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && this.isActive) {
                console.log('App backgrounded, continuing session');
            }
        });

        // Handle orientation change
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.handleOrientationChange(), 500);
        });
    }

    handleOrientationChange() {
        // Recalculate layout for breathing circle
        const circle = document.getElementById('breathingCircle');
        if (circle) {
            circle.style.display = 'none';
            circle.offsetHeight; // Force reflow
            circle.style.display = '';
        }
    }

    showScreen(screenId) {
        // Hide all screens
        const screens = ['welcomeScreen', 'breathingInterface', 'sessionComplete'];
        screens.forEach(screen => {
            const element = document.getElementById(screen);
            if (element) {
                element.classList.add('hidden');
            }
        });
        
        // Show requested screen
        const targetScreen = document.getElementById(screenId);
        if (targetScreen) {
            targetScreen.classList.remove('hidden');
        }
    }

    startSession() {
        this.showScreen('breathingInterface');
        this.resetSession();
        this.isActive = true;
        this.isPaused = false;
        
        // Start with preparation phase
        this.currentPhase = 'prepare';
        this.updateBreathText('Get ready...');
        this.updateSessionStatus('Session starting in 3 seconds');
        
        // Start after 3 seconds
        setTimeout(() => {
            if (this.isActive) {
                this.startBreathingCycle();
                this.startSessionTimer();
                this.updateSessionStatus('Follow the breathing guide');
            }
        }, 3000);
    }

    resetSession() {
        this.currentTime = this.sessionDuration;
        this.breathCycles = 0;
        this.phaseTime = 0;
        this.currentPhase = 'prepare';
        
        if (this.sessionTimer) clearInterval(this.sessionTimer);
        if (this.breathingTimer) clearInterval(this.breathingTimer);
        
        this.updateTimer();
        this.resetBreathingCircle();
    }

    startSessionTimer() {
        this.sessionTimer = setInterval(() => {
            if (!this.isPaused && this.isActive) {
                this.currentTime--;
                this.updateTimer();
                
                if (this.currentTime <= 0) {
                    this.completeSession();
                }
            }
        }, 1000);
    }

    startBreathingCycle() {
        this.currentPhase = 'inhale';
        this.phaseTime = 0;
        this.updatePhaseUI();
        
        this.breathingTimer = setInterval(() => {
            if (!this.isPaused && this.isActive) {
                this.phaseTime += 0.1;
                this.updateBreathingProgress();
                
                // Check if current phase is complete
                let phaseDuration = this.getCurrentPhaseDuration();
                if (this.phaseTime >= phaseDuration) {
                    this.nextPhase();
                }
            }
        }, 100);
    }

    getCurrentPhaseDuration() {
        switch (this.currentPhase) {
            case 'inhale': return this.pattern.inhale;
            case 'hold': return this.pattern.hold;
            case 'exhale': return this.pattern.exhale;
            default: return 1;
        }
    }

    nextPhase() {
        this.phaseTime = 0;
        
        switch (this.currentPhase) {
            case 'inhale':
                this.currentPhase = 'hold';
                break;
            case 'hold':
                this.currentPhase = 'exhale';
                break;
            case 'exhale':
                this.currentPhase = 'inhale';
                this.breathCycles++;
                break;
        }
        
        this.updatePhaseUI();
    }

    updatePhaseUI() {
        // Reset all phase indicators
        document.querySelectorAll('.phase').forEach(phase => {
            phase.classList.remove('active');
        });
        
        // Activate current phase
        const phaseElement = document.getElementById(`phase${this.currentPhase.charAt(0).toUpperCase() + this.currentPhase.slice(1)}`);
        if (phaseElement) {
            phaseElement.classList.add('active');
        }
        
        // Update breathing circle
        const circle = document.getElementById('breathingCircle');
        if (circle) {
            circle.className = 'breathing-circle';
            
            if (this.currentPhase === 'inhale') {
                circle.classList.add('inhale');
                this.updateBreathText('Breathe In');
            } else if (this.currentPhase === 'exhale') {
                circle.classList.add('exhale');
                this.updateBreathText('Breathe Out');
            } else {
                this.updateBreathText('Hold');
            }
        }
    }

    updateBreathingProgress() {
        const circle = document.querySelector('.progress-ring-circle');
        if (circle) {
            const phaseDuration = this.getCurrentPhaseDuration();
            const progress = this.phaseTime / phaseDuration;
            const circumference = 2 * Math.PI * 110; // radius = 110
            const offset = circumference - (progress * circumference);
            
            circle.style.strokeDashoffset = offset;
        }
    }

    updateBreathText(text) {
        const breathTextElement = document.getElementById('breathText');
        if (breathTextElement) {
            breathTextElement.textContent = text;
        }
    }

    updateTimer() {
        const minutes = Math.floor(this.currentTime / 60);
        const seconds = this.currentTime % 60;
        const timerElement = document.getElementById('sessionTimer');
        if (timerElement) {
            timerElement.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
    }

    updateSessionStatus(status) {
        const statusElement = document.getElementById('sessionStatus');
        if (statusElement) {
            statusElement.textContent = status;
        }
    }

    pauseSession() {
        if (!this.isActive) return;
        
        this.isPaused = !this.isPaused;
        const pauseBtn = document.getElementById('pauseBtn');
        
        if (this.isPaused) {
            if (pauseBtn) pauseBtn.textContent = 'Resume';
            this.updateSessionStatus('Session paused');
            this.updateBreathText('Paused');
        } else {
            if (pauseBtn) pauseBtn.textContent = 'Pause';
            this.updateSessionStatus('Follow the breathing guide');
        }
    }

    endSession() {
        this.isActive = false;
        this.isPaused = false;
        
        if (this.sessionTimer) clearInterval(this.sessionTimer);
        if (this.breathingTimer) clearInterval(this.breathingTimer);
        
        this.completeSession();
    }

    completeSession() {
        this.isActive = false;
        
        if (this.sessionTimer) clearInterval(this.sessionTimer);
        if (this.breathingTimer) clearInterval(this.breathingTimer);
        
        // Calculate completed duration
        const completedSeconds = this.sessionDuration - this.currentTime;
        const completedMinutes = Math.floor(completedSeconds / 60);
        const remainingSeconds = completedSeconds % 60;
        
        const completedDurationElement = document.getElementById('completedDuration');
        const breathCyclesElement = document.getElementById('breathCycles');
        
        if (completedDurationElement) {
            completedDurationElement.textContent = `${completedMinutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        
        if (breathCyclesElement) {
            breathCyclesElement.textContent = this.breathCycles;
        }
        
        this.showScreen('sessionComplete');
    }

    resetBreathingCircle() {
        const circle = document.getElementById('breathingCircle');
        if (circle) {
            circle.className = 'breathing-circle';
        }
        
        this.updateBreathText('Ready');
        
        // Reset progress ring
        const progressCircle = document.querySelector('.progress-ring-circle');
        if (progressCircle) {
            progressCircle.style.strokeDashoffset = 691.15;
        }
    }

    newSession() {
        this.showScreen('welcomeScreen');
    }

    goHome() {
        this.showScreen('welcomeScreen');
    }

    setCustomDuration(minutes) {
        if (minutes && !isNaN(minutes) && minutes >= 1 && minutes <= 30) {
            this.sessionDuration = parseInt(minutes) * 60;
            return true;
        }
        return false;
    }
}

// Initialize the application
const app = new CalmPulseApp();

// Global functions for button clicks
function startSession() {
    app.startSession();
}

function pauseSession() {
    app.pauseSession();
}

function endSession() {
    app.endSession();
}

function newSession() {
    app.newSession();
}

function goHome() {
    app.goHome();
}

function showCustom() {
    const duration = prompt('Enter session duration in minutes (1-30):', '5');
    if (app.setCustomDuration(duration)) {
        app.startSession();
    } else {
        alert('Please enter a valid duration between 1 and 30 minutes.');
    }
}

// Handle app installation prompt (PWA)
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    console.log('App can be installed');
});

// Service Worker registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}