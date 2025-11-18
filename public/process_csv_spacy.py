#!/usr/bin/env python3
"""
CSV Processor for Grammar Game - SpaCy Version
Generates beginner (holophrastic) tiles from advanced (word-level) tiles using NLP
"""

import csv
import sys

try:
    import spacy
    nlp = spacy.load("en_core_web_sm")
except ImportError:
    print("ERROR: spaCy not installed.")
    print("Install with: pip install spacy")
    print("Then download model: python -m spacy download en_core_web_sm")
    sys.exit(1)
except OSError:
    print("ERROR: spaCy model 'en_core_web_sm' not found.")
    print("Download with: python -m spacy download en_core_web_sm")
    sys.exit(1)

def chunk_tiles_with_nlp(tiles, grammatical_form):
    """
    Use spaCy to intelligently chunk tiles based on grammatical structure
    
    Rules:
    - Keep nouns separate (subjects, objects)
    - Chunk verb phrases (aux + verb + adverb/particle)
    - Keep subordinators separate
    - Keep punctuation separate
    """
    
    # Remove empty tiles
    tiles = [t for t in tiles if t.strip()]
    
    # Join tiles to analyze with spaCy
    text = ' '.join(tiles)
    doc = nlp(text)
    
    chunked = []
    current_chunk = []
    in_verb_phrase = False
    
    for i, token in enumerate(doc):
        # Skip if punctuation - keep separate
        if token.pos_ == "PUNCT":
            if current_chunk:
                chunked.append(' '.join(current_chunk))
                current_chunk = []
            chunked.append(token.text)
            in_verb_phrase = False
            continue
        
        # Subordinating conjunctions stay separate
        if token.pos_ == "SCONJ" or token.dep_ == "mark":
            if current_chunk:
                chunked.append(' '.join(current_chunk))
                current_chunk = []
            chunked.append(token.text)
            in_verb_phrase = False
            continue
        
        # Check if starting a verb phrase
        if token.pos_ == "AUX":
            # Start new verb phrase
            if current_chunk and not in_verb_phrase:
                chunked.append(' '.join(current_chunk))
                current_chunk = []
            current_chunk.append(token.text)
            in_verb_phrase = True
            continue
        
        # Continue building verb phrase
        if in_verb_phrase:
            # Add verbs, adverbs, particles to the verb phrase
            if token.pos_ in ["VERB", "ADV", "PART"]:
                current_chunk.append(token.text)
                continue
            
            # Add prepositions if part of phrasal verb or passive construction
            if token.pos_ == "ADP" and grammatical_form == "passive":
                current_chunk.append(token.text)
                # Check if next token is noun (part of "by X" construction)
                if i + 1 < len(doc) and doc[i + 1].pos_ in ["NOUN", "PROPN"]:
                    current_chunk.append(doc[i + 1].text)
                    # Skip next token since we added it
                    # Mark it by looking ahead
                continue
            
            # End of verb phrase - save it
            if current_chunk:
                chunked.append(' '.join(current_chunk))
                current_chunk = []
            in_verb_phrase = False
        
        # Nouns and noun phrases - check if should be kept separate
        if token.pos_ in ["NOUN", "PROPN"]:
            # Check if it was already added as part of "by X" construction
            if i > 0 and doc[i-1].pos_ == "ADP" and doc[i-1].text in current_chunk:
                # Already added, skip
                continue
            
            # Keep nouns separate unless they're part of a compound
            if token.dep_ == "compound" and i + 1 < len(doc):
                current_chunk.append(token.text)
                continue
            else:
                if current_chunk:
                    chunked.append(' '.join(current_chunk))
                    current_chunk = []
                chunked.append(token.text)
                continue
        
        # Determiners and adjectives
        if token.pos_ in ["DET", "ADJ"]:
            current_chunk.append(token.text)
            continue
        
        # Default: add to current chunk or start new one
        if current_chunk:
            current_chunk.append(token.text)
        else:
            chunked.append(token.text)
    
    # Add any remaining chunk
    if current_chunk:
        chunked.append(' '.join(current_chunk))
    
    return chunked

