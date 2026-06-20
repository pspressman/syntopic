// MultiStageGrammarGame.js - 4-Stage Grammar & Reading Comprehension Game
// WITH TOPIC-SPECIFIC SAVE SYSTEM + PROGRESS TRACKING
// 
// SAVE SYSTEM: Each of the 12 topics tracks progress independently using localStorage
// - Geology progress won't overwrite Weather progress
// - Auto-saves after each question and stage change
// - Manual save button available anytime
// - Data persists across browser sessions on same device
//
// FIX APPLIED (19Dec2025): State now initializes directly from localStorage
// instead of loading via useEffect. This prevents the race condition where
// React state updates weren't being applied before the game rendered.
// The key insight: useState initial values run synchronously before first render,
// while useEffect runs AFTER render, causing the "state not updating" bug.

import React, { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'syntopic-progress';

// ============================================================================
// SOUND EFFECTS - Web Audio API synthesized sounds (no external files needed)
// Varied sounds for each success type to keep things fresh
// ============================================================================
class SynTopicSoundEffects {
  constructor() {
    this.audioContext = null;
    this.masterVolume = 0.5;
    this.enabled = true;
    this.stage1Counter = 0;
    this.stage2Counter = 0;
    this.bonusCounter = 0;
    this.celebrationCounter = 0;
  }

  init() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }
    return this;
  }

  setVolume(vol) { this.masterVolume = Math.max(0, Math.min(1, vol)); }
  setEnabled(enabled) { this.enabled = enabled; }

  // Stage 1: Semantic Selection - bright encouraging chimes (5 variations)
  playStage1Success() {
    if (!this.enabled) return;
    this.init();
    const variations = [
      () => this._playChime([523.25, 659.25, 783.99], 0.15),
      () => this._playChime([587.33, 739.99, 880.00], 0.15),
      () => this._playBrightDing(698.46),
      () => this._playSparkle([659.25, 783.99], 0.1),
      () => this._playChime([493.88, 659.25, 783.99], 0.15),
    ];
    variations[this.stage1Counter++ % variations.length]();
  }

  // Stage 2: Tile Arrangement - fuller achievement sounds (5 variations)
  playStage2Success() {
    if (!this.enabled) return;
    this.init();
    const variations = [
      () => this._playTriumphChord([261.63, 329.63, 392.00, 523.25], 0.3),
      () => this._playArpeggio([392.00, 493.88, 587.33, 783.99], 0.08),
      () => this._playPowerChord([349.23, 440.00, 523.25], 0.25),
      () => this._playWhoosh([440.00, 554.37, 659.25]),
      () => this._playTriumphChord([293.66, 369.99, 440.00, 587.33], 0.3),
    ];
    variations[this.stage2Counter++ % variations.length]();
  }

  // Bonus: Alternative order found - exciting special sounds (4 variations)
  playBonusSuccess() {
    if (!this.enabled) return;
    this.init();
    const variations = [
      () => this._playBonusFanfare(),
      () => this._playMagicSparkle(),
      () => this._playCoinCollect(),
      () => this._playLevelUp(),
    ];
    variations[this.bonusCounter++ % variations.length]();
  }

  // Recording done - gentle chime
  playRecordingDone() {
    if (!this.enabled) return;
    this.init();
    this._playSoftChime([523.25, 659.25], 0.2);
  }

  // Celebration - big fanfares (3 variations)
  playCelebration() {
    if (!this.enabled) return;
    this.init();
    const variations = [
      () => this._playVictoryFanfare(),
      () => this._playTriumphantFinale(),
      () => this._playConfettiPop(),
    ];
    variations[this.celebrationCounter++ % variations.length]();
  }

  // Wrong answer - soft, encouraging (not harsh)
  playWrongAnswer() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(350, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(280, ctx.currentTime + 0.15);
    gain.gain.setValueAtTime(this.masterVolume * 0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  }

  // Tile pickup - quick rising blip
  playTilePickup() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(900, ctx.currentTime + 0.05);
    gain.gain.setValueAtTime(this.masterVolume * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.08);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.08);
  }

  // Tile drop - quick falling blip
  playTileDrop() {
    if (!this.enabled) return;
    this.init();
    const ctx = this.audioContext;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(500, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(350, ctx.currentTime + 0.06);
    gain.gain.setValueAtTime(this.masterVolume * 0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.1);
  }

  // === Helper methods for sound synthesis ===
  _playChime(frequencies, spacing) {
    const ctx = this.audioContext;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * spacing);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  _playBrightDing(frequency) {
    const ctx = this.audioContext;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.value = frequency;
    osc2.type = 'sine';
    osc2.frequency.value = frequency * 2;
    gain.gain.setValueAtTime(this.masterVolume * 0.35, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);
    osc1.start();
    osc2.start();
    osc1.stop(ctx.currentTime + 0.5);
    osc2.stop(ctx.currentTime + 0.5);
  }

  _playSparkle(frequencies, spacing) {
    const ctx = this.audioContext;
    for (let i = 0; i < 4; i++) {
      frequencies.forEach((freq, j) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.value = freq * (1 + i * 0.5);
        const startTime = ctx.currentTime + (i * spacing * 2) + (j * spacing);
        gain.gain.setValueAtTime(0, startTime);
        gain.gain.linearRampToValueAtTime(this.masterVolume * 0.2, startTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(startTime);
        osc.stop(startTime + 0.15);
      });
    }
  }

  _playTriumphChord(frequencies, duration) {
    const ctx = this.audioContext;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i < 2 ? 'sine' : 'triangle';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * 0.03);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, startTime + 0.05);
      gain.gain.setValueAtTime(this.masterVolume * 0.3, startTime + duration);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + duration + 0.5);
    });
  }

  _playArpeggio(frequencies, spacing) {
    const ctx = this.audioContext;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * spacing);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.35, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  _playPowerChord(frequencies, duration) {
    const ctx = this.audioContext;
    frequencies.forEach((freq) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 2000;
      gain.gain.setValueAtTime(this.masterVolume * 0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration + 0.3);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + duration + 0.4);
    });
  }

  _playWhoosh(frequencies) {
    const ctx = this.audioContext;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * 0.05);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  _playSoftChime(frequencies, spacing) {
    const ctx = this.audioContext;
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * spacing);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.25, startTime + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.6);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.6);
    });
  }

  _playBonusFanfare() {
    const ctx = this.audioContext;
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * 0.08);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.4, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.5);
    });
  }

  _playMagicSparkle() {
    const ctx = this.audioContext;
    [880, 1108.73, 1318.51, 1760, 2217.46].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * 0.04);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * (0.3 - i * 0.04), startTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.4);
    });
  }

  _playCoinCollect() {
    const ctx = this.audioContext;
    [987.77, 1318.51].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      osc.type = 'square';
      osc.frequency.value = freq;
      filter.type = 'lowpass';
      filter.frequency.value = 3000;
      const startTime = ctx.currentTime + (i * 0.08);
      gain.gain.setValueAtTime(this.masterVolume * 0.2, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);
      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.15);
    });
  }

  _playLevelUp() {
    const ctx = this.audioContext;
    [392, 493.88, 587.33, 783.99, 987.77].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * 0.06);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.35, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 0.3);
    });
  }

  _playVictoryFanfare() {
    const ctx = this.audioContext;
    const notes = [
      { freq: 523.25, time: 0, dur: 0.1 }, { freq: 523.25, time: 0.12, dur: 0.1 },
      { freq: 523.25, time: 0.24, dur: 0.1 }, { freq: 659.25, time: 0.4, dur: 0.5 },
      { freq: 659.25, time: 0.9, dur: 0.1 }, { freq: 659.25, time: 1.02, dur: 0.1 },
      { freq: 659.25, time: 1.14, dur: 0.1 }, { freq: 783.99, time: 1.3, dur: 0.6 },
    ];
    notes.forEach(note => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = note.freq;
      const startTime = ctx.currentTime + note.time;
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.35, startTime + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + note.dur + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + note.dur + 0.2);
    });
  }

  _playTriumphantFinale() {
    const ctx = this.audioContext;
    [261.63, 329.63, 392, 523.25, 659.25, 783.99].forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = i % 2 === 0 ? 'triangle' : 'sine';
      osc.frequency.value = freq;
      const startTime = ctx.currentTime + (i * 0.03);
      gain.gain.setValueAtTime(0, startTime);
      gain.gain.linearRampToValueAtTime(this.masterVolume * 0.25, startTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + 1.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(startTime);
      osc.stop(startTime + 1.6);
    });
  }

  _playConfettiPop() {
    const ctx = this.audioContext;
    // Pop noise
    const bufferSize = ctx.sampleRate * 0.1;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (bufferSize * 0.1));
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;
    const noiseGain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 2000;
    noiseGain.gain.value = this.masterVolume * 0.4;
    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(ctx.destination);
    noise.start();
    // Celebration tones after pop
    setTimeout(() => {
      [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
        setTimeout(() => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.type = 'sine';
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(this.masterVolume * 0.3, ctx.currentTime);
          gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.start();
          osc.stop(ctx.currentTime + 0.4);
        }, i * 50);
      });
    }, 100);
  }
}

