// lib/sgf.js — Smart Game Format (SGF) 解析与生成
// 仅覆盖围棋（GM[1]）主分支：棋盘尺寸、落子序列、结果。
// SGF 坐标用连续字母 a-z 表示（不跳过 I），左上角为 a/a，0-indexed。

import { BOARD_SIZES } from "./go-rules";

const LETTER_BASE = 97; // 'a'

/** (x, y) → SGF 坐标字符串，如 (15, 3) → "pd" */
export function xyToSgf(x, y) {
  return String.fromCharCode(LETTER_BASE + x) + String.fromCharCode(LETTER_BASE + y);
}

/** SGF 坐标字符串 → { x, y }，非法返回 null */
export function sgfToXy(coord) {
  if (!coord || coord.length < 2) return null;
  const x = coord.charCodeAt(0) - LETTER_BASE;
  const y = coord.charCodeAt(1) - LETTER_BASE;
  if (x < 0 || y < 0 || x > 25 || y > 25) return null;
  return { x, y };
}

/** 解析 RE 结果字段 → { winner, via }（和棋/无结果返回 null） */
function parseResult(re) {
  if (!re) return null;
  const r = re.trim();
  if (r.startsWith("B")) return { winner: "B", via: r.includes("R") ? "resign" : "score" };
  if (r.startsWith("W")) return { winner: "W", via: r.includes("R") ? "resign" : "score" };
  return null;
}

/**
 * 解析 SGF 文本，返回主分支棋局 { size, moves, result }。
 * 失败抛出可读的 Error（中文）。
 */
export function parseSGF(text) {
  if (!text || typeof text !== "string") {
    throw new Error("文件内容为空或不是文本。");
  }

  let i = 0;
  const n = text.length;
  while (i < n && text[i] !== "(") i++;
  if (i >= n) throw new Error("未找到有效的 SGF 棋局（缺少根节点）。");

  // 简易递归下降：每个分支点只取第一个子变化（主分支）。
  // 主序列在变体之后仍可能继续（如 `... (变体) ;B[fc]`），需持续消费。
  function parseGameTree() {
    i++; // 消费 '('
    const nodes = [];
    const variations = [];
    for (;;) {
      while (i < n && text[i] === ";") nodes.push(parseNode());
      if (i < n && text[i] === "(") {
        variations.push(parseGameTree());
        continue; // 变体之后主序列可能继续
      }
      break;
    }
    if (text[i] === ")") i++;
    return { nodes, variations };
  }

  function parseNode() {
    i++; // 消费 ';'
    const props = {};
    while (i < n && /[A-Z]/.test(text[i] || "")) {
      let ident = "";
      while (i < n && /[A-Z]/.test(text[i])) {
        ident += text[i];
        i++;
      }
      const values = [];
      while (i < n && text[i] === "[") {
        i++; // 消费 '['
        let val = "";
        while (i < n && text[i] !== "]") {
          if (text[i] === "\\") {
            val += text[i + 1] ?? "";
            i += 2;
          } else {
            val += text[i];
            i++;
          }
        }
        i++; // 消费 ']'
        values.push(val);
      }
      props[ident] = values;
    }
    return props;
  }

  const tree = parseGameTree();

  // 沿主分支展开节点序列
  const mainLine = t => {
    const out = [...t.nodes];
    if (t.variations.length) out.push(...mainLine(t.variations[0]));
    return out;
  };
  const nodes = mainLine(tree);

  let size = 19;
  let result = null;
  const moves = [];
  for (const node of nodes) {
    if (node.SZ && node.SZ[0]) {
      const s = parseInt(node.SZ[0], 10);
      if (s >= 2 && s <= 25) size = s;
    }
    if (node.RE) result = parseResult(node.RE[0]) || result;

    const bv = node.B && node.B[0];
    const wv = node.W && node.W[0];
    if (bv != null) {
      if (bv === "") {
        moves.push({ color: "B", pass: true });
      } else {
        const xy = sgfToXy(bv);
        if (!xy) throw new Error(`存在无法识别的落子坐标：${bv}`);
        if (xy.x >= size || xy.y >= size) throw new Error(`落子坐标超出棋盘尺寸：${bv}`);
        moves.push({ color: "B", x: xy.x, y: xy.y });
      }
    } else if (wv != null) {
      if (wv === "") {
        moves.push({ color: "W", pass: true });
      } else {
        const xy = sgfToXy(wv);
        if (!xy) throw new Error(`存在无法识别的落子坐标：${wv}`);
        if (xy.x >= size || xy.y >= size) throw new Error(`落子坐标超出棋盘尺寸：${wv}`);
        moves.push({ color: "W", x: xy.x, y: xy.y });
      }
    }
  }

  if (!BOARD_SIZES.includes(size)) {
    throw new Error(`暂不支持 ${size} 路棋盘（仅支持 9/13/19）。`);
  }

  return { size, moves, result };
}

const esc = s => String(s).replace(/\\/g, "\\\\").replace(/]/g, "\\]");

/**
 * 序列化棋局为 SGF 文本。
 * @param {{ size:number, moves:Array, result?:{winner,via}|null, blackName?:string, whiteName?:string }} game
 */
export function toSGF({ size, moves, result, blackName = "Black", whiteName = "White" }) {
  let out = `(;GM[1]FF[4]CA[UTF-8]SZ[${size}]PB[${esc(blackName)}]PW[${esc(whiteName)}]`;
  if (result && result.winner) {
    const tag = result.via === "resign" ? "+R" : "+?";
    out += `RE[${result.winner}${tag}]`;
  }
  for (const m of moves) {
    const coord = m.pass ? "" : xyToSgf(m.x, m.y);
    out += `;${m.color}[${coord}]`;
  }
  out += ")";
  return out;
}
