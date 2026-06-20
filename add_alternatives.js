const fs = require('fs');
const path = require('path');

// Files to process (excluding geology)
const files = [
  'astronomyQuestions.json',
  //'emergencyPrepQuestions.json',
  //'environmentalQuestions.json',
  //'firstAidQuestions.json',
  //'indianLoreQuestions.json',
  //'natureQuestions.json',
  //'personalMgmtQuestions.json',
  //'personalSafetyQuestions.json',
  //'spaceExplorationQuestions.json',
  //'weatherQuestions.json',
  //'wildernessSurvivalQuestions.json'
];

const dataDir = './data';
const backupDir = './data_backup';

// Generate alternatives for a given tile set and order
function generateAlternatives(tiles, order1, voice) {
  const alternatives = [];
  const parts = order1.split(',');

  // Filter out empty strings and periods for analysis
  const nonEmptyTiles = tiles.filter(t => t !== '' && t !== '.');
  const periodIdx = parts.length - 1;

  // Strategy 1: Temporal/manner adverb fronting
  const adverbs = ['tonight', 'today', 'yesterday', 'tomorrow', 'now', 'then', 'quickly', 'slowly',
                   'carefully', 'safely', 'gradually', 'suddenly', 'always', 'often', 'usually',
                   'every day', 'every year', 'right now', 'all night', 'all day', 'constantly',
                   'continuously', 'steadily', 'safely', 'rapidly', 'immediately', 'eventually'];

  for (let i = 1; i < parts.length - 1; i++) {
    if (adverbs.includes(parts[i].toLowerCase())) {
      const newParts = [...parts];
      const adv = newParts.splice(i, 1)[0];
      newParts.splice(0, 0, adv); // Front the adverb
      alternatives.push(newParts.join(','));
      break; // Only one adverb front per alternative
    }
  }

  // Strategy 2: Prepositional phrase fronting for passive voice
  // Look for "by X" at end of passive sentences (must be last 2-3 elements before period)
  if (voice === 'passive') {
    const isDebug = order1.includes("earth's");
    if (isDebug) console.log('[DEBUG generateAlternatives] order1=', order1, 'parts=', parts);

    // Search from the end backwards for "by"
    for (let i = parts.length - 2; i >= Math.max(1, parts.length - 4); i--) {
      const tile = parts[i].toLowerCase();
      if (isDebug) console.log(`  [loop] i=${i}, tile="${tile}"`);

      // Case 1: "by X" as single tile or "by X" + additional tile (e.g., "by telescopes", "by earth's" + "shadow")
      if (tile.startsWith('by ') && i >= parts.length - 3) {
        // Check if this plus next tile(s) form the end
        const tilesAfterThis = parts.length - 1 - i; // not counting period
        if (tilesAfterThis <= 2) { // This tile, or this + 1-2 more tiles
          const newParts = [...parts];
          const period = newParts.pop();
          const numToMove = Math.min(tilesAfterThis + 1, parts.length - period - 1);
          const byParts = newParts.splice(i, numToMove);
          newParts.unshift(...byParts);
          newParts.push(period);
          const candidate = newParts.join(',');
          if (!alternatives.includes(candidate) && candidate !== order1) {
            alternatives.push(candidate);
          }
          break;
        }
      }

      // Case 2: "by" as separate tile + "X" following (e.g., "by" + "earth's" + "shadow")
      if (tile === 'by' && i < parts.length - 2) {
        // How many tiles after "by"? (before period)
        const tilesAfterBy = parts.length - 2 - i;
        if (tilesAfterBy >= 1 && tilesAfterBy <= 2) {
          const newParts = [...parts];
          const period = newParts.pop();
          const byParts = newParts.splice(i, tilesAfterBy + 1); // "by" + following tile(s)
          newParts.unshift(...byParts);
          newParts.push(period);
          const candidate = newParts.join(',');
          if (!alternatives.includes(candidate) && candidate !== order1) {
            alternatives.push(candidate);
          }
          break;
        }
      }
    }
  }

  // Strategy 3: Prepositional phrase fronting for active/progressive
  // Look for location/time PPs at END of sentence: "in X", "on X", "at X", etc.
  if (voice === 'active' || voice === 'progressive') {
    const frontablePreps = ['in ', 'on ', 'at ', 'during ', 'over ', 'through ', 'across ', 'near ', 'around ', 'above ', 'below ', 'under ', 'behind ', 'beside ', 'throughout ', 'within '];

    // Only look in last 3-4 positions (before period)
    const startSearchAt = Math.max(2, parts.length - 5);
    for (let i = startSearchAt; i < parts.length - 1; i++) {
      const tile = parts[i].toLowerCase();
      if (frontablePreps.some(prep => tile.startsWith(prep))) {
        // Determine PP length - must reach end of sentence (before period)
        let ppLength = 1;
        // If we can include the next tile and still be at the end, do it
        if (i + 1 === parts.length - 2) { // Next tile is right before period
          ppLength = 2;
        }

        // Only proceed if this PP extends to the end
        if (i + ppLength >= parts.length - 1) {
          const newParts = [...parts];
          const period = newParts.pop();
          const ppParts = newParts.splice(i, ppLength);
          newParts.unshift(...ppParts);
          newParts.push(period);
          const candidate = newParts.join(',');
          if (!alternatives.includes(candidate) && candidate !== order1) {
            alternatives.push(candidate);
          }
          break;
        }
      }
    }
  }

  // Strategy 4: Adverb placement variation in progressive
  // Move adverb between auxiliary and verb: "is slowly cooling" -> "slowly is cooling" (rare) or keep as is
  // Actually, better: "magma slowly is cooling" -> valid alternative
  if (voice === 'progressive') {
    for (let i = 1; i < parts.length - 2; i++) {
      if (adverbs.includes(parts[i].toLowerCase()) &&
          (parts[i+1] === 'is' || parts[i+1] === 'are' || parts[i+1] === 'was' || parts[i+1] === 'were')) {
        // Adverb before auxiliary - this is already an alternative to adverb-after-aux
        // Don't need to generate another one
      }
      // Look for pattern: subj + aux + adverb + verb
      if ((parts[i] === 'is' || parts[i] === 'are' || parts[i] === 'was' || parts[i] === 'were') &&
          i + 1 < parts.length - 1 && adverbs.includes(parts[i+1].toLowerCase())) {
        // Could move adverb before subject, already handled by Strategy 1
      }
    }
  }

  return alternatives.slice(0, 3); // Max 3 alternatives
}

