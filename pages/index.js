// pages/index.js - SynTopic Topics Selection Page
import Link from 'next/link';
import { useState } from 'react';
import TopicBackground from '../components/TopicBackground';

const topics = [
  // Natural Science
  { id: 'geology', title: 'Geology', icon: '🪨', description: 'Discover rocks, minerals, and the forces that shape our Earth', questionCount: 22, color: '#8B4513', category: 'Natural Science' },
  { id: 'weather', title: 'Weather', icon: '⛈️', description: 'Learn about clouds, storms, and how weather patterns form', questionCount: 42, color: '#3498DB', category: 'Natural Science' },
  { id: 'nature', title: 'Nature', icon: '🌿', description: 'Explore plants, animals, ecosystems, and the natural world', questionCount: 50, color: '#27AE60', category: 'Natural Science' },
  { id: 'environmental-science', title: 'Environmental Science', icon: '🌍', description: 'Understand ecosystems, conservation, and protecting our planet', questionCount: 40, color: '#16A085', category: 'Natural Science' },
  { id: 'astronomy', title: 'Astronomy', icon: '🔭', description: 'Explore stars, planets, and the wonders of the universe', questionCount: 40, color: '#2C3E50', category: 'Natural Science' },
  
  // Space & Exploration
  { id: 'space-exploration', title: 'Space Exploration', icon: '🚀', description: 'Discover rockets, missions, and humanity\'s journey to the stars', questionCount: 40, color: '#1A1A2E', category: 'Space & Exploration' },
  
  // Life Skills & Safety
  { id: 'first-aid', title: 'First Aid', icon: '🩹', description: 'Learn essential skills to help in medical emergencies', questionCount: 45, color: '#E74C3C', category: 'Life Skills' },
  { id: 'emergency-preparedness', title: 'Emergency Preparedness', icon: '🚨', description: 'Learn to prevent, respond to, and recover from emergencies', questionCount: 30, color: '#C0392B', category: 'Life Skills' },
  { id: 'wilderness-survival', title: 'Wilderness Survival', icon: '🏕️', description: 'Learn essential skills to survive and thrive in the outdoors', questionCount: 40, color: '#1E8449', category: 'Life Skills' },
  { id: 'personal-safety', title: 'Personal Safety', icon: '🛡️', description: 'Learn to stay safe, get safe, and speak up for yourself', questionCount: 45, color: '#8E44AD', category: 'Life Skills' },
  { id: 'personal-management', title: 'Personal Management', icon: '📊', description: 'Master budgeting, saving, investing, and life skills for success', questionCount: 40, color: '#9B59B6', category: 'Life Skills' },
  
  // Culture & Heritage
  { id: 'indian-lore', title: 'Indian Lore', icon: '🪶', description: 'Discover American Indian cultures, traditions, and contributions', questionCount: 48, color: '#D35400', category: 'Culture & Heritage' },
];

// Group topics by category
const categories = [...new Set(topics.map(t => t.category))];

export default function TopicsPage() {
  const [hoveredTopic, setHoveredTopic] = useState(null);
  
  const totalQuestions = topics.reduce((sum, t) => sum + t.questionCount, 0);

  return (
    <div style={{ 
      minHeight: '100vh', 
      padding: '40px 20px'
    }}>
      <TopicBackground topicId="default" />
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <header style={{ textAlign: 'center', marginBottom: '40px', color: 'white' }}>
          <h1 style={{ 
            fontSize: '48px', 
            margin: '0 0 10px 0',
            textShadow: '2px 2px 4px rgba(0,0,0,0.3)'
          }}>
            🎓 SynTopic 🎓
          </h1>
          <p style={{ 
            fontSize: '20px', 
            opacity: 0.9,
            margin: '0 0 5px 0'
          }}>
            Grammar & Reading Comprehension Game
          </p>
          <p style={{ 
            fontSize: '16px', 
            opacity: 0.7 
          }}>
            {topics.length} Topics • {totalQuestions} Questions • 4 Grammar Forms
          </p>
        </header>

        {/* Instructions */}
        <div style={{
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '16px',
          padding: '20px 30px',
          marginBottom: '40px',
          color: 'white',
          textAlign: 'center'
        }}>
          <p style={{ margin: 0, fontSize: '18px' }}>
            <strong>How to Play:</strong> Choose a topic → Select grammar forms (Active, Progressive, Passive, Subordinate) 
            → Choose Beginner (phrases) or Advanced (words) → Build sentences and earn points!
          </p>
        </div>

        {/* Topics by Category */}
        {categories.map(category => (
          <div key={category} style={{ marginBottom: '40px' }}>
            <h2 style={{ 
              color: 'white', 
              fontSize: '24px', 
              marginBottom: '20px',
              paddingLeft: '10px',
              borderLeft: '4px solid rgba(255,255,255,0.5)'
            }}>
              {category}
            </h2>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: '20px'
            }}>
              {topics
                .filter(t => t.category === category)
                .map(topic => (
                  <Link 
                    href={`/topics/${topic.id}`} 
                    key={topic.id}
                    style={{ textDecoration: 'none' }}
                  >
                    <div
                      onMouseEnter={() => setHoveredTopic(topic.id)}
                      onMouseLeave={() => setHoveredTopic(null)}
                      style={{
                        background: 'white',
                        borderRadius: '16px',
                        padding: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.3s ease',
                        transform: hoveredTopic === topic.id ? 'translateY(-8px) scale(1.02)' : 'translateY(0)',
                        boxShadow: hoveredTopic === topic.id 
                          ? '0 20px 40px rgba(0,0,0,0.3)' 
                          : '0 4px 15px rgba(0,0,0,0.1)',
                        borderLeft: `6px solid ${topic.color}`
                      }}
                    >
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        marginBottom: '12px' 
                      }}>
                        <span style={{ fontSize: '40px', marginRight: '15px' }}>
                          {topic.icon}
                        </span>
                        <div>
                          <h3 style={{ 
                            margin: 0, 
                            fontSize: '22px', 
                            color: '#333' 
                          }}>
                            {topic.title}
                          </h3>
                          <span style={{ 
                            fontSize: '14px', 
                            color: topic.color,
                            fontWeight: 'bold'
                          }}>
                            {topic.questionCount} questions
                          </span>
                        </div>
                      </div>
                      <p style={{ 
                        margin: 0, 
                        color: '#666', 
                        fontSize: '15px',
                        lineHeight: '1.5'
                      }}>
                        {topic.description}
                      </p>
                    </div>
                  </Link>
                ))}
            </div>
          </div>
        ))}

        {/* Footer */}
        <footer style={{ 
          textAlign: 'center', 
          color: 'rgba(255,255,255,0.7)', 
          marginTop: '60px',
          paddingTop: '30px',
          borderTop: '1px solid rgba(255,255,255,0.2)'
        }}>
          <p style={{ margin: '0 0 10px 0' }}>
            SynTopic teaches reading comprehension and grammatical flexibility
          </p>
          <p style={{ margin: 0, fontSize: '14px' }}>
            4 Stages: Semantic Selection → Syntactic Arrangement → Voice Recording → Celebration
          </p>
        </footer>
      </div>
    </div>
  );
}
