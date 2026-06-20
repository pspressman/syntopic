// pages/topics/[topicId].js - Dynamic Topic Page
// This single file handles ALL 12 topics by dynamically loading the right question data
// UPDATED: Now passes topicId to MultiStageGrammarGame for topic-specific save storage

import Link from 'next/link';
import { useRouter } from 'next/router';
import MultiStageGrammarGame from '../../components/MultiStageGrammarGame';
import TopicBackground from '../../components/TopicBackground';

// Import all question data files
import geologyQuestions from '../../data/geologyQuestions.json';
import weatherQuestions from '../../data/weatherQuestions.json';
import natureQuestions from '../../data/natureQuestions.json';
import indianLoreQuestions from '../../data/indianLoreQuestions.json';
import personalMgmtQuestions from '../../data/personalMgmtQuestions.json';
import wildernessSurvivalQuestions from '../../data/wildernessSurvivalQuestions.json';
import emergencyPrepQuestions from '../../data/emergencyPrepQuestions.json';
import firstAidQuestions from '../../data/firstAidQuestions.json';
import environmentalQuestions from '../../data/environmentalQuestions.json';
import astronomyQuestions from '../../data/astronomyQuestions.json';
import spaceExplorationQuestions from '../../data/spaceExplorationQuestions.json';
import personalSafetyQuestions from '../../data/personalSafetyQuestions.json';

// Topic configuration with questions data
const topicConfig = {
  'geology': {
    title: 'Geology',
    icon: '🪨',
    subtitle: 'Discover rocks, minerals, and the forces that shape our Earth',
    gradient: 'linear-gradient(135deg, #8B4513 0%, #A0522D 100%)',
    questions: geologyQuestions
  },
  'weather': {
    title: 'Weather',
    icon: '⛈️',
    subtitle: 'Learn about clouds, storms, and how weather patterns form',
    gradient: 'linear-gradient(135deg, #3498DB 0%, #2980B9 100%)',
    questions: weatherQuestions
  },
  'nature': {
    title: 'Nature',
    icon: '🌿',
    subtitle: 'Explore plants, animals, ecosystems, and the natural world',
    gradient: 'linear-gradient(135deg, #27AE60 0%, #1E8449 100%)',
    questions: natureQuestions
  },
  'environmental-science': {
    title: 'Environmental Science',
    icon: '🌍',
    subtitle: 'Understand ecosystems, conservation, and protecting our planet',
    gradient: 'linear-gradient(135deg, #16A085 0%, #1ABC9C 100%)',
    questions: environmentalQuestions
  },
  'astronomy': {
    title: 'Astronomy',
    icon: '🔭',
    subtitle: 'Explore stars, planets, and the wonders of the universe',
    gradient: 'linear-gradient(135deg, #2C3E50 0%, #4A6FA5 100%)',
    questions: astronomyQuestions
  },
  'space-exploration': {
    title: 'Space Exploration',
    icon: '🚀',
    subtitle: 'Discover rockets, missions, and humanity\'s journey to the stars',
    gradient: 'linear-gradient(135deg, #1A1A2E 0%, #16213E 50%, #0F3460 100%)',
    questions: spaceExplorationQuestions
  },
  'first-aid': {
    title: 'First Aid',
    icon: '🩹',
    subtitle: 'Learn essential skills to help in medical emergencies',
    gradient: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
    questions: firstAidQuestions
  },
  'emergency-preparedness': {
    title: 'Emergency Preparedness',
    icon: '🚨',
    subtitle: 'Learn to prevent, respond to, and recover from emergencies',
    gradient: 'linear-gradient(135deg, #E74C3C 0%, #C0392B 100%)',
    questions: emergencyPrepQuestions
  },
  'wilderness-survival': {
    title: 'Wilderness Survival',
    icon: '🏕️',
    subtitle: 'Learn essential skills to survive and thrive in the outdoors',
    gradient: 'linear-gradient(135deg, #2C3E50 0%, #1A252F 100%)',
    questions: wildernessSurvivalQuestions
  },
  'personal-safety': {
    title: 'Personal Safety',
    icon: '🛡️',
    subtitle: 'Learn to stay safe, get safe, and speak up for yourself',
    gradient: 'linear-gradient(135deg, #8E44AD 0%, #9B59B6 50%, #3498DB 100%)',
    questions: personalSafetyQuestions
  },
  'personal-management': {
    title: 'Personal Management',
    icon: '📊',
    subtitle: 'Master budgeting, saving, investing, and life skills for success',
    gradient: 'linear-gradient(135deg, #9B59B6 0%, #8E44AD 100%)',
    questions: personalMgmtQuestions
  },
  'indian-lore': {
    title: 'Indian Lore',
    icon: '🪶',
    subtitle: 'Discover American Indian cultures, traditions, and contributions',
    gradient: 'linear-gradient(135deg, #D35400 0%, #E67E22 100%)',
    questions: indianLoreQuestions
  }
};

export default function TopicPage() {
  const router = useRouter();
  const { topicId } = router.query;
  
  // Handle loading state
  if (!topicId || !topicConfig[topicId]) {
    return (
      <div style={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        background: '#f5f5f5'
      }}>
        <p>Loading...</p>
      </div>
    );
  }
  
  const topic = topicConfig[topicId];

  return (
    <div style={{ minHeight: '100vh' }}>
      <TopicBackground topicId={topicId} />
      {/* Header */}
      <header style={{
        background: topic.gradient,
        color: 'white',
        padding: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <Link href="/" style={{
          color: 'white',
          textDecoration: 'none',
          fontSize: '16px',
          padding: '8px 16px',
          background: 'rgba(255,255,255,0.2)',
          borderRadius: '20px'
        }}>
          ← Back to Topics
        </Link>
        <div style={{ textAlign: 'center', flex: 1 }}>
          <h1 style={{ margin: '0 0 5px 0', fontSize: '32px' }}>
            {topic.icon} {topic.title} {topic.icon}
          </h1>
          <p style={{ margin: 0, fontSize: '16px', opacity: 0.9 }}>
            {topic.subtitle}
          </p>
        </div>
        <div style={{ width: '120px' }}></div>
      </header>
      
      {/* 
        Game Component - CRITICAL: Pass topicId prop for topic-specific save storage
        Without topicId, all topics would share the same save data
      */}
      <MultiStageGrammarGame 
        questionsData={topic.questions} 
        topicId={topicId}
      />
      
      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '20px',
        color: '#999',
        fontSize: '14px',
        marginTop: '40px'
      }}>
        <p>SynTopic - Grammar & Reading Comprehension Game</p>
      </footer>
    </div>
  );
}

// Generate static paths for all topics at build time
export async function getStaticPaths() {
  const paths = Object.keys(topicConfig).map(topicId => ({
    params: { topicId }
  }));
  
  return { paths, fallback: false };
}

// Static props (empty but required for static generation)
export async function getStaticProps({ params }) {
  return { props: {} };
}