// Process a single question object
function processQuestion(q) {
  const voices = ['active', 'progressive', 'passive', 'subordinate'];
  let addedCount = 0;

  voices.forEach(voice => {
    // Process both beginner and advanced
    ['beginner', 'advanced'].forEach(mode => {
      const tilesKey = `tiles_${voice}${mode === 'beginner' ? '' : '_advanced'}`;
      const orderKeyBase = `order_${voice}_${mode === 'beginner' ? 'beginner_' : ''}`;

      // Skip if already has _2
      if (q[`${orderKeyBase}2`]) return;

      const tiles = q[tilesKey];
      const order1 = q[`${orderKeyBase}1`];

      if (q.id === 'astronomy-14' && voice === 'passive') {
        console.log(`[DEBUG processQuestion] mode=${mode}, voice=${voice}`);
        console.log(`  orderKeyBase="${orderKeyBase}"`);
        console.log(`  order1="${order1}"`);
        console.log(`  tilesKey="${tilesKey}", tiles=`, tiles);
      }

      if (!tiles || !order1) return;

      const alts = generateAlternatives(tiles, order1, voice);
      alts.forEach((alt, idx) => {
        const num = idx + 2;
        q[`${orderKeyBase}${num}`] = alt;
        addedCount++;
      });
    });
  });

  return addedCount;
}

// Main processing
let totalFiles = 0;
let totalQuestions = 0;
let totalAlternatives = 0;

files.forEach(filename => {
  const filepath = path.join(dataDir, filename);
  const backupPath = path.join(backupDir, filename);

  console.log(`\n=== Processing ${filename} ===`);

  // Backup
  const content = fs.readFileSync(filepath, 'utf8');
  fs.writeFileSync(backupPath, content);
  console.log(`Backed up to ${backupPath}`);

  // Parse
  const data = JSON.parse(content);
  let questionCount = 0;
  let altCount = 0;

  data.forEach(q => {
    const added = processQuestion(q);
    if (added > 0) {
      questionCount++;
      altCount += added;
    }
    // Debug specific question
    if (q.id === 'astronomy-14') {
      console.log('\\n[DEBUG] astronomy-14:');
      console.log('  passive_beginner_2:', q.order_passive_beginner_2 || 'NONE');
      console.log('  passive_2:', q.order_passive_2 || 'NONE');
    }
  });

  // Write back
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2));

  console.log(`Questions processed: ${questionCount}`);
  console.log(`Alternatives added: ${altCount}`);

  totalFiles++;
  totalQuestions += questionCount;
  totalAlternatives += altCount;
});

console.log(`\n=== SUMMARY ===`);
console.log(`Files processed: ${totalFiles}`);
console.log(`Questions with new alternatives: ${totalQuestions}`);
console.log(`Total alternatives added: ${totalAlternatives}`);
