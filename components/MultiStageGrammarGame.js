// MultiStageGrammarGame.js - 4-Stage Grammar & Reading Comprehension Game
// FIXED: Tiles now scrambled in Stage 2, bonus only offered when alternatives exist

import React, { useState, useEffect } from 'react';

const MultiStageGrammarGame = ({ questionsData }) => {
  // Setup state
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedForms, setSelectedForms] = useState([]);
  const [tileMode, setTileMode] = useState('beginner'); // 'beginner' or 'advanced'
  const [currentQuestionForm, setCurrentQuestionForm] = useState('');
  
  // Game state
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
  
  // Bonus system state
  const [showBonusOption, setShowBonusOption] = useState(false);
  const [firstCorrectArrangement, setFirstCorrectArrangement] = useState(null);
  const [bonusAttempted, setBonusAttempted] = useState(false);
  
  const currentQuestion = questionsData[currentQuestionIndex];
  
  // Handle form checkbox toggle
  const handleFormToggle = (form) => {
    if (selectedForms.includes(form)) {
      setSelectedForms(selectedForms.filter(f => f !== form));
    } else {
      setSelectedForms([...selectedForms, form]);
    }
  };
  
  // Start game with selected forms and mode
  const handleStartGame = () => {
    if (selectedForms.length === 0) return;
    
    const randomForm = selectedForms[Math.floor(Math.random() * selectedForms.length)];
    setCurrentQuestionForm(randomForm);
    setGameStarted(true);
  };
  
  // Pick random form when question changes
  useEffect(() => {
    if (gameStarted && stage === 1) {
      const randomForm = selectedForms[Math.floor(Math.random() * selectedForms.length)];
      setCurrentQuestionForm(randomForm);
      setShowBonusOption(false);
      setFirstCorrectArrangement(null);
      setBonusAttempted(false);
    }
  }, [currentQuestionIndex, stage]);
  
  // Scramble a sentence
  const scrambleSentence = (words) => {
    const shuffled = [...words];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  // Auto-capitalize helper for first tile in sentence
  const capitalizeFirstLetter = (text) => {
    if (!text) return text;
    return text.charAt(0).toUpperCase() + text.slice(1);
  };
  
  // Get tiles based on mode
  const getTilesForMode = (question, form) => {
    const suffix = tileMode === 'beginner' ? '' : '_advanced';
    const tilesKey = `tiles_${form.toLowerCase()}${suffix}`;
    const tilesData = question[tilesKey];
    
    // Handle if already an array or if it's a string
    if (Array.isArray(tilesData)) {
      return tilesData;
    }
    return tilesData ? tilesData.split(',').map(t => t.trim()) : [];
  };
  
  // Count how many valid orders exist for current form/mode
  const countValidOrders = () => {
    const suffix = tileMode === 'beginner' ? '_beginner' : '';
    let count = 0;
    
    // Check all possible order keys (we have up to 10 in some cases)
    for (let i = 1; i <= 20; i++) {
      const orderKey = `order_${currentQuestionForm.toLowerCase()}${suffix}_${i}`;
      if (currentQuestion[orderKey] && currentQuestion[orderKey].trim()) {
        count++;
      } else {
        break; // Stop when we hit first missing order
      }
    }
    
    return count;
  };
  
  // Generate Stage 1 options
  const generateStage1Options = () => {
    if (!currentQuestion || !currentQuestionForm) return [];
    
    const correctTiles = getTilesForMode(currentQuestion, currentQuestionForm);
    const scrambledCorrect = scrambleSentence(correctTiles);
    
    const otherQuestions = questionsData.filter((_, idx) => idx !== currentQuestionIndex);
    const shuffledOthers = [...otherQuestions].sort(() => Math.random() - 0.5);
    const distractors = shuffledOthers.slice(0, 3).map(q => {
      const distractorTiles = getTilesForMode(q, currentQuestionForm);
      return scrambleSentence(distractorTiles);
    });
    
    const options = [
      { text: scrambledCorrect.join(' '), isCorrect: true, tiles: correctTiles },
      { text: distractors[0].join(' '), isCorrect: false, tiles: distractors[0] },
      { text: distractors[1].join(' '), isCorrect: false, tiles: distractors[1] },
      { text: distractors[2].join(' '), isCorrect: false, tiles: distractors[2] }
    ];
    
    return options.sort(() => Math.random() - 0.5);
  };
  
  const [stage1Options, setStage1Options] = useState([]);
  
  useEffect(() => {
    if (gameStarted && stage === 1 && currentQuestionForm) {
      setStage1Options(generateStage1Options());
    }
  }, [currentQuestionIndex, stage, currentQuestionForm]);
  
  // Stage 1: Handle option selection
  const handleOptionSelect = (index) => {
    setSelectedOption(index);
  };
  
  // Stage 1: Submit answer
  const handleStage1Submit = () => {
    if (selectedOption === null) return;
    
    const selected = stage1Options[selectedOption];
    if (selected.isCorrect) {
      setFeedback('Great! You found the right meaning! 🎉');
      
      // FIXED: Scramble tiles for Stage 2
      const scrambled = scrambleSentence(selected.tiles);
      setSelectedTiles(scrambled);
      setSlots(Array(scrambled.length).fill(null));
      
      setTimeout(() => {
        setStage(2);
        setFeedback('');
        setSelectedOption(null);
      }, 1500);
    } else {
      setFeedback('Not quite! Try another one. 🤔');
      setTimeout(() => setFeedback(''), 1500);
    }
  };
  
  // Stage 2: Handle tile click
  const handleTileClick = (tileIndex) => {
    const emptySlotIndex = slots.findIndex(slot => slot === null);
    if (emptySlotIndex !== -1) {
      const newSlots = [...slots];
      newSlots[emptySlotIndex] = tileIndex;
      setSlots(newSlots);
    }
  };
  
  // Stage 2: Handle slot click (remove tile)
  const handleSlotClick = (slotIndex) => {
    if (slots[slotIndex] !== null) {
      const newSlots = [...slots];
      newSlots[slotIndex] = null;
      setSlots(newSlots);
    }
  };
  
  // Stage 2: Check if arrangement matches any valid order
  const checkArrangement = () => {
    const suffix = tileMode === 'beginner' ? '_beginner' : '';
    const userOrder = slots.map(tileIndex => selectedTiles[tileIndex]).join(',');
    
    // Check against all valid orders
    for (let i = 1; i <= 20; i++) {
      const orderKey = `order_${currentQuestionForm.toLowerCase()}${suffix}_${i}`;
      const correctOrder = currentQuestion[orderKey];
      if (correctOrder && userOrder === correctOrder) {
        return { isCorrect: true, orderIndex: i };
      }
    }
    
    return { isCorrect: false };
  };
  
  // Stage 2: Submit arrangement
  const handleStage2Submit = () => {
    if (slots.includes(null)) {
      setFeedback('Please fill all the slots! 📝');
      setTimeout(() => setFeedback(''), 1500);
      return;
    }
    
    const result = checkArrangement();
    const userOrder = slots.map(tileIndex => selectedTiles[tileIndex]).join(',');
    
    if (result.isCorrect) {
      // Check if this is bonus attempt
      if (bonusAttempted && firstCorrectArrangement) {
        // Bonus attempt
        if (userOrder === firstCorrectArrangement) {
          setFeedback("That's the same order! Try arranging it differently.");
          setTimeout(() => setFeedback(''), 2000);
          return;
        } else {
          // Different valid arrangement!
          setFeedback('Bonus point! You found another way! 🌟🎁');
          setBonusPoints(bonusPoints + 1);
          setTimeout(() => {
            setStage(3);
            setFeedback('');
          }, 2000);
        }
      } else {
        // First correct attempt
        setFeedback('Perfect grammar! 🌟');
        setScore(score + 1);
        setFirstCorrectArrangement(userOrder);
        
        // FIXED: Count total valid orders, only offer bonus if 2+
        const totalValidOrders = countValidOrders();
        
        setTimeout(() => {
          setFeedback('');
          if (totalValidOrders >= 2) {
            setShowBonusOption(true);
          } else {
            setStage(3);
          }
        }, 1500);
      }
    } else {
      setFeedback('Not quite right. Try a different arrangement! 🤔');
      setTimeout(() => setFeedback(''), 1500);
    }
  };
  
  // Handle trying bonus challenge
  const handleTryAnotherWay = () => {
    setShowBonusOption(false);
    setBonusAttempted(true);
    setSlots(Array(selectedTiles.length).fill(null));
    setFeedback('');
  };
  
  // Skip bonus and go to stage 3
  const handleSkipBonus = () => {
    setShowBonusOption(false);
    setStage(3);
  };
  
  // Get the correct sentence for display
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
  
  // Stage 3: Voice recording functions
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
      console.error('Error accessing microphone:', err);
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
    setStage(4);
    setRecordingComplete(false);
    setAudioBlob(null);
  };
  
  // Stage 4: Continue button
  const handleContinue = () => {
    if (currentQuestionIndex < questionsData.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
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
  
  // Setup screen
  if (!gameStarted) {
    return (
      <div className="setup-screen">
        <h2>Choose Your Grammar Forms</h2>
        <div className="form-selection">
          {['Active', 'Progressive', 'Passive', 'Subordinate'].map(form => (
            <label key={form} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedForms.includes(form)}
                onChange={() => handleFormToggle(form)}
              />
              {form}
            </label>
          ))}
        </div>
        
        <h2>Choose Difficulty Mode</h2>
        <div className="mode-selection">
          <label className="radio-label">
            <input
              type="radio"
              name="mode"
              value="beginner"
              checked={tileMode === 'beginner'}
              onChange={() => setTileMode('beginner')}
            />
            Beginner (Phrase Chunks)
          </label>
          <label className="radio-label">
            <input
              type="radio"
              name="mode"
              value="advanced"
              checked={tileMode === 'advanced'}
              onChange={() => setTileMode('advanced')}
            />
            Advanced (Individual Words)
          </label>
        </div>
        
        <button 
          onClick={handleStartGame}
          disabled={selectedForms.length === 0}
          className="btn-primary"
          style={{ marginTop: '20px' }}
        >
          Start Game
        </button>
      </div>
    );
  }
  
  // Game complete screen
  if (gameComplete) {
    return (
      <div className="game-complete-screen">
        <h1>🎉 Congratulations! 🎉</h1>
        <div className="final-score">
          <p className="score-text">Final Score: {score}</p>
          {bonusPoints > 0 && <p className="bonus-text">Bonus Points: {bonusPoints}</p>}
          <p className="total-text">Total: {score + bonusPoints}</p>
        </div>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Play Again
        </button>
      </div>
    );
  }
  
  return (
    <div className="game-container">
      <div className="game-header">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: `${((currentQuestionIndex + 1) / questionsData.length) * 100}%` }}
          />
        </div>
        <p className="question-counter">
          Question {currentQuestionIndex + 1} of {questionsData.length} | Stage {stage} of 4
        </p>
        <p className="score-display">
          Score: {score} {bonusPoints > 0 && `(+${bonusPoints} bonus)`}
        </p>
        <p style={{ textAlign: 'center', fontSize: '14px', color: '#999', marginTop: '5px' }}>
          {currentQuestionForm} | {tileMode === 'beginner' ? 'Beginner Mode' : 'Advanced Mode'}
        </p>
      </div>
      
      {feedback && <div className="feedback-banner">{feedback}</div>}
      
      <div className="reading-passage">
        <p>{currentQuestion.text_segment}</p>
      </div>
      
      <div className="question-prompt">
        <h3>{currentQuestion.question}</h3>
      </div>
      
      {/* STAGE 1: Multiple Choice */}
      {stage === 1 && (
        <div className="stage-1">
          <h4 className="stage-title">🎪 Which silly sentence is trying to say the right thing?</h4>
          <div className="options-container">
            {stage1Options.map((option, index) => (
              <div
                key={index}
                className={`option ${selectedOption === index ? 'selected' : ''}`}
                onClick={() => handleOptionSelect(index)}
              >
                <span className="option-letter">{String.fromCharCode(65 + index)}</span>
                <span className="option-text">{option.text}</span>
              </div>
            ))}
          </div>
          <button 
            onClick={handleStage1Submit}
            disabled={selectedOption === null}
            className="btn-primary"
          >
            Submit Answer
          </button>
        </div>
      )}
      
      {/* STAGE 2: Tile Arrangement */}
      {stage === 2 && !showBonusOption && (
        <div className="stage-2">
          <h4 className="stage-title">
            {bonusAttempted ? '🎁 Bonus: Try arranging it a different way!' : '📝 Now arrange these words in the correct order!'}
          </h4>
          
          <div className="slots-container">
            {slots.map((tileIndex, slotIndex) => (
              <div
                key={slotIndex}
                className={`slot ${tileIndex !== null ? 'filled' : 'empty'}`}
                onClick={() => handleSlotClick(slotIndex)}
              >
                {tileIndex !== null && (
                  <span>
                    {slotIndex === 0 
                      ? capitalizeFirstLetter(selectedTiles[tileIndex])
                      : selectedTiles[tileIndex]
                    }
                  </span>
                )}
              </div>
            ))}
          </div>
          
          <div className="tiles-container">
            {selectedTiles.map((tile, index) => (
              <div
                key={index}
                className={`tile ${slots.includes(index) ? 'used' : ''}`}
                onClick={() => !slots.includes(index) && handleTileClick(index)}
              >
                {tile}
              </div>
            ))}
          </div>
          
          <button 
            onClick={handleStage2Submit}
            className="btn-primary"
          >
            {bonusAttempted ? 'Check Bonus Answer' : 'Check Grammar'}
          </button>
        </div>
      )}
      
      {/* Bonus Option Screen */}
      {stage === 2 && showBonusOption && (
        <div className="stage-2">
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'linear-gradient(135deg, #ffeaa7 0%, #fdcb6e 100%)',
            borderRadius: '20px',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '28px', marginBottom: '20px', color: '#d35400' }}>
              🎁 Bonus Challenge! 🎁
            </h3>
            <p style={{ fontSize: '18px', marginBottom: '30px', color: '#333' }}>
              This sentence can be arranged another way!<br/>
              Try to find it for a bonus point!
            </p>
            <div style={{ display: 'flex', gap: '15px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleTryAnotherWay}
                className="btn-primary"
                style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' }}
              >
                Try Another Way! 🎯
              </button>
              <button
                onClick={handleSkipBonus}
                className="btn-primary"
                style={{ background: '#999' }}
              >
                Continue to Reading →
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* STAGE 3: Voice Recording */}
      {stage === 3 && (
        <div className="stage-3">
          <h4 className="stage-title">🎤 Now read this sentence aloud!</h4>
          <div className="sentence-display">
            <p className="sentence-to-read">{getCorrectSentence()}</p>
          </div>
          
          <div className="recording-controls">
            {!isRecording && !recordingComplete && (
              <button onClick={handleStartRecording} className="btn-record">
                🎤 Start Reading
              </button>
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
      
      {/* STAGE 4: Celebration */}
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
                <div
                  key={index}
                  className="celebration-tile"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
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