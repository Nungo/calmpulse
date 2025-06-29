# CalmPulse

Real-time breathing companion with heart rate monitoring for anxiety relief and mindfulness.

## Overview

CalmPulse is a Progressive Web Application designed to provide immediate anxiety relief through guided breathing exercises combined with real-time biometric feedback. The application uses camera-based photoplethysmography to monitor heart rate while guiding users through scientifically-backed breathing patterns.

## Core Features

### Biometric Monitoring
- Real-time heart rate detection using smartphone camera
- Contactless measurement via photoplethysmography (PPG)
- Visual feedback showing physiological improvements
- Session analytics with before/after comparisons

### Breathing Guidance
- Multiple evidence-based breathing patterns
- 4-7-8 technique for deep relaxation
- Box breathing for focus and control
- Coherent breathing for balance and harmony
- Visual and audio cues for proper timing

### Emergency Intervention
- Quick-access panic attack mode
- Simplified interface for crisis situations
- Automatic 2-minute guided sessions
- Optimized for immediate stress relief

### Progressive Web App
- Installable on mobile devices
- Offline functionality
- Native app-like experience
- Cross-platform compatibility

## Technical Specifications

### Frontend Architecture
- Vanilla JavaScript with ES6+ features
- CSS3 with custom properties and animations
- Responsive design with mobile-first approach
- Progressive enhancement principles

### Audio Processing
- Tone.js for dynamic sound generation
- Real-time audio synthesis
- Adaptive frequency modulation
- Cross-browser audio compatibility

### Camera Integration
- WebRTC MediaDevices API
- Real-time video processing
- Signal processing for heart rate detection
- Privacy-focused local processing

### Performance Optimization
- Service Worker for offline capabilities
- Resource caching strategies
- Minimal bundle size (under 30KB)
- Hardware acceleration for animations

## Installation and Setup

### Development Environment
```bash
# Clone repository
git clone https://github.com/username/calmpulse.git
cd calmpulse

# Start local development server
python -m http.server 8080
# or
npx live-server --port=8080

# Access application
http://localhost:8080
```

### Production Deployment
```bash
# Deploy to Vercel
npx vercel --prod

# Deploy to Netlify
npx netlify deploy --prod --dir=.

# Deploy to GitHub Pages
# Push to main branch and enable GitHub Pages
```

## Project Structure

```
calmpulse/
├── index.html          # Main application structure
├── styles.css          # Responsive styling and animations
├── app.js             # Core application logic
├── sw.js              # Service Worker for PWA features
├── manifest.json      # PWA configuration
├── package.json       # Project metadata and scripts
└── README.md          # Documentation
```

## Browser Compatibility

### Supported Browsers
- Chrome 80+ (recommended for full feature set)
- Safari 13+ (iOS and macOS)
- Firefox 75+
- Edge 80+

### Required APIs
- MediaDevices API for camera access
- Web Audio API for sound generation
- Service Worker API for offline functionality
- Canvas API for image processing

## Usage Instructions

### Basic Operation
1. Grant camera permission when prompted
2. Place fingertip over rear camera and flashlight
3. Select preferred breathing pattern
4. Follow visual and audio guidance
5. Monitor real-time heart rate feedback

### Heart Rate Monitoring
- Ensure adequate lighting conditions
- Keep finger steady on camera lens
- Cover both camera and flashlight completely
- Allow 10-15 seconds for stable readings

### Emergency Mode
- Accessible via red emergency button
- Immediately starts calming 4-7-8 breathing
- Simplified interface reduces cognitive load
- Auto-completes after 2 minutes

## Privacy and Security

### Data Handling
- All processing occurs locally on device
- No user data transmitted to external servers
- Camera access used exclusively for heart rate detection
- No storage of biometric information

### Security Measures
- HTTPS required for camera API access
- No third-party tracking or analytics
- Transparent permission requests
- User-controlled data retention

## Performance Metrics

### Loading Performance
- First Contentful Paint: Under 1.5 seconds
- Time to Interactive: Under 2.5 seconds
- Lighthouse Performance Score: 95+

### Accessibility
- WCAG 2.1 AA compliance
- Screen reader compatibility
- High contrast mode support
- Keyboard navigation support

## Development Guidelines

### Code Standards
- ESLint configuration for JavaScript
- Prettier for consistent formatting
- Semantic HTML structure
- BEM methodology for CSS

### Testing Requirements
- Cross-browser compatibility testing
- Mobile device testing
- Accessibility auditing
- Performance monitoring

## Contributing

### Development Process
1. Fork the repository
2. Create feature branch from main
3. Implement changes with tests
4. Submit pull request with documentation
5. Code review and integration

### Issue Reporting
- Use GitHub Issues for bug reports
- Include browser and device information
- Provide steps to reproduce issues
- Attach relevant screenshots or logs

## Technical Implementation

### Heart Rate Detection Algorithm
The application implements photoplethysmography using the following process:
1. Video stream capture from device camera
2. Frame-by-frame analysis of red channel intensity
3. Signal filtering and noise reduction
4. Peak detection for heartbeat identification
5. BPM calculation and trend analysis

### Breathing Pattern Implementation
Each breathing pattern follows a state machine approach:
- Inhale phase with visual expansion
- Optional hold phases for specific techniques
- Exhale phase with visual contraction
- Automatic progression through cycles
- Real-time timing adjustments

## Roadmap and Future Development

### Phase 1 (Current)
- Core breathing functionality
- Basic heart rate monitoring
- PWA implementation
- Emergency mode

### Phase 2 (Planned)
- Advanced analytics and trends
- Custom pattern creation
- Session history and progress tracking
- Integration with health platforms

### Phase 3 (Future)
- Native mobile applications
- Wearable device integration
- Machine learning personalization
- Telehealth platform integration

## Support and Documentation

### Technical Support
- GitHub Issues for bug reports
- Documentation updates via pull requests
- Community discussions in repository

### Medical Disclaimer
This application is designed for wellness and educational purposes only. It is not intended to diagnose, treat, cure, or prevent any medical condition. Users experiencing severe anxiety or panic disorders should consult qualified healthcare professionals.

## License

This project is licensed under the MIT License. See LICENSE file for complete terms and conditions.

## Acknowledgments

### Third-Party Libraries
- Tone.js: Web Audio API framework
- Inter Font: Typography system

### Research Foundation
- Breathing techniques based on published medical research
- Heart rate variability studies
- Anxiety intervention methodologies

### Development Tools
- Visual Studio Code
- Chrome DevTools
- Lighthouse auditing
- Various browser testing platforms