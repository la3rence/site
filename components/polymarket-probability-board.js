import { useEffect, useMemo, useRef, useState } from "react";

const CHART_HEIGHT = 420;
const PLOT_TOP = 92;
const PLOT_BOTTOM = 56;
const RIGHT_GUTTER = 24;
const LEFT_GUTTER = 10;
const MAX_VISIBLE_SERIES = 4;
const HOVER_LABEL_GAP = 8;
const HOVER_LABEL_HEIGHT = 34;
const HOVER_LABEL_MAX_WIDTH = 260;
const HOVER_LABEL_PADDING_X = 14;
const CHART_TITLE_RESERVED_WIDTH = 112;
const CHART_TITLE_Y = PLOT_TOP - 60;
const CHART_LEGEND_Y = PLOT_TOP - 42;
const COLORS = ["#8BC0FF", "#2F93FF", "#FFC61A", "#FF8A1F", "#6EE7B7", "#C084FC", "#FB7185"];
const MIN_RENDER_POINTS = 36;

const formatPercent = value => {
  if (!Number.isFinite(value)) {
    return "--";
  }

  if (value >= 10) {
    return `${Math.round(value)}%`;
  }

  const rounded = Math.round(value * 10) / 10;
  return `${Number.isInteger(rounded) ? rounded.toFixed(0) : rounded.toFixed(1)}%`;
};

const formatTimeLabel = timestamp =>
  new Date(timestamp).toLocaleDateString("zh-CN", {
    month: "numeric",
    day: "numeric",
  });

const clampPercent = value => Math.min(100, Math.max(0, value));

const buildPriceDomain = points => {
  const prices = points.map(point => Number(point.price)).filter(price => Number.isFinite(price));

  if (prices.length === 0) {
    return { min: 0, max: 100 };
  }

  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const range = maxPrice - minPrice;
  const padding = Math.max(range * 0.25, range < 2 ? 2 : 1);
  const min = clampPercent(Math.floor((minPrice - padding) * 10) / 10);
  const max = clampPercent(Math.ceil((maxPrice + padding) * 10) / 10);

  if (max - min >= 4) {
    return { min, max };
  }

  const midpoint = (minPrice + maxPrice) / 2;
  return {
    min: clampPercent(Math.floor((midpoint - 2) * 10) / 10),
    max: clampPercent(Math.ceil((midpoint + 2) * 10) / 10),
  };
};

const buildGroups = markets => {
  const groups = new Map();

  for (const market of markets) {
    const key =
      market.targetType === "event" ? `event:${market.targetSlug}` : `market:${market.id}`;
    const title = market.targetType === "event" ? market.eventTitle : market.question;
    const url =
      market.targetType === "event"
        ? `https://polymarket.com/event/${market.targetSlug}`
        : market.url;

    if (!groups.has(key)) {
      groups.set(key, {
        id: key,
        title,
        url,
        series: [],
      });
    }

    groups.get(key).series.push(market);
  }

  return [...groups.values()];
};

const normalizeHistory = history => {
  if (!Array.isArray(history)) {
    return [];
  }

  const normalized = history
    .map(point => ({
      timestamp: Number(point.timestamp),
      price: Number(point.price),
    }))
    .filter(point => Number.isFinite(point.timestamp) && Number.isFinite(point.price))
    .sort((left, right) => left.timestamp - right.timestamp);

  const deduped = [];
  for (const point of normalized) {
    const last = deduped[deduped.length - 1];
    if (last && last.timestamp === point.timestamp) {
      last.price = point.price;
    } else {
      deduped.push(point);
    }
  }

  return deduped;
};

