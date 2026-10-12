"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import * as gamesApi from "@/lib/api/games";
import { extractErrorMessage } from "@/lib/api/client";

interface Cell {
  letter: string | null; // revealed letter, if solved
  wordIndexes: number[];
  posInWord: Record<number, number>;
}

export default function WordConnectPlay() {
  const [screen, setScreen] = useState<"subjects" | "game">("subjects");
  const [subjects, setSubjects] = useState<gamesApi.WordConnectSubject[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [level, setLevel] = useState<gamesApi.WordConnectLevel | null>(null);
  const [subjectMeta, setSubjectMeta] = useState<{ icon: string; name: string } | null>(null);

  const [guess, setGuess] = useState<string[]>([]);
  const [usedTiles, setUsedTiles] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(false);
  const [justSolved, setJustSolved] = useState<string | null>(null);

  const [overlay, setOverlay] = useState<{
    emoji: string;
    title: string;
    cash: string;
    msg: string;
    btn: string;
    onBtn: () => void;
  } | null>(null);

  const [particles, setParticles] = useState<{ id: number; left: number; top: number; size: number; color: string; dur: number; delay: number }[]>([]);

  useEffect(() => {
    gamesApi
      .getWordConnectSubjects()
      .then(setSubjects)
      .catch((e) => setError(extractErrorMessage(e)))
      .finally(() => setLoadingSubjects(false));
  }, []);

  const activeWord = level && level.activeWordIndex >= 0 ? level.words[level.activeWordIndex] : null;

  // Build the crossword grid purely from geometry the server sent —
  // letters only appear for words already solved, so the grid can never
  // leak an unsolved answer.
  const { grid, gridH, gridW } = useMemo(() => {
    if (!level) return { grid: [] as (Cell | null)[][], gridH: 0, gridW: 0 };
    let maxR = 0;
    let maxC = 0;
    level.words.forEach((w) => {
      const endR = w.dir === "v" ? w.row + w.length - 1 : w.row;
      const endC = w.dir === "h" ? w.col + w.length - 1 : w.col;
      maxR = Math.max(maxR, endR);
      maxC = Math.max(maxC, endC);
    });
    const h = maxR + 1;
    const wd = maxC + 1;
    const g: (Cell | null)[][] = Array.from({ length: h }, () => Array(wd).fill(null));
    level.words.forEach((w) => {
      for (let i = 0; i < w.length; i++) {
        const r = w.dir === "v" ? w.row + i : w.row;
        const c = w.dir === "h" ? w.col + i : w.col;
        if (!g[r][c]) g[r][c] = { letter: null, wordIndexes: [], posInWord: {} };
        const cell = g[r][c]!;
        cell.wordIndexes.push(w.index);
        cell.posInWord[w.index] = i;
        if (w.solved && w.letters) cell.letter = w.letters[i];
      }
    });
    return { grid: g, gridH: h, gridW: wd };
  }, [level]);

  const tileSize = useMemo(() => {
    if (!gridW) return 34;
    const max = Math.max(gridH, gridW);
    if (max <= 5) return 42;
    if (max <= 7) return 36;
    if (max <= 9) return 30;
    return 26;
  }, [gridH, gridW]);

  function spawnParticles() {
    const cols = ["#f0c040", "#7ecba1", "#7eb8e8", "#ef8c8c", "#c49fee", "#50d860", "#f7c59f", "#ff9040"];
    setParticles(
      Array.from({ length: 24 }, (_, i) => ({
        id: Date.now() + i,
        left: 8 + Math.random() * 84,
        top: 10 + Math.random() * 50,
        size: 7 + Math.random() * 11,
        color: cols[i % cols.length],
        dur: 0.9 + Math.random() * 0.7,
        delay: Math.random() * 0.4,
      })),
    );
    setTimeout(() => setParticles([]), 1900);
  }

  async function startGame(s: gamesApi.WordConnectSubject) {
    setError(null);
    try {
      const res = await gamesApi.startWordConnectSession(s.subjectKey);
      setSessionId(res.sessionId);
      setLevel(res.level);
      setSubjectMeta({ icon: s.icon, name: s.subjectName });
      setGuess([]);
      setUsedTiles(new Set());
      setBusy(false);
      setOverlay(null);
      setScreen("game");
    } catch (e) {
      setError(extractErrorMessage(e));
    }
  }

  function goHome() {
    setScreen("subjects");
    setSessionId(null);
    setLevel(null);
    setOverlay(null);
  }

  const submit = useCallback(
    async (finalGuess: string[]) => {
      if (!sessionId || !level || !activeWord) return;
      setBusy(true);
      try {
        const res = await gamesApi.submitWordConnectWord(
          sessionId,
          activeWord.index,
          finalGuess.join(""),
        );

        if (res.isCorrect) {
          setJustSolved(activeWord.clue);
          spawnParticles();
        } else {
          setShake(true);
          setTimeout(() => setShake(false), 450);
        }

        await new Promise((r) => setTimeout(r, res.isCorrect ? 900 : 550));

        setGuess([]);
        setUsedTiles(new Set());
        setJustSolved(null);

        if (res.sessionFinished) {
          const total = res.cash;
          setOverlay({
            emoji: total >= 3000 ? "🏆" : total >= 1500 ? "🥈" : "🎮",
            title: "GAME OVER!",
            cash: `Total: ₦${total.toLocaleString()}`,
            msg:
              total >= 3000
                ? "Outstanding performance! 🔥"
                : total >= 1500
                  ? "Great job! 👏"
                  : "Keep practising — you'll get there!",
            btn: "Play Again",
            onBtn: goHome,
          });
          spawnParticles();
          setBusy(false);
          return;
        }

        if (res.levelComplete) {
          const failed = !res.isCorrect;
          spawnParticles();
          const next = res.nextLevel;
          setOverlay({
            emoji: failed ? "💔" : "🏆",
            title: failed ? "LEVEL DONE" : "LEVEL CLEAR!",
            cash: res.earned ? `+₦${res.earned.toLocaleString()} earned!` : "No coins this round",
            msg: `Next level unlocked 🔓 Total: ₦${res.cash.toLocaleString()}`,
            btn: "Continue →",
            onBtn: () => {
              setOverlay(null);
              if (next) setLevel(next);
            },
          });
          setBusy(false);
          return;
        }

        if (res.currentLevel) setLevel(res.currentLevel);
        setBusy(false);
      } catch (e) {
        setError(extractErrorMessage(e));
        setBusy(false);
      }
    },
    [sessionId, level, activeWord],
  );

  function tapTile(letter: string, idx: number) {
    if (busy || !activeWord || usedTiles.has(idx) || guess.length >= activeWord.length) return;
    const next = [...guess, letter];
    setGuess(next);
    setUsedTiles(new Set([...usedTiles, idx]));
    if (next.length === activeWord.length) {
      setBusy(true);
      setTimeout(() => submit(next), 320);
    }
  }

  function clearGuess() {
    if (busy) return;
    setGuess([]);
    setUsedTiles(new Set());
  }

  return (
    <div className="wc-game">
      <div id="app">
        {/* ═══ SUBJECT SCREEN ═══ */}
        <div id="ss" style={{ display: screen === "subjects" ? "flex" : "none" }}>
          <div className="g-title">🔤 WORD CONNECT</div>
          <div className="g-sub">Choose your subject — fill the wooden board!</div>
          {error && <div className="g-sub" style={{ color: "#ef8c8c" }}>{error}</div>}
          <div className="s-grid">
            {loadingSubjects ? (
              <div className="g-sub">Loading subjects…</div>
            ) : (
              subjects.map((s) => (
                <button
                  key={s.subjectKey}
                  className="s-btn"
                  style={{ ["--c" as string]: s.color }}
                  onClick={() => startGame(s)}
                >
                  <span className="s-icon">{s.icon}</span>
                  <span className="s-name">{s.subjectName}</span>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ═══ GAME SCREEN ═══ */}
        <div
          id="gs"
          style={{
            display: screen === "game" ? "flex" : "none",
            flexDirection: "column",
            alignItems: "center",
            flex: 1,
          }}
        >
          {level && (
            <>
              <div className="h-bar">
                <button className="back-btn" onClick={goHome}>
                  ← Back
                </button>
                <div className="h-subject">
                  {subjectMeta?.icon} {level.subjectName}
                </div>
                <div className="h-coins" aria-live="polite">
                  <span className="h-naira">₦</span>
                  <div className="h-amount">{level.cash.toLocaleString()}</div>
                </div>
              </div>

              <div className="status-strip">
                <div className="lvl-txt">
                  Level {level.levelNumber} / {level.totalLevels}
                </div>
                <div className="lives-row">
                  {[0, 1, 2].map((i) => (
                    <span key={i} className={`lv${i >= level.lives ? " lost" : ""}`}>
                      ❤
                    </span>
                  ))}
                </div>
              </div>

              {/* CLUE CARD */}
              <div className="clue-card">
                <div className="clue-top">
                  <div className="clue-bulb">💡</div>
                  <div className="clue-heading">Clue</div>
                  <div className="clue-word-hint">{activeWord ? `${activeWord.length} letters` : ""}</div>
                </div>
                <div className="clue-body">{justSolved ?? activeWord?.clue ?? "Loading..."}</div>
                <div className="clue-letters">
                  <div className="clue-len-badge">{activeWord ? `${activeWord.length} letters` : "0 letters"}</div>
                  <div className="clue-blanks">
                    {activeWord &&
                      Array.from({ length: activeWord.length }, (_, i) => (
                        <div className="clue-dash" key={i} />
                      ))}
                  </div>
                </div>
              </div>

              {/* BOARD */}
              <div className="board-wrap">
                <div className="board">
                  <div
                    className="cw-grid"
                    style={{
                      gridTemplateColumns: `repeat(${gridW}, ${tileSize}px)`,
                      gridTemplateRows: `repeat(${gridH}, ${tileSize}px)`,
                    }}
                  >
                    {grid.map((row, r) =>
                      row.map((cell, c) => {
                        if (!cell) return <div key={`${r}-${c}`} />;
                        if (cell.letter) {
                          return (
                            <div key={`${r}-${c}`} className="tf correct" style={{ fontSize: tileSize * 0.5 }}>
                              {cell.letter}
                            </div>
                          );
                        }
                        const isActiveCell = activeWord ? cell.wordIndexes.includes(activeWord.index) : false;
                        const pos = activeWord ? cell.posInWord[activeWord.index] : undefined;
                        const typed = isActiveCell && pos !== undefined ? guess[pos] : undefined;
                        const cls = ["tb"];
                        if (isActiveCell) cls.push("active");
                        if (typed) cls.push("has-letter");
                        if (shake && isActiveCell) cls.push("shake-tile");
                        return (
                          <div key={`${r}-${c}`} className={cls.join(" ")} style={{ fontSize: tileSize * 0.5 }}>
                            {typed ?? ""}
                          </div>
                        );
                      }),
                    )}
                  </div>

                  <div className="ans-section">
                    <div className="ans-lbl">spell the word</div>
                    <div className="ans-row">
                      {activeWord &&
                        Array.from({ length: activeWord.length }, (_, i) => (
                          <div
                            key={i}
                            className={`as${guess[i] ? " hl" : ""}${shake ? " err" : ""}`}
                            onClick={clearGuess}
                          >
                            {guess[i] ?? ""}
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* BOTTOM TILES */}
              <div className="bottom-area">
                <div className="tiles-lbl">tap a circle to place a letter</div>
                <div className="l-tiles">
                  {level.tiles.map((letter, i) => (
                    <div
                      key={i}
                      className={`lt${usedTiles.has(i) ? " used" : ""}`}
                      role="button"
                      tabIndex={0}
                      aria-label={`Letter ${letter}`}
                      onClick={() => tapTile(letter, i)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") tapTile(letter, i);
                      }}
                    >
                      {letter}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* LEVEL CLEAR / GAME OVER */}
      <div className={`lco${overlay ? " show" : ""}`} role="dialog" aria-modal="true">
        {overlay && (
          <div className="lc-box">
            <div className="lc-emoji">{overlay.emoji}</div>
            <div className="lc-title">{overlay.title}</div>
            <div className="lc-cash">{overlay.cash}</div>
            <div className="lc-msg">{overlay.msg}</div>
            <button className="lc-btn" onClick={overlay.onBtn}>
              {overlay.btn}
            </button>
          </div>
        )}
      </div>

      {/* PARTICLES */}
      {particles.map((p) => (
        <div
          key={p.id}
          style={{
            position: "absolute",
            pointerEvents: "none",
            borderRadius: "50%",
            zIndex: 600,
            width: p.size,
            height: p.size,
            background: p.color,
            left: `${p.left}%`,
            top: `${p.top}%`,
            animation: `floatUp ${p.dur}s ease-out ${p.delay}s forwards`,
          }}
        />
      ))}

      <style jsx>{`
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0
    }

    .wc-game {
      --wood-light: #d49050;
      --wood-mid: #a86828;
      --wood-dark: #8a5418;
      --wood-border: #7a3e0e;
      --wood-inner: #e8a96044;
      --tile-gold-top: #eaca7a;
      --tile-gold-bot: #c8a038;
      --tile-gold-bdr: #a07818;
      --tile-gold-shd: #806010;
      --tile-blank-top: #b07030;
      --tile-blank-bot: #8a5018;
      --tile-blank-bdr: #6a3808;
      --tile-blank-shd: #4a2000;
      --green-top: #50cc70;
      --green-bot: #28a040;
      --green-bdr: #18803a;
      --green-shd: #105028;
      --red-top: #cc5050;
      --red-bot: #a02828;
      --bg-dark: #1a0e05;
      --bg-bottom: #3d1005;
      --gold: #f0c040;
      --gold2: #c89010;
      --text-warm: #4a2800;
      --text-muted: #a08060;
    }

    /* Adapted from the prototype's html/body/#app rules — embedded in the
       dashboard rather than standing alone, so this wrapper owns the
       full-bleed background and sizing. Locked to exactly one viewport
       with no page scroll; contain:layout also keeps the level-clear
       overlay and flying-letter animations inside the game area instead
       of escaping into the dashboard shell. */
    .wc-game {
      font-family: 'Nunito', sans-serif;
      background: var(--bg-dark);
      color: #fff;
      display: flex;
      flex-direction: column;
      align-items: center;
      height: 100vh;
      overflow: hidden;
      position: relative;
      contain: layout;
    }

    #app {
      width: 100%;
      max-width: 500px;
      height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      overflow: hidden;
    }

    /* ══════════ SUBJECT SCREEN ══════════ */
    #ss {
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      flex: 1;
      padding: 2rem 1.2rem;
      gap: 0;
      background: radial-gradient(ellipse at 50% 0%, #3a1e08 0%, #0d0600 70%)
    }

    .g-title {
      font-family: 'Fredoka One', cursive;
      font-size: 2.8rem;
      color: var(--gold);
      letter-spacing: 3px;
      text-shadow: 0 0 30px #f0c04066, 0 3px 0 #7a4000;
      text-align: center;
      margin-bottom: 4px
    }

    .g-sub {
      color: var(--text-muted);
      font-size: .9rem;
      margin-bottom: 2.2rem;
      text-align: center
    }

    .s-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 11px;
      width: 100%;
      max-width: 430px
    }

    .s-btn {
      padding: 1.15rem .3rem .9rem;
      border-radius: 18px;
      border: 2.5px solid #3a2010;
      background: linear-gradient(160deg, #3d2210, #251208);
      cursor: pointer;
      font-family: 'Nunito', sans-serif;
      font-size: .82rem;
      font-weight: 800;
      color: #b08050;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 7px;
      transition: all .22s;
      box-shadow: 0 5px 16px #00000077, inset 0 1px 0 #ffffff11
    }

    .s-btn:hover,
    .s-btn:focus {
      transform: translateY(-5px);
      border-color: var(--c, var(--gold));
      color: var(--c, var(--gold));
      outline: none;
      box-shadow: 0 12px 28px #00000088, 0 0 24px color-mix(in srgb, var(--c, var(--gold)) 40%, transparent)
    }

    .s-btn .s-icon {
      font-size: 2rem;
      line-height: 1
    }

    .s-btn .s-name {
      line-height: 1.2;
      text-align: center
    }

    /* ══════════ GAME SCREEN ══════════ */
    #gs {
      display: none;
      flex-direction: column;
      align-items: center;
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      background: radial-gradient(ellipse at 50% 0%, #2a1505 0%, #0d0600 80%)
    }

    /* header */
    .h-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      padding: .55rem .85rem;
      background: linear-gradient(180deg, #6a3818 0%, #3d2008 100%);
      border-bottom: 2.5px solid #8a5020;
      flex-shrink: 0
    }

    .back-btn {
      background: #1e0f04;
      border: 1.5px solid #7a4820;
      color: #c09060;
      padding: 5px 13px;
      border-radius: 20px;
      cursor: pointer;
      font-size: .79rem;
      font-family: 'Nunito', sans-serif;
      font-weight: 700;
      transition: all .15s
    }

    .back-btn:hover {
      border-color: var(--gold);
      color: var(--gold)
    }

    .h-subject {
      font-family: 'Fredoka One', cursive;
      font-size: 1rem;
      color: var(--gold);
      letter-spacing: 1px
    }

    .h-coins {
      display: flex;
      align-items: center;
      gap: 5px;
      background: #1e0f04;
      border: 1.5px solid var(--gold);
      border-radius: 20px;
      padding: 4px 12px
    }

    .h-naira {
      font-size: .75rem;
      color: var(--gold);
      font-weight: 900
    }

    .h-amount {
      font-family: 'Fredoka One', cursive;
      font-size: 1.1rem;
      color: var(--gold);
      min-width: 58px;
      text-align: right;
      transition: color .2s
    }

    /* status strip */
    .status-strip {
      display: flex;
      align-items: center;
      justify-content: space-between;
      width: 100%;
      max-width: 460px;
      padding: .35rem .7rem
    }

    .lvl-txt {
      font-size: .78rem;
      color: var(--text-muted);
      font-weight: 700
    }

    .lives-row {
      display: flex;
      gap: 4px
    }

    .lv {
      font-size: .95rem;
      transition: all .35s
    }

    .lv.lost {
      opacity: .18;
      transform: scale(.65)
    }

    /* ══════════ CLUE CARD (prominent!) ══════════ */
    .clue-card {
      width: calc(100% - 1.2rem);
      max-width: 460px;
      margin: .4rem .6rem .3rem;
      background: linear-gradient(135deg, #3a1e04, #251208);
      border: 2.5px solid var(--gold);
      border-radius: 16px;
      padding: .7rem 1rem .75rem;
      position: relative;
      box-shadow: 0 0 0 1px #7a4010, 0 6px 24px #00000077, 0 0 30px #f0c04022;
      overflow: hidden;
      flex-shrink: 0;
    }

    .clue-card::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, #f0c04012 0%, transparent 60%);
      pointer-events: none;
      border-radius: 14px;
    }

    .clue-top {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: .45rem
    }

    .clue-bulb {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--gold), var(--gold2));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: .9rem;
      box-shadow: 0 0 12px #f0c04077;
      flex-shrink: 0
    }

    .clue-heading {
      font-family: 'Fredoka One', cursive;
      font-size: 1rem;
      color: var(--gold);
      letter-spacing: .5px;
      text-transform: uppercase
    }

    .clue-word-hint {
      font-size: .68rem;
      color: #c09060;
      font-weight: 700;
      margin-left: auto;
      background: #3a1e04;
      border: 1px solid #7a4010;
      border-radius: 20px;
      padding: 2px 9px;
      letter-spacing: .5px
    }

    .clue-body {
      font-size: 1rem;
      font-weight: 800;
      color: #f5e0b0;
      line-height: 1.45;
      letter-spacing: .2px
    }

    .clue-letters {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: .45rem
    }

    .clue-len-badge {
      font-size: .7rem;
      font-weight: 800;
      color: #c09060;
      background: #2a1008;
      border: 1px solid #6a3010;
      border-radius: 10px;
      padding: 2px 8px
    }

    .clue-blanks {
      display: flex;
      gap: 3px
    }

    .clue-dash {
      width: 10px;
      height: 3px;
      border-radius: 2px;
      background: #c09060;
      opacity: .6
    }

    /* ══════════ WOODEN BOARD ══════════ */
    .board-wrap {
      width: calc(100% - 1rem);
      max-width: 460px;
      margin: .2rem .5rem
    }

    .board {
      background: linear-gradient(155deg, var(--wood-light) 0%, var(--wood-mid) 50%, var(--wood-dark) 100%);
      border-radius: 18px;
      padding: 14px 10px 12px;
      border: 3.5px solid var(--wood-border);
      box-shadow: 0 8px 30px #00000088, inset 0 2px 5px #ffffff22, inset 0 -3px 7px #00000033;
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
    }

    .board::before {
      content: '';
      position: absolute;
      inset: 5px;
      border-radius: 13px;
      border: 1.5px solid var(--wood-inner);
      pointer-events: none
    }

    .cw-grid {
      display: flex;
      flex-direction: column;
      gap: var(--tile-gap, 4px);
      align-items: center
    }

    .cw-row {
      display: flex;
      gap: var(--tile-gap, 4px);
      justify-content: center
    }

    /* tile base */
    .te {
      width: var(--tile-size, 46px);
      height: var(--tile-size, 46px);
      flex-shrink: 0
    }

    .tf {
      /* pre-filled, solved */
      width: var(--tile-size, 46px);
      height: var(--tile-size, 46px);
      border-radius: 9px;
      flex-shrink: 0;
      background: linear-gradient(155deg, var(--tile-gold-top), var(--tile-gold-bot));
      border: 2px solid var(--tile-gold-bdr);
      border-bottom: 3.5px solid var(--tile-gold-shd);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Fredoka One', cursive;
      font-size: var(--tile-fs, 1.4rem);
      color: var(--text-warm);
      box-shadow: 0 3px 8px #00000044;
    }

    .tb {
      /* blank to fill */
      width: var(--tile-size, 46px);
      height: var(--tile-size, 46px);
      border-radius: 9px;
      flex-shrink: 0;
      background: linear-gradient(155deg, var(--tile-blank-top), var(--tile-blank-bot));
      border: 2px solid var(--tile-blank-bdr);
      border-bottom: 3.5px solid var(--tile-blank-shd);
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Fredoka One', cursive;
      font-size: var(--tile-fs, 1.4rem);
      color: transparent;
      box-shadow: inset 0 3px 8px #00000055;
      transition: all .18s;
      flex-shrink: 0;
      cursor: default;
      position: relative;
    }

    /* Dimple effect inside blank */
    .tb::after {
      content: '';
      position: absolute;
      inset: 6px;
      border-radius: 5px;
      border: 1px solid #00000022
    }

    .tb.active {
      border-color: var(--gold) !important;
      box-shadow: inset 0 3px 8px #00000055;
      animation: bpulse 1.1s ease-in-out infinite
    }

    .tb.has-letter {
      background: linear-gradient(155deg, #daba60, #b88a20);
      border-color: #c09030;
      border-bottom-color: #8a6010;
      color: var(--text-warm);
      animation: popIn .28s cubic-bezier(.34, 1.56, .64, 1);
    }

    .tb.correct {
      background: linear-gradient(155deg, var(--green-top), var(--green-bot));
      border-color: var(--green-bdr);
      border-bottom-color: var(--green-shd);
      color: #fff;
      text-shadow: 0 1px 3px #00000044;
      animation: cGlow .5s ease;
    }

    .tb.shake-tile {
      animation: shk .38s ease !important
    }

    /* answer preview */
    .ans-section {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      width: 100%
    }

    .ans-lbl {
      font-size: .6rem;
      color: #7a4828;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700
    }

    .ans-row {
      display: flex;
      gap: 4px;
      justify-content: center;
      flex-wrap: wrap
    }

    .as {
      min-width: 34px;
      height: 34px;
      border-radius: 7px;
      padding: 0 3px;
      background: linear-gradient(145deg, #1e4010, #143008);
      border: 2px solid #3a8020;
      border-bottom: 3px solid #185808;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Fredoka One', cursive;
      font-size: 1rem;
      color: #fff;
      transition: all .18s;
      box-shadow: 0 2px 5px #00000055;
    }

    .as.hl {
      background: linear-gradient(145deg, #4a9828, #327010);
      border-color: #5ab830;
      animation: popIn .22s cubic-bezier(.34, 1.56, .64, 1)
    }

    .as.win {
      background: linear-gradient(145deg, #40c860, #18a038);
      border-color: #20d050;
      animation: cGlow .6s ease
    }

    .as.err {
      background: linear-gradient(145deg, var(--red-top), var(--red-bot));
      border-color: #e04040;
      animation: shk .38s ease
    }

    /* ══════════ BOTTOM LETTER TILES ══════════ */
    .bottom-area {
      width: 100%;
      background: linear-gradient(0deg, #5c1e08, #3d1005);
      border-top: 3px solid #7a3010;
      padding: .65rem .5rem 1rem;
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: .55rem;
    }

    .tiles-lbl {
      font-size: .62rem;
      color: #8a5030;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      font-weight: 700
    }

    .l-tiles {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      justify-content: center;
      max-width: 440px
    }

    .lt {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(155deg, var(--tile-gold-top), #c8a030);
      border: 2.5px solid var(--tile-gold-bdr);
      border-bottom: 4px solid #705000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: 'Fredoka One', cursive;
      font-size: 1.35rem;
      color: var(--text-warm);
      cursor: pointer;
      transition: all .16s;
      box-shadow: 0 5px 12px #00000066;
      user-select: none;
      position: relative;
    }

    .lt:hover:not(.used) {
      transform: translateY(-5px) scale(1.1);
      box-shadow: 0 10px 22px #00000077;
      border-color: var(--gold);
      background: linear-gradient(155deg, #fff0a0, #e0b840)
    }

    .lt:focus:not(.used) {
      outline: 3px solid var(--gold);
      outline-offset: 3px
    }

    .lt.used {
      opacity: .22;
      pointer-events: none;
      transform: none !important;
      box-shadow: none
    }

    /* ══════════ LEVEL CLEAR ══════════ */
    .lco {
      position: fixed;
      inset: 0;
      background: #00000099;
      z-index: 500;
      display: none;
      align-items: center;
      justify-content: center;
      padding: 1rem
    }

    .lco.show {
      display: flex
    }

    .lc-box {
      background: linear-gradient(155deg, #4a2808, #2a1005);
      border: 3px solid var(--gold);
      border-radius: 24px;
      padding: 2.2rem 2rem;
      text-align: center;
      animation: lcPop .45s cubic-bezier(.34, 1.56, .64, 1);
      box-shadow: 0 12px 50px #00000099, 0 0 40px #f0c04033;
      max-width: 320px;
      width: 100%;
    }

    .lc-emoji {
      font-size: 3.2rem;
      margin-bottom: .3rem
    }

    .lc-title {
      font-family: 'Fredoka One', cursive;
      font-size: 1.9rem;
      color: var(--gold);
      text-shadow: 0 0 20px #f0c04066;
      margin-bottom: .3rem
    }

    .lc-cash {
      font-family: 'Fredoka One', cursive;
      font-size: 1.4rem;
      color: #50e870;
      margin-bottom: .3rem
    }

    .lc-msg {
      color: var(--text-muted);
      font-size: .83rem;
      line-height: 1.5;
      margin-bottom: .9rem
    }

    .lc-btn {
      background: linear-gradient(145deg, var(--gold), var(--gold2));
      color: var(--text-warm);
      border: none;
      padding: 11px 32px;
      border-radius: 22px;
      font-family: 'Nunito', sans-serif;
      font-weight: 900;
      font-size: .95rem;
      cursor: pointer;
      transition: transform .15s;
      box-shadow: 0 4px 16px #00000055;
    }

    .lc-btn:hover {
      transform: scale(1.07)
    }

    .lc-btn:focus {
      outline: 3px solid #fff;
      outline-offset: 2px
    }

    /* ══════════ KEYFRAMES ══════════ */
    @keyframes bpulse {

      0%,
      100% {
        box-shadow: inset 0 3px 8px #00000055
      }

      50% {
        box-shadow: inset 0 3px 8px #00000055, 0 0 0 5px #f0c04066, 0 0 20px #f0c04044
      }
    }

    @keyframes popIn {
      0% {
        transform: scale(0) rotateY(90deg);
        opacity: 0
      }

      70% {
        transform: scale(1.18) rotateY(-5deg)
      }

      100% {
        transform: scale(1) rotateY(0)
      }
    }

    @keyframes cGlow {

      0%,
      100% {
        box-shadow: 0 3px 8px #00000044
      }

      50% {
        box-shadow: 0 0 0 7px #40c86066, 0 0 22px #18a04066
      }
    }

    @keyframes shk {

      0%,
      100% {
        transform: translateX(0)
      }

      20%,
      60% {
        transform: translateX(-7px)
      }

      40%,
      80% {
        transform: translateX(7px)
      }
    }

    @keyframes cashPop {

      0%,
      100% {
        transform: scale(1)
      }

      40% {
        transform: scale(1.38)
      }

      70% {
        transform: scale(.93)
      }
    }

    @keyframes floatUp {
      0% {
        opacity: 1;
        transform: translateY(0) scale(1)
      }

      100% {
        opacity: 0;
        transform: translateY(-110px) scale(.2)
      }
    }

    @keyframes lcPop {
      0% {
        transform: scale(0) rotate(-8deg);
        opacity: 0
      }

      65% {
        transform: scale(1.08) rotate(2deg)
      }

      100% {
        transform: scale(1) rotate(0);
        opacity: 1
      }
    }

    @keyframes clueShine {
      0% {
        transform: translateX(-100%) skewX(-15deg)
      }

      100% {
        transform: translateX(400%) skewX(-15deg)
      }
    }

    .clue-card::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 40%;
      height: 100%;
      background: linear-gradient(90deg, transparent, #ffffff0a, transparent);
      animation: clueShine 3s ease-in-out infinite;
      pointer-events: none;
    }

      `}</style>
    </div>
  );
}
