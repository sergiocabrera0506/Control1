# Bode Diagram Analyzer - PRD

## Overview
Control systems engineering app for analyzing transfer functions (1st to 4th order). Users input numerator/denominator polynomial coefficients and get Bode diagrams, stability analysis, and export capabilities.

## Core Features
1. **Transfer Function Input** - Numerator (4 coeffs: B3-B0) and Denominator (5 coeffs: A4-A0) with real-time formula display
2. **Bode Diagrams** - Magnitude (dB) and Phase (deg) plots with logarithmic frequency axis
3. **Cursor Tracking** - Touch-based cursor showing frequency, magnitude, phase at any point
4. **Stability Analysis** - System health (Stable/Unstable), gain margin, phase margin indicators
5. **Pole-Zero Map** - Visual s-plane with poles (x) and zeros (o), unit circle, grid
6. **Poles/Zeros Table** - Tabular display of pole/zero real and imaginary parts
7. **Export CSV** - Full Bode data (frequency, magnitude, phase) as CSV download
8. **Export PDF** - Complete analysis report with stability info, margins, poles/zeros, and sampled Bode data
9. **Config** - Adjustable frequency range, point density (512/1024/2048), grid/asymptotes/phase marker toggles

## Navigation
4 tabs: Function | Analyze | Stability | Config

## New Features (v2)
10. **Step Response** - Time-domain step response chart with steady-state reference line
11. **Impulse Response** - Time-domain impulse response chart
12. **Time Metrics** - Steady state value, overshoot %, rise time (10-90%), settling time (2% band)
13. **Save Transfer Functions** - Save favorites to MongoDB with custom names
14. **Load Transfer Functions** - Tap saved TF to load coefficients, delete unwanted ones
15. **Parallel Simulation** - RUN_SIMULATION calls both Bode analysis and time-response endpoints in parallel

## Tech Stack
- **Frontend**: React Native (Expo SDK 54), react-native-svg for charts, expo-file-system + expo-sharing for exports
- **Backend**: FastAPI + scipy (signal processing) + reportlab (PDF generation)
- **Database**: MongoDB (available but not heavily used - computation-focused app)

## Design
Dark cyberpunk/engineering theme (#0D1117 background, #00FF66 green accent, #00E5FF cyan accent, monospace fonts)
