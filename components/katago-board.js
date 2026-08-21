import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { N, coordToXY, xyToCoord, buildState, isLegal } from "../lib/go-rules";
import styles from "./katago-board.module.css";

/**
 * 19x19 围棋对弈棋盘，与 katago-server (https://kata.lawrenceli.me) 实时对弈。
 * 棋局状态完全在浏览器端维护，每次分析仅提交完整落子序列（无状态分析接口）。
 */

const API = "https://kata.lawrenceli.me/api/v1/analysis";
const MAX_VISITS = 50;
const REQUEST_TIMEOUT = 50000;

// 棋盘 SVG 尺寸（viewBox 单位）
const M = 34;
const S = 620;
const CELL = (S - M * 2) / (N - 1);
const STAR = [3, 9, 15];

const pct = v => (v == null ? "—" : `${Math.round(v * 1000) / 10}%`);

/** 数值变化时以 ease-out 缓动插值（用于胜率计数动画） */
function useAnimatedValue(value, duration = 700) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    prevRef.current = value;
    if (from === to) {
      setDisplay(to);
      return;
    }
    let raf;
    const start = performance.now();
    const tick = now => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3); // cubic ease-out
      setDisplay(from + (to - from) * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return display;
}

// ---------- 组件 ----------

export default function KatagoBoard() {
  const [moves, setMoves] = useState([]);
  const [phase, setPhase] = useState("user"); // user | thinking | error | over
  const [userColor, setUserColor] = useState("B");
  const [analysis, setAnalysis] = useState(null); // { aiWinrate, scoreLead, top[] }
  const [result, setResult] = useState(null); // { winner, delta, via }
  const [hint, setHint] = useState(null);
  const [hover, setHover] = useState(null);
  const [error, setError] = useState(null);
  const [zen, setZen] = useState(false);

  const movesRef = useRef(moves);
  const userColorRef = useRef(userColor);
  const abortRef = useRef(null);
  const svgRef = useRef(null);
  const hintTimerRef = useRef(null);

  // 禅模式：Esc 退出
  useEffect(() => {
    if (!zen) return;
    const onKey = e => {
      if (e.key === "Escape") setZen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zen]);

  const commitMoves = useCallback(next => {
    movesRef.current = next;
    setMoves(next);
  }, []);

  const st = useMemo(() => buildState(moves), [moves]);
  const { board, posKeys, captured, lastMove } = st;
  const aiColor = userColor === "B" ? "W" : "B";
  const turn = moves.length % 2 === 0 ? "B" : "W";
  const isUserTurn = phase === "user" && turn === userColor;
  const gameOver = phase === "over";

  // AI 胜率（analysis.aiWinrate 为 AI 视角），数字与进度条同步动画
  const aiWinrate = analysis?.aiWinrate ?? null;
  const animatedWinrate = useAnimatedValue(aiWinrate ?? 0);
  const shownWinrate = aiWinrate == null ? null : animatedWinrate;

  const analyze = useCallback(async (movesList, signal) => {
    const body = {
      moves: movesList.map(m => (m.pass ? [m.color, "pass"] : [m.color, xyToCoord(m.x, m.y)])),
      komi: 7.5,
      rules: "chinese",
      boardXSize: 19,
      boardYSize: 19,
      maxVisits: MAX_VISITS,
      includeOwnership: false,
      includePolicy: false,
    };
    const res = await fetch(API, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, []);

  const showHint = useCallback(text => {
    setHint(text);
    clearTimeout(hintTimerRef.current);
    hintTimerRef.current = setTimeout(() => setHint(null), 1400);
  }, []);

  /** 对局结束：双弃权时用最后一次分析估算胜负 */
  const finishGame = useCallback(
    async finalMoves => {
      setPhase("over");
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const timeout = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
      try {
        const data = await analyze(finalMoves, ctrl.signal);
        const root = data.rootInfo || {};
        const lead = root.scoreLead;
        if (lead == null) {
          setResult({ winner: null, delta: null, via: "score-failed" });
        } else {
          const blackLead = root.currentPlayer === "B" ? lead : -lead;
          setResult({
            winner: blackLead > 0 ? "B" : "W",
            delta: Math.abs(blackLead),
            via: "score",
          });
        }
      } catch {
        setResult({ winner: null, delta: null, via: "score-failed" });
      } finally {
        clearTimeout(timeout);
      }
    },
    [analyze],
  );

  /** AI 行棋：提交完整序列 → 取最佳应手 → 落子或弃权 */
  const runAI = useCallback(async () => {
    const ms = movesRef.current;
    const uc = userColorRef.current;
    const turn = ms.length % 2 === 0 ? "B" : "W";
    if (turn !== (uc === "B" ? "W" : "B")) return; // 非 AI 回合

    setPhase("thinking");
    setError(null);
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    const timeout = setTimeout(() => ctrl.abort(), REQUEST_TIMEOUT);
    try {
      const data = await analyze(ms, ctrl.signal);
      const infos = (data.moveInfos || []).filter(
        info => info && typeof info.moveCoord === "string",
      );
      const ai = uc === "B" ? "W" : "B";
      let chosen = null;
      for (const info of infos) {
        const xy = coordToXY(info.moveCoord);
        if (!xy) continue;
        const s = buildState(ms);
        if (isLegal(s.board, xy.y * N + xy.x, ai === "B" ? 1 : 2, s.posKeys)) {
          chosen = { info, xy };
          break;
        }
      }
      const root = data.rootInfo || {};
      setAnalysis({ aiWinrate: root.winrate ?? null });

      const next = chosen
        ? [...ms, { color: ai, x: chosen.xy.x, y: chosen.xy.y }]
        : [...ms, { color: ai, pass: true }];
      commitMoves(next);
      const lastTwo = next.slice(-2);
      if (lastTwo.length === 2 && lastTwo.every(m => m.pass)) {
        finishGame(next);
      } else {
        setPhase("user");
      }
    } catch (e) {
      if (e.name === "AbortError") return; // 被悔棋/新局取消
      setError("AI 分析失败（服务繁忙），可重试或让 AI 弃权");
      setPhase("error");
    } finally {
      clearTimeout(timeout);
    }
  }, [analyze, finishGame, commitMoves]);

  /** 用户落子 */
  const play = useCallback(
    (x, y) => {
      if (!isUserTurn) return;
      const idx = y * N + x;
      if (board[idx] !== 0) return;
      if (!isLegal(board, idx, userColor === "B" ? 1 : 2, posKeys)) {
        showHint("此处不能落子");
        return;
      }
      const next = [...movesRef.current, { color: userColor, x, y }];
      commitMoves(next);
      const lastTwo = next.slice(-2);
      if (lastTwo.length === 2 && lastTwo.every(m => m.pass)) {
        finishGame(next);
        return;
      }
      setPhase("thinking");
      runAI();
    },
    [board, posKeys, userColor, isUserTurn, runAI, finishGame, showHint, commitMoves],
  );

  /** 悔棋：撤销直到轮到自己（至少撤一手） */
  const undo = useCallback(() => {
    if (gameOver) return;
    const ms = [...movesRef.current];
    const target = userColor === "B" ? 0 : 1;
    do {
      ms.pop();
    } while (ms.length > 0 && ms.length % 2 !== target);
    abortRef.current?.abort();
    abortRef.current = null;
    commitMoves(ms);
    setPhase("user");
    setError(null);
    setAnalysis(null);
    setResult(null);
  }, [gameOver, userColor, commitMoves]);

  /** 用户弃权 */
  const pass = useCallback(() => {
    if (!isUserTurn) return;
    const next = [...movesRef.current, { color: userColor, pass: true }];
    commitMoves(next);
    const lastTwo = next.slice(-2);
    if (lastTwo.length === 2 && lastTwo.every(m => m.pass)) {
      finishGame(next);
      return;
    }
    setPhase("thinking");
    runAI();
  }, [isUserTurn, userColor, runAI, finishGame, commitMoves]);

  /** 新局 / 换执 */
  const newGame = useCallback(
    color => {
      abortRef.current?.abort();
      abortRef.current = null;
      userColorRef.current = color;
      setUserColor(color);
      commitMoves([]);
      setPhase("user");
      setError(null);
      setAnalysis(null);
      setResult(null);
      setHint(null);
      if (color === "W") runAI(); // 执白：AI 执黑先手
    },
    [runAI, commitMoves],
  );

  const resign = useCallback(() => {
    if (gameOver) return;
    abortRef.current?.abort();
    abortRef.current = null;
    setPhase("over");
    setResult({ winner: aiColor, via: "resign" });
  }, [gameOver, aiColor]);

  // ---------- 渲染 ----------

  const toSvg = (x, y) => ({ cx: M + x * CELL, cy: M + y * CELL });

  const onPointer = e => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * S;
    const py = ((e.clientY - rect.top) / rect.height) * S;
    const x = Math.round((px - M) / CELL);
    const y = Math.round((py - M) / CELL);
    if (x < 0 || x >= N || y < 0 || y >= N) return null;
    if (Math.abs(px - (M + x * CELL)) > CELL * 0.62) return null;
    if (Math.abs(py - (M + y * CELL)) > CELL * 0.62) return null;
    return { x, y };
  };

  const statusText = gameOver
    ? result?.via === "resign"
      ? "你认输了"
      : "对局结束"
    : phase === "error"
      ? error
      : `轮到${turn === "B" ? "黑" : "白"}棋${turn === userColor ? "（你）" : ""}`;

  const resultText = result
    ? result.via === "resign"
      ? `${result.winner === "B" ? "黑" : "白"}方获胜（认输）`
      : result.via === "score"
        ? `${result.winner === "B" ? "黑" : "白"}方胜 ${result.delta.toFixed(1)} 目`
        : "双方弃权，无法获取目差"
    : null;

  return (
    <div
      className={`not-prose ${
        zen
          ? "fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-zinc-900"
          : "my-8"
      }`}
    >
      {/* 状态栏（固定宽度槽位，避免切换时布局抖动导致棋盘位移） */}
      <div
        className={
          zen
            ? "hidden"
            : "mb-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-1 text-sm text-zinc-600 dark:text-zinc-400"
        }
      >
        <div className="flex w-16 shrink-0 items-center justify-center">
          {phase === "thinking" && (
            <span className="flex items-center gap-1" aria-label="AI 思考中">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 dark:bg-zinc-400" />
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 dark:bg-zinc-400"
                style={{ animationDelay: "180ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 dark:bg-zinc-400"
                style={{ animationDelay: "360ms" }}
              />
            </span>
          )}
        </div>
        <span className={`w-36 shrink-0 text-center ${hint ? "text-red-500" : ""}`}>
          {hint || statusText}
        </span>
        <div className="w-44 shrink-0 text-center text-xs tabular-nums">
          {captured.B + captured.W > 0 && `提子 黑 ${captured.B} · 白 ${captured.W} ｜ `}
          手数 {moves.length}
        </div>
      </div>

      {/* 棋盘 */}
      <div
        className={
          zen ? "w-full max-w-[min(92vw,92vh)] px-4 sm:px-0" : "relative mx-auto max-w-[720px]"
        }
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${S} ${S}`}
          className={`${styles.goBoard} h-auto w-full select-none rounded-lg shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800`}
          style={{ backgroundColor: "var(--go-board-bg)" }}
          onClick={e => {
            const p = onPointer(e);
            if (p) play(p.x, p.y);
          }}
          onMouseMove={e => {
            const p = onPointer(e);
            setHover(isUserTurn && p && board[p.y * N + p.x] === 0 ? p : null);
          }}
          onMouseLeave={() => setHover(null)}
        >
          {/* 网格线 */}
          {Array.from({ length: N }, (_, k) => (
            <g key={k}>
              <line
                x1={M + k * CELL}
                y1={M}
                x2={M + k * CELL}
                y2={M + (N - 1) * CELL}
                style={{ stroke: "var(--go-line)" }}
                strokeWidth="1"
              />
              <line
                x1={M}
                y1={M + k * CELL}
                x2={M + (N - 1) * CELL}
                y2={M + k * CELL}
                style={{ stroke: "var(--go-line)" }}
                strokeWidth="1"
              />
            </g>
          ))}
          {/* 星位 */}
          {STAR.flatMap(a => STAR.map(b => ({ a, b }))).map(({ a, b }, i) => (
            <circle
              key={i}
              cx={M + a * CELL}
              cy={M + b * CELL}
              r="3.2"
              style={{ fill: "var(--go-line)" }}
            />
          ))}
          {/* 棋子 */}
          {board.map((v, i) => {
            if (!v) return null;
            const x = i % N;
            const y = (i / N) | 0;
            const { cx, cy } = toSvg(x, y);
            return (
              <g key={i}>
                <circle
                  cx={cx}
                  cy={cy}
                  r={CELL * 0.46}
                  style={{
                    fill: v === 1 ? "var(--go-black-fill)" : "var(--go-white-fill)",
                    stroke: v === 1 ? "var(--go-black-edge)" : "var(--go-white-edge)",
                  }}
                  strokeWidth="1"
                />
                {lastMove && lastMove.x === x && lastMove.y === y && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={CELL * 0.34}
                    fill="none"
                    strokeWidth={CELL * 0.09}
                    style={{
                      stroke: v === 1 ? "var(--go-mark-on-black)" : "var(--go-mark-on-white)",
                    }}
                  />
                )}
              </g>
            );
          })}
          {/* 悬停预览（使用真实棋子颜色，仅以透明度区分预览） */}
          {hover && (
            <circle
              cx={toSvg(hover.x, hover.y).cx}
              cy={toSvg(hover.x, hover.y).cy}
              r={CELL * 0.46}
              strokeWidth="1"
              style={{
                fill: userColor === "B" ? "var(--go-black-fill)" : "var(--go-white-fill)",
                stroke: userColor === "B" ? "var(--go-black-edge)" : "var(--go-white-edge)",
                opacity: "var(--go-ghost-opacity)",
              }}
            />
          )}
        </svg>
      </div>

      {/* 分析信息 */}
      {!zen && (analysis || (gameOver && resultText) || phase === "error") && (
        <div className="mx-auto mt-4 max-w-[720px] text-sm text-zinc-600 dark:text-zinc-400">
          {analysis ? (
            <div className="flex flex-col gap-1.5 text-xs tabular-nums">
              <div className="flex items-center gap-2">
                <span className="w-7 shrink-0">AI</span>
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                  <div
                    className="h-full rounded-full bg-zinc-900 transition-[width] duration-700 ease-out dark:bg-zinc-500"
                    style={{
                      width: `${Math.max(0, Math.min(100, (shownWinrate ?? 0) * 100))}%`,
                    }}
                  />
                </div>
                <span className="w-11 shrink-0 text-right">{pct(shownWinrate)}</span>
              </div>
            </div>
          ) : null}
          {gameOver && resultText && (
            <div className="mt-3 rounded-md border border-zinc-200 px-3 py-2 dark:border-zinc-800">
              {resultText}
            </div>
          )}
          {phase === "error" && (
            <div className="mt-3 flex items-center gap-2">
              <button
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                onClick={() => {
                  setPhase("thinking");
                  runAI();
                }}
              >
                重试
              </button>
              <button
                className="rounded-md border border-zinc-300 px-3 py-1 text-xs hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                onClick={() => {
                  const next = [...movesRef.current, { color: aiColor, pass: true }];
                  commitMoves(next);
                  const lastTwo = next.slice(-2);
                  if (lastTwo.length === 2 && lastTwo.every(m => m.pass)) {
                    finishGame(next);
                  } else {
                    setPhase("user");
                  }
                }}
              >
                AI 弃权
              </button>
            </div>
          )}
        </div>
      )}

      {/* 操作 */}
      <div
        className={
          zen
            ? "hidden"
            : "mx-auto mt-4 flex max-w-[720px] flex-wrap items-center justify-center gap-2 text-xs"
        }
      >
        {/* 执黑 / 执白 */}
        <div className="flex items-center rounded-full border border-zinc-200 p-0.5 dark:border-zinc-800">
          {["B", "W"].map(c => (
            <button
              key={c}
              onClick={() => newGame(c)}
              title={c === "B" ? "执黑先手" : "执白后手"}
              className={`rounded-full px-4 py-1 transition-colors duration-150 ${
                userColor === c
                  ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {c === "B" ? "执黑" : "执白"}
            </button>
          ))}
        </div>

        {/* 悔棋 / 弃权 / 认输（对局结束时为「再来一局」） */}
        <div className="flex items-center rounded-full border border-zinc-200 p-0.5 dark:border-zinc-800">
          <button
            onClick={undo}
            disabled={gameOver || moves.length === 0}
            title="悔棋：撤销直到轮到你"
            className="rounded-full px-4 py-1 text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            悔棋
          </button>
          <button
            onClick={pass}
            disabled={!isUserTurn}
            title="弃权"
            className="rounded-full px-4 py-1 text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            弃权
          </button>
          <button
            onClick={gameOver ? () => newGame(userColor) : resign}
            disabled={gameOver ? false : phase === "error"}
            title={gameOver ? "再来一局" : "认输"}
            className={`rounded-full px-4 py-1 transition-colors duration-150 disabled:pointer-events-none disabled:opacity-30 ${
              gameOver
                ? "bg-zinc-900 text-zinc-50 hover:opacity-80 dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            {gameOver ? "再来一局" : "认输"}
          </button>
        </div>

        {/* 禅 */}
        <div className="flex items-center rounded-full border border-zinc-200 p-0.5 dark:border-zinc-800">
          <button
            onClick={() => setZen(true)}
            title="禅模式：只显示棋盘（Esc 退出）"
            className="rounded-full px-4 py-1 text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            禅
          </button>
        </div>
      </div>

      {/* 禅模式退出（悬浮于棋盘右上角） */}
      {zen && (
        <button
          onClick={() => setZen(false)}
          title="退出禅模式 (Esc)"
          className="absolute right-4 top-4 rounded-full px-3 py-1 text-xs text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          X
        </button>
      )}
    </div>
  );
}
