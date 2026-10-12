"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Maximize2, Minimize2 } from "lucide-react";
import * as gamesApi from "@/lib/api/games";
import { extractErrorMessage } from "@/lib/api/client";

// ═══════════════════════════════════════════════════════════════
// ICONS — inline SVG strings, lifted verbatim from the prototype
// (gravitas-millionaire-v2.html) so the artwork is pixel-identical.
// Rendered via dangerouslySetInnerHTML since they're static,
// developer-authored markup, not user input.
// ═══════════════════════════════════════════════════════════════
const ICONS: Record<string, string> = {
  chem: `<svg viewBox="0 0 40 40" fill="none" width="36" height="36"><circle cx="20" cy="20" r="17" stroke="currentColor" stroke-width="1.5"/><ellipse cx="20" cy="20" rx="6" ry="12" stroke="currentColor" stroke-width="1.5"/><ellipse cx="20" cy="20" rx="12" ry="6" stroke="currentColor" stroke-width="1.5"/><circle cx="20" cy="20" r="2.5" fill="currentColor"/></svg>`,
  math: `<svg viewBox="0 0 40 40" fill="none" width="36" height="36"><rect x="4" y="4" width="32" height="32" rx="4" stroke="currentColor" stroke-width="1.5"/><path d="M12 20h16M20 12v16" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M12 30l4-4M16 30l-4-4M24 12l8 8M24 20l8-8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  phys: `<svg viewBox="0 0 40 40" fill="none" width="36" height="36"><path d="M20 4v32M4 20h32" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/><circle cx="20" cy="20" r="10" stroke="currentColor" stroke-width="1.5"/><path d="M20 10l3 5-3 5-3-5z" fill="currentColor"/></svg>`,
  bio: `<svg viewBox="0 0 40 40" fill="none" width="36" height="36"><ellipse cx="20" cy="20" rx="10" ry="15" stroke="currentColor" stroke-width="1.5"/><ellipse cx="20" cy="20" rx="10" ry="15" stroke="currentColor" stroke-width="1.5" transform="rotate(60 20 20)"/><ellipse cx="20" cy="20" rx="10" ry="15" stroke="currentColor" stroke-width="1.5" transform="rotate(120 20 20)"/><circle cx="20" cy="20" r="3" fill="currentColor"/></svg>`,
  eng: `<svg viewBox="0 0 40 40" fill="none" width="36" height="36"><rect x="6" y="4" width="28" height="32" rx="3" stroke="currentColor" stroke-width="1.5"/><path d="M12 13h16M12 19h16M12 25h10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  geo: `<svg viewBox="0 0 40 40" fill="none" width="36" height="36"><circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="1.5"/><path d="M5 20h30M20 5c-4 4-6 9-6 15s2 11 6 15M20 5c4 4 6 9 6 15s-2 11-6 15" stroke="currentColor" stroke-width="1.5"/><path d="M8 13h24M8 27h24" stroke="currentColor" stroke-width="1"/></svg>`,
  hist: `<svg viewBox="0 0 40 40" fill="none" width="36" height="36"><circle cx="20" cy="20" r="15" stroke="currentColor" stroke-width="1.5"/><path d="M20 10v10l6 4" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 7l4 4M5 20H2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  econ: `<svg viewBox="0 0 40 40" fill="none" width="36" height="36"><path d="M6 32l8-10 6 4 8-12 6 6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="20" cy="12" r="5" stroke="currentColor" stroke-width="1.5"/><path d="M20 9v6M18 11h4" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/></svg>`,
  book: `<svg viewBox="0 0 40 40" fill="none" width="36" height="36"><path d="M6 8c4-3 10-3 14 0v24c-4-3-10-3-14 0V8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/><path d="M34 8c-4-3-10-3-14 0v24c4-3 10-3 14 0V8z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  ll50: `<svg viewBox="0 0 28 28" fill="none" width="22" height="22"><circle cx="14" cy="14" r="12" stroke="currentColor" stroke-width="1.5"/><text x="14" y="10" text-anchor="middle" font-size="7" fill="currentColor" font-family="sans-serif" font-weight="700">50</text><line x1="4" y1="14" x2="24" y2="14" stroke="currentColor" stroke-width="1.2"/><text x="14" y="22" text-anchor="middle" font-size="7" fill="currentColor" font-family="sans-serif" font-weight="700">50</text></svg>`,
  phone: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M6.5 3h3l1.5 4-2 1.5c1 2 2.5 3.5 4.5 4.5L15 11l4 1.5v3C19 17 17 19 15 19 9 19 5 14 5 8c0-2 2-5 1.5-5z" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/></svg>`,
  crowd: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><circle cx="8" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/><circle cx="16" cy="8" r="2.5" stroke="currentColor" stroke-width="1.5"/><path d="M3 20c0-3 2-5 5-5h8c3 0 5 2 5 5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`,
  skip: `<svg viewBox="0 0 24 24" fill="none" width="22" height="22"><path d="M5 5l10 7-10 7V5z" fill="currentColor"/><rect x="17" y="5" width="2.5" height="14" rx="1" fill="currentColor"/></svg>`,
  trophy: `<svg viewBox="0 0 64 64" fill="none" width="80" height="80"><path d="M20 8h24v20a12 12 0 01-24 0V8z" fill="#FFD700" stroke="#B8860B" stroke-width="1.5"/><path d="M8 10h12v12a6 6 0 01-12 0V10z" fill="#FFA500" stroke="#B8860B" stroke-width="1.2"/><path d="M44 10h12v12a6 6 0 01-12 0V10z" fill="#FFA500" stroke="#B8860B" stroke-width="1.2"/><path d="M32 36v10M24 52h16" stroke="#B8860B" stroke-width="2" stroke-linecap="round"/><path d="M26 46h12l2 6H24l2-6z" fill="#FFD700"/></svg>`,
  warn: `<svg viewBox="0 0 64 64" fill="none" width="72" height="72"><circle cx="32" cy="32" r="28" stroke="#FFA500" stroke-width="2"/><path d="M32 20v16M32 42v4" stroke="#FFA500" stroke-width="3" stroke-linecap="round"/></svg>`,
};

// Maps a backend Subject enum value to one of the prototype's hand-drawn
// icons where a sensible match exists, falling back to a generic open
// book for every past-question subject the original 8-icon prototype
// didn't cover (Government, Literature, Commerce, Accounting, the
// Nigerian languages, etc).
const SUBJECT_ICON: Record<string, string> = {
  chemistry: "chem",
  mathematics: "math",
  further_mathematics: "math",
  physics: "phys",
  biology: "bio",
  english: "eng",
  geography: "geo",
  history: "hist",
  economics: "econ",
};

function subjectIconKey(subject: string): string {
  return SUBJECT_ICON[subject] ?? "book";
}

