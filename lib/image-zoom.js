const noop = () => {};

const getSource = image => image.dataset.zoomSrc || image.currentSrc || image.src;

const isPlainClick = event => {
  return event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
};

export function createImageZoom(images, options = {}) {
  if (typeof document === "undefined") {
    return { detach: noop };
  }

  const targets = Array.from(images).filter(image => image instanceof HTMLImageElement);
  if (targets.length === 0) {
    return { detach: noop };
  }

  const {
    background = "rgba(0,0,0,0.3)",
    backdropFilter = "none",
    margin = 0,
    maxScale = 1.35,
  } = options;
  let active = null;

  const close = () => {
    if (!active) {
      return;
    }

    const { backdrop, image, onKeyDown, overflow } = active;
    active = null;
    document.removeEventListener("keydown", onKeyDown);
    document.body.style.overflow = overflow;
    backdrop.style.opacity = "0";
    image.style.transform = "scale(0.98)";
    window.setTimeout(() => backdrop.remove(), 180);
  };

  const open = sourceImage => {
    close();

    const src = getSource(sourceImage);
    if (!src) {
      return;
    }

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const naturalWidth = sourceImage.naturalWidth || sourceImage.width;
    const naturalHeight = sourceImage.naturalHeight || sourceImage.height;
    const scale = Math.min(
      (viewportWidth - margin * 2) / naturalWidth,
      (viewportHeight - margin * 2) / naturalHeight,
      maxScale,
    );

    const backdrop = document.createElement("div");
    backdrop.setAttribute("role", "presentation");
    backdrop.style.cssText = `
      position: fixed;
      inset: 0;
      z-index: 2147483647;
      display: grid;
      place-items: center;
      cursor: zoom-out;
      background: ${background};
      backdrop-filter: ${backdropFilter};
      -webkit-backdrop-filter: ${backdropFilter};
      opacity: 0;
      transition: opacity 180ms ease;
    `;

    const image = document.createElement("img");
    image.src = src;
    image.alt = sourceImage.alt || "";
    image.style.cssText = `
      width: ${naturalWidth * scale}px;
      height: ${naturalHeight * scale}px;
      max-width: calc(100vw - ${margin * 2}px);
      max-height: calc(100vh - ${margin * 2}px);
      object-fit: contain;
      cursor: zoom-out;
      filter: none;
      image-rendering: auto;
      user-select: none;
      transform: scale(0.98);
      transition: transform 180ms ease;
    `;

    const onKeyDown = event => {
      if (event.key === "Escape") {
        close();
      }
    };

    backdrop.addEventListener("click", close);
    image.addEventListener("click", close);
    backdrop.appendChild(image);
    document.body.appendChild(backdrop);
    document.addEventListener("keydown", onKeyDown);

    active = { backdrop, image, onKeyDown, overflow: document.body.style.overflow };
    document.body.style.overflow = "hidden";
    window.requestAnimationFrame(() => {
      backdrop.style.opacity = "1";
      image.style.transform = "scale(1)";
    });
  };

  const onClick = event => {
    if (isPlainClick(event)) {
      event.preventDefault();
      open(event.currentTarget);
    }
  };

  targets.forEach(image => {
    image.style.cursor = "zoom-in";
    image.addEventListener("click", onClick);
  });

  return {
    detach() {
      close();
      targets.forEach(image => image.removeEventListener("click", onClick));
    },
  };
}
