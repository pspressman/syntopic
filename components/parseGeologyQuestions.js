// parseGeologyQuestions.js - Utility to parse CSV data into game format

/**
 * Parse a CSV row into a question object
 * @param {string} csvText - Raw CSV text content
 * @returns {Array} Array of question objects
 */
export function parseGeologyQuestions(csvText) {
  // Split into lines and remove header
  const lines = csvText.trim().split('\n');
  const headers = parseCSVLine(lines[0]);
  
  const questions = [];
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue; // Skip empty lines
    
    const values = parseCSVLine(lines[i]);
    if (values.length < headers.length) continue; // Skip incomplete rows
    
    const question = {};
    headers.forEach((header, index) => {
      question[header] = values[index] || '';
    });
    
    // Parse tile strings into arrays
    question.tiles_active = parseTiles(question.tiles_active);
    question.tiles_progressive = parseTiles(question.tiles_progressive);
    question.tiles_passive = parseTiles(question.tiles_passive);
    question.tiles_subordinate = parseTiles(question.tiles_subordinate);
    
    // Parse slot counts
    question.slots_active = parseInt(question.slots_active) || 0;
    question.slots_progressive = parseInt(question.slots_progressive) || 0;
    question.slots_passive = parseInt(question.slots_passive) || 0;
    question.slots_subordinate = parseInt(question.slots_subordinate) || 0;
    
    questions.push(question);
  }
  
  return questions;
}

/**
 * Parse a CSV line handling quoted values
 * @param {string} line - A single CSV line
 * @returns {Array} Array of values
 */
function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];
    
    if (char === '"' && nextChar === '"') {
      // Escaped quote
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      // Toggle quote mode
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of value
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add last value
  values.push(current.trim());
  
  return values;
}

/**
 * Parse tile string into array
 * @param {string} tilesString - Comma-separated tiles (may be quoted)
 * @returns {Array} Array of tile strings
 */
function parseTiles(tilesString) {
  if (!tilesString) return [];
  
  // Remove outer quotes if present
  const cleaned = tilesString.replace(/^["']|["']$/g, '');
  
  // Split by comma and trim
  return cleaned.split(',').map(tile => tile.trim());
}
