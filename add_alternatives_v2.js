const fs = require('fs');
const path = require('path');

const files = [
  'astronomyQuestions.json',
  'emergencyPrepQuestions.json',
  'environmentalQuestions.json',
  'firstAidQuestions.json',
  'indianLoreQuestions.json',
  'natureQuestions.json',
  'personalMgmtQuestions.json',
  'personalSafetyQuestions.json',
  'spaceExplorationQuestions.json',
  'weatherQuestions.json',
  'wildernessSurvivalQuestions.json'
];

const dataDir = './data';
const backupDir = './data_backup';

function generateAlternatives(tiles, order1, voice) {
  const alternatives = [];
  const parts = order1.split(',');

  // Common temporal/manner adverbs that can be fronted
  const adverbs = ['tonight', 'today', 'yesterday', 'tomorrow', 'now', 'then', 'quickly', 'slowly',
                   'carefully', 'safely', 'gradually', 'suddenly', 'always', 'often', 'usually',
                   'every day', 'every year', 'right now', 'all night', 'all day', 'constantly',
                   'continuously', 'steadily', 'rapidly', 'immediately', 'eventually'];

  // Strategy 1: Front adverbs
  for (let i = 1; i < parts.length - 1; i++) {
    if (adverbs.includes(parts[i].toLowerCase())) {
      const alt = [parts[i], ...parts.slice(0, i), ...parts.slice(i + 1)].join(',');
      if (!alternatives.includes(alt)) alternatives.push(alt);
      break;
    }
  }

  // Strategy 2: Front "by X" phrase in passive voice
  // Skip if sentence has complex structure (subordinate clauses with while, when, because, etc.)
  const hasComplexStructure = parts.some(p => ['while', 'when', 'because', 'if', 'although', 'though'].includes(p.toLowerCase()));
  if (voice === 'passive' && !hasComplexStructure) {
    // Find "by" tiles near the end
    for (let i = Math.max(1, parts.length - 4); i < parts.length - 1; i++) {
      const tile = parts[i].toLowerCase();

      // Does this tile start with "by "?
      if (tile.startsWith('by ')) {
        // How many tiles from here to the period?
        const remaining = parts.length - 1 - i;
        if (remaining <= 2) {
          // Move this tile + next tiles (if any, excluding period) to front
          const toMove = parts.slice(i, parts.length - 1); // Everything from i to before period
          const before = parts.slice(0, i);
          const period = parts[parts.length - 1];
          const alt = [...toMove, ...before, period].join(',');
          if (!alternatives.includes(alt)) alternatives.push(alt);
          break;
        }
      }

      // Or is this tile just "by" (advanced mode)?
      if (tile === 'by') {
        const tilesAfterBy = parts.length - 2 - i; // Not counting period
        if (tilesAfterBy >= 1 && tilesAfterBy <= 2) {
          const toMove = parts.slice(i, parts.length - 1); // "by" + following tiles
          const before = parts.slice(0, i);
          const period = parts[parts.length - 1];
          const alt = [...toMove, ...before, period].join(',');
          if (!alternatives.includes(alt)) alternatives.push(alt);
          break;
        }
      }
    }
  }

  // Strategy 3: Front PP in active/progressive (at end only)
  if (voice === 'active' || voice === 'progressive') {
    const preps = ['in ', 'on ', 'at ', 'during ', 'over ', 'through ', 'across ', 'near ',
                   'around ', 'above ', 'below ', 'under ', 'behind ', 'beside ', 'throughout ', 'within '];

    for (let i = Math.max(2, parts.length - 5); i < parts.length - 1; i++) {
      const tile = parts[i].toLowerCase();
      if (preps.some(p => tile.startsWith(p))) {
        // Is this at/near the end?
        const remaining = parts.length - 1 - i;
        if (remaining <= 2) {
          const toMove = parts.slice(i, parts.length - 1); // From i to before period
          const before = parts.slice(0, i);
          const period = parts[parts.length - 1];
          const alt = [...toMove, ...before, period].join(',');
          if (!alternatives.includes(alt)) alternatives.push(alt);
          break;
        }
      }
    }
  }

  return alternatives.slice(0, 3);
}

function processQuestion(q) {
  const voices = ['active', 'progressive', 'passive', 'subordinate'];
  let addedCount = 0;

  voices.forEach(voice => {
    ['beginner', 'advanced'].forEach(mode => {
      const tilesKey = `tiles_${voice}${mode === 'beginner' ? '' : '_advanced'}`;
      const orderKeyBase = `order_${voice}_${mode === 'beginner' ? 'beginner_' : ''}`;

      if (q[`${orderKeyBase}2`]) return; // Already has alternatives

      const tiles = q[tilesKey];
      const order1 = q[`${orderKeyBase}1`];

      if (!tiles || !order1) return;

      const alts = generateAlternatives(tiles, order1, voice);
      alts.forEach((alt, idx) => {
        q[`${orderKeyBase}${idx + 2}`] = alt;
        addedCount++;
      });
    });
  });

  return addedCount;
}

// Main
let totalFiles = 0;
let totalQuestions = 0;
let totalAlternatives = 0;

files.forEach(filename => {
  const filepath = path.join(dataDir, filename);
  const backupPath = path.join(backupDir, filename);

  console.log(`\n=== Processing ${filename} ===`);

  const content = fs.readFileSync(filepath, 'utf8');
  fs.writeFileSync(backupPath, content);
  console.log(`Backed up to ${backupPath}`);

  const data = JSON.parse(content);
  let questionCount = 0;
  let altCount = 0;

  data.forEach(q => {
    const added = processQuestion(q);
    if (added > 0) {
      questionCount++;
      altCount += added;
    }
  });

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