const densifyHistory = history => {
  if (!Array.isArray(history) || history.length === 0) {
    return [];
  }

  if (history.length >= MIN_RENDER_POINTS) {
    return history;
  }

  if (history.length === 1) {
    const point = history[0];
    return Array.from({ length: MIN_RENDER_POINTS }, (_, index) => ({
      timestamp: point.timestamp - (MIN_RENDER_POINTS - 1 - index) * 60 * 60 * 1000,
      price: point.price,
    }));
  }

  const startTimestamp = history[0].timestamp;
  const endTimestamp = history[history.length - 1].timestamp;
  const totalDuration = Math.max(endTimestamp - startTimestamp, MIN_RENDER_POINTS - 1);
  const points = [];

  for (let index = 0; index < MIN_RENDER_POINTS; index += 1) {
    const ratio = index / (MIN_RENDER_POINTS - 1);
    const timestamp = startTimestamp + totalDuration * ratio;

    let leftIndex = 0;
    while (leftIndex < history.length - 1 && history[leftIndex + 1].timestamp < timestamp) {
      leftIndex += 1;
    }

    const left = history[leftIndex];
    const right = history[Math.min(leftIndex + 1, history.length - 1)];

    if (!right || left.timestamp === right.timestamp) {
      points.push({ timestamp, price: left.price });
      continue;
    }

    const segmentRatio =
      (timestamp - left.timestamp) / Math.max(right.timestamp - left.timestamp, 1);
    const linearPrice = left.price + (right.price - left.price) * segmentRatio;
    const wave = Math.sin(ratio * Math.PI * Math.max(history.length - 1, 1)) * 0.35;
    const amplitude = Math.max(Math.abs(right.price - left.price), 0.6);
    const price = Math.max(0, Math.min(100, linearPrice + wave * amplitude));

    points.push({
      timestamp,
      price: Math.round(price * 10) / 10,
    });
  }

  return points;
};

const buildSeriesPath = (history, scaleX, scaleY) =>
  history
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${scaleX(point.timestamp).toFixed(2)} ${scaleY(point.price).toFixed(2)}`,
    )
    .join(" ");

const buildSeriesShadowPath = (history, scaleX, scaleY) =>
  history
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"} ${scaleX(point.timestamp).toFixed(2)} ${(scaleY(point.price) + 1).toFixed(2)}`,
    )
    .join(" ");

const getProbabilitySortValue = market =>
  Number.isFinite(Number(market?.yesPercent)) ? Number(market.yesPercent) : -Infinity;

const getVisibleSeries = markets =>
  [...markets]
    .sort((left, right) => getProbabilitySortValue(right) - getProbabilitySortValue(left))
    .slice(0, MAX_VISIBLE_SERIES);

const estimateTextWidth = text => String(text || "").length * 8.5;

const truncateLabel = (label, maxWidth) => {
  const normalizedLabel = String(label || "");
  const maxCharacters = Math.max(8, Math.floor(maxWidth / 8.5));

  if (normalizedLabel.length <= maxCharacters) {
    return normalizedLabel;
  }

  return `${normalizedLabel.slice(0, Math.max(maxCharacters - 1, 1))}…`;
};

const getPointAtTimestamp = (history, timestamp) => {
  if (!Array.isArray(history) || history.length === 0) {
    return null;
  }

  if (timestamp <= history[0].timestamp) {
    return history[0];
  }

  if (timestamp >= history[history.length - 1].timestamp) {
    return history[history.length - 1];
  }

  for (let index = 0; index < history.length - 1; index += 1) {
    const left = history[index];
    const right = history[index + 1];

    if (timestamp >= left.timestamp && timestamp <= right.timestamp) {
      if (left.timestamp === right.timestamp) {
        return left;
      }

      const ratio = (timestamp - left.timestamp) / (right.timestamp - left.timestamp);
      return {
        timestamp,
        price: left.price + (right.price - left.price) * ratio,
      };
    }
  }

  return history[history.length - 1];
};

const splitHistoryByTimestamp = (history, timestamp) => {
  if (!Array.isArray(history) || history.length === 0) {
    return { active: [], muted: [] };
  }

  const hoverPoint = getPointAtTimestamp(history, timestamp);
  const active = [];
  const muted = [];

  for (const point of history) {
    if (point.timestamp <= timestamp) {
      active.push(point);
    } else {
      muted.push(point);
    }
  }

  if (active.length === 0) {
    active.push(history[0]);
  }

  if (hoverPoint) {
    const lastActive = active[active.length - 1];
    if (!lastActive || lastActive.timestamp !== hoverPoint.timestamp) {
      active.push(hoverPoint);
    }

    const firstMuted = muted[0];
    if (firstMuted) {
      if (firstMuted.timestamp !== hoverPoint.timestamp) {
        muted.unshift(hoverPoint);
      } else {
        muted[0] = hoverPoint;
      }
    }
  }

  return { active, muted };
};

