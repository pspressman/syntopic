// TopicBackground.js
// Renders topic-specific animated backgrounds for SynTopic
// Place in: components/TopicBackground.js

import { useEffect, useRef } from 'react';

// Topic to background type mapping
const TOPIC_BACKGROUNDS = {
  // Space themes
  'astronomy': 'stars',
  'space-exploration': 'aurora',
  
  // Nature themes
  'nature': 'sunset',
  'camping': 'sunset',
  'wilderness-survival': 'forest',
  'environmental-science': 'leaves',
  
  // Weather themes
  'weather': 'clouds',
  'emergency-preparedness': 'rain',
  
  // Cultural/Safety themes
  'indian-lore': 'fireflies',
  'first-aid': 'fireflies',
  
  // Life skills themes
  'personal-management': 'geometric',
  'personal-safety': 'geometric',
  
  // Default for unlisted topics (geology, etc.)
  'default': 'gradient'
};

const TopicBackground = ({ topicId = 'default' }) => {
  const containerRef = useRef(null);
  const backgroundType = TOPIC_BACKGROUNDS[topicId] || TOPIC_BACKGROUNDS['default'];

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear previous particles
    container.innerHTML = '';

    // Generate particles based on background type
    switch (backgroundType) {
      case 'stars':
        generateStars(container);
        break;
      case 'aurora':
        generateAurora(container);
        break;
      case 'sunset':
        generateSunset(container);
        break;
      case 'forest':
        generateForest(container);
        break;
      case 'leaves':
        generateLeaves(container);
        break;
      case 'clouds':
        generateClouds(container);
        break;
      case 'rain':
        generateRain(container);
        break;
      case 'fireflies':
        generateFireflies(container);
        break;
      case 'geometric':
        generateGeometric(container);
        break;
      // 'gradient' needs no particles
    }

    // Cleanup on unmount
    return () => {
      if (container) container.innerHTML = '';
    };
  }, [backgroundType]);

  return (
    <div className={`topic-background bg-${backgroundType}`}>
      <div className="background-particles" ref={containerRef}></div>
    </div>
  );
};

// ============================================
// PARTICLE GENERATORS
// ============================================

function generateStars(container) {
  // Regular stars
  for (let i = 0; i < 100; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    const size = Math.random() * 3 + 1;
    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 3 + 2}s;
      animation-delay: ${Math.random() * 2}s;
    `;
    container.appendChild(star);
  }
  
  // Shooting stars
  for (let i = 0; i < 3; i++) {
    const shootingStar = document.createElement('div');
    shootingStar.className = 'shooting-star';
    shootingStar.style.cssText = `
      left: ${Math.random() * 50 + 50}%;
      top: ${Math.random() * 30}%;
      animation-delay: ${i * 5 + Math.random() * 3}s;
    `;
    container.appendChild(shootingStar);
  }
}

function generateAurora(container) {
  // Aurora waves
  for (let i = 0; i < 3; i++) {
    const wave = document.createElement('div');
    wave.className = 'aurora-wave';
    container.appendChild(wave);
  }
  
  // Stars behind aurora
  for (let i = 0; i < 80; i++) {
    const star = document.createElement('div');
    star.className = 'aurora-star';
    const size = Math.random() * 2 + 1;
    star.style.cssText = `
      width: ${size}px;
      height: ${size}px;
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 3 + 2}s;
      animation-delay: ${Math.random() * 2}s;
    `;
    container.appendChild(star);
  }
}

function generateSunset(container) {
  // Sun
  const sun = document.createElement('div');
  sun.className = 'sun';
  container.appendChild(sun);
  
  // Grass blades
  for (let i = 0; i < 80; i++) {
    const grass = document.createElement('div');
    grass.className = 'grass-blade';
    grass.style.cssText = `
      left: ${i * 1.3}%;
      height: ${Math.random() * 60 + 40}px;
      animation-duration: ${Math.random() * 2 + 2}s;
      animation-delay: ${Math.random() * 2}s;
    `;
    container.appendChild(grass);
  }
}

function generateForest(container) {
  // Tree layers
  const layer1 = document.createElement('div');
  layer1.className = 'tree-layer tree-layer-1';
  container.appendChild(layer1);
  
  const layer2 = document.createElement('div');
  layer2.className = 'tree-layer tree-layer-2';
  container.appendChild(layer2);
}

function generateLeaves(container) {
  const leafTypes = ['🍂', '🍁', '🌿', '🍃', '🌱'];
  
  for (let i = 0; i < 25; i++) {
    const leaf = document.createElement('div');
    leaf.className = 'leaf';
    leaf.textContent = leafTypes[Math.floor(Math.random() * leafTypes.length)];
    leaf.style.cssText = `
      left: ${Math.random() * 100}%;
      font-size: ${Math.random() * 20 + 16}px;
      animation-duration: ${Math.random() * 8 + 8}s;
      animation-delay: ${Math.random() * 10}s;
    `;
    container.appendChild(leaf);
  }
}

function generateClouds(container) {
  for (let i = 0; i < 8; i++) {
    const cloud = document.createElement('div');
    cloud.className = 'cloud';
    const size = Math.random() * 100 + 60;
    cloud.style.cssText = `
      width: ${size}px;
      height: ${size * 0.6}px;
      top: ${Math.random() * 50}%;
      animation-duration: ${Math.random() * 30 + 40}s;
      animation-delay: ${-(Math.random() * 40)}s;
    `;
    container.appendChild(cloud);
  }
}

function generateRain(container) {
  for (let i = 0; i < 100; i++) {
    const drop = document.createElement('div');
    drop.className = 'raindrop';
    drop.style.cssText = `
      left: ${Math.random() * 100}%;
      height: ${Math.random() * 15 + 10}px;
      animation-duration: ${Math.random() * 0.5 + 0.5}s;
      animation-delay: ${Math.random() * 2}s;
    `;
    container.appendChild(drop);
  }
}

function generateFireflies(container) {
  for (let i = 0; i < 30; i++) {
    const firefly = document.createElement('div');
    firefly.className = 'firefly';
    firefly.style.cssText = `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 60 + 20}%;
      animation-duration: ${Math.random() * 5 + 5}s, ${Math.random() * 3 + 2}s;
      animation-delay: ${Math.random() * 5}s, ${Math.random() * 2}s;
    `;
    container.appendChild(firefly);
  }
}

function generateGeometric(container) {
  const shapeTypes = ['circle', 'square', 'triangle'];
  
  for (let i = 0; i < 15; i++) {
    const shape = document.createElement('div');
    const type = shapeTypes[Math.floor(Math.random() * shapeTypes.length)];
    shape.className = `shape ${type}`;
    
    if (type !== 'triangle') {
      const size = Math.random() * 80 + 40;
      shape.style.width = size + 'px';
      shape.style.height = size + 'px';
    }
    
    shape.style.cssText += `
      left: ${Math.random() * 100}%;
      top: ${Math.random() * 100}%;
      animation-duration: ${Math.random() * 10 + 10}s;
      animation-delay: ${Math.random() * 5}s;
    `;
    container.appendChild(shape);
  }
}

export default TopicBackground;
