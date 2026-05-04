export const POST_PREVIEW_TYPES = {
  chart: "chart",
  image: "image",
  video: "video",
};

export const CHART_PREVIEW_SOURCES = {
  vix: "vix",
};

const normalizeChartPreview = preview => {
  const source = preview.source ?? preview.chart;

  if (!Object.values(CHART_PREVIEW_SOURCES).includes(source)) {
    return null;
  }

  return {
    type: POST_PREVIEW_TYPES.chart,
    source,
    title: preview.title ?? null,
    dataType: preview.dataType ?? null,
  };
};

const normalizeImagePreview = preview => {
  if (typeof preview.src !== "string" || preview.src.length === 0) {
    return null;
  }

  return {
    type: POST_PREVIEW_TYPES.image,
    src: preview.src,
    alt: typeof preview.alt === "string" ? preview.alt : "",
    title: preview.title ?? null,
  };
};

const normalizeVideoPreview = preview => {
  if (typeof preview.src !== "string" || preview.src.length === 0) {
    return null;
  }

  return {
    type: POST_PREVIEW_TYPES.video,
    src: preview.src,
    poster: typeof preview.poster === "string" ? preview.poster : null,
    title: preview.title ?? null,
    mimeType: typeof preview.mimeType === "string" ? preview.mimeType : null,
  };
};

const PREVIEW_NORMALIZERS = {
  [POST_PREVIEW_TYPES.chart]: normalizeChartPreview,
  [POST_PREVIEW_TYPES.image]: normalizeImagePreview,
  [POST_PREVIEW_TYPES.video]: normalizeVideoPreview,
};

export const normalizePostPreview = preview => {
  if (!preview || typeof preview !== "object") {
    return null;
  }

  const normalize = PREVIEW_NORMALIZERS[preview.type];

  if (!normalize) {
    return null;
  }

  return normalize(preview);
};
