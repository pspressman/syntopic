// pages/grammar-game.js
// Multi-Stage Grammar Game Page

import MultiStageGrammarGame from '../components/MultiStageGrammarGame';
import geologyQuestions from '../data/geologyQuestions.json';

export default function GrammarGamePage() {
  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px 20px',
        textAlign: 'center',
        marginBottom: '0'
      }}>
        <h1 style={{ margin: '0 0 10px 0', fontSize: '36px' }}>
          🧪 Geology Grammar Adventure 🌍
        </h1>
        <p style={{ margin: 0, fontSize: '18px', opacity: 0.9 }}>
          Learn about rocks and grammar in 4 fun stages!
        </p>
      </header>
      
      {/* The game component */}
      <MultiStageGrammarGame questionsData={geologyQuestions} />
      
      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        color: '#999',
        fontSize: '14px',
        marginTop: '40px'
      }}>
        <p>Multi-Stage Grammar & Reading Comprehension Game</p>
      </footer>
    </div>
  );
}
