"use client";

import { CSSProperties, useEffect, useRef, useState } from "react";
import * as gamesApi from "@/lib/api/games";
import { extractErrorMessage } from "@/lib/api/client";
import { useAuthStore } from "@/lib/store/authStore";
import mapData from "@/lib/data/nigeria-map-data.json";

const NG_VIEWBOX = "0 0 744 600";
const ZONE_NAMES: Record<string, string> = {
  nw: "North West",
  ne: "North East",
  nc: "North Central",
  sw: "South West",
  se: "South East",
  ss: "South South",
};
const ZONE_COLORS: Record<string, string> = {
  nw: "#1a2e08",
  ne: "#0d200a",
  nc: "#1a3d0d",
  sw: "#0d2e2e",
  se: "#0a221a",
  ss: "#0a1520",
};
const START_LEADS = 3;
const TIMER_SECONDS = 30;

interface MapState {
  id: string;
  name: string;
  zone: string;
  cx: number;
  cy: number;
  d: string;
}
const STATES = mapData as MapState[];

type Screen = "intro" | "game" | "end";

const WitnessAvatar = () => (
  <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
    <circle cx="22" cy="17" r="10" fill="#6B3410" />
    <ellipse cx="22" cy="37" rx="13" ry="8" fill="#2d2d4e" />
    <circle cx="19" cy="17" r="2" fill="#1a0a00" />
    <circle cx="25" cy="17" r="2" fill="#1a0a00" />
  </svg>
);

const MugshotSvg = ({ won }: { won: boolean }) => (
  <svg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="38" r="24" fill="#6B3410" />
    <ellipse cx="50" cy="86" rx="30" ry="16" fill={won ? "#1a3d0d" : "#1a1a2e"} />
    <circle cx="43" cy="38" r="3" fill="#1a0a00" />
    <circle cx="57" cy="38" r="3" fill="#1a0a00" />
    {won ? (
      <path d="M40 48 Q50 55 60 48" stroke="#2ecc71" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    ) : (
      <path d="M40 52 Q50 46 60 52" stroke="#e74c3c" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    )}
  </svg>
);