def normalize_tiles_to_words(tiles_str):
    """
    Split any multi-word tiles into individual words for advanced mode
    """
    if not tiles_str:
        return []
    
    tiles = [t.strip() for t in tiles_str.split(',')]
    words = []
    
    for tile in tiles:
        # Check if tile is already multi-word
        if ' ' in tile:
            # Split into individual words
            words.extend(tile.split())
        else:
            words.append(tile)
    
    return words

def generate_beginner_orders(advanced_tiles, beginner_tiles):
    """
    Map advanced tile arrangements to beginner chunked tiles
    Returns fewer valid orders for beginners (max 2)
    """
    # For beginners, we'll generate straightforward orders
    # Typical patterns: Subject-Verb-Object, Time-Subject-Verb-Object
    
    beginner_orders = []
    
    # Standard order (as chunked)
    beginner_orders.append(','.join(beginner_tiles))
    
    # Try one common variation if applicable
    # Move time/location modifiers
    if len(beginner_tiles) > 3:
        # Check for adverbial modifiers (usually at end)
        if beginner_tiles[-2] not in ['.', ',', ';']:
            # Try moving last non-punctuation element to front
            variant = [beginner_tiles[-2]] + beginner_tiles[:-2] + [beginner_tiles[-1]]
            beginner_orders.append(','.join(variant))
    
    return beginner_orders[:2]

def process_csv(input_file, output_file):
    """Process the CSV and add beginner columns"""
    
    with open(input_file, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=',')
        fieldnames = reader.fieldnames
        rows = list(reader)
    
    # Add new fieldnames
    new_fields = []
    for form in ['active', 'progressive', 'passive', 'subordinate']:
        new_fields.append(f'tiles_{form}_advanced')
        new_fields.append(f'tiles_{form}_beginner')
        new_fields.append(f'order_{form}_beginner_1')
        new_fields.append(f'order_{form}_beginner_2')
    
    all_fieldnames = list(fieldnames) + new_fields
    
    # Process each row
    processed = 0
    for row in rows:
        for form in ['active', 'progressive', 'passive', 'subordinate']:
            tiles_key = f'tiles_{form}'
            if tiles_key not in row or not row[tiles_key]:
                continue
            
            # Normalize to individual words for advanced
            original_tiles_str = row[tiles_key]
            advanced_tiles = normalize_tiles_to_words(original_tiles_str)
            row[f'tiles_{form}_advanced'] = ','.join(advanced_tiles)
            
            # Generate beginner chunks using spaCy
            try:
                beginner_tiles = chunk_tiles_with_nlp(advanced_tiles, form)
                row[f'tiles_{form}_beginner'] = ','.join(beginner_tiles)
                
                # Generate beginner orders
                beginner_orders = generate_beginner_orders(advanced_tiles, beginner_tiles)
                for i, order in enumerate(beginner_orders[:2], start=1):
                    row[f'order_{form}_beginner_{i}'] = order
                
            except Exception as e:
                print(f"Warning: Error processing {form} for question '{row.get('question', 'unknown')}': {e}")
                row[f'tiles_{form}_beginner'] = row[tiles_key]  # Fallback to original
        
        processed += 1
    
    # Write output
    with open(output_file, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=all_fieldnames, delimiter=',')
        writer.writeheader()
        writer.writerows(rows)
    
    print(f"✓ Processed {processed} questions")
    print(f"✓ Added beginner/advanced tiles for all grammatical forms")
    print(f"✓ Output written to: {output_file}")
    print(f"\nNOTE: Review the beginner chunking and adjust manually if needed.")

if __name__ == '__main__':
    if len(sys.argv) != 3:
        print("Usage: python process_csv_spacy.py input.csv output.csv")
        sys.exit(1)
    
    input_file = sys.argv[1]
    output_file = sys.argv[2]
    
    print("Using spaCy for intelligent tile chunking...")
    process_csv(input_file, output_file)