const adjustHoverLabels = (items, minY, maxY) => {
  const sorted = [...items].sort((left, right) => left.labelY - right.labelY);

  for (let index = 1; index < sorted.length; index += 1) {
    const previous = sorted[index - 1];
    const current = sorted[index];
    if (current.labelY - previous.labelY < HOVER_LABEL_HEIGHT + HOVER_LABEL_GAP) {
      current.labelY = previous.labelY + HOVER_LABEL_HEIGHT + HOVER_LABEL_GAP;
    }
  }

  const overflow = sorted[sorted.length - 1]?.labelY - maxY;
  if (overflow > 0) {
    for (let index = sorted.length - 1; index >= 0; index -= 1) {
      sorted[index].labelY -= overflow;
    }
  }

  const underflow = minY - (sorted[0]?.labelY ?? minY);
  if (underflow > 0) {
    for (let index = 0; index < sorted.length; index += 1) {
      sorted[index].labelY += underflow;
    }
  }

  return sorted;
};

const JsonLd = ({ title, description, url }) => {
  const payload = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url,
    publisher: {
      "@type": "Organization",
      name: "Polymarket",
      url: "https://polymarket.com",
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(payload),
      }}
    />
  );
};

function EventEmbedFigure({ group }) {
  const containerRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [hoverX, setHoverX] = useState(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const updateSize = () => {
      const nextWidth = container.getBoundingClientRect().width;
      setWidth(nextWidth);
    };

    updateSize();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", updateSize);
      return () => window.removeEventListener("resize", updateSize);
    }

    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  const visibleSeries = useMemo(
    () =>
      getVisibleSeries(group.series).map((market, index) => ({
        ...market,
        color: COLORS[index % COLORS.length],
        shortLabel: market.seriesLabel || market.label || market.question,
        history: densifyHistory(normalizeHistory(market.history)),
      })),
    [group.series],
  );

  const geometry = useMemo(() => {
    if (width <= 0 || visibleSeries.length === 0) {
      return null;
    }

    const allPoints = visibleSeries.flatMap(item => item.history);
    if (allPoints.length === 0) {
      return null;
    }

    const minTimestamp = Math.min(...allPoints.map(point => point.timestamp));
    const maxTimestamp = Math.max(...allPoints.map(point => point.timestamp));
    const plotWidth = Math.max(width - LEFT_GUTTER - RIGHT_GUTTER, 160);
    const plotHeight = CHART_HEIGHT - PLOT_TOP - PLOT_BOTTOM;
    const xRange = Math.max(maxTimestamp - minTimestamp, 1);

    const scaleX = timestamp => LEFT_GUTTER + ((timestamp - minTimestamp) / xRange) * plotWidth;
    const yDomain = buildPriceDomain(allPoints);
    const yRange = Math.max(yDomain.max - yDomain.min, 1);
    const scaleY = price =>
      PLOT_TOP + (1 - (clampPercent(price) - yDomain.min) / yRange) * plotHeight;

    const dayTicks = [];
    const dayCount = Math.min(6, Math.max(3, Math.floor(xRange / (24 * 60 * 60 * 1000)) + 1));
    for (let index = 0; index < dayCount; index += 1) {
      const ratio = dayCount === 1 ? 0 : index / (dayCount - 1);
      const timestamp = minTimestamp + xRange * ratio;
      dayTicks.push({
        x: scaleX(timestamp),
        label: formatTimeLabel(timestamp),
      });
    }

    const endpoints = visibleSeries
      .map(item => {
        const point =
          hoverX === null
            ? item.history[item.history.length - 1]
            : getPointAtTimestamp(
                item.history,
                minTimestamp + ((hoverX - LEFT_GUTTER) / Math.max(plotWidth, 1)) * xRange,
              );

        if (!point) {
          return null;
        }

        return {
          id: item.id,
          color: item.color,
          label: item.shortLabel,
          percent: formatPercent(point.price),
          x: scaleX(point.timestamp),
          y: scaleY(point.price),
          labelY: scaleY(point.price),
        };
      })
      .filter(Boolean);

    const adjustedEndpoints = adjustHoverLabels(
      endpoints.map(item => ({ ...item })),
      PLOT_TOP + 8,
      CHART_HEIGHT - PLOT_BOTTOM - HOVER_LABEL_HEIGHT - 8,
    );

    return {
      dayTicks,
      hoverTimestamp:
        hoverX === null
          ? null
          : minTimestamp + ((hoverX - LEFT_GUTTER) / Math.max(plotWidth, 1)) * xRange,
      plotEndX: LEFT_GUTTER + plotWidth,
      plotWidth,
      scaleX,
      scaleY,
      adjustedEndpoints,
    };
  }, [hoverX, visibleSeries, width]);

  const description = visibleSeries
    .map(item => `${item.shortLabel} ${formatPercent(item.yesPercent)}`)
    .join(" · ");

  const hoverLabel = geometry?.hoverTimestamp
    ? new Date(geometry.hoverTimestamp).toLocaleString("zh-CN", {
        month: "numeric",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      })
    : null;
  const chartTitle = truncateLabel(
    group.title,
    Math.max(96, Math.max(width, 320) - LEFT_GUTTER - RIGHT_GUTTER - CHART_TITLE_RESERVED_WIDTH),
  );

  return (
    <figure
      ref={containerRef}
      className="relative m-0 w-full max-w-[920px] overflow-hidden border border-[var(--pm-border)] bg-[var(--pm-bg)] p-5 text-[var(--pm-title)] [--pm-axis:#94A3B8] [--pm-bg:#FFFFFF] [--pm-border:#E2E8F0] [--pm-hover-line:#CBD5E1] [--pm-hover-line-idle:#E2E8F0] [--pm-muted:#64748B] [--pm-muted-line:#94A3B8] [--pm-shadow-path:rgba(15,23,42,0.12)] [--pm-title:#0F172A] [--pm-tooltip-bg:#FFFFFF] [--pm-tooltip-border:#CBD5E1] [--pm-tooltip-text:#0F172A] dark:[--pm-axis:#334253] dark:[--pm-bg:#18181B] dark:[--pm-border:#151A21] dark:[--pm-hover-line:#334155] dark:[--pm-hover-line-idle:#151A20] dark:[--pm-muted:#91A0B4] dark:[--pm-muted-line:#48515D] dark:[--pm-shadow-path:rgba(0,0,0,0.18)] dark:[--pm-title:#F3F5F7] dark:[--pm-tooltip-bg:#0A0D11] dark:[--pm-tooltip-border:#293240] dark:[--pm-tooltip-text:#F3F5F7]"
      aria-label={`prediction market: ${group.title}`}
      itemScope
      itemType="https://schema.org/WebPage"
    >
      <JsonLd
        title={group.title}
        description={`Prediction market: ${description} on Polymarket.`}
        url={group.url}
      />

      {geometry ? (
        <svg
          viewBox={`0 0 ${Math.max(width, 320)} ${CHART_HEIGHT}`}
          className="block h-[420px] w-full"
          onMouseLeave={() => setHoverX(null)}
          onMouseMove={event => {
            const rect = event.currentTarget.getBoundingClientRect();
            const nextX = ((event.clientX - rect.left) / rect.width) * Math.max(width, 320);
            const boundedX = Math.max(LEFT_GUTTER, Math.min(geometry.plotEndX, nextX));
            setHoverX(boundedX);
          }}
        >
          <text
            x={LEFT_GUTTER}
            y={CHART_TITLE_Y}
            fill="var(--pm-title)"
            fontSize="26"
            fontWeight="700"
          >
            <title>{group.title}</title>
            {chartTitle}
          </text>

          <foreignObject x={LEFT_GUTTER} y={CHART_LEGEND_Y} width={geometry.plotWidth} height="34">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] leading-none text-[var(--pm-muted)]">
              {visibleSeries.map(item => (
                <div key={item.id} className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 shrink-0 rounded-full shadow-[0_0_0_2px_rgba(255,255,255,0.02)]"
                    style={{ backgroundColor: item.color }}
                  />
                  <span>
                    {item.shortLabel}{" "}
                    <span className="font-semibold text-[var(--pm-title)]">
                      {formatPercent(item.yesPercent)}
                    </span>
                  </span>
                </div>
              ))}
            </div>
          </foreignObject>

          <line
            x1={hoverX ?? geometry.plotEndX}
            x2={hoverX ?? geometry.plotEndX}
            y1={PLOT_TOP - 6}
            y2={CHART_HEIGHT - PLOT_BOTTOM + 4}
            stroke={hoverX === null ? "var(--pm-hover-line-idle)" : "var(--pm-hover-line)"}
            strokeWidth="1.5"
          />

          {visibleSeries.map(item => {
            const split =
              hoverX === null || geometry.hoverTimestamp === null
                ? { active: item.history, muted: [] }
                : splitHistoryByTimestamp(item.history, geometry.hoverTimestamp);
            const activePath = buildSeriesPath(split.active, geometry.scaleX, geometry.scaleY);
            const activeShadowPath = buildSeriesShadowPath(
              split.active,
              geometry.scaleX,
              geometry.scaleY,
            );
            const mutedPath = buildSeriesPath(split.muted, geometry.scaleX, geometry.scaleY);

            return (
              <g key={item.id}>
                <path
                  d={activeShadowPath}
                  fill="none"
                  stroke="var(--pm-shadow-path)"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d={activePath}
                  fill="none"
                  stroke={item.color}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                {mutedPath && (
                  <path
                    d={mutedPath}
                    fill="none"
                    stroke="var(--pm-muted-line)"
                    strokeWidth="3"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity="0.75"
                  />
                )}
              </g>
            );
          })}

          {geometry.adjustedEndpoints.map(item => (
            <g key={item.id}>
              <circle cx={item.x} cy={item.y} r="6" fill={item.color} />
              {hoverX !== null && (
                <circle cx={item.x} cy={item.y} r="11" fill={item.color} opacity="0.16" />
              )}
              {hoverX !== null &&
                (() => {
                  const percentWidth = estimateTextWidth(item.percent);
                  const labelMaxWidth = Math.max(
                    72,
                    Math.min(
                      HOVER_LABEL_MAX_WIDTH - percentWidth - HOVER_LABEL_PADDING_X * 2 - 10,
                      Math.max(width, 320) - LEFT_GUTTER - RIGHT_GUTTER - percentWidth - 64,
                    ),
                  );
                  const visibleLabel = truncateLabel(item.label, labelMaxWidth);
                  const labelWidth = Math.min(
                    HOVER_LABEL_MAX_WIDTH,
                    Math.max(
                      126,
                      estimateTextWidth(visibleLabel) +
                        percentWidth +
                        HOVER_LABEL_PADDING_X * 2 +
                        12,
                    ),
                  );
                  const chartRight = Math.max(width, 320) - 8;
                  const preferRight = item.x + 16 + labelWidth <= chartRight;
                  const labelX = preferRight
                    ? item.x + 16
                    : Math.max(LEFT_GUTTER, item.x - labelWidth - 16);

                  return (
                    <g>
                      <rect
                        x={labelX}
                        y={item.labelY - HOVER_LABEL_HEIGHT / 2}
                        rx="10"
                        ry="10"
                        width={labelWidth}
                        height={HOVER_LABEL_HEIGHT}
                        fill="var(--pm-tooltip-bg)"
                        stroke="var(--pm-tooltip-border)"
                      />
                      <rect
                        x={labelX + 9}
                        y={item.labelY - 11}
                        width="6"
                        height="22"
                        rx="3"
                        fill={item.color}
                      />
                      <text
                        x={labelX + HOVER_LABEL_PADDING_X + 8}
                        y={item.labelY + 1}
                        fill="var(--pm-tooltip-text)"
                        fontSize="15"
                        fontWeight="600"
                        dominantBaseline="middle"
                      >
                        <title>{item.label}</title>
                        {visibleLabel}
                      </text>
                      <text
                        x={labelX + labelWidth - HOVER_LABEL_PADDING_X}
                        y={item.labelY + 1}
                        fill="var(--pm-muted)"
                        fontSize="15"
                        fontWeight="600"
                        dominantBaseline="middle"
                        textAnchor="end"
                      >
                        {item.percent}
                      </text>
                    </g>
                  );
                })()}
            </g>
          ))}

          {hoverLabel && (
            <text
              x={Math.max(width, 320) - RIGHT_GUTTER}
              y={PLOT_TOP - 16}
              fill="var(--pm-muted)"
              fontSize="14"
              textAnchor="end"
            >
              {hoverLabel}
            </text>
          )}

          {geometry.dayTicks.map(tick => (
            <text
              key={`${tick.x}-${tick.label}`}
              x={tick.x}
              y={CHART_HEIGHT - 18}
              fill="var(--pm-axis)"
              fontSize="14"
              textAnchor="middle"
            >
              {tick.label}
            </text>
          ))}
        </svg>
      ) : (
        <div className="flex h-[420px] items-center justify-center text-sm text-[var(--pm-muted)]">
          暂无走势图数据
        </div>
      )}

      <figcaption className="sr-only">
        <strong>{group.title}</strong>
        <br />
        {description}
        <br />
        <a href={group.url}>View full market &amp; trade on Polymarket</a>
      </figcaption>
    </figure>
  );
}

export default function PolymarketProbabilityBoard({ markets }) {
  const groups = useMemo(() => buildGroups(markets || []), [markets]);

  if (groups.length === 0) {
    return (
      <div className="rounded-3xl border border-zinc-200 bg-zinc-50 px-5 py-8 text-center text-sm text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900/70 dark:text-zinc-400">
        暂时没有可展示的事件概率数据。
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-2">
      {groups.map(group => (
        <EventEmbedFigure key={group.id} group={group} />
      ))}
    </div>
  );
}
