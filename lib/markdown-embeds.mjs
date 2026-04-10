import { visit } from "unist-util-visit";

const customEmbedPattern = /<(douban|bilibili|github|tweet|trade)\b/i;
const inlineEmbedTags = new Set(["trade"]);
const htmlIgnoredTags = new Set(["code", "pre"]);

const getPlaceholderTagName = tagName => {
  return inlineEmbedTags.has(tagName.toLowerCase()) ? "span" : "div";
};

const parseEmbedAttributes = attrs => {
  const properties = {};
  const attrPattern = /([:@\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let match = attrPattern.exec(attrs);

  while (match) {
    const [, key, doubleQuoted, singleQuoted, bareValue] = match;
    properties[key] = doubleQuoted ?? singleQuoted ?? bareValue ?? true;
    match = attrPattern.exec(attrs);
  }

  return properties;
};

const escapeAttribute = value => {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("'", "&#39;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
};

const buildEmbedPlaceholder = (tagName, properties) => {
  const placeholderTagName = getPlaceholderTagName(tagName);
  const embedName = tagName.toLowerCase();
  return `<${placeholderTagName} data-embed="${embedName}" data-props='${escapeAttribute(
    JSON.stringify(properties),
  )}'></${placeholderTagName}>`;
};

export const replaceEmbedTagsInHtml = html => {
  let cursor = 0;
  let output = "";
  const ignoredTagStack = [];

  while (cursor < html.length) {
    const rest = html.slice(cursor);
    const embedMatch =
      ignoredTagStack.length === 0
        ? rest.match(/^<(douban|bilibili|github|tweet|trade)\b([^>]*?)(?:\/>|>\s*<\/\1>)/i)
        : null;

    if (embedMatch) {
      const [, tagName, attrs = ""] = embedMatch;
      output += buildEmbedPlaceholder(tagName, parseEmbedAttributes(attrs));
      cursor += embedMatch[0].length;
      continue;
    }

    const tagMatch = rest.match(/^<\/?([a-zA-Z][\w-]*)\b[^>]*>/);

    if (tagMatch) {
      const [fullMatch, tagName] = tagMatch;
      const normalizedTagName = tagName.toLowerCase();

      if (htmlIgnoredTags.has(normalizedTagName)) {
        if (fullMatch.startsWith("</")) {
          if (ignoredTagStack[ignoredTagStack.length - 1] === normalizedTagName) {
            ignoredTagStack.pop();
          }
        } else if (!fullMatch.endsWith("/>")) {
          ignoredTagStack.push(normalizedTagName);
        }
      }

      output += fullMatch;
      cursor += fullMatch.length;
      continue;
    }

    output += html[cursor];
    cursor += 1;
  }

  return output;
};

export const rehypeEmbedPlaceholders = () => {
  return tree => {
    visit(tree, node => {
      if (
        node.type === "raw" &&
        typeof node.value === "string" &&
        customEmbedPattern.test(node.value)
      ) {
        node.value = replaceEmbedTagsInHtml(node.value);
      }

      if (
        node.type === "element" &&
        typeof node.tagName === "string" &&
        customEmbedPattern.test(`<${node.tagName}>`)
      ) {
        const tagName = node.tagName.toLowerCase();
        node.tagName = getPlaceholderTagName(tagName);
        node.properties = {
          "data-embed": tagName,
          "data-props": JSON.stringify(node.properties ?? {}),
        };
        node.children = [];
      }
    });
  };
};
