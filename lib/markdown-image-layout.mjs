import { visit } from "unist-util-visit";

// Markdown image layout syntax:
//   ![caption](/images/photo.jpg#full)    -> edge-to-edge viewport width
//   ![caption](/images/photo.jpg#wide)    -> centered wide image, capped by CSS
//   ![caption](/images/photo.jpg#w=720)   -> centered image with max width 720px
//   ![caption](/images/photo.jpg#w=60%)   -> centered image with max width 60%
// The hash is consumed during Markdown rendering and removed from the final img src.
const IMAGE_LAYOUT_CLASS = "md-image";

export const rehypeImageLayout = () => {
  return tree => {
    let imageIndex = 0;

    visit(tree, "element", (node, index, parent) => {
      if (node.tagName !== "img" || typeof node.properties?.src !== "string") {
        return;
      }

      applyImageLoading(node, imageIndex);
      imageIndex += 1;

      const layout = parseImageLayout(node.properties.src);

      if (!layout) {
        return;
      }

      node.properties.src = layout.src;
      const figure = parent?.tagName === "figure" ? parent : null;
      applyImageLayout(figure ?? node, layout);
    });
  };
};

const applyImageLoading = (node, imageIndex) => {
  node.properties = {
    ...node.properties,
    decoding: node.properties.decoding ?? "async",
  };

  if (imageIndex > 0 && !node.properties.loading) {
    node.properties.loading = "lazy";
  }
};

const parseImageLayout = src => {
  const hashIndex = src.indexOf("#");

  if (hashIndex === -1) {
    return null;
  }

  const baseSrc = src.slice(0, hashIndex);
  const hash = src.slice(hashIndex + 1).trim();

  if (!hash) {
    return null;
  }

  if (hash === "full" || hash === "wide") {
    return { src: baseSrc, kind: hash };
  }

  const params = new URLSearchParams(hash);
  const width = params.get("w") ?? params.get("width");
  const normalizedWidth = normalizeImageWidth(width);

  if (!normalizedWidth) {
    return null;
  }

  return { src: baseSrc, kind: "contained", width: normalizedWidth };
};

const normalizeImageWidth = width => {
  if (!width) {
    return null;
  }

  const value = width.trim();

  if (/^\d+(\.\d+)?$/.test(value)) {
    return `${value}px`;
  }

  if (/^\d+(\.\d+)?(px|rem|em|vw|%)$/.test(value)) {
    return value;
  }

  return null;
};

const applyImageLayout = (node, layout) => {
  const classNames = new Set(
    normalizeClassNames(node.properties?.className ?? node.properties?.class),
  );
  classNames.add(IMAGE_LAYOUT_CLASS);
  classNames.add(`md-image-${layout.kind}`);

  node.properties = {
    ...node.properties,
    className: [...classNames],
  };
  delete node.properties.class;

  if (layout.width) {
    node.properties.style = appendStyle(
      node.properties.style,
      `--image-max-width: ${layout.width}`,
    );
  }
};

const normalizeClassNames = classNames => {
  if (Array.isArray(classNames)) {
    return classNames;
  }

  if (typeof classNames === "string") {
    return classNames.split(/\s+/).filter(Boolean);
  }

  return [];
};

const appendStyle = (style, declaration) => {
  if (!style) {
    return declaration;
  }

  return `${style.replace(/;?\s*$/, ";")} ${declaration}`;
};
