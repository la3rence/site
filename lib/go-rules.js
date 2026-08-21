/**
 * 19x19 围棋规则引擎（纯函数，无 React 依赖，可独立测试）。
 * 用于 katago 对弈页：在浏览器端维护棋局状态，配合无状态分析接口使用。
 */

export const N = 19;
export const LETTERS = "ABCDEFGHJKLMNOPQRST"; // 19 列，跳过 I

const neighborsOf = i => {
  const x = i % N;
  const y = (i / N) | 0;
  const out = [];
  if (x > 0) out.push(i - 1);
  if (x < N - 1) out.push(i + 1);
  if (y > 0) out.push(i - N);
  if (y < N - 1) out.push(i + N);
  return out;
};

const groupInfo = (board, start) => {
  const color = board[start];
  const group = [start];
  const seen = new Set([start]);
  const liberties = new Set();
  const stack = [start];
  while (stack.length) {
    const i = stack.pop();
    for (const nb of neighborsOf(i)) {
      if (board[nb] === 0) liberties.add(nb);
      else if (board[nb] === color && !seen.has(nb)) {
        seen.add(nb);
        group.push(nb);
        stack.push(nb);
      }
    }
  }
  return { group, liberties };
};

/** 模拟在 i 处落 color 子（1=黑 2=白），返回新棋盘与提子数（不校验合法性） */
const simulatePlace = (board, i, color) => {
  const b = board.slice();
  b[i] = color;
  const opp = color === 1 ? 2 : 1;
  let captured = 0;
  for (const nb of neighborsOf(i)) {
    if (b[nb] === opp) {
      const { group, liberties } = groupInfo(b, nb);
      if (liberties.size === 0) {
        for (const g of group) b[g] = 0;
        captured += group.length;
      }
    }
  }
  return { board: b, captured };
};

/**
 * 由落子序列重建棋盘状态。
 * moves: [{ color: 'B'|'W', x, y } | { color, pass: true }]
 * 返回 { board, posKeys, captured, lastMove }
 */
export const buildState = moves => {
  let board = new Array(N * N).fill(0);
  let posKeys = new Set([board.join("")]);
  const captured = { B: 0, W: 0 };
  let lastMove = null;
  for (const m of moves) {
    if (m.pass) {
      // 弃权后清除禁着点记忆（简单劫规则重置）
      posKeys = new Set([board.join("")]);
      lastMove = null;
      continue;
    }
    const color = m.color === "B" ? 1 : 2;
    const res = simulatePlace(board, m.y * N + m.x, color);
    board = res.board;
    captured[m.color] += res.captured;
    posKeys.add(board.join(""));
    lastMove = { x: m.x, y: m.y, color: m.color };
  }
  return { board, posKeys, captured, lastMove };
};

/** 落子是否合法：空点、非自杀、不重复历史局面（位置超劫） */
export const isLegal = (board, i, color, posKeys) => {
  if (board[i] !== 0) return false;
  const { board: b, captured } = simulatePlace(board, i, color);
  if (captured === 0) {
    const own = groupInfo(b, i);
    if (own.liberties.size === 0) return false; // 自杀
  }
  if (posKeys.has(b.join(""))) return false; // 劫 / 循环
  return true;
};

/** 坐标转换：API 坐标（如 "Q3"、"pass"）<-> 棋盘索引 */
export const coordToXY = coord => {
  if (!coord || typeof coord !== "string") return null;
  if (/^pass$/i.test(coord)) return null; // pass 由调用方单独处理
  const m = coord.match(/^([A-Za-z])(\d{1,2})$/);
  if (!m) return null;
  const x = LETTERS.indexOf(m[1].toUpperCase());
  const row = parseInt(m[2], 10);
  if (x < 0 || row < 1 || row > N) return null;
  return { x, y: N - row };
};

export const xyToCoord = (x, y) => `${LETTERS[x]}${N - y}`;
