# Lexi · Voice Vocabulary Coach

A working prototype of a **voice agent that helps people learn vocabulary**. You talk to Lexi, and Lexi talks back: it introduces a word, listens to you pronounce it, asks you to use it in a sentence, and quizzes you later. Progress is saved in your browser.

## Try it

Open the deployed prototype (link in the repo description) in **Chrome or Edge** on desktop or Android, allow the microphone, and tap the mic orb.

Then just talk:

| Say | Lexi does |
|---|---|
| "teach me" | Introduces a new word: meaning, part of speech, example sentence. Then asks you to say it back and use it in a sentence. |
| "quiz me" | Reads a definition; you say the word. Hints after wrong answers, three tries per word. |
| "repeat" | Says the last thing again. |
| "example" / "spell it" / "hint" / "skip" | Contextual help for the current word. |
| "what's my score" | Reads out words learned and quiz accuracy. |
| "help" | Lists the commands. |
| "stop" | Ends the session. |

No mic, or using Safari/Firefox? Type replies in the text box. Lexi still speaks.

## How it works

- **Single static page** (`index.html`), no build step, no backend, no API keys.
- **Speech-to-text:** browser `SpeechRecognition` (Web Speech API), with interim transcripts shown live.
- **Text-to-speech:** browser `speechSynthesis`, preferring a natural English voice when available.
- **Agent logic:** a small state machine (`idle → learn (repeat → sentence) | quiz (answer)`) plus global intents (teach, quiz, repeat, hint, skip, score, help, stop). Answers are matched with normalization and Levenshtein similarity so recognizer slips like "a femoral" still count for "ephemeral".
- **Spaced practice (light):** quiz mode prefers words you have already learned; learn mode prefers words you have not.
- **Persistence:** learned words, quiz score and daily streak in `localStorage`.

## Run locally

```bash
git clone https://github.com/dnsingh2826/apna-product.git
cd apna-product
python3 -m http.server 8000
# open http://localhost:8000
```

Speech recognition requires a secure context (`https://` or `localhost`).

## Next steps (not in this prototype)

- Swap the rule-based brain for an LLM (for open-ended sentence feedback and free conversation).
- Server-side STT/TTS for consistent voices across browsers.
- Real spaced-repetition scheduling and user accounts.
