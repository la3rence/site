import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  coordToXY,
  xyToCoord,
  buildState,
  isLegal,
  starPoints,
  BOARD_SIZES,
} from "../lib/go-rules";
import styles from "./katago-board.module.css";
import withLocalization from "./withI18n";

/**
 * 围棋对弈棋盘（支持 9/13/19 路切换），与 AI 实时对弈。
 * 棋局状态完全在浏览器端维护，每次分析仅提交完整落子序列（无状态分析接口）。
 * 棋谱（含棋盘尺寸、执子、阶段、分析、结果）持久化到 localStorage，
 * 刷新或重新打开页面时可恢复对局。
 */
const API = "https://go.game.lawrenceli.me/api/v1/analysis";
const MAX_VISITS = 50;
const REQUEST_TIMEOUT = 120000;
const STORAGE_KEY = "go-game-state-v1";

// 棋盘 SVG 尺寸（viewBox 单位），与棋盘路数无关
const M = 34;
const S = 620;

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

// ---------- 棋谱持久化 ----------

const isValidMove = (m, N) => {
  if (!m || (m.color !== "B" && m.color !== "W")) return false;
  if (m.pass) return true;
  if (typeof m.x !== "number" || typeof m.y !== "number") return false;
  return m.x >= 0 && m.x < N && m.y >= 0 && m.y < N;
};

/** 读取全部按棋盘尺寸分桶的存档：{ "9": {...}, "13": {...}, "19": {...}, _lastSize: 19 } */
const loadAllSaved = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const d = JSON.parse(raw);
    return d && typeof d === "object" && !Array.isArray(d) ? d : {};
  } catch {
    return {};
  }
};

/** 读取指定棋盘尺寸的存档，校验失败返回 null */
const loadSaved = size => {
  const all = loadAllSaved();
  const d = all[size];
  if (!d || typeof d !== "object") return null;
  if (!Array.isArray(d.moves) || !d.moves.every(m => isValidMove(m, size))) return null;
  const userColor = d.userColor === "B" || d.userColor === "W" ? d.userColor : "B";
  const phase = ["user", "thinking", "error", "over"].includes(d.phase) ? d.phase : "user";
  return {
    userColor,
    moves: d.moves,
    phase,
    analysis: d.analysis ?? null,
    result: d.result ?? null,
  };
};

/** 写入指定棋盘尺寸的存档，并记住最后活动的尺寸 */
const saveStateForSize = (size, state) => {
  const all = loadAllSaved();
  all[size] = state;
  all._lastSize = size;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
};

// ---------- 组件 ----------

