# Setup Instructions

## What You Have

A complete Next.js project with the 4-stage grammar game ready to run.

## Terminal Commands to Run (on YOUR Mac)

### Step 1: Download and Extract
Download the `grammar-game-project` folder to your Mac.

### Step 2: Navigate to Project
```bash
cd /path/to/grammar-game-project
```

### Step 3: Install Dependencies
```bash
npm install
```

### Step 4: Build the Project
```bash
npm run build
```

### Step 5: Run Locally
```bash
npm run dev
```

Open browser to: http://localhost:3000

### Step 6: Deploy to Vercel
```bash
npx vercel --prod
```

## Project Structure

```
grammar-game-project/
├── components/
│   ├── MultiStageGrammarGame.js    ← Main game component
│   ├── MultiStageGrammarGame.css   ← Game styling
│   └── parseGeologyQuestions.js    ← CSV parser
├── pages/
│   ├── _app.js                     ← App wrapper
│   ├── index.js                    ← Landing page
│   └── grammar-game.js             ← Game page
├── public/
│   └── geology_questions.csv       ← Sample questions
├── styles/
│   └── globals.css                 ← Global styles
├── package.json                    ← Dependencies
├── next.config.js                  ← Next.js config
└── .gitignore                      ← Git ignore file
```

## Routes

- `/` - Landing page with "Start Playing" button
- `/grammar-game` - The actual 4-stage game

## The 4 Stages

1. **Stage 1**: Multiple choice (semantic selection)
2. **Stage 2**: Tile arrangement (syntactic construction)
3. **Stage 3**: Voice recording (reading fluency)
4. **Stage 4**: Celebration (rewards)

## Troubleshooting

### If `npm run build` fails:
- Check that all files are in correct locations
- Delete `node_modules` and `.next` folders
- Run `npm install` again
- Run `npm run build` again

### If voice recording doesn't work:
- Browser must support Web Audio API (all modern browsers do)
- User must grant microphone permission
- Works in Chrome, Firefox, Safari, Edge

### If CSV doesn't load:
- Must be in `public/` folder
- Must be named `geology_questions.csv`
- Check browser console for errors

## Adding Your Own Questions

Edit `public/geology_questions.csv` with your own questions.

Required CSV columns:
- text_segment
- question
- topic
- Active, Progressive, Passive, Subordinate
- tiles_active, tiles_progressive, tiles_passive, tiles_subordinate
- order_active_1, order_progressive_1, order_passive_1, order_subordinate_1

## Notes

- This is a complete standalone project
- No changes needed to your existing SynTactic code
- Voice recording uses Web Audio API (local storage only)
- All animations are pure CSS (seizure-safe)
