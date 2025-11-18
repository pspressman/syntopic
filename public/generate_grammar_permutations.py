#!/usr/bin/env python3
"""
Grammar Permutation Generator for ASD Reading Game

Converts simplified CSV (12 columns) to JSON with all valid grammatical permutations.
Uses spaCy for permissive grammatical validation.

Input CSV Columns (12):
- text_segment, question, topic, Picture
- Active, Progressive, Passive, Subordinate (target sentences)
- tiles_active, tiles_progressive, tiles_passive, tiles_subordinate (chunked)

Output JSON Structure:
[{
  "text_segment": "...",
  "question": "...",
  "topic": "...",
  "picture": "...",
  "tiles_active": ["chunk1", "chunk2", ...],
  "valid_orders_active_beginner": ["chunk1,chunk2,chunk3.", ...],
  "valid_orders_active_advanced": ["word1,word2,word3.", ...],
  ... (same for progressive/passive/subordinate)
}]
"""

import csv
import json
import itertools
import re
from pathlib import Path
from typing import List, Dict, Set, Tuple


class GrammarPermutationGenerator:
    """Generate and validate grammatical permutations for grammar game"""
    
    # Grammar forms to process
    FORMS = ['active', 'progressive', 'passive', 'subordinate']
    
    # Maximum permutations to generate per question (safety limit)
    MAX_PERMUTATIONS = 10000
    
    def __init__(self, csv_path: str, output_path: str = None):
        self.csv_path = Path(csv_path)
        self.output_path = Path(output_path) if output_path else self.csv_path.with_suffix('.json')
        
    def strip_punctuation(self, text: str) -> str:
        """Remove punctuation from text"""
        return re.sub(r'[^\w\s]', '', text).strip()
    
    def add_period(self, text: str) -> str:
        """Ensure text ends with a period"""
        text = text.strip()
        if not text.endswith('.'):
            text += '.'
        return text
    
    def filter_correct_tiles(self, all_tiles: List[str], target_sentence: str) -> List[str]:
        """
        Filter tiles to only those that appear in the target sentence.
        This removes distractor tiles used in the game UI.
        """
        if not all_tiles or not target_sentence:
            return []
        
        # Normalize target sentence (lowercase, no punctuation)
        target_normalized = self.strip_punctuation(target_sentence.lower())
        
        correct_tiles = []
        for tile in all_tiles:
            tile_normalized = tile.lower()
            # Check if this tile appears in the target sentence
            if tile_normalized in target_normalized:
                correct_tiles.append(tile)
        
        return correct_tiles
    
    def parse_tiles(self, tiles_string: str) -> List[str]:
        """Parse comma-separated tiles from CSV"""
        if not tiles_string or tiles_string.strip() == '':
            return []
        
        # Remove quotes and split
        cleaned = tiles_string.strip().strip('"\'')
        tiles = [tile.strip() for tile in cleaned.split(',')]
        
        # Strip punctuation from each tile, THEN filter empty strings
        tiles = [self.strip_punctuation(tile) for tile in tiles]
        tiles = [tile for tile in tiles if tile]  # Filter after punctuation removal
        
        return tiles
    
    def split_chunks_to_words(self, chunks: List[str]) -> List[str]:
        """Split chunks into individual words for advanced mode"""
        words = []
        for chunk in chunks:
            words.extend(chunk.split())
        return words
    
    def validate_with_simple_heuristics(self, sentence: str) -> bool:
        """
        Extremely permissive validation using simple heuristics.
        
        Strategy: Accept almost anything that looks like a sentence with the right words.
        The goal is syntactic flexibility - if words are present, most orders are valid.
        """
        if not sentence or len(sentence.strip()) < 3:
            return False
        
        # Remove punctuation for word checking
        words = re.findall(r'\b\w+\b', sentence.lower())
        
        if len(words) < 2:
            return False
        
        # Check for basic verb-like words (very permissive list)
        # Include common verbs, auxiliaries, and verb forms
        verb_indicators = {
            'is', 'are', 'was', 'were', 'be', 'been', 'being',
            'cools', 'cooling', 'cooled', 'cool',
            'transforms', 'transforming', 'transformed', 'transform',
            'compresses', 'compressing', 'compressed', 'compress',
            'forms', 'forming', 'formed', 'form',
            'changes', 'changing', 'changed', 'change',
            'builds', 'building', 'built', 'build',
            'stays', 'staying', 'stayed', 'stay',
            'goes', 'going', 'went', 'go'
        }
        
        has_verb = any(word in verb_indicators for word in words)
        
        # If we have words and at least one looks like a verb, accept it
        # This is VERY permissive - we want to accept creative word orders
        return has_verb or len(words) >= 3  # Accept even without clear verb if enough words
    
    def generate_permutations(self, elements: List[str]) -> List[List[str]]:
        """
        Generate all permutations of elements.
        Returns up to MAX_PERMUTATIONS to avoid memory issues.
        """
        if len(elements) > 8:
            print(f"  ⚠️  Warning: {len(elements)} elements = {len(elements)}! permutations")
            print(f"     Limiting to first {self.MAX_PERMUTATIONS} permutations")
        
        perms = []
        for i, perm in enumerate(itertools.permutations(elements)):
            if i >= self.MAX_PERMUTATIONS:
                break
            perms.append(list(perm))
        
        return perms
    
    def generate_valid_orders(
        self,
        chunks: List[str],
        mode: str = 'beginner'
    ) -> List[str]:
        """
        Generate all valid word orders for a given mode.
        
        Args:
            chunks: List of phrase chunks (e.g., ["magma", "cools slowly", "underground"])
            mode: 'beginner' (permute chunks) or 'advanced' (permute words)
        
        Returns:
            List of valid order strings (e.g., ["magma,cools slowly,underground."])
        """
        if not chunks:
            return []
        
        # Get elements to permute
        if mode == 'beginner':
            elements = chunks
        else:  # advanced
            elements = self.split_chunks_to_words(chunks)
        
        # Generate permutations
        permutations = self.generate_permutations(elements)
        
        # Validate each permutation
        valid_orders = []
        for perm in permutations:
            # Join into sentence
            if mode == 'beginner':
                # Join chunks with commas, then convert to sentence for validation
                sentence = ' '.join(perm)
            else:
                # Join words with spaces
                sentence = ' '.join(perm)
            
            # Add period for validation
            sentence_with_period = self.add_period(sentence)
            
            # Validate with simple heuristics
            if self.validate_with_simple_heuristics(sentence_with_period):
                # For storage, keep the comma-separated format
                if mode == 'beginner':
                    order_string = ','.join(perm) + '.'
                else:
                    order_string = ','.join(perm) + '.'
                
                valid_orders.append(order_string)
        
        return valid_orders
    
    def process_row(self, row: Dict[str, str]) -> Dict:
        """Process a single CSV row into JSON format with all permutations"""
        
        print(f"\nProcessing: {row.get('question', 'Unknown question')[:60]}...")
        
        result = {
            'text_segment': row.get('text_segment', ''),
            'question': row.get('question', ''),
            'topic': row.get('topic', ''),
            'picture': row.get('Picture', ''),  # Note: capital P in CSV
        }
        
        # Process each grammar form
        for form in self.FORMS:
            # Get tiles for this form
            tiles_key = f'tiles_{form}'
            all_tiles = self.parse_tiles(row.get(tiles_key, ''))
            
            # Get target sentence to filter against
            target_sentence = row.get(form.capitalize(), '')
            
            # Filter to only correct tiles (removes distractors)
            tiles = self.filter_correct_tiles(all_tiles, target_sentence)
            
            result[tiles_key] = tiles
            
            if not tiles:
                print(f"  ⚠️  No matching tiles for {form}, skipping")
                result[f'valid_orders_{form}_beginner'] = []
                result[f'valid_orders_{form}_advanced'] = []
                continue
            
            print(f"  📝 {form}: filtered {len(tiles)} correct tiles from {len(all_tiles)} total")
            
            # Generate beginner permutations (chunk-level)
            print(f"  🔄 Generating {form} beginner permutations ({len(tiles)} chunks)...")
            beginner_orders = self.generate_valid_orders(tiles, mode='beginner')
            result[f'valid_orders_{form}_beginner'] = beginner_orders
            print(f"     ✓ Found {len(beginner_orders)} valid beginner orders")
            
            # Generate advanced permutations (word-level)
            words = self.split_chunks_to_words(tiles)
            print(f"  🔄 Generating {form} advanced permutations ({len(words)} words)...")
            advanced_orders = self.generate_valid_orders(tiles, mode='advanced')
            result[f'valid_orders_{form}_advanced'] = advanced_orders
            print(f"     ✓ Found {len(advanced_orders)} valid advanced orders")
        
        return result
    
    def generate(self) -> List[Dict]:
        """Main generation function - process entire CSV"""
        
        print(f"📖 Reading CSV: {self.csv_path}")
        
        # Read CSV/TSV (auto-detect delimiter)
        with open(self.csv_path, 'r', encoding='utf-8') as f:
            # Read first line to detect delimiter
            first_line = f.readline()
            f.seek(0)
            
            # Use tab if tabs are present, otherwise comma
            delimiter = '\t' if '\t' in first_line else ','
            
            reader = csv.DictReader(f, delimiter=delimiter)
            rows = list(reader)
        
        print(f"✓ Found {len(rows)} questions\n")
        print("=" * 60)
        
        # Process each row
        results = []
        for i, row in enumerate(rows, 1):
            print(f"\n[{i}/{len(rows)}]")
            result = self.process_row(row)
            results.append(result)
        
        # Write output
        print("\n" + "=" * 60)
        print(f"\n💾 Writing JSON: {self.output_path}")
        
        with open(self.output_path, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        
        print(f"✓ Saved {len(results)} questions")
        
        # Print summary statistics
        self.print_summary(results)
        
        return results
    
    def print_summary(self, results: List[Dict]):
        """Print summary statistics"""
        print("\n" + "=" * 60)
        print("📊 SUMMARY STATISTICS")
        print("=" * 60)
        
        total_valid_orders = 0
        
        for form in self.FORMS:
            beginner_key = f'valid_orders_{form}_beginner'
            advanced_key = f'valid_orders_{form}_advanced'
            
            beginner_counts = [len(r.get(beginner_key, [])) for r in results]
            advanced_counts = [len(r.get(advanced_key, [])) for r in results]
            
            print(f"\n{form.upper()}:")
            print(f"  Beginner orders: {sum(beginner_counts)} total "
                  f"(avg {sum(beginner_counts)/len(results):.1f} per question)")
            print(f"  Advanced orders: {sum(advanced_counts)} total "
                  f"(avg {sum(advanced_counts)/len(results):.1f} per question)")
            
            total_valid_orders += sum(beginner_counts) + sum(advanced_counts)
        
        print(f"\n🎯 TOTAL VALID ORDERS GENERATED: {total_valid_orders}")
        print("=" * 60)


def main():
    """Main entry point"""
    import argparse
    
    parser = argparse.ArgumentParser(
        description='Generate grammar permutations from simplified CSV'
    )
    parser.add_argument(
        'csv_file',
        help='Path to input CSV file (simplified 12-column format)'
    )
    parser.add_argument(
        '-o', '--output',
        help='Path to output JSON file (default: same name as input with .json extension)'
    )
    
    args = parser.parse_args()
    
    # Create generator and run
    generator = GrammarPermutationGenerator(args.csv_file, args.output)
    
    try:
        results = generator.generate()
        print("\n✅ SUCCESS! Grammar permutations generated.")
        print(f"📁 Output: {generator.output_path}")
        
    except Exception as e:
        print(f"\n❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1
    
    return 0


if __name__ == '__main__':
    exit(main())