function KatagoBoard({ translations }) {
  const t = translations;
  const [size, setSize] = useState(19); // 9 | 13 | 19
  const [moves, setMoves] = useState([]);
  const [phase, setPhase] = useState("user"); // user | thinking | error | over
  const [userColor, setUserColor] = useState("B");
  const [analysis, setAnalysis] = useState(null); // { aiWinrate, scoreLead, top[] }
  const [result, setResult] = useState(null); // { winner, delta, via }
  const [hint, setHint] = useState(null);
  const [hover, setHover] = useState(null);
  const [error, setError] = useState(null);
  const [zen, setZen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [dialog, setDialog] = useState(null); // { title, message, onConfirm, confirmText }

  const movesRef = useRef(moves);
  const userColorRef = useRef(userColor);
  const sizeRef = useRef(size);
  const abortRef = useRef(null);
  const svgRef = useRef(null);
  const hintTimerRef = useRef(null);
  const runAIRef = useRef(null);

  // 棋谱持久化：仅在水合（mount）后写入，按当前棋盘尺寸分桶存储
  useEffect(() => {
    if (typeof window === "undefined" || !mounted) return;
    try {
      const data = { userColor, moves, phase, analysis, result };
      saveStateForSize(size, data);
    } catch {
      /* 存储不可用时静默降级 */
    }
  }, [mounted, size, userColor, moves, phase, analysis, result]);

  /** 恢复存档后：若停在 AI 思考阶段则续跑 AI，否则落到用户/结束态 */
  const resumeIfThinking = saved => {
    if (saved.phase !== "thinking") {
      setPhase(saved.phase);
      return;
    }
    const turn = saved.moves.length % 2 === 0 ? "B" : "W";
    const aiColor = saved.userColor === "B" ? "W" : "B";
    if (turn === aiColor) {
      setPhase("thinking");
      setTimeout(() => runAIRef.current && runAIRef.current(), 0); // 续跑被中断的 AI 落子
    } else {
      setPhase("user");
    }
  };

  // 水合：从 localStorage 恢复棋局（SSR 友好，初始渲染使用默认值）
  useEffect(() => {
    // 兼容旧版扁平存档（单一棋盘、无分桶）→ 迁移为按尺寸分桶，避免丢失进行中的对局
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (
          d &&
          typeof d === "object" &&
          !Array.isArray(d) &&
          d.size &&
          Array.isArray(d.moves) &&
          !BOARD_SIZES.some(s => d[s])
        ) {
          const size = BOARD_SIZES.includes(d.size) ? d.size : 19;
          // 整体覆盖为分桶结构，避免残留旧的扁平顶层字段
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({
              [size]: {
                userColor: d.userColor,
                moves: d.moves,
                phase: d.phase,
                analysis: d.analysis,
                result: d.result,
              },
              _lastSize: size,
            }),
          );
        }
      }
    } catch {
      /* 损坏的存档忽略，走默认空局 */
    }

    const all = loadAllSaved();
    const lastSize = BOARD_SIZES.includes(all._lastSize) ? all._lastSize : 19;
    const saved = loadSaved(lastSize);
    if (saved) {
      sizeRef.current = lastSize;
      userColorRef.current = saved.userColor;
      setSize(lastSize);
      setUserColor(saved.userColor);
      movesRef.current = saved.moves;
      setMoves(saved.moves);
      setAnalysis(saved.analysis);
      setResult(saved.result);
      setError(null);
      setHint(null);
      resumeIfThinking(saved);
    }
    setMounted(true);
    // 仅在挂载时执行一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 禅模式：Esc 退出
  useEffect(() => {
    if (!zen) return;
    const onKey = e => {
      if (e.key === "Escape") setZen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [zen]);

  // AI 思考中时把浏览器标签标题切换为「思考中」，结束后还原
  useEffect(() => {
    if (typeof document === "undefined") return; // SSR 安全
    const prev = document.title;
    if (phase === "thinking") document.title = t["Thinking"];
    return () => {
      if (phase === "thinking") document.title = prev;
    };
  }, [phase, t]);

  const commitMoves = useCallback(next => {
    movesRef.current = next;
    setMoves(next);
  }, []);

  const st = useMemo(() => buildState(moves, size), [moves, size]);
  const { board, posKeys, captured, lastMove } = st;
  const aiColor = userColor === "B" ? "W" : "B";
  const turn = moves.length % 2 === 0 ? "B" : "W";
  const isUserTurn = phase === "user" && turn === userColor;
  const gameOver = phase === "over";
  const STAR = starPoints(size);
  const CELL = (S - M * 2) / (size - 1);

  // AI 胜率（analysis.aiWinrate 为 AI 视角），数字与进度条同步动画
  const aiWinrate = analysis?.aiWinrate ?? null;
  const animatedWinrate = useAnimatedValue(aiWinrate ?? 0);
  const shownWinrate = aiWinrate == null ? null : animatedWinrate;

  const analyze = useCallback(async (movesList, signal) => {
    const N = sizeRef.current;
    const body = {
      moves: movesList.map(m => (m.pass ? [m.color, "pass"] : [m.color, xyToCoord(m.x, m.y, N)])),
      komi: 7.5,
      rules: "chinese",
      boardXSize: N,
      boardYSize: N,
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
    const N = sizeRef.current;
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
        const xy = coordToXY(info.moveCoord, N);
        if (!xy) continue;
        const s = buildState(ms, N);
        if (isLegal(s.board, xy.y * N + xy.x, ai === "B" ? 1 : 2, s.posKeys, N)) {
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
      setError(t["AI analysis failed, retry or let AI pass"]);
      setPhase("error");
    } finally {
      clearTimeout(timeout);
    }
  }, [analyze, finishGame, commitMoves, t]);

  // 始终持有最新 runAI 引用（供恢复对局时调用）
  runAIRef.current = runAI;

  /** 用户落子 */
  const play = useCallback(
    (x, y) => {
      if (!isUserTurn) return;
      const idx = y * size + x;
      if (board[idx] !== 0) return;
      if (!isLegal(board, idx, userColor === "B" ? 1 : 2, posKeys, size)) {
        showHint(t["Cannot play here"]);
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
    [board, posKeys, size, userColor, isUserTurn, runAI, finishGame, showHint, commitMoves, t],
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

  /** 新局 / 换执（保持当前棋盘尺寸） */
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

  /** 切换棋盘尺寸（9/13/19）：各自保留存档，切回时恢复对应尺寸的棋局 */
  const changeSize = useCallback(
    newSize => {
      if (newSize === sizeRef.current) return;
      abortRef.current?.abort();
      abortRef.current = null;
      sizeRef.current = newSize;
      setSize(newSize);
      const saved = loadSaved(newSize);
      if (saved) {
        userColorRef.current = saved.userColor;
        setUserColor(saved.userColor);
        movesRef.current = saved.moves;
        setMoves(saved.moves);
        setAnalysis(saved.analysis);
        setResult(saved.result);
        setError(null);
        setHint(null);
        resumeIfThinking(saved);
      } else {
        commitMoves([]);
        setPhase("user");
        setError(null);
        setAnalysis(null);
        setResult(null);
        setHint(null);
        if (userColorRef.current === "W") runAI(); // 执白：AI 执黑先手
      }
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

  /** 二次确认弹窗：用于开新局 / 认输 / 切换棋盘，避免误操作丢失当前对局 */
  const askConfirm = (title, message, onConfirm, confirmText) =>
    setDialog({ title, message, onConfirm, confirmText: confirmText || t["Confirm"] });

  const runConfirm = () => {
    const fn = dialog?.onConfirm;
    setDialog(null);
    fn?.();
  };

  // ESC 关闭弹窗
  useEffect(() => {
    if (!dialog) return;
    const onKey = e => {
      if (e.key === "Escape") setDialog(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dialog]);

  // ---------- 渲染 ----------

  const toSvg = (x, y) => ({ cx: M + x * CELL, cy: M + y * CELL });

  const onPointer = e => {
    if (!svgRef.current) return null;
    const rect = svgRef.current.getBoundingClientRect();
    const px = ((e.clientX - rect.left) / rect.width) * S;
    const py = ((e.clientY - rect.top) / rect.height) * S;
    const x = Math.round((px - M) / CELL);
    const y = Math.round((py - M) / CELL);
    if (x < 0 || x >= size || y < 0 || y >= size) return null;
    if (Math.abs(px - (M + x * CELL)) > CELL * 0.62) return null;
    if (Math.abs(py - (M + y * CELL)) > CELL * 0.62) return null;
    return { x, y };
  };

  const statusText = gameOver
    ? result?.via === "resign"
      ? t["You resigned"]
      : t["Game over"]
    : phase === "error"
      ? error
      : turn === "B"
        ? t["Black to move"]
        : t["White to move"];

  const resultText = result
    ? result.via === "resign"
      ? t[result.winner === "B" ? "Black wins by resignation" : "White wins by resignation"]
      : result.via === "score"
        ? t[result.winner === "B" ? "Black wins by score" : "White wins by score"].replace(
            "%s",
            result.delta.toFixed(1),
          )
        : t["Both passed, score unavailable"]
    : null;

  return (
    <div
      className={`not-prose ${
        zen
          ? "fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-zinc-900"
          : "my-8"
      }`}
    >
      {/* 状态栏：左=状态文字，中=思考动画（居中），右=手数（右对齐） */}
      <div
        className={
          zen
            ? "hidden"
            : "mx-auto mb-8 flex max-w-180 items-center gap-x-3 text-xs text-zinc-600 dark:text-zinc-400"
        }
      >
        <span className={`mx-2 min-w-0 flex-1 truncate text-left ${hint ? "text-red-500" : ""}`}>
          {hint || statusText}
        </span>
        <span className="flex shrink-0 items-center gap-1" aria-label="Thinking">
          {phase === "thinking" && (
            <>
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 dark:bg-zinc-400" />
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 dark:bg-zinc-400"
                style={{ animationDelay: "180ms" }}
              />
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-zinc-500 dark:bg-zinc-400"
                style={{ animationDelay: "360ms" }}
              />
            </>
          )}
        </span>
        <div className="mx-2 flex-1 text-right tabular-nums">
          {captured.B + captured.W > 0 &&
            `${t["Captured"]} ${t["Black"]} ${captured.B} · ${t["White"]} ${captured.W} ｜ `}
          {t["Moves"]} {moves.length}
        </div>
      </div>

      {/* 棋盘 */}
      <div
        className={
          zen ? "w-full max-w-[min(92vw,92vh)] px-4 sm:px-0" : "relative mx-auto max-w-180"
        }
      >
        <svg
          ref={svgRef}
          viewBox={`0 0 ${S} ${S}`}
          className={`${styles.goBoard} h-auto w-full select-none rounded-lg shadow-sm ring-1 ring-zinc-200 dark:ring-zinc-800 ${
            phase === "thinking" ? "cursor-wait" : ""
          }`}
          style={{ backgroundColor: "var(--go-board-bg)" }}
          onClick={e => {
            const p = onPointer(e);
            if (p) play(p.x, p.y);
          }}
          onMouseMove={e => {
            const p = onPointer(e);
            setHover(isUserTurn && p && board[p.y * size + p.x] === 0 ? p : null);
          }}
          onMouseLeave={() => setHover(null)}
        >
          {/* 网格线 */}
          {Array.from({ length: size }, (_, k) => (
            <g key={`line-${k}`}>
              <line
                x1={M + k * CELL}
                y1={M}
                x2={M + k * CELL}
                y2={M + (size - 1) * CELL}
                style={{ stroke: "var(--go-line)" }}
                strokeWidth="1"
              />
              <line
                x1={M}
                y1={M + k * CELL}
                x2={M + (size - 1) * CELL}
                y2={M + k * CELL}
                style={{ stroke: "var(--go-line)" }}
                strokeWidth="1"
              />
            </g>
          ))}
          {/* 星位 */}
          {STAR.flatMap(a => STAR.map(b => ({ a, b }))).map(({ a, b }, i) => (
            <circle
              key={`star-${i}`}
              cx={M + a * CELL}
              cy={M + b * CELL}
              r="3.2"
              style={{ fill: "var(--go-line)" }}
            />
          ))}
          {/* 棋子 */}
          {board.map((v, i) => {
            if (!v) return null;
            const x = i % size;
            const y = (i / size) | 0;
            const { cx, cy } = toSvg(x, y);
            return (
              <g key={`stone-${i}`}>
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
        <div className="mx-auto mt-8 max-w-180 text-sm text-zinc-600 dark:text-zinc-400">
          {analysis ? (
            <div className="flex flex-col gap-1.5 text-xs tabular-nums">
              <div className="flex items-center gap-2 mx-1">
                <span className="w-16 shrink-0">{t["AI winrate"]}</span>
                <div className="h-1 flex-1 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
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
                {t["Retry"]}
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
                {t["Let AI pass"]}
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
            : "mx-auto mt-8 flex max-w-180 flex-wrap items-center justify-center gap-2 text-xs"
        }
      >
        {/* 棋盘尺寸 */}
        <div className="flex items-center rounded-full border border-zinc-200 p-0.5 dark:border-zinc-800">
          <span className="px-2 text-zinc-400 dark:text-zinc-500">{t["Board size"]}</span>
          {BOARD_SIZES.map(s => (
            <button
              key={s}
              onClick={() => {
                if (s === sizeRef.current) return;
                askConfirm(
                  t["Switch to {size}×{size} board?"].replace(/\{size\}/g, s),
                  t["Current game progress will be lost."],
                  () => changeSize(s),
                );
              }}
              title={t["Board size"]}
              className={`rounded-full px-3 py-1 transition-colors duration-150 ${
                size === s
                  ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {s}×{s}
            </button>
          ))}
        </div>

        {/* 执黑 / 执白 */}
        <div className="flex items-center rounded-full border border-zinc-200 p-0.5 dark:border-zinc-800">
          {["B", "W"].map(c => (
            <button
              key={c}
              onClick={() =>
                askConfirm(t["Start a new game?"], t["Current game progress will be lost."], () =>
                  newGame(c),
                )
              }
              title={c === "B" ? t["Play Black (first move)"] : t["Play White (second move)"]}
              className={`rounded-full px-4 py-1 transition-colors duration-150 ${
                userColor === c
                  ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
              }`}
            >
              {c === "B" ? t["Play Black"] : t["Play White"]}
            </button>
          ))}
        </div>

        {/* 悔棋 / 弃权 / 认输（对局结束时为「再来一局」） */}
        <div className="flex items-center rounded-full border border-zinc-200 p-0.5 dark:border-zinc-800">
          <button
            onClick={undo}
            disabled={gameOver || moves.length === 0}
            title={t["Undo: revert until your turn"]}
            className="rounded-full px-4 py-1 text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {t["Undo"]}
          </button>
          <button
            onClick={pass}
            disabled={!isUserTurn}
            title={t["Pass"]}
            className="rounded-full px-4 py-1 text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900 disabled:pointer-events-none disabled:opacity-30 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {t["Pass"]}
          </button>
          <button
            onClick={() =>
              gameOver
                ? askConfirm(t["Start a new game?"], t["Current game progress will be lost."], () =>
                    newGame(userColor),
                  )
                : askConfirm(
                    t["Resign this game?"],
                    t["Current game progress will be lost."],
                    resign,
                  )
            }
            disabled={gameOver ? false : phase === "error"}
            title={gameOver ? t["Play again"] : t["Resign"]}
            className={`rounded-full px-4 py-1 transition-colors duration-150 disabled:pointer-events-none disabled:opacity-30 ${
              gameOver
                ? "bg-zinc-900 text-zinc-50 hover:opacity-80 dark:bg-zinc-100 dark:text-zinc-900"
                : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
            }`}
          >
            {gameOver ? t["Play again"] : t["Resign"]}
          </button>
        </div>

        {/* 禅 */}
        <div className="flex items-center rounded-full border border-zinc-200 p-0.5 dark:border-zinc-800">
          <button
            onClick={() => setZen(true)}
            title={t["Zen mode: board only (Esc to exit)"]}
            className="rounded-full px-4 py-1 text-zinc-500 transition-colors duration-150 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
          >
            {t["Zen"]}
          </button>
        </div>
      </div>

      {/* 禅模式退出（悬浮于棋盘右上角，圆形 + 等宽字体 x） */}
      {zen && (
        <button
          onClick={() => setZen(false)}
          title={t["Exit Zen mode (Esc)"]}
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full font-mono text-sm text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-500 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
        >
          x
        </button>
      )}

      {/* 二次确认弹窗（开新局 / 认输 / 切换棋盘） */}
      {dialog && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 px-4"
          onClick={() => setDialog(null)}
        >
          <div
            className="w-full max-w-xs rounded-lg border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">{dialog.title}</h3>
            {dialog.message && (
              <p className="mt-1 text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
                {dialog.message}
              </p>
            )}
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDialog(null)}
                className="rounded-md border border-zinc-300 px-3 py-1.5 text-xs text-zinc-600 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
              >
                {t["Cancel"]}
              </button>
              <button
                onClick={runConfirm}
                className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs text-zinc-50 transition-opacity hover:opacity-80 dark:bg-zinc-100 dark:text-zinc-900"
              >
                {dialog.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withLocalization(KatagoBoard);