// Create singleton instance
const soundEffects = new SynTopicSoundEffects();

// ============================================================================
// HELPER: Synchronously read saved data from localStorage
// This runs BEFORE the component mounts, so we can use it for initial state
// ============================================================================
const getSavedGameState = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.error('[INIT] Error reading localStorage:', err);
  }
  return null;
};

// ============================================================================
// HELPER: Get saved data for a specific topic
// Returns null if no save exists or if the topic is already completed
// ============================================================================
const getSavedTopicData = (topicId) => {
  const gameState = getSavedGameState();
  if (gameState?.topicProgress?.[topicId]) {
    const topicData = gameState.topicProgress[topicId];
    // Only return if there's actual progress and not completed
    if (topicData.currentQuestion >= 0 && !topicData.completed) {
      return {
        topicData,
        grammarForms: gameState.grammarForms || [],
        difficulty: gameState.difficulty || 'beginner'
      };
    }
  }
  return null;
};

const MultiStageGrammarGame = ({ questionsData, topicId = 'geology' }) => {
  
  // ============================================================================
  // STATE INITIALIZATION
  // Key fix: We check localStorage SYNCHRONOUSLY during initial state setup
  // This ensures saved values are used from the very first render
  // ============================================================================
  
  // Check for saved progress once, synchronously, before component mounts
  const [initialSaveData] = useState(() => getSavedTopicData(topicId));
  
  // Setup state - these do NOT auto-restore; user must click "Continue"
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedForms, setSelectedForms] = useState([]);
  const [tileMode, setTileMode] = useState('beginner');
  const [currentQuestionForm, setCurrentQuestionForm] = useState('');
  
  // Track whether user has save data available (for showing the "Continue" prompt)
  const [hasSavedProgress, setHasSavedProgress] = useState(() => initialSaveData !== null);
  const [savedTopicData, setSavedTopicData] = useState(() => initialSaveData?.topicData || null);
  
  // Gameplay state - these get restored when user clicks "Continue Game"
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [stage, setStage] = useState(1);
  const [selectedOption, setSelectedOption] = useState(null);
  const [selectedTiles, setSelectedTiles] = useState([]);
  const [slots, setSlots] = useState([]);
  const [score, setScore] = useState(0);
  const [bonusPoints, setBonusPoints] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [gameComplete, setGameComplete] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [audioBlob, setAudioBlob] = useState(null);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [recordingComplete, setRecordingComplete] = useState(false);
  
  // Bonus system
  const [showBonusOption, setShowBonusOption] = useState(false);
  const [firstCorrectArrangement, setFirstCorrectArrangement] = useState(null);
  const [bonusAttempted, setBonusAttempted] = useState(false);
  
  // Flag to prevent auto-save from firing during state restoration
  const [isRestoringState, setIsRestoringState] = useState(false);
  
  // Sound effects toggle (user can mute)
  const [soundEnabled, setSoundEnabled] = useState(true);
  const soundInitialized = useRef(false);
  
  // Initialize sound on first user interaction
  const initSound = () => {
    if (!soundInitialized.current) {
      soundEffects.init();
      soundInitialized.current = true;
    }
  };
  
  const currentQuestion = questionsData[currentQuestionIndex];
  const totalQuestions = questionsData.length;
  
  // Sync sound enabled state with the sound effects instance
  useEffect(() => {
    soundEffects.setEnabled(soundEnabled);
  }, [soundEnabled]);
  
  // Play celebration sound when reaching Stage 4
  useEffect(() => {
    if (stage === 4 && gameStarted) {
      initSound();
      soundEffects.playCelebration();
    }
  }, [stage, gameStarted]);
  
  // ============================================================================
  // SAVE/LOAD SYSTEM
  // ============================================================================
  
  // Load complete game state from localStorage (all topics)
  const loadGameState = useCallback(() => {
    const state = getSavedGameState();
    return state || {
      topicProgress: {},
      lastActive: null,
      grammarForms: [],
      difficulty: 'beginner',
      totalScore: 0,
      questionsCompleted: 0,
      topicsCompleted: 0
    };
  }, []);
  
  // Save progress for THIS topic (preserves other topics)
  const saveProgress = useCallback((showConfirmation = false) => {
    // Don't save while we're restoring state - this prevents overwriting
    // the saved data with default values during the restore process
    if (isRestoringState) {
      console.log('[SAVE] Skipped - currently restoring state');
      return;
    }
    
    try {
      console.log('[SAVE] Saving for topic:', topicId, 'Question:', currentQuestionIndex, 'Score:', score);
      
      const gameState = loadGameState();
      
      if (!gameState.topicProgress) {
        gameState.topicProgress = {};
      }
      
      // Update only this topic's progress
      gameState.topicProgress[topicId] = {
        currentQuestion: currentQuestionIndex,
        score: score,
        bonusPoints: bonusPoints,
        completed: gameComplete
      };
      
      // Track which topic was last active (for cross-session continuity)
      gameState.lastActive = {
        topic: topicId,
        question: currentQuestionIndex,
        timestamp: new Date().toISOString()
      };
      
      // Save the user's grammar form and difficulty preferences
      if (gameStarted) {
        gameState.grammarForms = selectedForms;
        gameState.difficulty = tileMode;
      }
      
      // Recalculate global stats across all topics
      let totalScore = 0;
      let questionsCompleted = 0;
      let topicsCompleted = 0;
      
      Object.values(gameState.topicProgress).forEach(topicData => {
        totalScore += topicData.score || 0;
        totalScore += topicData.bonusPoints || 0;
        questionsCompleted += topicData.currentQuestion || 0;
        if (topicData.completed) topicsCompleted++;
      });
      
      gameState.totalScore = totalScore;
      gameState.questionsCompleted = questionsCompleted;
      gameState.topicsCompleted = topicsCompleted;
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
      console.log('[SAVE] Success!', gameState.topicProgress[topicId]);
      
      if (showConfirmation) {
        setFeedback('💾 Progress saved! ✓');
        setTimeout(() => setFeedback(''), 1500);
      }
      
    } catch (err) {
      console.error('[SAVE] Error:', err);
      if (showConfirmation) {
        setFeedback('❌ Save failed');
        setTimeout(() => setFeedback(''), 2000);
      }
    }
  }, [topicId, currentQuestionIndex, score, bonusPoints, gameComplete, gameStarted, selectedForms, tileMode, loadGameState, isRestoringState]);
  
  // ============================================================================
  // LOAD/RESTORE PROGRESS
  // Called when user clicks "Continue Game" button
  // Now uses a restoration flag to prevent auto-save interference
  // ============================================================================
  const loadProgress = useCallback(() => {
    const gameState = loadGameState();
    console.log('[LOAD] Game state:', gameState);
    console.log('[LOAD] Topic data:', gameState.topicProgress?.[topicId]);
    
    if (gameState.topicProgress && gameState.topicProgress[topicId]) {
      const topicData = gameState.topicProgress[topicId];
      
      console.log('[LOAD] Restoring:', topicId, 'Question:', topicData.currentQuestion, 'Score:', topicData.score);
      
      // Set flag to prevent auto-save during restoration
      setIsRestoringState(true);
      
      // Restore all gameplay state from saved data
      setCurrentQuestionIndex(topicData.currentQuestion || 0);
      setScore(topicData.score || 0);
      setBonusPoints(topicData.bonusPoints || 0);
      setGameComplete(topicData.completed || false);
      
      // Restore user preferences (grammar forms and difficulty)
      if (gameState.grammarForms && gameState.grammarForms.length > 0) {
        setSelectedForms(gameState.grammarForms);
      }
      if (gameState.difficulty) {
        setTileMode(gameState.difficulty);
      }
      
      // Always start at stage 1 of the current question
      setStage(1);
      
      // Start the game and show welcome message
      setGameStarted(true);
      setFeedback(`Welcome back! Continuing ${topicId} from question ${topicData.currentQuestion + 1}. 👋`);
      setTimeout(() => setFeedback(''), 2500);
      
      // Clear the restoration flag after React has processed state updates
      // Using setTimeout ensures all setState calls have been batched
      setTimeout(() => {
        setIsRestoringState(false);
        console.log('[LOAD] Restoration complete, auto-save re-enabled');
      }, 100);
    }
  }, [topicId, loadGameState]);
  
  // Clear progress for THIS topic only
  const clearTopicProgress = useCallback(() => {
    try {
      const gameState = loadGameState();
      if (gameState.topicProgress && gameState.topicProgress[topicId]) {
        delete gameState.topicProgress[topicId];
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
        console.log('[CLEAR] Cleared:', topicId);
      }
      setHasSavedProgress(false);
      setSavedTopicData(null);
    } catch (err) {
      console.error('[CLEAR] Error:', err);
    }
  }, [topicId, loadGameState]);
  
  // ============================================================================
  // AUTO-SAVE EFFECTS
  // Note: Question advancement is saved in handleContinue() directly
  // This auto-save handles score updates during gameplay
  // ============================================================================
  
  // Auto-save when score or bonus points change (not question index - that's handled in handleContinue)
  useEffect(() => {
    // Only auto-save if:
    // 1. Game is actively being played
    // 2. Game is not complete
    // 3. We're not in the middle of restoring state
    // 4. We have a score > 0 (means actual gameplay has happened)
    if (gameStarted && !gameComplete && !isRestoringState && (score > 0 || bonusPoints > 0)) {
      console.log('[AUTO-SAVE] Score changed - Question:', currentQuestionIndex, 'Score:', score);
      saveProgress(false);
    }
  }, [score, bonusPoints, gameStarted, gameComplete, isRestoringState, saveProgress]);
  
  // Save final state when game is completed
  useEffect(() => {
    if (gameComplete && !isRestoringState) {
      console.log('[COMPLETE] Saving final state');
      saveProgress(false);
    }
  }, [gameComplete, isRestoringState, saveProgress]);
  
  // ============================================================================
  // GAME ACTIONS
  // ============================================================================
  
  // Reset everything and start fresh
  const startNewGame = () => {
    clearTopicProgress();
    setGameStarted(false);
    setSelectedForms([]);
    setTileMode('beginner');
    setCurrentQuestionIndex(0);
    setStage(1);
    setScore(0);
    setBonusPoints(0);
    setGameComplete(false);
    setSelectedTiles([]);
    setSlots([]);
    setShowBonusOption(false);
    setFirstCorrectArrangement(null);
    setBonusAttempted(false);
  };
  
  // Manual save button handler
  const handleManualSave = () => {
    console.log('[MANUAL] Save clicked');
    saveProgress(true);
  };
  
  // Calculate completion percentage for this topic
  const getTopicCompletion = () => {
    if (!questionsData || questionsData.length === 0) return 0;
    return Math.round((currentQuestionIndex / questionsData.length) * 100);
  };
  
  // Get global stats across all topics
  const getGlobalStats = () => {
    const gameState = loadGameState();
    return {
      totalScore: gameState.totalScore || 0,
      questionsCompleted: gameState.questionsCompleted || 0,
      topicsCompleted: gameState.topicsCompleted || 0
    };
  };
  
  // ============================================================================
  // GAME LOGIC
  // ============================================================================
  
  // Toggle grammar form selection (Active, Progressive, Passive, Subordinate)
  const handleFormToggle = (form) => {
    if (selectedForms.includes(form)) {
      setSelectedForms(selectedForms.filter(f => f !== form));
    } else {
      setSelectedForms([...selectedForms, form]);
    }
  };
  
  // Start a new game with selected forms
  const handleStartGame = () => {
    if (selectedForms.length === 0) return;
    const randomForm = selectedForms[Math.floor(Math.random() * selectedForms.length)];
    setCurrentQuestionForm(randomForm);
    setGameStarted(true);
  };
  
  // Set random grammar form when moving to a new question
  useEffect(() => {
    if (gameStarted && stage === 1 && selectedForms.length > 0) {
      const randomForm = selectedForms[Math.floor(Math.random() * selectedForms.length)];
      setCurrentQuestionForm(randomForm);
      setShowBonusOption(false);
      setFirstCorrectArrangement(null);
      setBonusAttempted(false);
    }
  }, [currentQuestionIndex, stage, gameStarted, selectedForms]);
  
  // Fisher-Yates shuffle for randomizing tile order
  const scrambleSentence = (words) => {
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Capitalize first letter of a string (for sentence display)
  const capitalizeFirstLetter = (text) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  
  // Get tiles for current mode (beginner = phrase chunks, advanced = individual words)
  const getTilesForMode = (question, form) => {
    const suffix = tileMode === 'beginner' ? '' : '_advanced';
    const tilesKey = `tiles_${form.toLowerCase()}${suffix}`;
    const tilesData = question[tilesKey];
    if (Array.isArray(tilesData)) return tilesData;
    return tilesData ? tilesData.split(',').map(t => t.trim()) : [];
  };
  
  // Count how many valid word orders exist for bonus point opportunities
  const countValidOrders = () => {
    const suffix = tileMode === 'beginner' ? '_beginner' : '';
    let count = 0;
    for (let i = 1; i <= 20; i++) {
      const orderKey = `order_${currentQuestionForm.toLowerCase()}${suffix}_${i}`;
      if (currentQuestion[orderKey] && currentQuestion[orderKey].trim()) {
        count++;
      } else {
        break;
      }
    }
    return count;
  };
  
  // Generate multiple choice options for Stage 1
  const generateStage1Options = () => {
    if (!currentQuestion || !currentQuestionForm) return [];
    
    // Get correct answer tiles and scramble them
    const correctTiles = getTilesForMode(currentQuestion, currentQuestionForm);
    const scrambledCorrect = scrambleSentence(correctTiles);
    
    // Get 3 wrong answers from other questions
    const otherQuestions = questionsData.filter((_, idx) => idx !== currentQuestionIndex);
    const shuffledOthers = [...otherQuestions].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 3).map(q => {
      const distractorTiles = getTilesForMode(q, currentQuestionForm);
      return scrambleSentence(distractorTiles);
    });
    
    // Combine and shuffle all options
    const options = [
      { text: scrambledCorrect.join(' '), isCorrect: true, tiles: correctTiles },
      { text: distractors[0].join(' '), isCorrect: false, tiles: distractors[0] },
      { text: distractors[1].join(' '), isCorrect: false, tiles: distractors[1] },
      { text: distractors[2].join(' '), isCorrect: false, tiles: distractors[2] }
    ];
    
    return options.sort(() => Math.random() - 0.5);
  };
  
  const [stage1Options, setStage1Options] = useState([]);
  
  // Regenerate Stage 1 options when question or form changes
  useEffect(() => {
    if (gameStarted && stage === 1 && currentQuestionForm) {
      setStage1Options(generateStage1Options());
    }
  }, [currentQuestionIndex, stage, currentQuestionForm, gameStarted]);
  
  // ============================================================================
  // STAGE HANDLERS
  // ============================================================================
  
  // Stage 1: Select which scrambled sentence matches the question
  const handleOptionSelect = (index) => {
    setSelectedOption(index);
  };
  
  const handleStage1Submit = () => {
    if (selectedOption === null) return;
    
    const selected = stage1Options[selectedOption];
    if (selected.isCorrect) {
      initSound();
      soundEffects.playStage1Success();
      setFeedback('Great! You found the right meaning! 🎉');
      const scrambled = scrambleSentence(selected.tiles);
      setSelectedTiles(scrambled);
      setSlots(Array(scrambled.length).fill(null));
      
      setTimeout(() => {
        setStage(2);
        setFeedback('');
        setSelectedOption(null);
      }, 1500);
    } else {
      initSound();
      soundEffects.playWrongAnswer();
      setFeedback('Not quite! Try another one. 🤔');
      setTimeout(() => setFeedback(''), 1500);
    }
  };
  
  // Stage 2: Arrange tiles in correct grammatical order
  const handleTileClick = (tileIndex) => {
    const emptySlotIndex = slots.findIndex(slot => slot === null);
    if (emptySlotIndex !== -1) {
      initSound();
      soundEffects.playTilePickup();
      const newSlots = [...slots];
      newSlots[emptySlotIndex] = tileIndex;
      setSlots(newSlots);
    }
  };
  
  const handleSlotClick = (slotIndex) => {
    if (slots[slotIndex] !== null) {
      initSound();
      soundEffects.playTileDrop();
      const newSlots = [...slots];
      newSlots[slotIndex] = null;
      setSlots(newSlots);
    }
  };
  
  // Check if current tile arrangement matches any valid order
  const checkArrangement = () => {
    const suffix = tileMode === 'beginner' ? '_beginner' : '';
    const userOrder = slots.map(tileIndex => selectedTiles[tileIndex]).join(',');
    
    for (let i = 1; i <= 20; i++) {
      const orderKey = `order_${currentQuestionForm.toLowerCase()}${suffix}_${i}`;
      const correctOrder = currentQuestion[orderKey];
      if (correctOrder && userOrder === correctOrder) {
        return { isCorrect: true, orderIndex: i };
      }
    }
    return { isCorrect: false };
  };
  
  const handleStage2Submit = () => {
    if (slots.includes(null)) {
      setFeedback('Please fill all the slots! 📝');
      setTimeout(() => setFeedback(''), 1500);
      return;
    }
    
    const result = checkArrangement();
    const userOrder = slots.map(tileIndex => selectedTiles[tileIndex]).join(',');
    
    if (result.isCorrect) {
      initSound();
      if (bonusAttempted && firstCorrectArrangement) {
        // User is attempting bonus - check if it's a different arrangement
        if (userOrder === firstCorrectArrangement) {
          soundEffects.playWrongAnswer();
          setFeedback("That's the same order! Try arranging it differently.");
          setTimeout(() => setFeedback(''), 2000);
          return;
        } else {
          // Different valid arrangement = bonus point!
          soundEffects.playBonusSuccess();
          setFeedback('Bonus point! You found another way! 🌟🎁');
          setBonusPoints(bonusPoints + 1);
          setTimeout(() => {
            setStage(3);
            setFeedback('');
          }, 2000);
        }
      } else {
        // First correct answer
        soundEffects.playStage2Success();
        setFeedback('Perfect grammar! 🌟');
        setScore(score + 1);
        setFirstCorrectArrangement(userOrder);
        const totalValidOrders = countValidOrders();
        
        setTimeout(() => {
          setFeedback('');
          if (totalValidOrders >= 2) {
            // Multiple valid orders exist - offer bonus challenge
            setShowBonusOption(true);
          } else {
            setStage(3);
          }
        }, 1500);
      }
    } else {
      initSound();
      soundEffects.playWrongAnswer();
      setFeedback('Not quite right. Try a different arrangement! 🤔');
      setTimeout(() => setFeedback(''), 1500);
    }
  };
  
  // Bonus challenge handlers
  const handleTryAnotherWay = () => {
    setShowBonusOption(false);
    setBonusAttempted(true);
    setSlots(Array(selectedTiles.length).fill(null));
    setFeedback('');
  };
  
  const handleSkipBonus = () => {
    setShowBonusOption(false);
    setStage(3);
  };
  
  // Get the correct sentence for Stage 3 reading
  const getCorrectSentence = () => {
    const suffix = tileMode === 'beginner' ? '_beginner' : '';
    const orderKey = `order_${currentQuestionForm.toLowerCase()}${suffix}_1`;
    const correctOrder = currentQuestion[orderKey];
    
    if (correctOrder) {
      const tiles = correctOrder.split(',').map(t => t.trim().replace(/\.$/, ''));
      return tiles.map((tile, i) => i === 0 ? capitalizeFirstLetter(tile) : tile).join(' ') + '.';
    }
    return '';
  };
  
  // Stage 3: Audio recording handlers
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks = [];
      
      recorder.ondataavailable = (e) => chunks.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setAudioBlob(blob);
        setRecordingComplete(true);
        stream.getTracks().forEach(track => track.stop());
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (err) {
      console.error('Microphone error:', err);
      setFeedback('Could not access microphone. You can skip this step!');
    }
  };
  
  const handleStopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      setIsRecording(false);
    }
  };
  
  const handlePlayback = () => {
    if (audioBlob) {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.play();
    }
  };
  
  const handleContinueFromStage3 = () => {
    initSound();
    soundEffects.playRecordingDone();
    setStage(4);
    setRecordingComplete(false);
    setAudioBlob(null);
  };
  
  // Stage 4: Move to next question or complete game
  // IMPORTANT: We save with the NEW question index directly to localStorage
  // This ensures that when user resumes, they start at the next unseen question
  // We can't rely on auto-save because React state updates are batched/async
  const handleContinue = () => {
    if (currentQuestionIndex < questionsData.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;
      
      // Save directly to localStorage with the NEXT question index
      // This bypasses the async state update issue
      try {
        const gameState = loadGameState();
        if (!gameState.topicProgress) gameState.topicProgress = {};
        
        gameState.topicProgress[topicId] = {
          currentQuestion: nextQuestionIndex,  // Save the NEW index
          score: score,
          bonusPoints: bonusPoints,
          completed: false
        };
        
        gameState.lastActive = {
          topic: topicId,
          question: nextQuestionIndex,
          timestamp: new Date().toISOString()
        };
        
        gameState.grammarForms = selectedForms;
        gameState.difficulty = tileMode;
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
        console.log('[CONTINUE] Saved progress at question:', nextQuestionIndex, 'Score:', score);
      } catch (err) {
        console.error('[CONTINUE] Save error:', err);
      }
      
      // Now update React state
      setCurrentQuestionIndex(nextQuestionIndex);
      setStage(1);
      setSelectedTiles([]);
      setSlots([]);
      setShowBonusOption(false);
      setFirstCorrectArrangement(null);
      setBonusAttempted(false);
    } else {
      setGameComplete(true);
    }
  };
  
  // ============================================================================
  // RENDER: Setup Screen (before game starts)
  // ============================================================================
  
  // Check if this topic was already completed
  const isTopicCompleted = () => {
    const gameState = getSavedGameState();
    return gameState?.topicProgress?.[topicId]?.completed === true;
  };
  
  const getCompletedTopicData = () => {
    const gameState = getSavedGameState();
    return gameState?.topicProgress?.[topicId] || null;
  };

  if (!gameStarted) {
    const completed = isTopicCompleted();
    const completedData = completed ? getCompletedTopicData() : null;
    
    return (
      <div className="setup-screen">
        {/* Show completion message if topic already done */}
        {completed && completedData && (
          <div style={{
            background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '2px solid #f39c12',
            textAlign: 'center'
          }}>
            <h3 style={{ color: '#d35400', marginBottom: '15px', fontSize: '24px' }}>
              🏆 You've completed {topicId}! 🏆
            </h3>
            <p style={{ marginBottom: '10px', color: '#333', fontSize: '18px' }}>
              Score: {completedData.score} {completedData.bonusPoints > 0 && `(+${completedData.bonusPoints} bonus)`}
            </p>
            <button onClick={startNewGame} className="btn-primary" style={{ marginTop: '15px', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
              🔄 Play Again
            </button>
          </div>
        )}
        
        {/* Show saved progress prompt if available */}
        {!completed && hasSavedProgress && savedTopicData && (
          <div style={{
            background: '#e3f2fd',
            padding: '20px',
            borderRadius: '12px',
            marginBottom: '30px',
            border: '2px solid #2196F3'
          }}>
            <h3 style={{ color: '#1976D2', marginBottom: '15px' }}>
              📌 Saved Progress Found for {topicId}!
            </h3>
            <p style={{ marginBottom: '10px', color: '#333' }}>
              You were on question {savedTopicData.currentQuestion + 1} of {totalQuestions}
            </p>
            <p style={{ marginBottom: '20px', color: '#666', fontSize: '14px' }}>
              Score: {savedTopicData.score} {savedTopicData.bonusPoints > 0 && `(+${savedTopicData.bonusPoints} bonus)`}
            </p>
            <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <button onClick={loadProgress} className="btn-primary" style={{ background: 'linear-gradient(135deg, #4CAF50 0%, #8BC34A 100%)' }}>
                ▶️ Continue Game
              </button>
              <button onClick={startNewGame} className="btn-primary" style={{ background: '#999' }}>
                🔄 Start New Game
              </button>
            </div>
          </div>
        )}
        
        {/* Only show setup options if not completed, or after clicking Play Again */}
        {!completed && (
          <>
            <h2>Choose Your Grammar Forms</h2>
        <div className="form-selection">
          {['Active', 'Progressive', 'Passive', 'Subordinate'].map(form => (
            <label key={form} className="checkbox-label">
              <input type="checkbox" checked={selectedForms.includes(form)} onChange={() => handleFormToggle(form)} />
              {form}
            </label>
          ))}
        </div>
        
        <h2>Choose Difficulty Mode</h2>
        <div className="mode-selection">
          <label className="radio-label">
            <input type="radio" name="mode" value="beginner" checked={tileMode === 'beginner'} onChange={() => setTileMode('beginner')} />
            Beginner (Phrase Chunks)
          </label>
          <label className="radio-label">
            <input type="radio" name="mode" value="advanced" checked={tileMode === 'advanced'} onChange={() => setTileMode('advanced')} />
            Advanced (Individual Words)
          </label>
        </div>
        
        <button onClick={handleStartGame} disabled={selectedForms.length === 0} className="btn-primary" style={{ marginTop: '20px' }}>
          Start Game
        </button>
          </>
        )}
      </div>
    );
  }
  
  // ============================================================================
  // RENDER: Game Complete Screen
  // ============================================================================
  
  if (gameComplete) {
    const globalStats = getGlobalStats();
    return (
      <div className="game-complete-screen">
        <h1>🎉 Topic Complete! 🎉</h1>
        <div className="final-score">
          <p className="score-text">Topic Score: {score}</p>
          {bonusPoints > 0 && <p className="bonus-text">Bonus Points: {bonusPoints}</p>}
          <p className="total-text">Total: {score + bonusPoints}</p>
          <div style={{ marginTop: '30px', fontSize: '16px', opacity: 0.9 }}>
            <p>Global Progress:</p>
            <p>Total Score: {globalStats.totalScore}</p>
            <p>Questions Completed: {globalStats.questionsCompleted}</p>
            <p>Topics Completed: {globalStats.topicsCompleted}/12</p>
          </div>
        </div>
        <button onClick={() => window.location.href = '/'} className="btn-primary">
          Back to Topics
        </button>
        <button onClick={startNewGame} className="btn-primary" style={{ marginTop: '15px', background: '#999' }}>
          Play This Topic Again
        </button>
      </div>
    );
  }
  
  // ============================================================================
  // RENDER: Main Game Screen
  // ============================================================================
  
  const completion = getTopicCompletion();
  
  return (
    <div className="game-container">
      {/* Header with progress tracking */}
      <div className="game-header">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }} />
        </div>
        
        <p className="question-counter">
          Question {currentQuestionIndex + 1} of {totalQuestions} | Stage {stage} of 4
        </p>
        <p className="question-counter" style={{ fontSize: '16px', fontWeight: 'bold', color: '#4CAF50' }}>
          Progress: {completion}% Complete
        </p>
        
        <p className="score-display">
          Score: {score} {bonusPoints > 0 && `(+${bonusPoints} bonus)`}
        </p>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#999', marginTop: '5px' }}>
          {currentQuestionForm} | {tileMode === 'beginner' ? 'Beginner Mode' : 'Advanced Mode'}
        </p>
        
        {/* Save and restart buttons */}
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '10px', flexWrap: 'wrap' }}>
          <button onClick={() => { initSound(); setSoundEnabled(!soundEnabled); }} style={{ background: soundEnabled ? '#9C27B0' : '#999', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', minWidth: '80px' }}>
            {soundEnabled ? '🔊 Sound' : '🔇 Muted'}
          </button>
          <button onClick={handleManualSave} style={{ background: '#4CAF50', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', minWidth: '120px' }}>
            💾 Save Progress
          </button>
          <button onClick={startNewGame} style={{ background: '#ff5722', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '12px', minWidth: '120px' }}>
            🔄 Restart Game
          </button>
        </div>
      </div>
      
      {/* Feedback banner */}
      {feedback && <div className="feedback-banner">{feedback}</div>}
      
      {/* Reading passage */}
      <div className="reading-passage">
        <p>{currentQuestion.text_segment}</p>
      </div>
      
      {/* Question prompt */}
      <div className="question-prompt">
        <h3>{currentQuestion.question}</h3>
      </div>
      
      {/* Stage 1: Multiple choice - identify correct scrambled sentence */}
      {stage === 1 && (
        <div className="stage-1">
          <h4 className="stage-title">🎪 Which silly sentence is trying to say the right thing?</h4>
          <div className="options-container">
            {stage1Options.map((option, index) => (
              <div key={index} className={`option ${selectedOption === index ? 'selected' : ''}`} onClick={() => handleOptionSelect(index)}>
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option.text}</span>
              </div>
            ))}
          </div>
          <button onClick={handleStage1Submit} disabled={selectedOption === null} className="btn-primary">
            Submit Answer
          </button>
        </div>
      )}
      
      {/* Stage 2: Tile arrangement */}
      {stage === 2 && !showBonusOption && (
        <div className="stage-2">
          <h4 className="stage-title">
            {bonusAttempted ? '🎁 Bonus: Try arranging it a different way!' : '🔧 Now arrange these words in the correct order!'}
          </h4>
          
          {/* Slots where tiles are placed */}
          <div className="slots-container">
            {slots.map((tileIndex, slotIndex) => (
              <div key={slotIndex} className={`slot ${tileIndex !== null ? 'filled' : 'empty'}`} onClick={() => handleSlotClick(slotIndex)}>
                {tileIndex !== null && (
                  <span>{slotIndex === 0 ? capitalizeFirstLetter(selectedTiles[tileIndex]) : selectedTiles[tileIndex]}</span>
                )}
              </div>
            ))}
          </div>
          
          {/* Available tiles to drag */}
          <div className="tiles-container">
            {selectedTiles.map((tile, index) => (
              <div key={index} className={`tile ${slots.includes(index) ? 'used' : ''}`} onClick={() => !slots.includes(index) && handleTileClick(index)}>
                {tile}
              </div>
            ))}
          </div>
          
          <button onClick={handleStage2Submit} className="btn-primary">
            {bonusAttempted ? 'Check Bonus Answer' : 'Check Grammar'}
          </button>
        </div>
      )}
      
      {/* Stage 2: Bonus option prompt */}
      {stage === 2 && showBonusOption && (
        <div className="stage-2">
          <div style={{ textAlign: 'center', padding: '40px', background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)', borderRadius: '20px', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '28px', marginBottom: '20px', color: '#d35400' }}>🎁 Bonus Challenge! 🎁</h3>
            <p style={{ fontSize: '18px', marginBottom: '30px', color: '#333' }}>
              This sentence can be arranged another way!<br/>Try to find it for a bonus point!
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={handleTryAnotherWay} className="btn-primary" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}>
                Try Another Way! 🎯
              </button>
              <button onClick={handleSkipBonus} className="btn-primary" style={{ background: '#999' }}>
                Continue to Reading →
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Stage 3: Read aloud */}
      {stage === 3 && (
        <div className="stage-3">
          <h4 className="stage-title">🎤 Now read this sentence aloud!</h4>
          <div className="sentence-display">
            <p className="sentence-to-read">{getCorrectSentence()}</p>
          </div>
          
          <div className="recording-controls">
            {!isRecording && !recordingComplete && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', alignItems: 'center' }}>
                <button onClick={handleStartRecording} className="btn-record">
                  🎤 Start Reading
                </button>
                <button onClick={handleContinueFromStage3} style={{ background: '#999', color: 'white', border: 'none', padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontSize: '14px' }}>
                  ⏭️ Skip Recording
                </button>
              </div>
            )}
            
            {isRecording && (
              <div>
                <button onClick={handleStopRecording} className="btn-record recording">
                  ⏹️ Stop Recording
                </button>
                <div className="recording-indicator">
                  <div className="pulse"></div>
                  <p>Recording... Speak now!</p>
                </div>
              </div>
            )}
            
            {recordingComplete && (
              <div className="recording-complete-controls">
                <button onClick={handlePlayback} className="btn-playback">
                  🔊 Listen to Yourself
                </button>
                <button onClick={handleContinueFromStage3} className="btn-primary">
                  Continue to Celebration! →
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      
      {/* Stage 4: Celebration and continue */}
      {stage === 4 && (
        <div className="stage-4">
          <h4 className="stage-title">🎉 Amazing Work! 🎉</h4>
          <div className="celebration">
            <div className="confetti-container">
              {[...Array(20)].map((_, i) => (
                <div key={i} className={`confetti confetti-${i % 5}`} />
              ))}
            </div>
            <div className="celebration-message">
              <h2>You got it right! 🌟</h2>
              <p className="correct-sentence">{getCorrectSentence()}</p>
            </div>
            <div className="celebration-tiles">
              {slots.map((tileIndex, index) => (
                <div key={index} className="celebration-tile" style={{ animationDelay: `${index * 0.1}s` }}>
                  {index === 0 ? capitalizeFirstLetter(selectedTiles[tileIndex]) : selectedTiles[tileIndex]}
                </div>
              ))}
            </div>
          </div>
          <button onClick={handleContinue} className="btn-primary btn-continue">
            {currentQuestionIndex < questionsData.length - 1 ? 'Next Question →' : 'Finish Game 🎊'}
          </button>
        </div>
      )}
    </div>
  );
};

export default MultiStageGrammarGame;