function subjectDisplayName(subject: string): string {
  return subject
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

const PRIZES = [500, 1000, 2000, 3000, 5000, 7500, 10000, 12500, 15000, 25000, 50000, 100000, 250000, 500000, 1000000];
const MILESTONES = new Set([4, 9, 14]);
const LABELS = ["A", "B", "C", "D"];
const CIRCUMFERENCE = 251.3;
const TIMER = 60;

function fmt(n: number): string {
  return "₦" + n.toLocaleString("en-NG");
}

function getGuaranteed(idx: number): number {
  const ms = [4, 9, 14];
  for (let i = ms.length - 1; i >= 0; i--) {
    if (idx > ms[i]) return PRIZES[ms[i]];
  }
  return 0;
}

function distRem(total: number, count: number): number[] {
  const arr: number[] = [];
  for (let i = 0; i < count - 1; i++) {
    const v = Math.max(1, Math.floor(Math.random() * (total / (count - i))));
    arr.push(v);
    total -= v;
  }
  arr.push(Math.max(1, total));
  return arr;
}

type OptionVisualState = "" | "correct" | "wrong" | "dimmed" | "selecting" | "locked";

interface ConfettiPiece {
  id: number;
  left: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
  radius: string;
}
const CONFETTI_COLORS = ["#FFD700", "#FFA500", "#FF6B6B", "#4AF7FF", "#00E87A", "#C0A0FF", "#FF88CC"];

export default function WhoWantsToBeAScholarPlay() {
  const router = useRouter();

  const [maximized, setMaximized] = useState(false);
  const [screen, setScreen] = useState<"select" | "game">("select");

  const [subjects, setSubjects] = useState<gamesApi.ScholarSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);
  const [highScore, setHighScore] = useState(0);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [subject, setSubject] = useState<string | null>(null);
  const [questions, setQuestions] = useState<gamesApi.GameQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [locked, setLocked] = useState(false);
  const [optionStates, setOptionStates] = useState<Record<string, OptionVisualState>>({});
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [timeLeft, setTimeLeft] = useState(TIMER);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [lifelinesUsed, setLifelinesUsed] = useState({ ll50: false, phone: false, crowd: false, skip: false });
  const [fiftyFiftyRemoved, setFiftyFiftyRemoved] = useState<string[]>([]);

  const [toast, setToast] = useState<string | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [modal, setModal] = useState<{ title: string; body: React.ReactNode } | null>(null);
  const [quitConfirmOpen, setQuitConfirmOpen] = useState(false);

  const [result, setResult] = useState<{
    won: boolean;
    reason: string;
    prize: number;
    answered: number;
  } | null>(null);

  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [moneyFly, setMoneyFly] = useState<{ key: number; amount: number } | null>(null);

  // ── init ──────────────────────────────────────────────────────
  useEffect(() => {
    gamesApi
      .getScholarSubjects()
      .then(setSubjects)
      .catch((err) => setSubjectsError(extractErrorMessage(err)))
      .finally(() => setLoadingSubjects(false));

    gamesApi
      .getMyScholarStats()
      .then((s) => setHighScore(s.highestScore))
      .catch(() => {
        /* non-critical — the widget just shows 0 */
      });
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  const currentQuestion = questions[currentIndex] ?? null;

  // ── toast ─────────────────────────────────────────────────────
  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 2400);
  }, []);

  // ── timer ─────────────────────────────────────────────────────
  const stopTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }, []);

  const handleTimeUp = () => {
    setLocked((wasLocked) => {
      if (wasLocked) return wasLocked;
      // Server treats an empty label as automatically wrong, and still
      // returns the real correct answer so it can be revealed exactly
      // like a wrong pick would.
      void resolveAnswer("");
      return true;
    });
  };

  const startTimer = () => {
    stopTimer();
    setTimeLeft(TIMER);
    let t = TIMER;
    timerRef.current = setInterval(() => {
      t -= 1;
      setTimeLeft(t);
      if (t <= 0) {
        stopTimer();
        handleTimeUp();
      }
    }, 1000);
  };

  // ── start game ────────────────────────────────────────────────
  async function startGame(sub: string) {
    setStarting(true);
    setStartError(null);
    try {
      const res = await gamesApi.startScholarSession(sub);
      setSessionId(res.sessionId);
      setSubject(res.subject);
      setQuestions(res.questions);
      setCurrentIndex(0);
      setLocked(false);
      setOptionStates({});
      setFiftyFiftyRemoved([]);
      setLifelinesUsed({ ll50: false, phone: false, crowd: false, skip: false });
      setResult(null);
      setScreen("game");
      startTimer();
    } catch (err) {
      setStartError(extractErrorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  // ── lifelines ─────────────────────────────────────────────────
  async function useLifeline(ll: "ll50" | "phone" | "crowd" | "skip") {
    if (lifelinesUsed[ll] || locked || !currentQuestion || !sessionId) return;

    if (ll === "phone") {
      // Deliberately simulated, exactly like the prototype — a fabricated
      // "confident" hint pointing at a real correct answer is only
      // possible server-side, and this game's Phone-a-Friend was always
      // designed as flavor rather than a real signal.
      setLifelinesUsed((p) => ({ ...p, phone: true }));
      const pct = Math.floor(Math.random() * 20) + 65;
      // Without revealing the true answer, phone/crowd hint at a
      // plausible-sounding option — kept purely client-side & cosmetic.
      const guess = LABELS[Math.floor(Math.random() * currentQuestion.options.length)];
      const guessOption = currentQuestion.options.find((o) => o.label === guess);
      setModal({
        title: "PHONE A FRIEND",
        body: (
          <p style={{ fontSize: 16, fontWeight: 500, color: "rgba(255,255,255,0.82)", lineHeight: 1.65 }}>
            &ldquo;I&apos;m fairly confident it&apos;s option {guess}:{" "}
            <strong style={{ color: "var(--gold)" }}>{guessOption?.text}</strong>. That&apos;s about {pct}%
            sure — trust your instincts!&rdquo;
          </p>
        ),
      });
      return;
    }

    if (ll === "crowd") {
      setLifelinesUsed((p) => ({ ...p, crowd: true }));
      const cPct = Math.floor(Math.random() * 24) + 53;
      const rest = 100 - cPct;
      const splits = distRem(rest, currentQuestion.options.length - 1);
      const highlightIdx = Math.floor(Math.random() * currentQuestion.options.length);
      let d = 0;
      const rows = currentQuestion.options.map((opt, i) => {
        const isHighlighted = i === highlightIdx;
        const pct = isHighlighted ? cPct : splits[d++];
        const fill = isHighlighted
          ? "linear-gradient(90deg,#00E87A,#00C060)"
          : "linear-gradient(90deg,#1A4FBF,#0D2E8A)";
        return (
          <div className="aud-row" key={opt.label}>
            <span className="aud-lbl">{opt.label}</span>
            <div className="aud-track">
              <div className="aud-fill" style={{ width: `${pct}%`, background: fill }} />
            </div>
            <span className="aud-pct">{pct}%</span>
          </div>
        );
      });
      setModal({ title: "AUDIENCE POLL", body: <>{rows}</> });
      return;
    }

    // ll50 / skip — real backend calls, since these actually touch the
    // real correct answer / real game progression.
    try {
      const res = await gamesApi.useScholarLifeline(sessionId, ll);
      setLifelinesUsed((p) => ({ ...p, [ll]: true }));
      if (ll === "ll50" && res.removedLabels) {
        setFiftyFiftyRemoved(res.removedLabels);
      } else if (ll === "skip") {
        stopTimer();
        if (res.sessionStatus === "won") {
          finishWithResult(true, "JACKPOT!", PRIZES[14]);
        } else if (res.nextQuestionIndex != null) {
          setCurrentIndex(res.nextQuestionIndex);
          setOptionStates({});
          setFiftyFiftyRemoved([]);
          setLocked(false);
          startTimer();
        }
      }
    } catch (err) {
      showToast(extractErrorMessage(err));
    }
  }

  // ── pick / resolve answer ────────────────────────────────────
  async function resolveAnswer(selectedLabel: string) {
    if (!sessionId || !currentQuestion) return;
    stopTimer();

    if (selectedLabel) {
      setOptionStates((prev) => {
        const next: Record<string, OptionVisualState> = {};
        currentQuestion.options.forEach((o) => (next[o.label] = "locked"));
        next[selectedLabel] = "selecting";
        return next;
      });
    }

    try {
      const res = await gamesApi.submitScholarAnswer(sessionId, currentQuestion.id, selectedLabel);

      await new Promise((r) => setTimeout(r, selectedLabel ? 900 : 0));

      if (res.isCorrect) {
        setOptionStates((prev) => ({ ...prev, [selectedLabel]: "correct" }));
        setMoneyFly({ key: Date.now(), amount: res.prizeWon });
        setTimeout(() => setMoneyFly(null), 1800);

        setTimeout(() => {
          if (res.sessionStatus === "won" || res.nextQuestionIndex == null) {
            finishWithResult(true, "JACKPOT!", res.prizeWon, res.xpEarned);
            return;
          }
          if (res.isMilestone) {
            showToast(`Milestone reached! ${fmt(res.prizeWon)} guaranteed`);
          } else {
            showToast("Correct!");
          }
          setCurrentIndex(res.nextQuestionIndex);
          setOptionStates({});
          setFiftyFiftyRemoved([]);
          setLocked(false);
          startTimer();
        }, 1800);
      } else {
        setOptionStates((prev) => ({
          ...prev,
          ...(selectedLabel ? { [selectedLabel]: "wrong" } : {}),
        }));
        setTimeout(() => {
          if (res.correctLabel) {
            setOptionStates((prev) => ({ ...prev, [res.correctLabel as string]: "correct" }));
          }
          setTimeout(
            () => finishWithResult(false, selectedLabel ? "WRONG ANSWER" : "TIME EXPIRED", res.prizeWon, res.xpEarned),
            2000,
          );
        }, selectedLabel ? 600 : 0);
      }
    } catch (err) {
      showToast(extractErrorMessage(err));
      setLocked(false);
      startTimer();
    }
  }

  function pick(label: string) {
    if (locked || !currentQuestion) return;
    setLocked(true);
    resolveAnswer(label);
  }

  // ── end game ──────────────────────────────────────────────────
  function finishWithResult(won: boolean, reason: string, prize: number, _xp?: number) {
    stopTimer();
    const answered = currentIndex + (won ? 1 : 0);
    setHighScore((prev) => Math.max(prev, prize));
    setResult({ won, reason, prize, answered });
    if (won || prize > 0) spawnConfetti();
  }

  function spawnConfetti() {
    const pieces: ConfettiPiece[] = Array.from({ length: 70 }, (_, i) => ({
      id: Date.now() + i,
      left: Math.random() * 100,
      size: Math.random() * 8 + 4,
      color: CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)],
      duration: Math.random() * 2 + 2,
      delay: (i * 55) / 1000 + Math.random() * 1,
      radius: Math.random() > 0.5 ? "50%" : "2px",
    }));
    setConfetti(pieces);
    setTimeout(() => setConfetti([]), 5500);
  }

  // ── quit ──────────────────────────────────────────────────────
  function handleQuitClick() {
    stopTimer();
    setQuitConfirmOpen(true);
  }
  async function confirmQuit() {
    setQuitConfirmOpen(false);
    if (!sessionId) return;
    try {
      const res = await gamesApi.quitScholarSession(sessionId);
      finishWithResult(false, "WALKED AWAY", res.prizeWon, res.xpEarned);
    } catch (err) {
      showToast(extractErrorMessage(err));
    }
  }
  function cancelQuit() {
    setQuitConfirmOpen(false);
    startTimer();
  }

  function backToSelect() {
    setResult(null);
    setScreen("select");
    setSessionId(null);
  }
  function playAgain() {
    if (subject) {
      setResult(null);
      startGame(subject);
    }
  }

  const currentPrize = currentIndex > 0 ? PRIZES[currentIndex - 1] : 0;
  const nextPrize = PRIZES[currentIndex] ?? PRIZES[14];

  return (
    <div className={`wwtbas-scholar-game ${maximized ? "wwtbas-maximized" : "wwtbas-embedded"}`}>
      <button
        className="wwtbas-maximize-btn"
        onClick={() => setMaximized((m) => !m)}
        title={maximized ? "Exit full screen" : "Full screen"}
        aria-label={maximized ? "Exit full screen" : "Full screen"}
      >
        {maximized ? <Minimize2 size={18} /> : <Maximize2 size={18} />}
      </button>

      <div id="stars" aria-hidden="true" />
      <div className={`toast ${toast ? "show" : ""}`}>{toast}</div>

      {/* ══ SUBJECT SELECT ══ */}
      <div className={`screen ${screen === "select" ? "active" : ""}`}>
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            minHeight: "100%",
            padding: "40px 20px",
            gap: 36,
          }}
        >
          <div>
            <div className="logo-title">
              WHO WANTS TO BE
              <br />A SCHOLAR?
            </div>
            <div className="logo-sub">★ Gravitas Educational Games ★</div>
          </div>
          <div className="select-prompt">
            {loadingSubjects
              ? "Loading subjects…"
              : subjectsError
                ? subjectsError
                : "Choose your subject to begin"}
          </div>
          {startError && <div className="select-prompt" style={{ color: "var(--wrong)" }}>{startError}</div>}
          <div className="subjects-grid">
            {subjects.map((s) => (
              <button
                key={s.subject}
                className="subject-card"
                disabled={starting}
                onClick={() => startGame(s.subject)}
              >
                <div
                  className="subject-icon"
                  style={{ color: "var(--gold)" }}
                  dangerouslySetInnerHTML={{ __html: ICONS[subjectIconKey(s.subject)] }}
                />
                <div className="subject-name">{subjectDisplayName(s.subject)}</div>
                <div className="subject-meta">15 Questions · ₦1,000,000</div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ GAME SCREEN ══ */}
      <div className={`screen ${screen === "game" ? "active" : ""}`}>
        <div className="game-header">
          <button className="btn-quit" onClick={handleQuitClick}>
            Quit
          </button>
          <div className="header-center">
            <div className="header-subject">{subject ? subjectDisplayName(subject).toUpperCase() : ""}</div>
            <div className="header-title">Who Wants to Be a Scholar?</div>
          </div>
          <div className="header-badge">{fmt(currentPrize)}</div>
        </div>
        <div className="game-main">
          <div className="question-col">
            <div className="prize-banner">
              <div>
                <div className="prize-label">Current Prize</div>
                <div className="prize-value">{fmt(currentPrize)}</div>
              </div>
              <div className="prize-next">
                Next
                <br />
                <span>{fmt(nextPrize)}</span>
              </div>
            </div>

            <div className="controls-row">
              <div className="lifelines">
                {(
                  [
                    { id: "ll50" as const, label: "50:50" },
                    { id: "phone" as const, label: "Call" },
                    { id: "crowd" as const, label: "Crowd" },
                    { id: "skip" as const, label: "Skip" },
                  ]
                ).map((ll) => (
                  <button
                    key={ll.id}
                    className={`lifeline-btn ${lifelinesUsed[ll.id] ? "used" : ""}`}
                    onClick={() => useLifeline(ll.id)}
                    title={ll.label}
                    disabled={lifelinesUsed[ll.id] || locked}
                  >
                    <span className="ll-icon" dangerouslySetInnerHTML={{ __html: ICONS[ll.id] }} />
                    <span className="ll-label">{ll.label}</span>
                  </button>
                ))}
              </div>
              <div className="timer-wrap">
                <svg viewBox="0 0 90 90" width="80" height="80">
                  <circle cx="45" cy="45" r="40" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="7" />
                  <circle
                    cx="45"
                    cy="45"
                    r="40"
                    fill="none"
                    stroke={timeLeft <= 10 ? "#FF4444" : timeLeft <= 20 ? "#FFA500" : "#FFD700"}
                    strokeWidth="7"
                    strokeLinecap="round"
                    strokeDasharray={CIRCUMFERENCE}
                    strokeDashoffset={CIRCUMFERENCE * (1 - timeLeft / TIMER)}
                    style={{
                      transformOrigin: "center",
                      transform: "rotate(-90deg)",
                      transition: "stroke-dashoffset 1s linear, stroke .5s",
                    }}
                  />
                </svg>
                <div className="timer-inner">
                  <span
                    className="timer-num"
                    style={{ color: timeLeft <= 10 ? "#FF4444" : timeLeft <= 20 ? "#FFA500" : "#FFD700" }}
                  >
                    {timeLeft}
                  </span>
                </div>
              </div>
            </div>

            <div className="question-box">
              <div className="q-num">
                Question {currentIndex + 1} of {questions.length || 15}
              </div>
              {currentQuestion?.passage && (
                <div style={{ marginBottom: 14, fontSize: 14, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                  {currentQuestion.passage.instructions && <p>{currentQuestion.passage.instructions}</p>}
                  {currentQuestion.passage.passageText && <p>{currentQuestion.passage.passageText}</p>}
                  {currentQuestion.passage.passageImageUrl && (
                    <Image
                      src={currentQuestion.passage.passageImageUrl}
                      alt="Passage"
                      width={500}
                      height={300}
                      style={{ maxWidth: "100%", borderRadius: 8, marginTop: 8 }}
                    />
                  )}
                </div>
              )}
              <div className="q-text">{currentQuestion?.text}</div>
              {currentQuestion?.imageUrl && (
                <Image
                  src={currentQuestion.imageUrl}
                  alt="Question"
                  width={500}
                  height={300}
                  style={{ maxWidth: "100%", borderRadius: 8, marginTop: 12 }}
                />
              )}
            </div>

            <div className="options-grid">
              {currentQuestion?.options.map((opt) => {
                const isDimmed = fiftyFiftyRemoved.includes(opt.label);
                const state = optionStates[opt.label] ?? "";
                const classes = ["option-btn"];
                if (state) classes.push(state);
                if (isDimmed) classes.push("dimmed", "locked");
                return (
                  <button
                    key={opt.label}
                    className={classes.join(" ")}
                    onClick={() => pick(opt.label)}
                    disabled={locked || isDimmed}
                  >
                    <span className="opt-label">{opt.label}</span>
                    <span className="opt-text">{opt.text}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="prize-ladder">
            <div className="ladder-title">Prize Ladder</div>
            <div className="ladder-inner">
              {Array.from({ length: 15 }, (_, i) => 14 - i).map((i) => {
                const classes = ["ladder-row"];
                if (MILESTONES.has(i)) classes.push("milestone");
                if (i < currentIndex) classes.push("won");
                if (i === currentIndex) classes.push("active");
                return (
                  <div className={classes.join(" ")} key={i}>
                    <div className="l-dot" />
                    <span className="l-num">{i + 1}</span>
                    <span className="l-amt">{fmt(PRIZES[i])}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ══ RESULT OVERLAY ══ */}
      {result && (
        <div className="result-overlay">
          <div className="result-reason">{result.reason}</div>
          <div dangerouslySetInnerHTML={{ __html: ICONS[result.won ? "trophy" : "warn"] }} />
          <div className="result-title">
            {result.won ? "Congratulations!" : result.prize > 0 ? "Well Played" : "Better Luck Next Time"}
          </div>
          <div className="result-amount">{fmt(result.prize)}</div>
          <div className="result-stats">
            <div className="stat">
              <div className="stat-val">{result.answered}</div>
              <div className="stat-lbl">Answered</div>
            </div>
            <div className="stat">
              <div className="stat-val">{fmt(highScore)}</div>
              <div className="stat-lbl">Best Score</div>
            </div>
          </div>
          <div className="result-msg">
            {result.won
              ? "Outstanding! You answered all 15 questions correctly and claimed the full jackpot!"
              : `You walk away with ${fmt(result.prize)}. Your guaranteed milestone protected you.`}
          </div>
          <div className="result-actions">
            <button className="btn-primary" onClick={playAgain}>
              Play Again
            </button>
            <button className="btn-secondary" onClick={backToSelect}>
              Change Subject
            </button>
          </div>
        </div>
      )}

      {/* ══ MODAL (Phone-a-Friend / Ask the Audience / Quit confirm) ══ */}
      {modal && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) setModal(null); }}>
          <div className="modal-card">
            <div className="modal-title">{modal.title}</div>
            <div className="modal-body">{modal.body}</div>
            <button className="modal-close" onClick={() => setModal(null)}>
              Got it
            </button>
          </div>
        </div>
      )}

      {quitConfirmOpen && (
        <div className="modal-bg" onClick={(e) => { if (e.target === e.currentTarget) cancelQuit(); }}>
          <div className="modal-card">
            <div className="modal-title">WALK AWAY?</div>
            <div className="modal-body">
              <p style={{ fontSize: 15, color: "rgba(255,255,255,0.82)", lineHeight: 1.6 }}>
                Walk away now and take {fmt(getGuaranteed(currentIndex))}?
              </p>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
              <button className="btn-secondary" style={{ flex: 1 }} onClick={cancelQuit}>
                Keep Playing
              </button>
              <button className="modal-close" style={{ flex: 1, margin: 0 }} onClick={confirmQuit}>
                Walk Away
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ MONEY FLY ══ */}
      {moneyFly && (
        <div className="money-fly" style={{ left: "calc(50% - 60px)", top: "42%" }}>
          {fmt(moneyFly.amount)}
        </div>
      )}

      {/* ══ CONFETTI ══ */}
      {confetti.map((c) => (
        <div
          key={c.id}
          className="confetti"
          style={{
            left: `${c.left}vw`,
            top: "-12px",
            width: c.size,
            height: c.size,
            background: c.color,
            borderRadius: c.radius,
            animationDuration: `${c.duration}s`,
            animationDelay: `${c.delay}s`,
          }}
        />
      ))}

      <style jsx>{`
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  .wwtbas-scholar-game {
    --gold: #FFD700;
    --gold2: #FFA500;
    --gold-dim: rgba(255,215,0,0.12);
    --dark: #050914;
    --dark2: #080F22;
    --panel: rgba(10,22,65,0.92);
    --border: rgba(30,70,200,0.35);
    --border-bright: rgba(255,215,0,0.45);
    --correct: #00E87A;
    --wrong: #FF3B3B;
    --text-primary: #FFFFFF;
    --text-secondary: rgba(255,255,255,0.65);
    --text-dim: rgba(255,255,255,0.30);
    --font-display: 'Cinzel', Georgia, serif;
    --font-body: 'Barlow', system-ui, sans-serif;
    --font-condensed: 'Barlow Condensed', system-ui, sans-serif;
    --font-mono: 'Share Tech Mono', monospace;
    --circumference: 251.3;
  }

  /* Adapted from the prototype's "html, body" rule — this component is
     embedded inside the dashboard rather than being its own standalone
     page, so the full-bleed dark background/font applies to this
     wrapper instead of the real <html>/<body>. "contain: layout" makes
     this element a containing block for position:fixed descendants
     (e.g. #stars below), so the starfield stays within the game card
     when embedded and only covers the true viewport once maximized
     (see the .wwtbas-maximized rule) — same visual result as the
     original standalone prototype, just correctly scoped to embed
     cleanly in a larger app shell. */
  .wwtbas-scholar-game {
    min-height: 100vh;
    background: var(--dark);
    color: var(--text-primary);
    font-family: var(--font-body);
    overflow-x: hidden;
    position: relative;
    contain: layout;
  }

  .wwtbas-scholar-game.wwtbas-embedded {
    min-height: 720px;
    height: 85vh;
    border-radius: 20px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.45);
  }

  .wwtbas-scholar-game.wwtbas-maximized {
    position: fixed;
    inset: 0;
    z-index: 999;
    height: 100vh;
    border-radius: 0;
  }

  .wwtbas-maximize-btn {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 50;
    width: 40px;
    height: 40px;
    border-radius: 10px;
    background: rgba(5,9,20,0.6);
    border: 1px solid var(--border-bright);
    color: var(--gold);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    backdrop-filter: blur(6px);
    transition: background .2s, transform .2s;
  }
  .wwtbas-maximize-btn:hover { background: rgba(255,215,0,0.15); transform: scale(1.05); }

  /* ══ STARFIELD ══ */
  #stars {
    position: fixed; inset: 0; pointer-events: none; z-index: 0;
    background:
      radial-gradient(ellipse at 30% 0%, rgba(20,50,140,0.7) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 100%, rgba(10,30,80,0.5) 0%, transparent 50%),
      #050914;
  }
  #stars::before {
    content: ''; position: absolute; inset: 0;
    background-image:
      radial-gradient(1px 1px at 15% 20%, rgba(255,255,255,0.85) 0%, transparent 100%),
      radial-gradient(1px 1px at 40% 65%, rgba(255,255,255,0.7) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 72% 14%, rgba(255,255,255,0.9) 0%, transparent 100%),
      radial-gradient(1px 1px at 88% 42%, rgba(255,255,255,0.6) 0%, transparent 100%),
      radial-gradient(1px 1px at 55% 80%, rgba(255,255,255,0.75) 0%, transparent 100%),
      radial-gradient(1px 1px at 25% 55%, rgba(255,215,0,0.5) 0%, transparent 100%),
      radial-gradient(1px 1px at 62% 35%, rgba(255,255,255,0.8) 0%, transparent 100%),
      radial-gradient(1px 1px at 5% 90%, rgba(255,255,255,0.5) 0%, transparent 100%),
      radial-gradient(1.5px 1.5px at 48% 5%, rgba(255,215,0,0.6) 0%, transparent 100%);
    background-size: 400px 400px;
    animation: twinkle 6s ease-in-out infinite alternate;
  }
  @keyframes twinkle { 0% {opacity:.5} 100% {opacity:1} }

  /* ══ SCREENS ══ */
  .screen { position: relative; z-index: 1; display: none; min-height: 100vh; }
  .screen.active { display: flex; flex-direction: column; }

  /* ══ SUBJECT SELECTION ══ */
  #screen-select {
    align-items: center; justify-content: center;
    padding: 40px 20px; gap: 36px;
  }
  .logo-title {
    font-family: var(--font-display);
    font-size: clamp(24px, 5.5vw, 54px);
    font-weight: 900;
    background: linear-gradient(160deg, #fff8d6 0%, #FFD700 40%, #FFA500 75%, #cc7a00 100%);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    filter: drop-shadow(0 0 24px rgba(255,190,0,0.45));
    animation: goldPulse 3.5s ease-in-out infinite;
    text-align: center; line-height: 1.2;
    letter-spacing: 0.02em;
  }
  @keyframes goldPulse {
    0%,100%{filter:drop-shadow(0 0 16px rgba(255,190,0,0.35))}
    50%{filter:drop-shadow(0 0 40px rgba(255,165,0,0.75))}
  }
  .logo-sub {
    font-family: var(--font-condensed);
    font-size: clamp(11px, 1.8vw, 14px); font-weight: 700;
    letter-spacing: 5px; color: rgba(255,215,0,0.5);
    text-align: center; margin-top: 10px; text-transform: uppercase;
  }
  .select-prompt {
    font-family: var(--font-condensed);
    font-size: clamp(13px, 2.2vw, 18px); font-weight: 700;
    letter-spacing: 3px; color: rgba(255,255,255,0.45);
    text-transform: uppercase; text-align: center;
  }
  .subjects-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(155px, 1fr));
    gap: 14px; max-width: 940px; width: 100%;
  }
  .subject-card {
    background: var(--panel);
    border: 1.5px solid var(--border);
    border-radius: 14px; padding: 26px 16px 20px;
    display: flex; flex-direction: column;
    align-items: center; gap: 12px;
    cursor: pointer;
    transition: border-color .25s, transform .25s, box-shadow .25s;
    position: relative; overflow: hidden; text-align: center;
  }
  .subject-card::after {
    content:''; position:absolute; inset:0;
    background: linear-gradient(135deg, rgba(255,215,0,0.07) 0%, transparent 60%);
    opacity:0; transition:opacity .25s; border-radius:14px;
  }
  .subject-card:hover::after { opacity:1; }
  .subject-card:hover {
    border-color: var(--gold);
    transform: translateY(-4px) scale(1.025);
    box-shadow: 0 12px 36px rgba(255,215,0,0.14), 0 0 0 1px rgba(255,215,0,0.1);
  }
  .subject-card:active { transform: scale(0.97); }
  .subject-icon {
    color: var(--gold); opacity: 0.85;
    width: 38px; height: 38px;
    transition: opacity .2s, transform .2s;
  }
  .subject-card:hover .subject-icon { opacity:1; transform:scale(1.1); }
  .subject-name {
    font-family: var(--font-condensed);
    font-size: clamp(13px, 2vw, 16px); font-weight: 700;
    letter-spacing: 1px; color: var(--text-primary); text-transform: uppercase;
  }
  .subject-meta {
    font-family: var(--font-body);
    font-size: 12px; color: var(--text-dim); font-weight: 500;
  }

  /* ══ GAME SCREEN ══ */
  #screen-game { flex-direction: column; }

  .game-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 14px 24px;
    background: rgba(5,9,20,0.88);
    border-bottom: 1px solid var(--border);
    backdrop-filter: blur(10px);
    position: sticky; top: 0; z-index: 20; gap: 16px;
  }
  .header-center { text-align: center; flex: 1; }
  .header-subject {
    font-family: var(--font-condensed);
    font-size: 11px; font-weight: 700;
    letter-spacing: 4px; color: rgba(255,215,0,0.5);
    text-transform: uppercase;
  }
  .header-title {
    font-family: var(--font-display);
    font-size: clamp(11px, 2vw, 15px); font-weight: 700;
    color: var(--gold); letter-spacing: 1px;
  }
  .header-badge {
    font-family: var(--font-mono);
    font-size: clamp(12px, 1.8vw, 15px); color: var(--gold);
    background: rgba(255,215,0,0.08);
    border: 1px solid rgba(255,215,0,0.25);
    padding: 5px 16px; border-radius: 20px;
    white-space: nowrap; min-width: 90px; text-align: center;
  }
  .btn-quit {
    font-family: var(--font-condensed);
    font-size: 13px; font-weight: 700; letter-spacing: 1px;
    background: rgba(220,30,30,0.12);
    border: 1px solid rgba(220,30,30,0.35);
    color: rgba(255,110,110,0.9);
    padding: 7px 18px; border-radius: 20px;
    cursor: pointer; transition: all .2s; white-space: nowrap;
  }
  .btn-quit:hover { background: rgba(220,30,30,0.28); color: #fff; }

  .game-main {
    display: flex; flex: 1; gap: 20px;
    padding: 20px; max-width: 1200px; margin: 0 auto; width: 100%;
    align-items: flex-start;
  }
  .question-col {
    flex: 1; display: flex; flex-direction: column; gap: 18px; min-width: 0;
  }

  /* Prize banner */
  .prize-banner {
    display: flex; align-items: center; justify-content: space-between;
    background: linear-gradient(90deg, rgba(255,215,0,0.04), rgba(255,165,0,0.1), rgba(255,215,0,0.04));
    border: 1px solid rgba(255,215,0,0.2);
    border-radius: 12px; padding: 12px 22px;
  }
  .prize-label {
    font-family: var(--font-condensed);
    font-size: 11px; font-weight: 700;
    letter-spacing: 3px; color: rgba(255,215,0,0.5); text-transform: uppercase;
  }
  .prize-value {
    font-family: var(--font-mono);
    font-size: clamp(22px, 3.5vw, 34px);
    color: var(--gold); text-shadow: 0 0 18px rgba(255,215,0,0.4);
    transition: all .4s ease;
  }
  .prize-next {
    font-family: var(--font-condensed);
    font-size: 12px; font-weight: 600;
    color: rgba(255,255,255,0.3); text-align: right; line-height: 1.5;
  }
  .prize-next span { color: rgba(255,215,0,0.6); }

  /* Controls row */
  .controls-row {
    display: flex; align-items: center;
    justify-content: space-between; gap: 12px;
  }
  .lifelines { display: flex; gap: 10px; }
  .lifeline-btn {
    display: flex; flex-direction: column;
    align-items: center; justify-content: center; gap: 4px;
    width: 58px; height: 58px;
    background: rgba(255,215,0,0.06);
    border: 1.5px solid rgba(255,215,0,0.28);
    border-radius: 12px; cursor: pointer;
    transition: all .25s; color: var(--gold);
  }
  .lifeline-btn:hover:not(.used) {
    background: rgba(255,215,0,0.14);
    border-color: var(--gold);
    transform: scale(1.07);
    box-shadow: 0 0 18px rgba(255,215,0,0.2);
  }
  .lifeline-btn.used { opacity:.2; cursor:default; filter:grayscale(1); }
  .ll-label {
    font-family: var(--font-condensed);
    font-size: 9px; font-weight: 700;
    letter-spacing: .5px; color: rgba(255,215,0,0.7); line-height: 1;
  }
  .ll-icon { line-height: 0; }

  /* Timer */
  .timer-wrap { position: relative; width: 80px; height: 80px; flex-shrink: 0; }
  .timer-wrap svg { position: absolute; top: 0; left: 0; transform: rotate(-90deg); }
  .timer-inner {
    position: absolute; inset: 0;
    display: flex; align-items: center; justify-content: center;
  }
  .timer-num {
    font-family: var(--font-mono);
    font-size: 23px; font-weight: 700; line-height: 1;
    transition: color .5s;
  }

  /* Question box */
  .question-box {
    background: var(--panel);
    border: 1.5px solid var(--border);
    border-radius: 18px; padding: 30px 32px;
    text-align: center; position: relative;
    box-shadow: 0 0 40px rgba(10,40,160,0.2), inset 0 1px 0 rgba(255,255,255,0.04);
  }
  .question-box::before {
    content: ''; position: absolute;
    top: -1px; left: 25%; right: 25%; height: 2px;
    background: linear-gradient(90deg, transparent, var(--gold), transparent);
  }
  .q-num {
    font-family: var(--font-condensed);
    font-size: 12px; font-weight: 700; letter-spacing: 3px;
    color: rgba(255,215,0,0.45); text-transform: uppercase; margin-bottom: 14px;
  }
  .q-text {
    font-family: var(--font-body);
    font-size: clamp(16px, 2.5vw, 22px);
    font-weight: 600; line-height: 1.55; color: #fff;
  }

  /* Options */
  .options-grid {
    display: grid; grid-template-columns: 1fr 1fr; gap: 12px;
  }
  .option-btn {
    display: flex; align-items: center; gap: 14px;
    background: var(--panel);
    border: 1.5px solid var(--border);
    border-radius: 50px; padding: 14px 20px;
    cursor: pointer;
    transition: border-color .2s, background .2s, transform .2s, box-shadow .2s;
    text-align: left;
  }
  .option-btn:hover:not(.locked) {
    border-color: rgba(255,215,0,0.6);
    background: rgba(255,215,0,0.07);
    transform: scale(1.015);
    box-shadow: 0 0 20px rgba(255,215,0,0.1);
  }
  .option-btn:active:not(.locked) { transform: scale(0.985); }
  .option-btn.locked { cursor: default; }
  .option-btn.selecting {
    border-color: var(--gold2);
    background: rgba(255,165,0,0.12);
    animation: selectPulse .35s ease-in-out 3;
    box-shadow: 0 0 24px rgba(255,165,0,0.3);
  }
  @keyframes selectPulse {
    0%,100%{box-shadow:0 0 10px rgba(255,165,0,0.2)}
    50%{box-shadow:0 0 34px rgba(255,165,0,0.65)}
  }
  .option-btn.correct {
    border-color: var(--correct);
    background: rgba(0,232,122,0.12);
    animation: correctBlink .45s ease-in-out 4;
    box-shadow: 0 0 28px rgba(0,232,122,0.25);
  }
  @keyframes correctBlink {
    0%,100%{background:rgba(0,232,122,0.12);box-shadow:0 0 16px rgba(0,232,122,0.2)}
    50%{background:rgba(0,232,122,0.28);box-shadow:0 0 44px rgba(0,232,122,0.6)}
  }
  .option-btn.wrong {
    border-color: var(--wrong);
    background: rgba(255,59,59,0.12);
    animation: wrongShake .4s ease-in-out;
    box-shadow: 0 0 24px rgba(255,59,59,0.2);
  }
  @keyframes wrongShake {
    0%,100%{transform:translateX(0)} 20%{transform:translateX(-7px)}
    40%{transform:translateX(7px)} 60%{transform:translateX(-4px)} 80%{transform:translateX(4px)}
  }
  .option-btn.dimmed { opacity: .28; pointer-events: none; }
  .opt-label {
    font-family: var(--font-condensed);
    font-size: 13px; font-weight: 800; letter-spacing: 1px;
    color: var(--gold); min-width: 28px;
    background: rgba(255,215,0,0.1);
    border: 1px solid rgba(255,215,0,0.22);
    border-radius: 50%; width: 32px; height: 32px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .opt-text {
    font-family: var(--font-body);
    font-size: clamp(13px, 2vw, 17px); font-weight: 600;
    color: #fff; flex: 1; line-height: 1.35;
  }

  /* Prize ladder */
  .prize-ladder {
    width: 210px; flex-shrink: 0;
    background: var(--panel);
    border: 1.5px solid var(--border);
    border-radius: 16px; padding: 14px 10px;
    max-height: calc(100vh - 110px);
    overflow-y: auto; overflow-x: hidden;
    position: sticky; top: 90px;
  }
  .prize-ladder::-webkit-scrollbar { width: 3px; }
  .prize-ladder::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.22); border-radius: 2px; }
  .ladder-title {
    font-family: var(--font-condensed);
    font-size: 10px; font-weight: 700; letter-spacing: 3px;
    color: rgba(255,215,0,0.4); text-align: center; text-transform: uppercase;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.05);
    margin-bottom: 8px;
  }
  .ladder-row {
    display: flex; align-items: center; gap: 8px;
    padding: 5px 8px; border-radius: 8px;
    transition: all .35s ease; margin: 1px 0;
    border: 1px solid transparent;
  }
  .ladder-row .l-dot {
    width: 7px; height: 7px; border-radius: 50%;
    background: rgba(255,255,255,0.15); flex-shrink: 0;
    transition: all .35s;
  }
  .ladder-row .l-num {
    font-family: var(--font-mono);
    font-size: 9px; color: rgba(255,255,255,0.25); min-width: 18px;
    transition: color .35s;
  }
  .ladder-row .l-amt {
    font-family: var(--font-mono);
    font-size: clamp(10px, 1.3vw, 12px);
    color: rgba(255,255,255,0.32); flex: 1; text-align: right;
    transition: all .35s;
  }
  .ladder-row.milestone .l-amt { color: rgba(255,165,0,0.65); }
  .ladder-row.milestone .l-dot { background: rgba(255,165,0,0.5); }
  .ladder-row.active {
    background: linear-gradient(90deg, rgba(255,215,0,0.1), rgba(255,165,0,0.05));
    border-color: rgba(255,215,0,0.25);
    transform: scale(1.02);
  }
  .ladder-row.active .l-amt {
    color: var(--gold); font-size: 14px;
    text-shadow: 0 0 10px rgba(255,215,0,0.5);
  }
  .ladder-row.active .l-dot {
    background: var(--gold);
    box-shadow: 0 0 8px rgba(255,215,0,0.7);
  }
  .ladder-row.active .l-num { color: var(--gold); }
  .ladder-row.won .l-amt { color: rgba(0,232,122,0.6); }
  .ladder-row.won .l-dot { background: rgba(0,232,122,0.5); }

  /* Toast */
  .toast {
    position: fixed; bottom: 32px; left: 50%;
    transform: translateX(-50%) translateY(80px);
    background: rgba(0,180,90,0.1);
    border: 1.5px solid rgba(0,232,122,0.45);
    color: var(--correct); padding: 10px 28px; border-radius: 40px;
    font-family: var(--font-condensed); font-size: 15px; font-weight: 700;
    letter-spacing: 2px; z-index: 100;
    transition: transform .35s ease;
    backdrop-filter: blur(6px); text-align: center;
    max-width: 90vw; white-space: nowrap;
  }
  .toast.show { transform: translateX(-50%) translateY(0); }

  /* Money fly-up */
  .money-fly {
    position: fixed; pointer-events: none; z-index: 500;
    font-family: var(--font-mono); font-size: 28px;
    color: var(--gold); text-shadow: 0 0 20px rgba(255,215,0,0.7);
    animation: flyUp 1.8s ease-out forwards;
  }
  @keyframes flyUp {
    0%{opacity:1;transform:translateY(0) scale(1)}
    40%{opacity:1;transform:translateY(-60px) scale(1.25)}
    100%{opacity:0;transform:translateY(-160px) scale(0.9)}
  }

  /* Confetti */
  .confetti {
    position: fixed; pointer-events: none; z-index: 999;
    animation: confettiFall linear forwards;
  }
  @keyframes confettiFall {
    0%{opacity:1;transform:translateY(-20px) rotate(0deg)}
    100%{opacity:0;transform:translateY(110vh) rotate(720deg)}
  }

  /* Lifeline modal */
  .modal-bg {
    position: fixed; inset: 0; z-index: 200;
    background: rgba(5,9,20,0.82);
    display: flex; align-items: center; justify-content: center;
    animation: fadeIn .25s ease;
    backdrop-filter: blur(5px);
  }
  @keyframes fadeIn { from{opacity:0} to{opacity:1} }
  .modal-card {
    background: linear-gradient(160deg, #0D1E5A 0%, #050914 100%);
    border: 1.5px solid rgba(30,70,200,0.45);
    border-radius: 22px; padding: 36px 32px;
    max-width: 420px; width: 90%; text-align: center;
    box-shadow: 0 24px 80px rgba(0,0,30,0.6);
  }
  .modal-title {
    font-family: var(--font-display);
    font-size: 18px; font-weight: 700;
    color: var(--gold); margin-bottom: 20px; letter-spacing: 2px;
  }
  .modal-body {
    font-family: var(--font-body);
    font-size: 16px; font-weight: 500;
    color: rgba(255,255,255,0.8); line-height: 1.65; margin-bottom: 24px;
  }
  .modal-close {
    font-family: var(--font-condensed);
    font-size: 14px; font-weight: 800;
    letter-spacing: 2px; text-transform: uppercase;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    border: none; color: #080500;
    padding: 12px 32px; border-radius: 40px;
    cursor: pointer; transition: all .25s;
    box-shadow: 0 4px 20px rgba(255,165,0,0.25);
  }
  .modal-close:hover { transform: scale(1.04); box-shadow: 0 4px 30px rgba(255,165,0,0.45); }
  .aud-row { display: flex; align-items: center; gap: 12px; margin: 10px 0; }
  .aud-lbl {
    font-family: var(--font-condensed);
    font-size: 14px; font-weight: 800; min-width: 20px; color: var(--gold);
  }
  .aud-track {
    flex: 1; height: 28px;
    background: rgba(255,255,255,0.05); border-radius: 6px; overflow: hidden;
  }
  .aud-fill { height: 100%; border-radius: 6px; transition: width .8s ease; }
  .aud-pct {
    font-family: var(--font-mono);
    font-size: 12px; color: rgba(255,255,255,0.65); min-width: 38px; text-align: right;
  }

  /* Result */
  .result-overlay {
    position: fixed; inset: 0; z-index: 300;
    background: rgba(5,9,20,0.93);
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    gap: 20px; padding: 40px;
    animation: fadeIn .4s ease;
    backdrop-filter: blur(8px);
  }
  .result-reason {
    font-family: var(--font-condensed);
    font-size: clamp(12px, 2vw, 16px); font-weight: 700;
    letter-spacing: 4px; color: rgba(255,215,0,0.5); text-transform: uppercase;
  }
  .result-title {
    font-family: var(--font-display);
    font-size: clamp(28px, 6vw, 58px); font-weight: 900;
    background: linear-gradient(135deg, #fff8d6, #FFD700, #FFA500);
    -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;
    text-align: center; line-height: 1.1;
    animation: bounceIn .5s ease;
  }
  @keyframes bounceIn {
    0%{transform:scale(.3);opacity:0} 60%{transform:scale(1.1)} 100%{transform:scale(1);opacity:1}
  }
  .result-amount {
    font-family: var(--font-mono);
    font-size: clamp(32px, 7vw, 66px);
    color: var(--gold); text-shadow: 0 0 40px rgba(255,215,0,0.45);
    animation: countUp .8s ease;
  }
  @keyframes countUp { from{transform:scale(.5);opacity:0} to{transform:scale(1);opacity:1} }
  .result-stats { display: flex; gap: 28px; margin: 4px 0; }
  .stat {
    display: flex; flex-direction: column; align-items: center; gap: 4px;
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 14px 24px;
  }
  .stat-val {
    font-family: var(--font-mono);
    font-size: 22px; font-weight: 700; color: var(--gold);
  }
  .stat-lbl {
    font-family: var(--font-condensed);
    font-size: 10px; font-weight: 700;
    letter-spacing: 2px; color: rgba(255,255,255,0.3); text-transform: uppercase;
  }
  .result-msg {
    font-family: var(--font-body);
    font-size: clamp(14px, 2vw, 18px); font-weight: 500;
    color: rgba(255,255,255,0.55); text-align: center;
    max-width: 440px; line-height: 1.6;
  }
  .result-actions { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; }
  .btn-primary {
    font-family: var(--font-condensed);
    font-size: 15px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;
    background: linear-gradient(135deg, #FFD700, #FFA500);
    border: none; color: #080500;
    padding: 14px 36px; border-radius: 40px;
    cursor: pointer; transition: all .25s;
    box-shadow: 0 4px 24px rgba(255,165,0,0.3);
  }
  .btn-primary:hover { transform: scale(1.05); box-shadow: 0 4px 40px rgba(255,165,0,0.55); }
  .btn-secondary {
    font-family: var(--font-condensed);
    font-size: 14px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;
    background: transparent; border: 1.5px solid rgba(255,215,0,0.35);
    color: rgba(255,215,0,0.8);
    padding: 13px 30px; border-radius: 40px;
    cursor: pointer; transition: all .25s;
  }
  .btn-secondary:hover { border-color: var(--gold); background: rgba(255,215,0,0.07); color: var(--gold); }

  /* Mobile */
  @media(max-width:700px){
    .game-main { flex-direction: column; padding: 12px; gap: 12px; }
    .prize-ladder {
      width: 100%; max-height: 120px;
      overflow-x: auto; overflow-y: hidden;
      position: static;
    }
    .ladder-inner { display: flex; flex-direction: row-reverse; gap: 4px; width: max-content; }
    .ladder-row { min-width: 96px; flex-shrink: 0; }
    .options-grid { grid-template-columns: 1fr; }
    .lifeline-btn { width: 50px; height: 50px; }
    .result-stats { gap: 12px; }
    .stat { padding: 10px 16px; }
  }

      `}</style>
    </div>
  );
}
