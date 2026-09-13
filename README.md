# Lexi, Voice Vocabulary Coach

A working prototype of a voice agent that helps people learn vocabulary. You talk, Lexi talks back. It introduces a word, listens to you say it, asks you to use it in a sentence, and quizzes you later. Progress is saved in the browser.

**Live prototype:** https://apna-product-lake.vercel.app

Open it in Chrome or Edge, allow the microphone, and press Start.

## What you can say

| Say | What happens |
|---|---|
| "teach me" | Lexi introduces a word: meaning, part of speech, example. Then you say it back, then use it in a sentence. |
| "quiz me" | Lexi reads a definition. You say the word. Letter and synonym hints after misses, three tries per word. |
| "repeat" | Hear the last line again. |
| "example", "spell it", "hint", "what does it mean" | Help with the current word. In quiz mode these give clues instead of the answer. |
| "skip" | Move to another word. |
| "what's my score" | Words learned and quiz accuracy. |
| "slower" / "faster" | Adjust Lexi's speaking speed. |
| "reset progress" | Clears progress, but only after you confirm with "yes". |
| "stop" | Ends the session. |

Every command also has a button, and there is a text box for people without a microphone.

## Guardrails

The coach is rule based. It cannot be talked into doing anything outside vocabulary practice. The guardrails fall into four groups.

**Scope and safety**
- Requests to ignore instructions, role play, or act as something else get a plain "I'm a vocabulary coach" reply, and the lesson continues where it was.
- Off-topic requests (weather, jokes, code, math, news, timers, and so on) get a one-line redirect back to the current word.
- Profanity is never repeated back. Lexi asks to keep it friendly and continues.
- Anything that looks like personal data (long digit strings, emails, words like password or OTP) is not stored, not spoken back, and shown as "(private details hidden)" in the transcript.
- Questions about identity get an honest answer: Lexi is a rule-based coach with a fixed deck of twenty words.
- User text is only ever inserted with `textContent`, so markup cannot render. Sentences are read back only when short and clean.
- A correct answer always wins over command words inside it, so "I learned to test my limits" still counts as a sentence.

**Input hygiene**
- Input is trimmed, control characters and tags are stripped, and it is capped at 200 characters.
- Identical inputs within 1.2 seconds are ignored (Android Chrome fires final results twice).
- Input arriving while Lexi is still processing is dropped and noted in the transcript rather than queued.
- Destructive actions (reset) require a spoken or typed "yes" within 15 seconds.

**Voice robustness**
- Speech is spoken sentence by sentence, because Chrome silently stops utterances longer than about 15 seconds.
- Every utterance and every listening turn has a watchdog, so the app never waits forever on a browser event that does not fire.
- Microphone denied, no microphone, or offline speech service each produce a clear message and switch to typing. Auto-listen stops after three silent turns and resumes on tap.
- Leaving the tab cancels speech and releases the microphone. Three minutes of silence pauses the session.
- Missing speech synthesis or recognition (Firefox, some Safari versions, http pages) degrades to text with an explanation.
- A global error handler resets the agent to a safe state and shows a toast instead of freezing.

**Data**
- Saved progress is validated on load: unknown words, negative or non-numeric counts, and malformed JSON are all repaired.
- No network requests at all. Fonts are self-hosted. Nothing leaves the device except audio processed by the browser's own speech service.

## Design

Implements `design.md` ("Editorial Frost / Platform Blue") exactly: white canvas, 1px `#e5e7eb` hairlines instead of fills or shadows, `border-radius: 0` on every surface and button, one accent (`#004ce6`) used only for active states and the `#eaf1ff` widget header bands, Plus Jakarta Sans at a 15px root, 34px controls, uppercase letterspaced micro-labels, inverted dark toasts, skinned scrollbars, the 1px button press, and `view-in` / `fade-in` motion with reduced-motion support.

Layout follows the spec's fixed 232px sidebar plus single scrolling content area. Three views: **Session** (KPI cards, the practice card with word, coach line and filter-bar controls, and the "things you can say" table), **Progress** (progress bar and deck table), and **Transcript**. Below 820px the sidebar becomes a drawer behind a blurred scrim with a sticky top bar. All tokens live at the top of `styles.css`.

## Project structure

```
index.html    page structure (sidebar, three views)
styles.css    design tokens and components from design.md
design.md     the design system specification the UI follows
app.js        agent state machine, guardrails, speech wrappers, UI
words.js      the twenty-word deck
fonts/        self-hosted Plus Jakarta Sans (variable woff2)
tests/        jsdom test suite with fake speech APIs
```

## Run locally

```bash
git clone https://github.com/dnsingh2826/apna-product.git
cd apna-product
python3 -m http.server 8000
# open http://localhost:8000
```

Voice input needs a secure context (`https://` or `localhost`).

## Tests

```bash
cd tests && npm install && npm test
```

Thirty-eight tests boot the real page in jsdom with fake speech recognition and synthesis, then drive the learn and quiz flows, every command in every state, all guardrails (injection, off-topic, profanity, personal data, HTML, long input, duplicates, busy drops, reset confirmation, deck hiding during a quiz), view switching and the mobile drawer, corrupt storage, streak logic, deck completion, microphone errors, watchdogs, inactivity, tab visibility, keyboard, and error recovery. The page was also exercised in real headless Chrome at widths from 320px to 1440px with no console errors and no horizontal overflow.

## Deploy

The live site is deployed with the Vercel CLI from this folder:

```bash
vercel deploy --prod
```

## Next steps

- Replace the rule-based brain with a language model behind a server, with the same guardrails as a pre-filter.
- Server-side speech for consistent voices across browsers.
- Real spaced repetition and accounts.
