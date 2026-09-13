/* =============================================================================
   Lexi, voice vocabulary coach
   -----------------------------------------------------------------------------
   Sections
     1. Config
     2. Storage (versioned, validated)
     3. Guardrails (input hygiene, scope, safety)
     4. Speech: synthesis
     5. Speech: recognition
     6. Matching helpers
     7. Agent (state machine)
     8. UI rendering
     9. Wiring and lifecycle
   No network calls. Everything runs in the browser.
   ============================================================================= */
(function () {
  "use strict";

  /* ---------------------------------------------------------------------------
     1. Config
  --------------------------------------------------------------------------- */
  const DEFAULTS = {
    MAX_INPUT_CHARS: 200,        // longer utterances are cut, never processed whole
    DEDUPE_MS: 1200,             // identical inputs inside this window are ignored (Android fires twice)
    NO_SPEECH_MAX: 3,            // consecutive silent turns before we stop auto listening
    LISTEN_TIMEOUT_MS: 12000,    // hard stop for a recognition turn that never ends
    INACTIVITY_MS: 180000,       // 3 minutes without input ends the session and releases the mic
    CONFIRM_MS: 15000,           // window to confirm a destructive command
    TTS_RATE: 0.98,
    MAX_ECHO_CHARS: 120,         // longest user sentence we will read back aloud
  };
  const CFG = Object.assign({}, DEFAULTS, window.LEXI_CONFIG || {});
  const WORDS = Array.isArray(window.LEXI_WORDS) ? window.LEXI_WORDS : [];
  const WORD_SET = new Set(WORDS.map((x) => x.w));

  /* ---------------------------------------------------------------------------
     2. Storage
  --------------------------------------------------------------------------- */
  const LS_PROGRESS = "lexi.progress.v2";
  const today = () => new Date().toISOString().slice(0, 10);
  const nonNegInt = (v) => (Number.isFinite(v) && v >= 0 ? Math.floor(v) : 0);

  function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
  function safeSet(key, val) { try { localStorage.setItem(key, val); return true; } catch { return false; } }

  function loadProgress() {
    const blank = { learned: [], correct: 0, asked: 0, streak: 0, lastDay: null };
    try {
      const raw = safeGet(LS_PROGRESS);
      if (!raw) return blank;
      const p = JSON.parse(raw);
      if (!p || typeof p !== "object") return blank;
      const learned = Array.isArray(p.learned) ? [...new Set(p.learned.filter((w) => typeof w === "string" && WORD_SET.has(w)))] : [];
      const correct = nonNegInt(p.correct), asked = Math.max(nonNegInt(p.asked), correct);
      const lastDay = typeof p.lastDay === "string" && /^\d{4}-\d{2}-\d{2}$/.test(p.lastDay) ? p.lastDay : null;
      return { learned, correct, asked, streak: nonNegInt(p.streak), lastDay };
    } catch { return blank; }
  }
  let P = loadProgress();
  const saveProgress = () => safeSet(LS_PROGRESS, JSON.stringify(P));

  function bumpStreak() {
    const t = today();
    if (P.lastDay === t) return;
    const y = new Date(Date.now() - 864e5).toISOString().slice(0, 10);
    P.streak = P.lastDay === y ? P.streak + 1 : 1;
    P.lastDay = t;
    saveProgress();
  }

  /* ---------------------------------------------------------------------------
     3. Guardrails
  --------------------------------------------------------------------------- */
  const Guard = {
    // Normalise raw input: strip control chars and markup-like noise, collapse whitespace, cap length.
    sanitize(raw) {
      if (typeof raw !== "string") return "";
      let t = raw.replace(/[\u0000-\u001F\u007F\u200B-\u200F\u2028\u2029\uFEFF]/g, " ");
      t = t.replace(/<[^>]*>/g, " ");
      t = t.replace(/\s+/g, " ").trim();
      if (t.length > CFG.MAX_INPUT_CHARS) t = t.slice(0, CFG.MAX_INPUT_CHARS);
      return t;
    },
    // Attempts to re-purpose the coach. The coach is rule based so these cannot work, but we answer them clearly.
    injection: /\b(ignore|disregard|forget|override)\b.{0,30}\b(instructions?|rules?|prompt|above|previous|prior|everything)\b|\bsystem prompt\b|\byou are now\b|\bpretend (to be|you are|you're)\b|\bact as\b|\brole ?play\b|\bjailbreak\b|\bdeveloper mode\b|\bnew instructions?\b|\bdo anything now\b/i,
    // Common out-of-scope requests. Checked only after a valid answer or known command has been ruled out.
    offtopic: /\b(weather|temperature|forecast|joke|news|headlines?|stock|bitcoin|crypto|recipe|cook|essay|poem|poetry|story|song|sing|lyrics|translate|translation|homework|math|calculate|equation|capital of|who (is|was|won)|what time|what date|today's date|set (a |an )?(timer|alarm|reminder)|remind me|call|text|message|email|open (the |my )?\w+|search|google|play (music|a song|some)|youtube|netflix|movie|film|game|code|python|javascript|program|write (me |a |an |some )|draft|summari[sz]e|explain (quantum|the|how)|meaning of life|dating|girlfriend|boyfriend|politics|election|religion|medical|doctor|medicine|diagnos|invest|loan|mortgage|tax)\b|\b\d+\s*[+\-*/x×]\s*\d+\b/i,
    identity: /\b(who|what) are you\b|\byour name\b|\bare you (a |an )?(bot|robot|ai|human|real|chatgpt|siri|alexa|gpt)\b|\bwhat can you do\b|\bwho made you\b/i,
    profanity: /\b(f+u+c+k\w*|s+h+i+t\w*|b+i+t+c+h\w*|a+s+s+h+o+l+e\w*|bastard\w*|d+i+c+k(head)?|c+u+n+t\w*|slut\w*|whore\w*|n+i+g+g+\w*|f+a+g+(got)?\w*|retard\w*|motherf\w*|wtf|stfu)\b/i,
    // Do not accept or read back things that look like personal data.
    personal: /\b\d[\d\s-]{7,}\d\b|[\w.+-]+@[\w-]+\.[\w.]+|\b(password|passcode|otp|pin|credit card|debit card|account number|aadhaar|ssn|passport)\b/i,

    classify(text) {
      if (!text) return "empty";
      if (this.profanity.test(text)) return "profanity";
      if (this.personal.test(text)) return "personal";
      if (this.injection.test(text)) return "injection";
      if (this.identity.test(text)) return "identity";
      if (this.offtopic.test(text)) return "offtopic";
      return "ok";
    },
    // Safe for the coach to read aloud and quote.
    echoable(text) {
      return text.length <= CFG.MAX_ECHO_CHARS && !this.profanity.test(text) && !this.personal.test(text);
    },
  };

  /* ---------------------------------------------------------------------------
     4. Speech: synthesis
  --------------------------------------------------------------------------- */
  const synth = typeof window.speechSynthesis !== "undefined" ? window.speechSynthesis : null;
  let voice = null;
  function pickVoice() {
    if (!synth) return;
    let vs = [];
    try { vs = synth.getVoices() || []; } catch { vs = []; }
    if (!vs.length) return;
    const prefs = [/Google US English/i, /Samantha/i, /Microsoft (Aria|Jenny|Zira|Guy)/i, /en-IN/i, /en-US/i, /en-GB/i, /^en/i];
    for (const re of prefs) {
      const v = vs.find((x) => re.test(x.name) || re.test(x.lang));
      if (v) { voice = v; return; }
    }
    voice = vs[0];
  }
  if (synth) { pickVoice(); try { synth.onvoiceschanged = pickVoice; } catch { /* read-only in some engines */ } }

  const TTS = { speaking: false, gen: 0 };

  // Chrome stops utterances longer than roughly 15 seconds, so we speak sentence by sentence.
  function chunkText(text) {
    const parts = text.match(/[^.!?]+[.!?]+["')\]]*\s*|[^.!?]+$/g) || [text];
    const out = []; let buf = "";
    for (const p of parts) {
      if ((buf + p).length > 160 && buf) { out.push(buf.trim()); buf = p; } else buf += p;
    }
    if (buf.trim()) out.push(buf.trim());
    return out;
  }

  function speakChunk(text, gen) {
    return new Promise((resolve) => {
      let u;
      try { u = new SpeechSynthesisUtterance(text); } catch { resolve(); return; }
      try { if (voice) u.voice = voice; } catch { voice = null; }
      try { u.rate = CFG.TTS_RATE; u.pitch = 1; u.lang = (voice && voice.lang) || "en-US"; } catch { /* keep engine defaults */ }
      let done = false;
      const finish = () => { if (done) return; done = true; clearTimeout(t); resolve(); };
      u.onend = finish; u.onerror = finish;
      const t = setTimeout(finish, Math.min(20000, 1500 + text.length * 75));
      try { synth.speak(u); } catch { finish(); }
      // Generation check: if a newer speak() started, stop waiting on this one.
      const poll = setInterval(() => { if (gen !== TTS.gen) { clearInterval(poll); finish(); } if (done) clearInterval(poll); }, 200);
    });
  }

  async function speak(text, { listenAfter = true } = {}) {
    S.lastAgentText = text;
    UI.coach(text);
    UI.line("lexi", text);
    Rec.stop();
    const gen = ++TTS.gen;
    TTS.speaking = true; UI.speaking(true); UI.mic("speaking", "Lexi is speaking. Tap to interrupt");
    if (synth) {
      try { synth.cancel(); } catch { /* ignore */ }
      for (const c of chunkText(text)) {
        if (gen !== TTS.gen) break;
        await speakChunk(c, gen);
      }
    } else {
      await new Promise((r) => setTimeout(r, Math.min(1200, 300 + text.length * 8)));
    }
    if (gen !== TTS.gen) return;            // superseded by a newer utterance
    TTS.speaking = false; UI.speaking(false);
    if (!S.started) { UI.mic("off", "Session ended"); return; }
    const canListen = Rec.supported && !S.micDenied;
    if (listenAfter && S.autoListen && canListen) Rec.start();
    else UI.mic(canListen ? "idle" : "off", S.micDenied ? "Mic blocked. Type your reply below" : Rec.supported ? "Tap to speak" : "Type your reply below");
  }
  function cancelSpeech() {
    TTS.gen++; TTS.speaking = false; UI.speaking(false);
    if (synth) { try { synth.cancel(); } catch { /* ignore */ } }
  }

  /* ---------------------------------------------------------------------------
     5. Speech: recognition
  --------------------------------------------------------------------------- */
  const SRClass = window.SpeechRecognition || window.webkitSpeechRecognition || null;
  const Rec = {
    supported: !!SRClass && (window.isSecureContext !== false),
    rec: null, listening: false, timer: null, noSpeech: 0, lastFinal: "", lastFinalAt: 0,

    init() {
      if (!this.supported) return;
      const r = new SRClass();
      r.lang = "en-US"; r.continuous = false; r.interimResults = true; r.maxAlternatives = 3;
      r.onstart = () => {
        this.listening = true; UI.mic("listening", "Listening");
        clearTimeout(this.timer);
        this.timer = setTimeout(() => this.stop(), CFG.LISTEN_TIMEOUT_MS);
      };
      r.onresult = (e) => {
        let interim = "", finalText = "";
        for (let i = 0; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) finalText += res[0].transcript; else interim += res[0].transcript;
        }
        if (interim) UI.heard(interim, true);
        if (finalText) {
          const now = Date.now();
          const clean = Guard.sanitize(finalText);
          if (clean && clean.toLowerCase() === this.lastFinal && now - this.lastFinalAt < CFG.DEDUPE_MS) return;
          this.lastFinal = clean.toLowerCase(); this.lastFinalAt = now; this.noSpeech = 0;
          UI.heard("", false);
          Agent.handle(clean, "voice");
        }
      };
      r.onerror = (e) => {
        this.listening = false; clearTimeout(this.timer);
        switch (e.error) {
          case "not-allowed":
          case "service-not-allowed":
            S.micDenied = true; S.autoListen = false;
            UI.mic("off", "Mic blocked. Type your reply below");
            UI.toast("warn", "Microphone is blocked", "Allow the microphone in your browser's site settings, then reload. You can keep going by typing.");
            UI.support();
            break;
          case "no-speech":
            this.noSpeech++;
            if (this.noSpeech >= CFG.NO_SPEECH_MAX) { S.autoListen = false; UI.mic("idle", "Tap the mic when you're ready"); }
            else UI.mic("idle", "I didn't hear anything. Tap to try again");
            break;
          case "audio-capture":
            S.autoListen = false; UI.mic("off", "No microphone found. Type below");
            UI.toast("warn", "No microphone found", "Connect a microphone or type your replies.");
            break;
          case "network":
            S.autoListen = false; UI.mic("idle", "Speech service unavailable. Type below");
            UI.toast("warn", "Speech recognition is offline", "Your browser's speech service could not be reached. Typing still works.");
            break;
          case "aborted":
            break;
          default:
            UI.mic("idle", "Mic error. Tap to retry");
        }
      };
      r.onend = () => {
        this.listening = false; clearTimeout(this.timer);
        if (UI.micState() === "listening") UI.mic("idle", "Tap to speak");
      };
      this.rec = r;
    },
    start() {
      if (!this.supported || !this.rec || this.listening || TTS.speaking || !S.started || S.micDenied) return false;
      try { this.rec.start(); return true; } catch { return false; }
    },
    stop() {
      clearTimeout(this.timer);
      if (this.rec && this.listening) { try { this.rec.abort(); } catch { /* ignore */ } }
      this.listening = false;
    },
  };

  /* ---------------------------------------------------------------------------
     6. Matching helpers
  --------------------------------------------------------------------------- */
  const norm = (s) => String(s).toLowerCase().replace(/[^a-z0-9\s']/g, " ").replace(/\s+/g, " ").trim();
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  function lev(a, b) {
    const m = a.length, n = b.length;
    if (!m) return n; if (!n) return m;
    let prev = Array.from({ length: n + 1 }, (_, i) => i), cur = new Array(n + 1);
    for (let i = 1; i <= m; i++) {
      cur[0] = i;
      for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      [prev, cur] = [cur, prev];
    }
    return prev[n];
  }
  const sim = (a, b) => 1 - lev(a, b) / Math.max(a.length, b.length, 1);

  // Did the utterance contain the target word? `loose` is used when we asked for the word alone,
  // because recognisers often split or mangle a single unfamiliar word ("a femoral" for "ephemeral").
  function saidWord(text, word, loose = false) {
    const t = norm(text), w = norm(word);
    if (!t) return false;
    if (new RegExp(`\\b${esc(w)}`).test(t)) return true;
    const toks = t.split(" ");
    if (toks.some((tok) => tok.length >= 4 && (sim(tok, w) >= 0.8 || (tok.length > 4 && w.startsWith(tok.slice(0, 5)))))) return true;
    if (loose && toks.length <= 3) {
      const joined = t.replace(/\s/g, "");
      if (sim(joined, w) >= 0.6) return true;
      if (joined.length >= 4 && (w.startsWith(joined.slice(0, 3)) || w.endsWith(joined.slice(-3))) && sim(joined, w) >= 0.5) return true;
    }
    return false;
  }
  function hasIntent(text, ...phrases) {
    const t = norm(text);
    return phrases.some((p) => new RegExp(`\\b${esc(norm(p))}\\b`).test(t));
  }
  const article = (pos) => (pos === "noun" ? "a noun" : pos === "verb" ? "a verb" : "an adjective");
  const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
  const praise = () => pick(["Nice.", "Great job.", "Exactly right.", "Perfect.", "You've got it.", "Well done."]);

  /* ---------------------------------------------------------------------------
     7. Agent
  --------------------------------------------------------------------------- */
  const S = {
    started: false,
    mode: "idle",        // idle | learn | quiz
    step: null,          // learn: repeat | sentence   quiz: answer
    word: null,
    attempts: 0,
    revealed: 0,         // letters revealed in quiz mask
    lastAgentText: "",
    busy: false,
    autoListen: true,
    micDenied: false,
    pendingConfirm: null,
    inactivity: null,
    lastInput: "", lastInputAt: 0,
  };

  function nextWord(exclude) {
    const fresh = WORDS.filter((x) => !P.learned.includes(x.w) && x.w !== exclude);
    const pool = fresh.length ? fresh : WORDS.filter((x) => x.w !== exclude);
    return pick(pool.length ? pool : WORDS);
  }
  function markLearned(w) {
    if (!P.learned.includes(w)) { P.learned.push(w); saveProgress(); }
    UI.progress();
  }
  function touchInactivity() {
    clearTimeout(S.inactivity);
    if (!S.started) return;
    S.inactivity = setTimeout(() => Agent.end(true), CFG.INACTIVITY_MS);
  }

  const Agent = {
    async start() {
      if (S.started) return;
      S.started = true; S.autoListen = true; Rec.noSpeech = 0;
      bumpStreak();
      UI.started(); UI.progress();
      // A silent utterance inside the user gesture unlocks audio on iOS and Safari.
      if (synth) { try { const u = new SpeechSynthesisUtterance(" "); u.volume = 0; synth.speak(u); } catch { /* ignore */ } }
      touchInactivity();
      const n = P.learned.length;
      const intro = n
        ? `Welcome back. You've learned ${n} word${n === 1 ? "" : "s"} so far. Say "teach me" for a new word, or "quiz me" to test yourself.`
        : `Hi, I'm Lexi, your vocabulary coach. Say "teach me" to learn a new word, or "quiz me" to test what you know.`;
      await speak(intro);
    },

    async end(auto = false) {
      if (!S.started) return;
      clearTimeout(S.inactivity);
      S.started = false; S.mode = "idle"; S.step = null; S.word = null; S.pendingConfirm = null;
      Rec.stop(); cancelSpeech();
      UI.session(); UI.deck();
      const msg = auto
        ? `I paused the session since it went quiet. You've learned ${P.learned.length} word${P.learned.length === 1 ? "" : "s"}. Tap Start whenever you want to continue.`
        : `Okay, we'll stop here. You've learned ${P.learned.length} word${P.learned.length === 1 ? "" : "s"}. Tap Start whenever you want to continue.`;
      if (auto) { UI.coach(msg); UI.line("note", "Session paused after inactivity."); UI.mic("off", "Session paused"); UI.ended(); return; }
      S.started = true;                       // let speak() run, then close out
      await speak(msg, { listenAfter: false });
      S.started = false; UI.mic("off", "Session ended"); UI.ended();
    },

    async teach(word) {
      S.mode = "learn"; S.step = "repeat"; S.attempts = 0; S.revealed = 0;
      S.word = word || nextWord(S.word && S.word.w);
      UI.session(); UI.deck();
      const w = S.word;
      await speak(`Your new word is "${w.w}". ${w.w} is ${article(w.pos)} meaning: ${w.def}. For example: ${w.ex} Now you try. Say "${w.w}" out loud.`);
    },

    async quiz(word) {
      S.mode = "quiz"; S.step = "answer"; S.attempts = 0; S.revealed = 0;
      const learnedPool = WORDS.filter((x) => P.learned.includes(x.w) && (!S.word || x.w !== S.word.w));
      S.word = word || (learnedPool.length >= 2 ? pick(learnedPool) : nextWord(S.word && S.word.w));
      UI.session(); UI.deck();
      const w = S.word;
      await speak(`Quiz time. Which word means: ${w.def}? It's ${article(w.pos)} with ${w.w.length} letters.`);
    },

    // Entry point for every user input, spoken or typed.
    async handle(raw, source = "voice") {
      const text = Guard.sanitize(raw);
      if (!text) return;
      if (S.busy) { UI.line("note", "Still working on the last reply. Ignored: " + text); return; }
      const now = Date.now();
      if (text.toLowerCase() === S.lastInput && now - S.lastInputAt < CFG.DEDUPE_MS) return;
      S.lastInput = text.toLowerCase(); S.lastInputAt = now;

      const kind = Guard.classify(text);
      const shown = kind === "personal" ? "(private details hidden)" : text;
      UI.line("you", shown);
      if (!S.started) {
        await this.start();
        // A plain greeting just opens the session; the greeting already says what to do next.
        if (hasIntent(text, "hello", "hi", "hey", "start", "begin")) return;
      }
      S.busy = true;
      touchInactivity();
      try {
        UI.heard(shown, false);
        await this.respond(text, kind, source);
      } finally {
        S.busy = false;
      }
    },

    async respond(text, kind) {
      const w = S.word;

      /* Pending confirmation for a destructive command */
      if (S.pendingConfirm) {
        const pc = S.pendingConfirm; S.pendingConfirm = null;
        if (Date.now() <= pc.expires && hasIntent(text, "yes", "yeah", "yep", "confirm", "do it", "sure")) {
          if (pc.type === "reset") {
            P = { learned: [], correct: 0, asked: 0, streak: P.streak, lastDay: P.lastDay }; saveProgress();
            S.word = null; S.mode = "idle"; S.step = null; UI.session(); UI.progress(); UI.deck();
            return speak(`Done. Your progress is cleared. Say "teach me" to begin again.`);
          }
        }
        return speak(`Okay, nothing was changed. ${this.reminder()}`);
      }

      /* Ending the session always works */
      if (hasIntent(text, "stop", "goodbye", "bye", "end session", "pause", "quit", "exit", "that's all")) return this.end();

      /* A correct answer beats any command word that happens to be in the sentence */
      const isAnswer = !!w && (
        (S.mode === "quiz" && S.step === "answer" && saidWord(text, w.w)) ||
        (S.mode === "learn" && S.step === "repeat" && saidWord(text, w.w, true)) ||
        (S.mode === "learn" && S.step === "sentence" && saidWord(text, w.w) && norm(text).split(" ").length >= 3)
      );
      if (isAnswer) return this.answer(text);

      /* Safety and scope guardrails. The user text is never read back here. */
      if (kind === "profanity") return speak(`Let's keep it friendly. ${this.reminder()}`);
      if (kind === "personal") return speak(`I don't need any personal details, and I won't store them. ${this.reminder()}`);
      if (kind === "injection") return speak(`I'm a vocabulary coach, and that's all I do. I can teach you a word or quiz you. ${this.reminder()}`);
      if (kind === "identity") return speak(`I'm Lexi, a vocabulary coach. I teach words from a fixed deck, check how you say them, and quiz you. Say "teach me" or "quiz me".`);

      /* Commands */
      if (hasIntent(text, "help", "commands", "options", "what can i say")) {
        return speak(`You can say "teach me" for a new word, "quiz me" to be tested, "repeat" to hear me again, "example" for a sentence, "spell it", "hint", "skip", or "score". Say "stop" when you're done.`);
      }
      if (hasIntent(text, "reset progress", "start over", "clear progress", "reset everything", "delete progress")) {
        S.pendingConfirm = { type: "reset", expires: Date.now() + CFG.CONFIRM_MS };
        return speak(`This will clear all ${P.learned.length} learned words and your quiz score. Say "yes" to confirm, or anything else to cancel.`);
      }
      if (hasIntent(text, "score", "progress", "how am i doing", "how many words", "my stats")) {
        const pct = P.asked ? Math.round((100 * P.correct) / P.asked) : 0;
        return speak(`You've learned ${P.learned.length} of ${WORDS.length} words, and answered ${P.correct} of ${P.asked} quiz questions correctly${P.asked ? `, that's ${pct} percent` : ""}. Say "teach me" or "quiz me" to keep going.`);
      }
      if (hasIntent(text, "teach me", "new word", "learn", "next word", "another word", "teach", "next", "another one")) return this.teach();
      if (hasIntent(text, "quiz me", "test me", "quiz", "test", "question")) return this.quiz();
      if (w && hasIntent(text, "meaning", "what does it mean", "definition", "define", "means")) {
        if (S.mode === "quiz") return speak(`It means: ${w.def}. Which word is it?`);
        return speak(`${w.w} means: ${w.def}.`);
      }
      if (hasIntent(text, "repeat", "say that again", "again", "pardon", "what did you say", "come again", "once more")) {
        return speak(S.lastAgentText || `Say "teach me" or "quiz me" to begin.`);
      }
      if (w && hasIntent(text, "example", "sentence", "use it", "usage")) {
        if (S.mode === "quiz") return speak(`Here's a clue instead. ${this.quizHint()} Which word is it?`);
        return speak(`Here's an example: ${w.ex} Now you try. ${S.step === "repeat" ? `Say "${w.w}".` : `Use "${w.w}" in a sentence.`}`);
      }
      if (w && hasIntent(text, "spell", "spelling", "spell it")) {
        if (S.mode === "quiz") return speak(`That would give it away. ${this.quizHint()} Which word is it?`);
        return speak(`${w.w} is spelled ${w.w.toUpperCase().split("").join(", ")}.`);
      }
      if (w && hasIntent(text, "hint", "clue", "i don't know", "dont know", "no idea", "not sure", "give up")) {
        if (S.mode === "quiz") { S.attempts++; return speak(`${this.quizHint()} Which word is it?`); }
        return speak(`No problem. The word is "${w.w}". ${S.step === "repeat" ? "Just say it back to me." : `Try a sentence like: ${w.ex}`}`);
      }
      if (hasIntent(text, "skip", "pass", "move on", "different word")) {
        if (S.mode === "quiz" && w) { P.asked++; saveProgress(); UI.progress(); await speak(`The answer was "${w.w}", meaning ${w.def}. Let's try another.`, { listenAfter: false }); return this.quiz(); }
        if (S.mode === "learn" && w) { await speak(`Skipping. Here's a different word.`, { listenAfter: false }); return this.teach(); }
        return this.teach();
      }
      if (hasIntent(text, "slower", "slow down")) { CFG.TTS_RATE = Math.max(0.7, CFG.TTS_RATE - 0.1); return speak(`Sure, I'll speak a little slower. ${this.reminder()}`); }
      if (hasIntent(text, "faster", "speed up")) { CFG.TTS_RATE = Math.min(1.3, CFG.TTS_RATE + 0.1); return speak(`Sure, I'll speak a little faster. ${this.reminder()}`); }

      /* Out of scope, once every in-scope reading has been ruled out */
      if (kind === "offtopic") return speak(`I can only help with vocabulary practice. ${this.reminder()}`);

      /* Mode specific attempts */
      if (S.mode === "learn" && w) return this.learnAttempt(text);
      if (S.mode === "quiz" && w) return this.quizAttempt(text);

      /* Idle fallback */
      if (hasIntent(text, "hello", "hi", "hey", "start", "begin", "yes", "okay", "ok", "sure", "ready", "let's go")) {
        return speak(`Great. Say "teach me" to learn a new word, or "quiz me" to test yourself.`);
      }
      return speak(`I didn't quite get that. You can say "teach me", "quiz me", or "help".`);
    },

    reminder() {
      const w = S.word;
      if (S.mode === "learn" && w) return S.step === "repeat" ? `We're on "${w.w}". Say it out loud.` : `We're on "${w.w}". Use it in a sentence.`;
      if (S.mode === "quiz" && w) return `Back to the quiz: which word means ${w.def}?`;
      return `Say "teach me" or "quiz me".`;
    },

    quizHint() {
      const w = S.word;
      if (S.revealed < 1) { S.revealed = 1; UI.session(); return `Hint: it starts with "${w.w[0].toUpperCase()}".`; }
      if (S.revealed < 2) { S.revealed = 2; UI.session(); return `Another hint: it's similar to "${w.syn[0]}", and it starts with "${w.w.slice(0, 2).toUpperCase()}".`; }
      return `It starts with "${w.w.slice(0, 2).toUpperCase()}" and it's similar to "${w.syn.join('" or "')}".`;
    },

    async answer(text) {
      const w = S.word;
      if (S.mode === "learn" && S.step === "repeat") {
        S.step = "sentence"; S.attempts = 0; UI.session();
        return speak(`${praise()} Now use "${w.w}" in your own sentence.`);
      }
      if (S.mode === "learn" && S.step === "sentence") {
        markLearned(w.w); S.step = "done"; UI.session();
        const echo = Guard.echoable(text) ? `"${text}". That's a good use of "${w.w}".` : `That's a good use of "${w.w}".`;
        await speak(`${praise()} ${echo} I've marked it as learned.`, { listenAfter: false });
        return P.learned.length >= WORDS.length
          ? speak(`You've learned every word in the deck. Say "quiz me" to keep them fresh.`)
          : speak(`Ready for another? Say "teach me", or "quiz me" to test yourself.`);
      }
      if (S.mode === "quiz") {
        P.correct++; P.asked++; saveProgress(); markLearned(w.w);
        S.revealed = w.w.length; S.step = "done"; UI.session(); UI.progress();
        await speak(`${praise()} "${w.w}", ${w.def}.`, { listenAfter: false });
        return this.quiz();
      }
    },

    async learnAttempt(text) {
      const w = S.word;
      if (S.step === "repeat") {
        S.attempts++;
        if (S.attempts >= 2) { S.step = "sentence"; S.attempts = 0; UI.session(); return speak(`Close enough. It's pronounced "${w.w}". Let's move on: use "${w.w}" in your own sentence.`); }
        return speak(`I heard something different. Try once more: say "${w.w}".`);
      }
      if (S.step === "sentence") {
        const containsWord = saidWord(text, w.w);
        if (!containsWord) S.attempts++;          // a too-short sentence with the word is not a miss
        if (!containsWord && S.attempts >= 2) {
          markLearned(w.w); S.step = "done"; UI.session();
          return speak(`That's okay. One example: "${w.ex}" I'll mark "${w.w}" as learned so we can quiz on it later. Say "teach me" for the next word.`);
        }
        if (!containsWord) return speak(`Good try, but I didn't hear "${w.w}" in that sentence. Try again. For example: "${w.ex}"`);
        return speak(`Almost. Give me a fuller sentence with "${w.w}" in it.`);
      }
      return speak(`Ready for another? Say "teach me", or "quiz me" to test yourself.`);
    },

    async quizAttempt(text) {
      const w = S.word;
      if (S.step !== "answer") return speak(`Say "quiz me" for the next question, or "teach me" for a new word.`);
      S.attempts++;
      if (S.attempts >= 3) {
        P.asked++; saveProgress(); S.revealed = w.w.length; S.step = "done"; UI.session(); UI.progress();
        await speak(`Not quite. The word was "${w.w}": ${w.def}. For example, ${w.ex}`, { listenAfter: false });
        return this.quiz();
      }
      const guess = Guard.echoable(text) && norm(text).split(" ").length <= 3 ? `Not "${text}". ` : `Not that one. `;
      return speak(`${guess}${this.quizHint()} Try again.`);
    },
  };

  /* ---------------------------------------------------------------------------
     8. UI
  --------------------------------------------------------------------------- */
  const $ = (id) => document.getElementById(id);
  const el = {};
  ["menuBtn", "scrim", "sidebar", "main", "voiceRow", "voiceTitle", "voiceSub", "navProgressCount", "navLogCount",
   "sessionSub", "btnStart", "btnEnd", "btnReset", "stLearned", "stTotal", "stScore", "stAccuracy", "stStreak",
   "statusDot", "modeLabel", "steps", "welcome", "supportNote", "wordBlock", "wordPos", "wordLen", "word", "definition", "example",
   "coach", "coachText", "heard", "typeForm", "typeInput", "btnRepeat", "btnHint", "btnSkip", "mic", "micLabel",
   "progressEl", "progressBar", "progressNote", "deck", "log", "logCount", "toast", "toastText"].forEach((id) => { el[id] = $(id); });

  const reduceMotion = () => {
    try { return navigator.webdriver === true || (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches); } catch { return false; }
  };
  const STATE_LABEL = { off: "Not started", idle: "Ready", listening: "Listening", speaking: "Speaking" };
  const clock = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`; };
  let toastTimer = null;

  const UI = {
    micState() { return el.mic ? el.mic.dataset.state : "off"; },
    mic(state, label) {
      if (!el.mic) return;
      el.mic.dataset.state = state;
      el.mic.setAttribute("aria-label", label);
      el.micLabel.textContent = label;
      el.statusDot.dataset.state = state;
      if (S.started) el.modeLabel.textContent = this.modeText() + (state === "listening" || state === "speaking" ? ` · ${STATE_LABEL[state]}` : "");
    },
    speaking(on) { if (el.coach) el.coach.dataset.speaking = on ? "1" : "0"; },
    coach(text) { if (el.coachText) el.coachText.textContent = text; },
    heard(text, interim) {
      if (!el.heard) return;
      el.heard.classList.toggle("interim", !!interim);
      el.heard.textContent = "";
      if (!text) return;
      const b = document.createElement("b"); b.textContent = interim ? "Hearing: " : "You said: ";
      el.heard.appendChild(b); el.heard.appendChild(document.createTextNode(text));
    },
    line(who, text) {
      if (!el.log) return;
      const empty = el.log.querySelector("tr.empty"); if (empty) empty.remove();
      const tr = document.createElement("tr"); tr.className = "line"; tr.dataset.who = who;
      const t = document.createElement("td"); t.className = "tab"; t.textContent = clock();
      const a = document.createElement("td"); a.className = "who"; a.textContent = who === "lexi" ? "Lexi" : who === "you" ? "You" : "Note";
      const b = document.createElement("td"); b.className = "what"; b.textContent = text;
      tr.appendChild(t); tr.appendChild(a); tr.appendChild(b); el.log.appendChild(tr);
      while (el.log.children.length > 200) el.log.removeChild(el.log.firstChild);
      const n = el.log.querySelectorAll("tr.line").length;
      el.logCount.textContent = `${n} line${n === 1 ? "" : "s"}`;
      el.navLogCount.textContent = String(n);
    },
    // Single inverted toast, bottom centre. kind: "warn" (red) or "info" (ink).
    toast(kind, title, msg) {
      if (!el.toast) return;
      el.toastText.textContent = msg ? `${title}. ${msg}` : title;
      el.toast.classList.toggle("toast--error", kind === "warn");
      el.toast.classList.add("show");
      clearTimeout(toastTimer);
      toastTimer = setTimeout(() => el.toast.classList.remove("show"), 6500);
    },
    support() {
      const ok = Rec.supported && !S.micDenied;
      if (el.voiceRow) {
        el.voiceRow.dataset.ok = ok ? "1" : "0";
        el.voiceTitle.textContent = ok ? "Voice ready" : S.micDenied ? "Mic blocked" : "Voice unavailable";
        el.voiceSub.textContent = ok ? "Browser speech service" : S.micDenied ? "Allow the mic, then reload" : "Typing still works";
      }
      if (!el.supportNote) return;
      if (!Rec.supported) {
        el.supportNote.textContent = window.isSecureContext === false
          ? "Voice input needs a secure (https) page. You can still type your replies."
          : "This browser doesn't support speech recognition. Lexi will still speak; type your replies. For full voice, use Chrome or Edge.";
      } else if (S.micDenied) {
        el.supportNote.textContent = "Microphone access is blocked for this site. Allow it in the browser settings and reload, or type your replies.";
      } else {
        el.supportNote.textContent = "Works best in Chrome or Edge. Allow the microphone when asked.";
      }
    },
    started() {
      el.welcome.hidden = true;
      el.btnStart.hidden = true; el.btnEnd.hidden = false;
      el.btnRepeat.disabled = false;
      el.sessionSub.textContent = `Session running. Say "teach me" for a new word, "quiz me" to be tested, or "help" for everything else.`;
      this.session(); this.support();
    },
    ended() {
      el.welcome.hidden = false;
      el.btnStart.hidden = false; el.btnEnd.hidden = true;
      el.btnStart.lastChild.textContent = "Start again";
      el.btnRepeat.disabled = true; el.btnHint.disabled = true; el.btnSkip.disabled = true;
      el.sessionSub.textContent = `Press Start, then talk. Say "teach me" for a new word or "quiz me" to be tested.`;
      this.session();
    },
    modeText() {
      const w = S.word;
      if (!S.started) return "Not started";
      if (S.mode === "learn" && w) return `Learning · word ${P.learned.length + (P.learned.includes(w.w) ? 0 : 1)} of ${WORDS.length}`;
      if (S.mode === "quiz") return `Quiz · ${P.correct} correct of ${P.asked}`;
      return "Ready";
    },
    session() {
      const w = S.word;
      const hasWord = !!w && S.mode !== "idle";
      this.deck();
      el.wordBlock.hidden = !hasWord;
      el.btnHint.disabled = !hasWord || !S.started;
      el.btnSkip.disabled = !hasWord || !S.started;
      el.modeLabel.textContent = this.modeText();
      // Steps as status pills
      const steps = S.mode === "learn" ? ["Hear", "Say", "Use"] : S.mode === "quiz" ? ["Question", "Answer"] : [];
      const idx = S.mode === "learn" ? (S.step === "repeat" ? 1 : S.step === "sentence" ? 2 : S.step === "done" ? 3 : 0)
                : S.mode === "quiz" ? (S.step === "answer" ? 1 : S.step === "done" ? 2 : 0) : 0;
      el.steps.textContent = "";
      steps.forEach((name, i) => {
        const s = document.createElement("span"); s.className = "step"; s.dataset.n = String(i + 1); s.textContent = name;
        s.dataset.state = i < idx ? "done" : i === idx ? "active" : "todo";
        el.steps.appendChild(s);
      });
      if (!hasWord) return;
      el.wordPos.textContent = w.pos;
      el.wordLen.textContent = `${w.w.length} letters`;
      const masked = S.mode === "quiz" && S.step !== "done";
      el.word.classList.toggle("masked", masked);
      el.word.textContent = "";
      el.example.textContent = "";
      if (masked) {
        for (let i = 0; i < w.w.length; i++) {
          const b = document.createElement("span");
          if (i < S.revealed) { b.textContent = w.w[i]; b.classList.add("revealed"); }
          el.word.appendChild(b);
        }
      } else {
        el.word.textContent = w.w;
        const re = new RegExp(`(${esc(w.w)})`, "i");
        w.ex.split(re).forEach((part) => {
          if (!part) return;
          if (re.test(part)) { const m = document.createElement("mark"); m.textContent = part; el.example.appendChild(m); }
          else el.example.appendChild(document.createTextNode(part));
        });
      }
      el.definition.textContent = w.def;
    },
    // KPI count-up (10.8): ticks from the last shown value; instant under reduced motion or automation.
    countUp(node, value, fmt) {
      const f = fmt || ((v) => String(v));
      const from = Number(node.dataset.v || 0);
      node.dataset.v = String(value);
      if (reduceMotion() || from === value || typeof requestAnimationFrame !== "function") { node.textContent = f(value); return; }
      const t0 = performance.now(), dur = 520;
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - p, 3);
        node.textContent = f(Math.round(from + (value - from) * e));
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    },
    progress() {
      const pct = WORDS.length ? Math.round((100 * P.learned.length) / WORDS.length) : 0;
      const acc = P.asked ? Math.round((100 * P.correct) / P.asked) : 0;
      this.countUp(el.stLearned, P.learned.length);
      this.countUp(el.stStreak, P.streak);
      this.countUp(el.stAccuracy, acc, (v) => `${v}%`);
      el.stScore.textContent = `${P.correct}/${P.asked}`;
      el.stTotal.textContent = String(WORDS.length);
      el.progressBar.style.width = pct + "%";
      el.progressEl.setAttribute("aria-valuenow", String(P.learned.length));
      el.progressEl.setAttribute("aria-valuemax", String(WORDS.length));
      el.progressNote.textContent = `${P.learned.length} of ${WORDS.length} words learned`;
      el.navProgressCount.textContent = `${P.learned.length}/${WORDS.length}`;
    },
    deck() {
      if (!el.deck) return;
      el.deck.textContent = "";
      // Guardrail: while a quiz question is open, no meaning is shown anywhere and nothing is highlighted,
      // otherwise the deck would hand over the answer.
      const quizOpen = S.started && S.mode === "quiz" && S.step === "answer";
      WORDS.forEach((x) => {
        const tr = document.createElement("tr"); tr.className = "deck-row";
        const cur = S.started && S.word && S.word.w === x.w && S.mode === "learn" && S.step !== "done";
        const learned = P.learned.includes(x.w);
        tr.dataset.status = cur ? "current" : learned ? "learned" : "new";
        const a = document.createElement("td"); a.className = "em"; a.textContent = x.w;
        const b = document.createElement("td"); b.textContent = x.pos;
        const c = document.createElement("td"); c.textContent = quizOpen ? "Hidden during the quiz" : x.def;
        if (quizOpen) c.style.color = "var(--text-subtle)";
        const d = document.createElement("td"); d.className = "status";
        const dot = document.createElement("span"); dot.className = "dot";
        d.appendChild(dot); d.appendChild(document.createTextNode(cur ? "Practising now" : learned ? "Learned" : "New"));
        tr.appendChild(a); tr.appendChild(b); tr.appendChild(c); tr.appendChild(d); el.deck.appendChild(tr);
      });
    },
    view(name) {
      document.querySelectorAll(".view").forEach((v) => {
        const on = v.dataset.view === name;
        v.hidden = !on; v.classList.toggle("active", on);
        if (on) { v.style.animation = "none"; void v.offsetWidth; v.style.animation = ""; }
      });
      document.querySelectorAll(".nav-item").forEach((b) => b.classList.toggle("active", b.dataset.view === name));
      this.drawer(false);
      if (el.main) el.main.scrollTop = 0;
    },
    drawer(open) {
      if (!el.sidebar) return;
      el.sidebar.classList.toggle("open", open);
      el.scrim.hidden = !open;
      el.menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    },
  };

  /* ---------------------------------------------------------------------------
     9. Wiring and lifecycle
  --------------------------------------------------------------------------- */
  function onMicTap() {
    if (!S.started) { Agent.start(); return; }
    if (TTS.speaking) { cancelSpeech(); S.autoListen = true; Rec.noSpeech = 0; if (!Rec.start()) UI.mic(Rec.supported && !S.micDenied ? "idle" : "off", Rec.supported ? "Tap to speak" : "Type your reply"); return; }
    if (Rec.listening) { Rec.stop(); UI.mic("idle", "Tap to speak"); return; }
    S.autoListen = true; Rec.noSpeech = 0;
    if (!Rec.start()) {
      if (S.micDenied) UI.toast("warn", "Microphone is blocked", "Allow the microphone in your browser's site settings, then reload. You can keep going by typing.");
      else if (!Rec.supported) UI.toast("info", "Voice input is unavailable here", "Type your reply in the box. Lexi will still speak.");
    }
  }

  function bind() {
    Rec.init();
    UI.support(); UI.progress(); UI.session();
    UI.mic("off", Rec.supported ? "Tap to start" : "Type to start");

    el.btnStart.addEventListener("click", () => Agent.start());
    el.btnEnd.addEventListener("click", () => Agent.handle("stop", "button"));
    el.btnReset.addEventListener("click", () => { UI.view("session"); Agent.handle("reset progress", "button"); });
    el.mic.addEventListener("click", onMicTap);
    el.btnRepeat.addEventListener("click", () => Agent.handle("repeat", "button"));
    el.btnHint.addEventListener("click", () => Agent.handle("hint", "button"));
    el.btnSkip.addEventListener("click", () => Agent.handle("skip", "button"));
    document.querySelectorAll("[data-say]").forEach((row) => {
      row.setAttribute("tabindex", "0"); row.setAttribute("role", "button");
      const go = () => Agent.handle(row.dataset.say, "button");
      row.addEventListener("click", go);
      row.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); go(); } });
    });
    el.typeForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const v = el.typeInput.value; el.typeInput.value = "";
      Agent.handle(v, "text");
    });

    document.querySelectorAll(".nav-item[data-view]").forEach((b) => b.addEventListener("click", () => UI.view(b.dataset.view)));
    el.menuBtn.addEventListener("click", () => UI.drawer(!el.sidebar.classList.contains("open")));
    el.scrim.addEventListener("click", () => UI.drawer(false));

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") { UI.drawer(false); return; }
      if (e.code !== "Space" || e.repeat) return;
      const a = document.activeElement;
      if (a && a !== document.body && a.tagName !== "MAIN" && a.tagName !== "SECTION") return;
      e.preventDefault(); onMicTap();
    });

    // Leaving the tab: stop talking and release the mic.
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { if (TTS.speaking) cancelSpeech(); Rec.stop(); if (S.started) UI.mic("idle", "Tap to speak"); }
    });
    window.addEventListener("pagehide", () => { cancelSpeech(); Rec.stop(); });
    window.addEventListener("beforeunload", () => { cancelSpeech(); });

    // Last line of defence: never leave the app stuck if something throws.
    const recover = () => {
      S.busy = false; S.pendingConfirm = null; cancelSpeech(); Rec.stop();
      if (S.started) UI.mic("idle", "Tap to speak");
      UI.toast("warn", "Something went wrong", "Lexi has recovered. Tap Speak or type to continue.");
    };
    window.addEventListener("error", recover);
    window.addEventListener("unhandledrejection", recover);
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", bind); else bind();

  // Test hook. Not used by the page itself.
  window.Lexi = { Agent, Guard, S, TTS, Rec, UI, CFG, WORDS, saidWord, hasIntent, norm, getProgress: () => P, speak, cancelSpeech };
})();