export default function MadamKarmenPlay() {
  const firstName = useAuthStore((s) => s.user?.firstName) ?? "Detective";

  const [screen, setScreen] = useState<Screen>("intro");
  const [howToPlayOpen, setHowToPlayOpen] = useState(false);
  const [stats, setStats] = useState<{ highScore: number; gamesPlayed: number } | null>(null);
  const [starting, setStarting] = useState(false);
  const [startError, setStartError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [round, setRound] = useState<gamesApi.KarmenRound | null>(null);
  const [mapOverlayOpen, setMapOverlayOpen] = useState(false);
  const [mapPeekOnly, setMapPeekOnly] = useState(false);
  const [locked, setLocked] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [revealCorrectName, setRevealCorrectName] = useState<string | null>(null);
  const [lastCorrect, setLastCorrect] = useState<boolean | null>(null);

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timeLeftRef = useRef(TIMER_SECONDS);

  const [hintText, setHintText] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ correct: boolean; text: string } | null>(null);
  const [streakBannerOn, setStreakBannerOn] = useState(false);

  const [interrogationOpen, setInterrogationOpen] = useState(false);
  const [interrogation, setInterrogation] = useState<gamesApi.KarmenInterrogation | null>(null);
  const [interrogationResult, setInterrogationResult] = useState<{ correct: boolean } | null>(null);

  const [quitConfirmOpen, setQuitConfirmOpen] = useState(false);
  const [endResult, setEndResult] = useState<{ won: boolean; score: number } | null>(null);

  useEffect(() => {
    gamesApi.getMyKarmenStats().then(setStats).catch(() => setStats({ highScore: 0, gamesPlayed: 0 }));
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  function stopTimer() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  }

  function startTimer() {
    stopTimer();
    timeLeftRef.current = TIMER_SECONDS;
    setTimeLeft(TIMER_SECONDS);
    timerRef.current = setInterval(() => {
      timeLeftRef.current -= 1;
      setTimeLeft(timeLeftRef.current);
      if (timeLeftRef.current <= 0) {
        stopTimer();
        handleAnswer(null);
      }
    }, 1000);
  }

  async function handleStart() {
    setStarting(true);
    setStartError(null);
    try {
      const res = await gamesApi.startKarmenSession();
      setSessionId(res.sessionId);
      setRound(res.round);
      setScreen("game");
      setMapOverlayOpen(true);
      setMapPeekOnly(false);
      setHintText(null);
      setFeedback(null);
      setSelectedId(null);
      setLocked(false);
      setEndResult(null);
    } catch (err) {
      setStartError(extractErrorMessage(err));
    } finally {
      setStarting(false);
    }
  }

  function beginRound() {
    setMapOverlayOpen(false);
    startTimer();
  }

  async function handleAnswer(chosenId: string | null) {
    if (locked || !sessionId || !round) return;
    setLocked(true);
    stopTimer();
    setSelectedId(chosenId);

    try {
      const res = await gamesApi.submitKarmenAnswer(sessionId, chosenId ?? "", timeLeftRef.current);
      setRevealCorrectName(res.correctCaseName);
      setLastCorrect(res.isCorrect);
      setFeedback({
        correct: res.isCorrect,
        text: res.isCorrect
          ? res.bonusStreak
            ? `CORRECT! +${res.pointsChange} pts`
            : `CORRECT! +${res.pointsChange} pts`
          : chosenId
            ? `WRONG — it was ${res.correctCaseName}`
            : `TIME'S UP — it was ${res.correctCaseName}`,
      });
      if (res.bonusStreak) {
        setStreakBannerOn(true);
        setTimeout(() => setStreakBannerOn(false), 2200);
      }

      await new Promise((r) => setTimeout(r, 1900));
      setFeedback(null);

      if (res.sessionStatus !== "in_progress") {
        setEndResult({ won: res.sessionStatus === "won", score: res.score });
        setScreen("end");
        return;
      }

      setSelectedId(null);
      setRevealCorrectName(null);
      setHintText(null);
      setRound(res.nextRound);
      setMapOverlayOpen(true);
      setMapPeekOnly(false);
      setLocked(false);
    } catch (err) {
      setFeedback(null);
      setLocked(false);
      startTimer();
      alert(extractErrorMessage(err));
    }
  }

  async function handleOpenInterrogation() {
    if (!sessionId || !round?.hintsLeft || !interrogationAvailable) return;
    try {
      const q = await gamesApi.getKarmenInterrogation(sessionId);
      setInterrogation(q);
      setInterrogationResult(null);
      setInterrogationOpen(true);
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }
  const interrogationAvailable = round ? round.streak > 0 && round.streak % 3 === 0 : false;

  async function answerInterrogation(idx: number) {
    if (!sessionId) return;
    try {
      const res = await gamesApi.answerKarmenInterrogation(sessionId, idx);
      setInterrogationResult({ correct: res.isCorrect });
      setRound((r) => (r ? { ...r, hintsLeft: res.hintsLeft } : r));
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }
  function closeInterrogation() {
    setInterrogationOpen(false);
    setInterrogation(null);
    setInterrogationResult(null);
  }

  async function handleSkip() {
    if (locked || !sessionId) return;
    setLocked(true);
    stopTimer();
    try {
      const res = await gamesApi.skipKarmenClue(sessionId);
      if (res.sessionStatus !== "in_progress") {
        setEndResult({ won: res.sessionStatus === "won", score: res.score });
        setScreen("end");
        return;
      }
      setRound(res.nextRound);
      setMapOverlayOpen(true);
      setMapPeekOnly(false);
      setHintText(null);
      setLocked(false);
    } catch (err) {
      setLocked(false);
      startTimer();
      alert(extractErrorMessage(err));
    }
  }

  async function handleHint() {
    if (!sessionId || !round || round.hintsLeft <= 0) return;
    try {
      const res = await gamesApi.useKarmenHint(sessionId);
      setHintText(res.hint);
      setRound((r) => (r ? { ...r, hintsLeft: res.hintsLeft } : r));
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }

  function peekMap() {
    stopTimer();
    setMapPeekOnly(true);
    setMapOverlayOpen(true);
  }
  function closePeek() {
    setMapOverlayOpen(false);
    setMapPeekOnly(false);
    startTimer();
  }

  function handleQuitClick() {
    stopTimer();
    setQuitConfirmOpen(true);
  }
  async function confirmQuit() {
    setQuitConfirmOpen(false);
    if (!sessionId) return;
    try {
      const res = await gamesApi.quitKarmenSession(sessionId);
      setEndResult({ won: false, score: res.score });
      setScreen("end");
    } catch (err) {
      alert(extractErrorMessage(err));
    }
  }
  function cancelQuit() {
    setQuitConfirmOpen(false);
    startTimer();
  }

  function backToIntro() {
    setScreen("intro");
    setSessionId(null);
    setRound(null);
    gamesApi.getMyKarmenStats().then(setStats).catch(() => {});
  }

  const zone = round?.zone ?? null;

  return (
    <div className="karmen-game">
      {/* ══ INTRO SCREEN ══ */}
      <div className={`screen ${screen === "intro" ? "active" : ""}`}>
        <div className="intro-content">
          <div className="intro-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            Naija Cyber-Crime Unit
          </div>

          <div className="karmen-svg-wrap">
            <svg width="130" height="130" viewBox="0 0 130 130" xmlns="http://www.w3.org/2000/svg">
              <ellipse cx="65" cy="122" rx="28" ry="5" fill="rgba(0,0,0,0.4)" />
              <path d="M35 75 C30 95 28 115 32 125 L98 125 C102 115 100 95 95 75 L65 82 Z" fill="#1a1a2e" stroke="#f5c518" strokeWidth="1" />
              <path d="M65 82 L50 75 L55 95 Z" fill="#2d2d4e" />
              <path d="M65 82 L80 75 L75 95 Z" fill="#2d2d4e" />
              <rect x="45" y="97" width="40" height="5" rx="2" fill="#f5c518" />
              <rect x="62" y="95" width="6" height="9" rx="1" fill="#c0392b" />
              <rect x="58" y="58" width="14" height="18" rx="4" fill="#8B4513" />
              <ellipse cx="65" cy="50" rx="24" ry="26" fill="#6B3410" />
              <path d="M41 45 C40 25 50 15 65 14 C80 15 90 25 89 45 C85 38 80 34 65 33 C50 34 45 38 41 45 Z" fill="#1a0a00" />
              <circle cx="44" cy="38" r="10" fill="#1a0a00" />
              <circle cx="86" cy="38" r="10" fill="#1a0a00" />
              <circle cx="65" cy="28" r="9" fill="#1a0a00" />
              <ellipse cx="57" cy="50" rx="4" ry="4.5" fill="white" />
              <ellipse cx="73" cy="50" rx="4" ry="4.5" fill="white" />
              <circle cx="58" cy="51" r="2.5" fill="#1a0a00" />
              <circle cx="74" cy="51" r="2.5" fill="#1a0a00" />
              <circle cx="59" cy="50" r=".9" fill="white" />
              <circle cx="75" cy="50" r=".9" fill="white" />
              <rect x="50" y="47" width="11" height="7" rx="3" fill="rgba(0,0,0,0.7)" stroke="#f5c518" strokeWidth="1" />
              <rect x="69" y="47" width="11" height="7" rx="3" fill="rgba(0,0,0,0.7)" stroke="#f5c518" strokeWidth="1" />
              <line x1="61" y1="50.5" x2="69" y2="50.5" stroke="#f5c518" strokeWidth="1" />
              <path d="M60 63 Q65 68 70 63" stroke="#c0392b" strokeWidth="2" fill="none" strokeLinecap="round" />
              <path d="M35 80 Q20 90 22 105" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" fill="none" />
              <rect x="10" y="101" width="22" height="16" rx="3" fill="#c0392b" stroke="#f5c518" strokeWidth="1.5" />
              <rect x="17" y="98" width="8" height="5" rx="1" fill="none" stroke="#f5c518" strokeWidth="1.5" />
              <line x1="21" y1="105" x2="21" y2="113" stroke="#f5c518" strokeWidth="1" />
              <path d="M95 80 Q110 88 108 100" stroke="#8B4513" strokeWidth="10" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          <h1 className="intro-title">
            Where in Nigeria
            <br />
            is Madam Karmen?
          </h1>
          <div className="intro-subtitle">A Geography Deduction Game</div>
          <div className="intro-tagline">
            &quot;She stole the Benin Bronze and is hiding across all 36 states.
            <br />
            Track her down before she escapes the country!&quot;
          </div>

          <div className="stats-bar">
            <div className="stat-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M3 3h18v18H3z" />
                <path d="M3 9h18M9 21V9" />
              </svg>
              36 States + FCT
            </div>
            <div className="stat-pill">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
              5 Clue Types
            </div>
            {stats && (
              <div className="stat-pill">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
                Best: {stats.highScore.toLocaleString("en-NG")} pts
              </div>
            )}
          </div>

          {startError && <p style={{ color: "#e74c3c", fontSize: 13, marginTop: 8 }}>{startError}</p>}

          <div className="intro-buttons">
            <button className="btn-primary" onClick={handleStart} disabled={starting}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              {starting ? "Loading case files…" : `Begin Investigation, ${firstName}`}
            </button>
            <button className="btn-secondary" onClick={() => setHowToPlayOpen(true)}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              How to Play
            </button>
          </div>
        </div>
      </div>

      {/* ══ GAME SCREEN ══ */}
      <div className={`screen ${screen === "game" ? "active" : ""}`}>
        {round && (
          <>
            <div className="top-bar">
              <div className="player-tag">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
                <span>{firstName}</span>
              </div>
              <div className="top-stat">
                <div className="top-stat-label">Case</div>
                <div className="top-stat-value case-count">{round.caseNumber}/10</div>
              </div>
              <div className="top-stat">
                <div className="top-stat-label">Score</div>
                <div className="top-stat-value gold">{round.score.toLocaleString("en-NG")}</div>
              </div>
              <div className="top-stat">
                <div className="top-stat-label">Streak</div>
                <div className="top-stat-value orange">{round.streak}</div>
              </div>
              <div className="top-stat">
                <div className="top-stat-label">Timer</div>
                <div className="top-stat-value">{timeLeft}</div>
              </div>
              <div className="top-stat">
                <div className="top-stat-label">Leads</div>
                <div className="leads-display">
                  {Array.from({ length: START_LEADS }, (_, i) => (
                    <div key={i} className="lead-dot" style={{ opacity: i < round.leads ? 1 : 0.2 }} />
                  ))}
                </div>
              </div>
              <button className="btn-secondary" style={{ marginLeft: 8, padding: "0.4rem 0.7rem" }} onClick={handleQuitClick}>
                Quit
              </button>
            </div>
            <div className="timer-bar-wrap">
              <div
                className="timer-bar-fill"
                style={{ width: `${(timeLeft / TIMER_SECONDS) * 100}%`, background: timeLeft <= 10 ? "#e74c3c" : undefined }}
              />
            </div>

            {streakBannerOn && (
              <div className="streak-banner" style={{ display: "flex" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9z" />
                </svg>
                STREAK BONUS! +300 pts
                <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--gold)" stroke="none">
                  <path d="M13 2L3 14h9l-1 8 10-12h-9z" />
                </svg>
              </div>
            )}

            <div className="clue-panel">
              <div className="witness-box">
                <div className="witness-avatar-wrap">
                  <WitnessAvatar />
                </div>
                <div className="witness-text-wrap">
                  <div className="witness-intro">Witness Report</div>
                  <div className="clue-type-badge">Case File #{round.caseNumber}</div>
                  <div className="clue-text">{round.clueText}</div>
                </div>
              </div>

              {hintText && (
                <div className="hint-box" style={{ display: "block" }}>
                  💡 {hintText}
                </div>
              )}

              <div className="choices-grid">
                {round.choices.map((c) => {
                  const isSelected = selectedId === c.id;
                  const isCorrectChoice = revealCorrectName === c.name;
                  let extraStyle: CSSProperties = {};
                  if (feedback) {
                    if (isCorrectChoice) extraStyle = { background: "rgba(46,204,113,0.25)", borderColor: "#2ecc71" };
                    else if (isSelected) extraStyle = { background: "rgba(231,76,60,0.25)", borderColor: "#e74c3c" };
                  }
                  return (
                    <button
                      key={c.id}
                      className="choice-btn"
                      style={extraStyle}
                      disabled={locked}
                      onClick={() => handleAnswer(c.id)}
                    >
                      {c.name}
                    </button>
                  );
                })}
              </div>

              <div className="action-row">
                <button className="btn-hint" onClick={handleHint} disabled={locked || round.hintsLeft <= 0}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  Hint ({round.hintsLeft})
                </button>
                <button className="btn-peek-map" onClick={peekMap} disabled={locked}>
                  🗺️ View Map
                </button>
                <button className="btn-interrogate" onClick={handleOpenInterrogation} disabled={locked || !interrogationAvailable}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  Interrogate
                </button>
                <button className="btn-skip" onClick={handleSkip} disabled={locked}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polygon points="5 4 15 12 5 20 5 4" />
                    <line x1="19" y1="5" x2="19" y2="19" />
                  </svg>
                  Skip
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ══ END SCREEN ══ */}
      <div className={`screen ${screen === "end" ? "active" : ""}`}>
        {endResult && (
          <div className="end-content">
            <div className="end-mugshot">
              <MugshotSvg won={endResult.won} />
            </div>
            <div className="end-title">{endResult.won ? "CASE CLOSED!" : "SHE GOT AWAY…"}</div>
            <div className="end-score">{endResult.score.toLocaleString("en-NG")} pts</div>
            <div className="end-detail">
              {endResult.won
                ? "You tracked Madam Karmen across all 10 sightings. Outstanding detective work!"
                : "The case file stays open — Madam Karmen will strike again."}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem", alignItems: "center" }}>
              <button className="btn-primary" onClick={handleStart}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <polyline points="1 4 1 10 7 10" />
                  <path d="M3.51 15a9 9 0 1 0 .49-3.24" />
                </svg>
                New Investigation
              </button>
              <button className="btn-secondary" onClick={backToIntro}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  <polyline points="9 22 9 12 15 12 15 22" />
                </svg>
                Main Menu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ══ FEEDBACK OVERLAY ══ */}
      <div className="feedback-overlay" style={{ display: feedback ? "flex" : "none" }}>
        <div className="feedback-banner" style={{ color: feedback?.correct ? "#2ecc71" : "#e74c3c" }}>
          {feedback?.text}
        </div>
      </div>

      {/* ══ MAP MODAL ══ */}
      <div className="modal-overlay" style={{ display: mapOverlayOpen ? "flex" : "none" }}>
        <div className="modal-box map-modal-box">
          <div className="map-modal-progress">
            {mapPeekOnly ? "Map Reference" : `State ${round?.caseNumber ?? 1} of 10`}
          </div>
          <div className="map-modal-title">{mapPeekOnly ? "🗺️ Nigeria Reference Map" : "🚨 New Sighting"}</div>
          <div className="map-modal-sub">
            {mapPeekOnly
              ? "The highlighted zone is where this case's sighting was reported."
              : `Reports place her somewhere in the `}
            {!mapPeekOnly && zone && <strong>{ZONE_NAMES[zone]}</strong>}
            {!mapPeekOnly && "…"}
          </div>
          <div className="nigeria-map">
            <svg viewBox={NG_VIEWBOX} xmlns="http://www.w3.org/2000/svg">
              {STATES.map((s) => {
                const classes = ["ng-state", `zone-${s.zone}`];
                if (zone && s.zone === zone) classes.push("zone-hint");
                return <path key={s.id} className={classes.join(" ")} d={s.d} />;
              })}
            </svg>
          </div>
          <div className="zone-legend">
            {Object.entries(ZONE_COLORS).map(([z, color]) => (
              <div className="zone-dot" key={z}>
                <div className="zone-dot-circle" style={{ background: color }} />
                {z.toUpperCase()}
              </div>
            ))}
          </div>
          <button className="map-modal-cta" onClick={mapPeekOnly ? closePeek : beginRound}>
            {mapPeekOnly ? "Back to Case ▸" : "Let's Investigate ▸"}
          </button>
        </div>
      </div>

      {/* ══ INTERROGATION MODAL ══ */}
      <div className="modal-overlay" style={{ display: interrogationOpen ? "flex" : "none" }}>
        <div className="modal-box">
          <div className="modal-title">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
            INTERROGATION
          </div>
          <div className="modal-subtitle">Answer correctly to earn a free hint!</div>
          {interrogation && (
            <>
              <div className="interrogate-witness">
                <div className="interrogate-avatar">
                  <WitnessAvatar />
                </div>
                <div>
                  <div className="interrogate-name">{interrogation.witnessName}</div>
                  <div className="interrogate-role">{interrogation.witnessRole}</div>
                </div>
              </div>
              <div className="interrogate-question">{interrogation.question}</div>
              {interrogationResult ? (
                <div className="modal-result" style={{ color: interrogationResult.correct ? "#2ecc71" : "#e74c3c" }}>
                  {interrogationResult.correct ? "Correct! Free hint earned." : "Not quite — no hint this time."}
                </div>
              ) : (
                <div className="modal-choices">
                  {interrogation.options.map((opt, i) => (
                    <button key={i} className="choice-btn" onClick={() => answerInterrogation(i)}>
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {interrogationResult && (
            <button className="modal-close" onClick={closeInterrogation}>
              Continue Investigation →
            </button>
          )}
        </div>
      </div>

      {/* ══ QUIT CONFIRM MODAL ══ */}
      <div className="modal-overlay" style={{ display: quitConfirmOpen ? "flex" : "none" }}>
        <div className="modal-box">
          <div className="modal-title">CLOSE THE CASE FILE?</div>
          <div className="modal-subtitle">Your current score will be recorded, but the case stays unsolved.</div>
          <div style={{ display: "flex", gap: 10, marginTop: 16 }}>
            <button className="btn-secondary" style={{ flex: 1 }} onClick={cancelQuit}>
              Keep Investigating
            </button>
            <button className="modal-close" style={{ flex: 1, margin: 0 }} onClick={confirmQuit}>
              Quit
            </button>
          </div>
        </div>
      </div>

      {/* ══ HOW TO PLAY MODAL ══ */}
      <div className="modal-overlay" style={{ display: howToPlayOpen ? "flex" : "none" }}>
        <div className="modal-box how-to-play">
          <h3>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--gold)" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            HOW TO PLAY
          </h3>
          <div className="htp-grid">
            {[
              { title: "Track Madam Karmen", body: "Read the witness clue and pick the correct Nigerian state from 4 options." },
              { title: "Beat the Timer", body: "30 seconds per clue. Faster answers = more bonus points!" },
              { title: "Protect Your Leads", body: "3 leads total. Wrong answers cost you a lead. Lose all 3 and it's over." },
              { title: "Build Streaks", body: "3 correct in a row = +300 bonus pts! Keep the streak alive." },
              { title: "Use Hints Wisely", body: "3 hints per game. Earn more by winning interrogations!" },
              { title: "Interrogate Witnesses", body: "Every 3 states, interrogate a local. Answer correctly for a free hint!" },
            ].map((item) => (
              <div className="htp-card" key={item.title}>
                <h4>{item.title}</h4>
                <p>{item.body}</p>
              </div>
            ))}
          </div>
          <button className="btn-primary" style={{ width: "100%" }} onClick={() => setHowToPlayOpen(false)}>
            Let&apos;s Go!
          </button>
        </div>
      </div>

      <style jsx>{`
.karmen-game {
  --forest: #0d3d1e;
  --forest2: #1a5c2e;
  --savanna: #e8720c;
  --savanna2: #ff9f45;
  --gold: #f5c518;
  --gold2: #ffd700;
  --night: #060e1f;
  --night2: #0d1f3c;
  --red: #c0392b;
  --green-flash: #27ae60;
  --text-light: #f0e6cc;
  --text-gold: #f5c518;
  --panel-bg: rgba(6,14,31,0.95);
  --border-glow: #f5c51844;
  --font-display: 'Bebas Neue', cursive;
  --font-body: 'Poppins', sans-serif;
}
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
/* Adapted from the prototype's html/body rules — embedded inside the
   dashboard rather than being its own standalone page, so this wrapper
   carries the full-bleed background/sizing instead of the real
   <html>/<body>. Always exactly one viewport tall with no page-level
   scroll, per instruction — contain: layout also makes this element the
   containing block for its position:fixed descendants (the map modal
   overlay etc.), so nothing escapes past the dashboard shell. */
.karmen-game{
  font-family:var(--font-body);
  background:var(--night);
  color:var(--text-light);
  height:100vh;
  overflow:hidden;
  position:relative;
  contain:layout;
  background-image:
    radial-gradient(ellipse at 20% 50%,#1a3a0a22 0%,transparent 60%),
    radial-gradient(ellipse at 80% 20%,#e8720c11 0%,transparent 50%);
}
.karmen-game button{cursor:pointer;font-family:var(--font-body);border:none;outline:none}
.karmen-game button:focus{outline:2px solid var(--gold);outline-offset:2px}

/* ── SCREENS ── */
.screen{display:none;height:100%;flex-direction:column;overflow-y:auto}
.screen.active{display:flex}
/* Game screen locks to exactly one viewport — no page scrolling, ever */
#screen-game.screen.active{
  height:100%;min-height:0;overflow:hidden;
}

/* ── INTRO ── */
#screen-intro{
  align-items:center;justify-content:center;
  text-align:center;padding:2rem 1rem;
  position:relative;overflow:hidden;
}
#screen-intro::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,#0d3d1e 0%,#060e1f 50%,#1a0a00 100%);
  z-index:0;
}
.intro-content{position:relative;z-index:1;max-width:620px;width:100%}

.intro-badge{
  display:inline-flex;align-items:center;gap:.4rem;
  background:var(--savanna);color:#fff;
  font-size:.7rem;font-weight:700;letter-spacing:3px;
  text-transform:uppercase;padding:5px 18px;
  border-radius:30px;margin-bottom:1rem;
  animation:pulse-badge 2s ease-in-out infinite;
}
@keyframes pulse-badge{0%,100%{opacity:1}50%{opacity:.7}}

.karmen-svg-wrap{
  margin:1.2rem auto;
  filter:drop-shadow(0 0 40px #f5c51866);
  animation:float-karmen 3s ease-in-out infinite;
  width:140px;height:140px;display:flex;align-items:center;justify-content:center;
}
@keyframes float-karmen{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}

.intro-title{
  font-family:var(--font-display);
  font-size:clamp(2rem,8vw,4.5rem);
  line-height:1;color:var(--gold);
  text-shadow:0 0 40px #f5c51844,3px 3px 0 #7a4a00;
  margin-bottom:.3rem;letter-spacing:2px;
}
.intro-subtitle{font-size:clamp(1rem,4vw,1.4rem);color:var(--savanna2);font-weight:700;margin-bottom:.4rem}
.intro-tagline{font-size:.85rem;color:#aaa;margin-bottom:2rem;font-style:italic;line-height:1.6}

.stats-bar{
  display:flex;gap:1rem;justify-content:center;
  margin-bottom:1.5rem;flex-wrap:wrap;
}
.stat-pill{
  background:rgba(245,197,24,.1);border:1px solid var(--gold);
  border-radius:20px;padding:.3rem .9rem;
  font-size:.72rem;font-weight:700;color:var(--gold);
  display:flex;align-items:center;gap:.4rem;
}

.name-input-wrap{
  margin:1rem 0;display:flex;
  flex-direction:column;align-items:center;gap:.5rem;
}
.name-input-wrap label{
  font-size:.78rem;color:var(--gold);
  letter-spacing:2px;text-transform:uppercase;font-weight:700;
}
.name-input-wrap input{
  background:rgba(255,255,255,.07);
  border:2px solid var(--gold);border-radius:10px;
  color:#fff;font-family:var(--font-body);
  font-size:1.05rem;font-weight:700;
  padding:.6rem 1.2rem;text-align:center;
  width:260px;transition:all .3s;
}
.name-input-wrap input:focus{
  background:rgba(245,197,24,.1);
  box-shadow:0 0 0 3px #f5c51844;outline:none;
}
.intro-buttons{display:flex;flex-direction:column;align-items:center;gap:.7rem}

.btn-primary{
  background:linear-gradient(135deg,var(--savanna) 0%,#c0550a 100%);
  color:#fff;font-size:1.1rem;font-weight:800;
  padding:.85rem 2.5rem;border-radius:50px;
  letter-spacing:1px;box-shadow:0 6px 24px #e8720c55;
  transition:all .2s;text-transform:uppercase;
  display:inline-flex;align-items:center;gap:.5rem;
}
.btn-primary:hover{transform:translateY(-3px);box-shadow:0 12px 32px #e8720c77}
.btn-primary:active{transform:translateY(0)}
.btn-secondary{
  background:transparent;border:2px solid var(--gold);
  color:var(--gold);font-size:.85rem;font-weight:700;
  padding:.5rem 1.5rem;border-radius:30px;letter-spacing:1px;
  transition:all .2s;display:inline-flex;align-items:center;gap:.4rem;
}
.btn-secondary:hover{background:var(--gold);color:var(--night)}

.highscores-preview{
  margin-top:1.5rem;
  background:rgba(255,255,255,.04);
  border:1px solid #ffffff11;border-radius:12px;
  padding:.8rem 1.2rem;font-size:.8rem;
}
.highscores-preview h4{
  color:var(--gold);font-size:.7rem;
  letter-spacing:2px;text-transform:uppercase;margin-bottom:.5rem;
  display:flex;align-items:center;gap:.4rem;
}
.hs-entry{display:flex;justify-content:space-between;gap:1rem;color:#ccc;padding:2px 0}

/* ── GAME SCREEN ── */
#screen-game{
  flex-direction:column;padding:0;
  max-width:920px;margin:0 auto;width:100%;
}

/* TOP BAR */
.top-bar{
  display:flex;align-items:center;justify-content:space-between;
  background:var(--night2);
  border-bottom:2px solid var(--border-glow);
  padding:.6rem 1rem;gap:.5rem;flex-wrap:wrap;
  position:sticky;top:0;z-index:100;
}
.player-tag{
  display:flex;align-items:center;gap:.4rem;
  font-size:.8rem;font-weight:700;color:var(--gold);
}
.top-stat{display:flex;flex-direction:column;align-items:center;min-width:60px}
.top-stat-label{font-size:.55rem;text-transform:uppercase;letter-spacing:1px;color:#888}
.top-stat-value{font-family:var(--font-display);font-size:1.4rem;color:#fff;line-height:1}
.top-stat-value.gold{color:var(--gold)}
.top-stat-value.orange{color:var(--savanna2)}
.leads-display{display:flex;gap:4px}
.lead-dot{
  width:12px;height:12px;border-radius:50%;
  background:var(--gold);transition:all .3s;
  box-shadow:0 0 8px var(--gold);
}
.lead-dot.lost{background:#333;box-shadow:none}

/* TIMER BAR */
.timer-bar-wrap{width:100%;height:5px;background:#ffffff11;position:relative}
.timer-bar-fill{
  height:100%;
  background:linear-gradient(90deg,var(--green-flash),var(--gold),var(--savanna));
  transition:width .2s linear,background .5s;
  border-radius:0 3px 3px 0;
}
.timer-bar-fill.danger{background:var(--red);animation:bar-pulse .5s ease-in-out infinite}
@keyframes bar-pulse{0%,100%{opacity:1}50%{opacity:.5}}

/* MAP */
.map-section{
  padding:.8rem 1rem .4rem;
  display:flex;flex-direction:column;align-items:center;
}
.map-title{
  font-size:.62rem;color:#666;
  letter-spacing:2px;text-transform:uppercase;margin-bottom:.4rem;
}
.nigeria-map{
  width:100%;max-width:480px;
  background:rgba(255,255,255,.02);
  border:1px solid #ffffff0a;
  border-radius:12px;padding:8px;
  position:relative;
}
.nigeria-map svg{width:100%;height:auto;display:block;overflow:visible}
.ng-state{
  stroke:#060e1f;stroke-width:1.2;
  fill:#16321f;
  cursor:default;
  transition:fill .35s,stroke .2s,filter .2s;
}
.ng-state.zone-nw{fill:#1a2e08}
.ng-state.zone-ne{fill:#0d200a}
.ng-state.zone-nc{fill:#1a3d0d}
.ng-state.zone-sw{fill:#0d2e2e}
.ng-state.zone-se{fill:#0a221a}
.ng-state.zone-ss{fill:#0a1520}
.ng-state.visited{opacity:.4}
.ng-state.zone-hint{
  filter:brightness(1.7) saturate(1.4);
  stroke:var(--savanna2);stroke-width:1.6;
}
.ng-state.candidate{
  cursor:pointer;
  stroke:var(--gold);stroke-width:2.2;
  animation:ng-candidate-pulse 1.6s ease-in-out infinite;
}
.ng-state.candidate:hover,.ng-state.candidate:focus{filter:brightness(1.9)}
.ng-state.candidate:active{filter:brightness(2.3)}
.ng-state.correct-reveal{
  fill:var(--gold)!important;stroke:#fff;stroke-width:2;
  animation:ng-correct-flash .6s ease-out;
}
.ng-state.wrong-reveal{
  fill:var(--red)!important;opacity:.85;
}
@keyframes ng-candidate-pulse{
  0%,100%{filter:brightness(1.35)}
  50%{filter:brightness(2)}
}
@keyframes ng-correct-flash{
  0%{filter:brightness(3)}
  100%{filter:brightness(1)}
}
.state-progress{font-size:.7rem;color:#888;margin-top:.4rem;letter-spacing:1px}
.map-hint-note{font-size:.6rem;color:#777;margin-top:.35rem;text-align:center;letter-spacing:.5px}

/* MAP MODAL (the "pop") — replaces the old always-visible map panel */
.map-modal-box{max-width:460px;padding:1.4rem 1.2rem;text-align:center}
.map-modal-progress{
  font-size:.62rem;letter-spacing:2px;text-transform:uppercase;
  color:var(--savanna2);font-weight:700;margin-bottom:.3rem;
}
.map-modal-title{
  font-family:var(--font-display);font-size:1.7rem;letter-spacing:2px;
  color:var(--gold);margin-bottom:.2rem;
}
.map-modal-title.wrong{color:var(--red)}
.map-modal-sub{font-size:.8rem;color:#bbb;margin-bottom:.9rem;line-height:1.5}
.map-modal-cta{
  margin-top:1rem;width:100%;padding:.85rem;border-radius:10px;
  background:var(--gold);color:#060e1f;font-weight:800;font-size:.95rem;
  border:none;font-family:var(--font-body);letter-spacing:.5px;
  transition:transform .15s;
}
.map-modal-cta:active{transform:scale(.97)}
.map-modal-cta.secondary{background:transparent;border:2px solid var(--gold);color:var(--gold);margin-top:.5rem}
.btn-peek-map{
  background:rgba(255,255,255,.06);border:2px solid rgba(255,255,255,.15);
  color:#bbb;font-size:.72rem;font-weight:700;
  padding:.4rem .7rem;border-radius:8px;
  display:flex;align-items:center;gap:.3rem;white-space:nowrap;
}
.btn-peek-map:hover{border-color:var(--savanna2);color:var(--savanna2)}
.top-stat-value.case-count{font-size:1.1rem}

/* CASE FILE STRIP */
.case-file-strip{
  display:flex;gap:.4rem;padding:.4rem 1rem;
  overflow-x:auto;scrollbar-width:none;
  border-bottom:1px solid #ffffff08;
}
.artifact-chip{
  display:flex;align-items:center;gap:.3rem;
  background:rgba(245,197,24,.1);
  border:1px solid #f5c51833;
  border-radius:20px;padding:.2rem .6rem;
  font-size:.66rem;font-weight:700;
  color:var(--gold);white-space:nowrap;flex-shrink:0;
}
.artifact-chip.locked{background:rgba(255,255,255,.03);border-color:#ffffff11;color:#444}
.artifact-chip.recovered{background:rgba(39,174,96,.15);border-color:var(--green-flash);color:#4fe89c}

/* CLUE PANEL */
.clue-panel{
  flex:1;min-height:0;padding:1rem;
  display:flex;flex-direction:column;gap:.6rem;
  overflow-y:auto;
}
.witness-box{
  display:flex;align-items:flex-start;gap:.8rem;
  background:linear-gradient(135deg,rgba(13,61,30,.85),rgba(6,14,31,.92));
  border:1px solid var(--forest2);
  border-left:4px solid var(--savanna);
  border-radius:12px;padding:.9rem 1rem;
}
.witness-avatar-wrap{flex-shrink:0;animation:float-karmen 4s ease-in-out infinite}
.witness-text-wrap{flex:1}
.witness-intro{
  font-size:.62rem;text-transform:uppercase;
  letter-spacing:2px;color:var(--savanna2);
  font-weight:700;margin-bottom:.3rem;
}
.clue-text{
  font-size:clamp(.88rem,2.5vw,1.03rem);
  line-height:1.6;color:#e8dcc8;font-weight:500;
}
.clue-text strong{color:var(--gold)}
.clue-type-badge{
  display:inline-flex;align-items:center;gap:.3rem;
  background:rgba(232,114,12,.2);
  border:1px solid var(--savanna);
  color:var(--savanna2);
  font-size:.58rem;font-weight:700;
  letter-spacing:1.5px;text-transform:uppercase;
  padding:2px 8px;border-radius:20px;margin-bottom:.5rem;
}

/* STATE FACT CARD */
.fact-card{
  background:rgba(245,197,24,.06);
  border:1px solid var(--border-glow);
  border-radius:10px;padding:.7rem 1rem;
  font-size:.78rem;line-height:1.6;
  color:#ccc;display:none;
}
.fact-card.show{display:block}
.fact-card strong{color:var(--gold)}
.fact-grid{display:grid;grid-template-columns:1fr 1fr;gap:.3rem .8rem;margin-top:.4rem}
.fact-item{display:flex;flex-direction:column;gap:.1rem}
.fact-label{font-size:.58rem;text-transform:uppercase;letter-spacing:1px;color:#666;font-weight:700}
.fact-val{font-size:.78rem;color:#e8dcc8;font-weight:600}

/* CHOICES */
.choices-grid{display:grid;grid-template-columns:1fr 1fr;gap:.5rem}
@media(max-width:480px){.choices-grid{grid-template-columns:1fr}}
.choice-btn{
  background:rgba(255,255,255,.05);
  border:2px solid rgba(255,255,255,.1);
  border-radius:10px;color:#e8dcc8;
  font-size:.88rem;font-weight:600;
  padding:.75rem 1rem;text-align:left;
  transition:all .2s;
  display:flex;align-items:center;gap:.6rem;
  position:relative;overflow:hidden;
}
.choice-btn::before{
  content:'';position:absolute;top:0;left:0;width:0;height:100%;
  background:rgba(245,197,24,.06);transition:width .3s;
}
.choice-btn:hover::before{width:100%}
.choice-btn:hover{border-color:var(--gold);color:#fff;transform:translateX(3px)}
.choice-btn.correct{background:rgba(39,174,96,.2);border-color:var(--green-flash);color:#fff;animation:correct-flash .5s ease}
.choice-btn.wrong{background:rgba(192,57,43,.2);border-color:var(--red);color:#aaa;animation:wrong-shake .4s ease}
.choice-btn.disabled{pointer-events:none}
@keyframes correct-flash{0%{transform:scale(1)}30%{transform:scale(1.04)}100%{transform:scale(1)}}
@keyframes wrong-shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-8px)}40%,80%{transform:translateX(8px)}}
.choice-letter{
  background:rgba(255,255,255,.12);
  width:26px;height:26px;border-radius:50%;
  display:flex;align-items:center;justify-content:center;
  font-size:.75rem;font-weight:800;flex-shrink:0;
}

/* FEEDBACK OVERLAY */
.feedback-overlay{
  position:fixed;inset:0;
  display:flex;align-items:center;justify-content:center;
  z-index:200;pointer-events:none;
  opacity:0;transition:opacity .3s;
}
.feedback-overlay.show{opacity:1}
.feedback-banner{
  font-family:var(--font-display);
  font-size:clamp(2rem,8vw,4rem);
  letter-spacing:3px;padding:.5rem 2rem;
  border-radius:12px;animation:feedback-pop .5s ease;
}
.feedback-banner.correct{background:rgba(39,174,96,.9);color:#fff;box-shadow:0 0 60px #27ae6088}
.feedback-banner.wrong{background:rgba(192,57,43,.9);color:#fff;box-shadow:0 0 60px #c0392b88}
@keyframes feedback-pop{0%{transform:scale(.5);opacity:0}60%{transform:scale(1.08)}100%{transform:scale(1);opacity:1}}

/* ACTION ROW */
.action-row{
  display:flex;gap:.5rem;padding:0 1rem .8rem;flex-wrap:wrap;
}
.btn-hint{
  background:rgba(245,197,24,.1);border:2px solid var(--gold);
  color:var(--gold);font-size:.78rem;font-weight:700;
  padding:.45rem .9rem;border-radius:8px;
  transition:all .2s;display:flex;align-items:center;gap:.35rem;
}
.btn-hint:hover{background:rgba(245,197,24,.2)}
.btn-hint:disabled{opacity:.4;cursor:not-allowed}
.btn-interrogate{
  background:rgba(52,152,219,.15);border:2px solid #3498db;
  color:#74c2f0;font-size:.78rem;font-weight:700;
  padding:.45rem .9rem;border-radius:8px;
  transition:all .2s;display:none;align-items:center;gap:.35rem;
}
.btn-interrogate:hover{background:rgba(52,152,219,.3)}
.btn-skip{
  background:rgba(255,255,255,.05);border:2px solid rgba(255,255,255,.15);
  color:#888;font-size:.75rem;font-weight:700;
  padding:.45rem .9rem;border-radius:8px;
  transition:all .2s;display:flex;align-items:center;gap:.35rem;
  margin-left:auto;
}
.btn-skip:hover{border-color:#aaa;color:#ccc}

/* STREAK BANNER */
.streak-banner{
  background:linear-gradient(90deg,#7a4a00,var(--savanna),#7a4a00);
  color:#fff;font-family:var(--font-display);
  font-size:1.1rem;letter-spacing:2px;
  text-align:center;padding:.5rem;
  transform:translateY(-60px);transition:transform .3s;
  display:flex;align-items:center;justify-content:center;gap:.5rem;
}
.streak-banner.show{transform:translateY(0)}

/* HINT BOX */
.hint-box{
  background:rgba(245,197,24,.08);
  border:1px solid var(--gold);border-radius:10px;
  padding:.6rem .9rem;font-size:.8rem;color:#e8c864;
  display:none;
}
.hint-box.show{display:flex;align-items:flex-start;gap:.5rem;animation:hint-slide .3s ease}
@keyframes hint-slide{0%{opacity:0;transform:translateY(-8px)}100%{opacity:1;transform:translateY(0)}}

/* ── MODALS ── */
.modal-overlay{
  position:fixed;inset:0;
  background:rgba(0,0,0,.88);
  z-index:300;
  display:flex;align-items:center;justify-content:center;
  padding:1rem;opacity:0;pointer-events:none;transition:opacity .3s;
}
.modal-overlay.show{opacity:1;pointer-events:all}
.modal-box{
  background:linear-gradient(135deg,var(--night2),#0a1a0a);
  border:2px solid var(--gold);border-radius:20px;
  padding:2rem;max-width:520px;width:100%;
  box-shadow:0 0 60px #f5c51822;
  transform:scale(.95);transition:transform .3s;
  max-height:90vh;overflow-y:auto;
}
.modal-overlay.show .modal-box{transform:scale(1)}
.modal-title{
  font-family:var(--font-display);font-size:1.8rem;
  color:var(--gold);letter-spacing:2px;margin-bottom:.3rem;
  display:flex;align-items:center;gap:.5rem;
}
.modal-subtitle{font-size:.78rem;color:#888;margin-bottom:1.2rem}
.interrogate-witness{
  display:flex;align-items:center;gap:1rem;
  background:rgba(255,255,255,.04);border-radius:12px;
  padding:.8rem;margin-bottom:1rem;
}
.interrogate-avatar{flex-shrink:0}
.interrogate-name{font-weight:700;color:var(--savanna2);font-size:.9rem}
.interrogate-role{font-size:.73rem;color:#888}
.interrogate-question{font-size:1rem;font-weight:600;color:#e8dcc8;margin-bottom:1rem;line-height:1.5}
.modal-choices{display:flex;flex-direction:column;gap:.5rem;margin-bottom:1rem}
.modal-choice{
  background:rgba(255,255,255,.06);border:1.5px solid rgba(255,255,255,.12);
  border-radius:10px;color:#e8dcc8;font-size:.88rem;font-weight:600;
  padding:.65rem 1rem;text-align:left;transition:all .2s;
}
.modal-choice:hover{border-color:var(--gold);color:#fff;background:rgba(245,197,24,.1)}
.modal-choice.correct{background:rgba(39,174,96,.25);border-color:var(--green-flash)}
.modal-choice.wrong{background:rgba(192,57,43,.25);border-color:var(--red)}
.modal-result{text-align:center;font-weight:700;font-size:.9rem;margin-bottom:.8rem;min-height:1.5rem}
.modal-result.good{color:var(--green-flash)}
.modal-result.bad{color:var(--red)}
.modal-close{
  width:100%;background:var(--savanna);color:#fff;
  font-weight:700;padding:.7rem;border-radius:10px;
  font-size:.9rem;transition:all .2s;display:none;
}
.modal-close.show{display:block}
.modal-close:hover{background:var(--savanna2)}

/* HTP */
.how-to-play{max-width:540px}
.how-to-play h3{font-family:var(--font-display);font-size:2rem;color:var(--gold);margin-bottom:1rem;display:flex;align-items:center;gap:.5rem}
.htp-grid{display:grid;grid-template-columns:1fr 1fr;gap:.8rem;margin-bottom:1rem}
@media(max-width:420px){.htp-grid{grid-template-columns:1fr}}
.htp-card{background:rgba(255,255,255,.05);border-radius:10px;padding:.8rem;border:1px solid rgba(255,255,255,.08)}
.htp-icon{margin-bottom:.4rem;display:flex;align-items:center}
.htp-card h4{font-size:.8rem;color:var(--gold);margin-bottom:.3rem}
.htp-card p{font-size:.73rem;color:#aaa;line-height:1.5}

/* ── END SCREEN ── */
#screen-end{
  align-items:center;justify-content:center;
  text-align:center;padding:2rem 1rem;
  position:relative;overflow:hidden;
}
#screen-end::before{
  content:'';position:absolute;inset:0;
  background:linear-gradient(135deg,#0a1a0a,var(--night),#1a0a00);
}
.end-content{position:relative;z-index:1;max-width:520px;width:100%}
.end-mugshot{
  margin:0 auto 1rem;
  animation:mugshot-pop .6s cubic-bezier(.34,1.56,.64,1);
}
@keyframes mugshot-pop{0%{transform:scale(0) rotate(-10deg);opacity:0}100%{transform:scale(1) rotate(0);opacity:1}}
.end-title{
  font-family:var(--font-display);
  font-size:clamp(2rem,8vw,3.5rem);
  letter-spacing:3px;margin-bottom:.5rem;
}
.end-title.win{color:var(--gold);text-shadow:0 0 40px #f5c51888}
.end-title.lose{color:var(--red)}
.end-score{font-family:var(--font-display);font-size:2.5rem;color:#fff;margin:.5rem 0}
.end-detail{font-size:.85rem;color:#aaa;margin-bottom:1.5rem;line-height:1.8}
.achievements-row{display:flex;flex-wrap:wrap;gap:.5rem;justify-content:center;margin-bottom:1.5rem}
.achievement-chip{
  background:rgba(245,197,24,.15);border:1px solid var(--gold);
  border-radius:20px;padding:.3rem .8rem;
  font-size:.72rem;font-weight:700;color:var(--gold);
  display:flex;align-items:center;gap:.3rem;
  animation:correct-flash .3s ease;
}

/* CONFETTI */
.confetti-piece{
  position:fixed;width:10px;height:10px;
  animation:confetti-fall linear forwards;
  z-index:400;pointer-events:none;
}
@keyframes confetti-fall{
  0%{transform:translateY(-100px) rotate(0deg);opacity:1}
  100%{transform:translateY(110vh) rotate(720deg);opacity:0}
}

/* RAPID FIRE */
.rapid-fire-header{
  background:linear-gradient(135deg,#7a0000,#3d0000);
  border:2px solid var(--red);border-radius:12px;
  padding:.8rem 1.2rem;text-align:center;
  animation:bar-pulse .8s ease-in-out infinite;
}
.rapid-fire-header h3{font-family:var(--font-display);font-size:1.4rem;color:var(--gold);letter-spacing:2px;display:flex;align-items:center;justify-content:center;gap:.5rem}
.rapid-fire-header p{font-size:.75rem;color:#e8720c}
.rapid-counter{
  font-family:var(--font-display);font-size:3rem;
  color:var(--red);text-align:center;
  animation:bar-pulse .5s ease-in-out infinite;
}

/* ZONE LEGEND */
.zone-legend{
  display:flex;gap:.4rem;flex-wrap:wrap;justify-content:center;
  margin-top:.4rem;
}
.zone-dot{
  display:flex;align-items:center;gap:.25rem;
  font-size:.55rem;color:#666;letter-spacing:.5px;text-transform:uppercase;font-weight:700;
}
.zone-dot-circle{width:8px;height:8px;border-radius:2px;flex-shrink:0}

/* SCROLLBAR */
::-webkit-scrollbar{width:4px;height:4px}
::-webkit-scrollbar-track{background:transparent}
::-webkit-scrollbar-thumb{background:#ffffff22;border-radius:4px}

/* MOBILE */
@media(max-width:600px){
  .top-bar{padding:.4rem .6rem}
  .top-stat-value{font-size:1.1rem}
  .clue-panel{padding:.6rem}
}

      `}</style>
    </div>
  );
}
