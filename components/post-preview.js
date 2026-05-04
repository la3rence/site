/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

const VixChart = dynamic(() => import("./vix-chart"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full animate-pulse rounded-sm bg-zinc-100 dark:bg-zinc-800" />
  ),
});

const PREVIEW_REFRESH_MS = 30000;
const PREVIEW_CACHE_TTL_MS = 10000;
const MAX_PREVIEW_POINTS = 90;
const previewDataCache = new Map();

export default function PostPreview({ preview, active }) {
  const Renderer = PREVIEW_RENDERERS[preview?.type];

  if (!Renderer) {
    return null;
  }

  return <Renderer preview={preview} active={active} />;
}

const PreviewFrame = ({ children }) => (
  <div className="not-prose overflow-hidden rounded-md bg-white/95 p-3 backdrop-blur-sm dark:bg-zinc-900/95">
    {children}
  </div>
);

const ChartPreview = ({ preview, active }) => {
  const Renderer = CHART_PREVIEW_RENDERERS[preview.source];

  if (!Renderer) {
    return null;
  }

  return <Renderer preview={preview} active={active} />;
};

const VixChartPreview = ({ preview, active }) => {
  const dataType = preview.dataType || "minute";
  const [state, setState] = useState({
    data: [],
    loading: false,
    error: null,
  });

  useEffect(() => {
    if (!active) {
      return undefined;
    }

    let ignored = false;
    const cacheKey = `vix:${dataType}`;

    const applyResult = result => {
      const data = Array.isArray(result?.data) ? result.data.slice(-MAX_PREVIEW_POINTS) : [];

      setState({
        data,
        loading: false,
        error: null,
      });
    };

    const fetchData = async ({ force = false } = {}) => {
      const cached = previewDataCache.get(cacheKey);
      const isFresh = cached && Date.now() - cached.cachedAt < PREVIEW_CACHE_TTL_MS;

      if (!force && isFresh) {
        applyResult(cached.result);
        return;
      }

      setState(current => ({ ...current, loading: current.data.length === 0, error: null }));

      try {
        const response = await fetch(`/api/vix-data?dataType=${dataType}`, { cache: "no-store" });

        if (!response.ok) {
          throw new Error(`Request failed: ${response.status}`);
        }

        const result = await response.json();
        previewDataCache.set(cacheKey, {
          cachedAt: Date.now(),
          result,
        });

        if (!ignored) {
          applyResult(result);
        }
      } catch (error) {
        if (!ignored) {
          setState(current => ({
            ...current,
            loading: false,
            error,
          }));
        }
      }
    };

    fetchData();
    const intervalId = setInterval(() => fetchData({ force: true }), PREVIEW_REFRESH_MS);

    return () => {
      ignored = true;
      clearInterval(intervalId);
    };
  }, [active, dataType]);

  const viewMode = dataType === "daily" ? "daily" : "minute";

  return (
    <PreviewFrame>
      <div className="h-32 w-full text-blue-400">
        {state.error ? (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            暂时无法加载预览
          </div>
        ) : state.loading ? (
          <div className="h-full w-full animate-pulse rounded-sm bg-zinc-100 dark:bg-zinc-800" />
        ) : state.data.length > 0 ? (
          <VixChart data={state.data} viewMode={viewMode} compact />
        ) : (
          <div className="flex h-full items-center justify-center text-xs text-zinc-500">
            等待数据
          </div>
        )}
      </div>
    </PreviewFrame>
  );
};

const ImagePreview = ({ preview }) => (
  <PreviewFrame>
    <img
      src={preview.src}
      alt={preview.alt}
      className="m-0 h-48 w-full rounded-sm object-contain dark:brightness-75"
      loading="lazy"
      decoding="async"
    />
  </PreviewFrame>
);

const VideoPreview = ({ preview }) => (
  <PreviewFrame>
    <video
      className="m-0 h-44 w-full rounded-sm bg-zinc-100 object-cover dark:bg-zinc-800"
      poster={preview.poster ?? undefined}
      muted
      autoPlay
      loop
      playsInline
      preload="metadata"
    >
      <source src={preview.src} type={preview.mimeType ?? undefined} />
    </video>
  </PreviewFrame>
);

const PREVIEW_RENDERERS = {
  chart: ChartPreview,
  image: ImagePreview,
  video: VideoPreview,
};

const CHART_PREVIEW_RENDERERS = {
  vix: VixChartPreview,
};
