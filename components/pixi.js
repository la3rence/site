import { Stage, Graphics } from "@pixi/react";
import { useCallback, useEffect, useState } from "react";

export default function GraphicsExample() {
  const [loaded, setLoaded] = useState(false);
  const [windowWidth, setWindowWidth] = useState(768);
  let offset = 300;
  const draw = useCallback((g, offset) => {
    g.clear();
    g.beginFill(0x000000);
    g.lineStyle(4, 0x000000, 1);
    g.moveTo(offset + 250, 50);
    g.lineTo(offset + 190, 150);
    g.lineTo(offset + 310, 150);
    g.endFill();
    g.lineStyle(2, 0x000000, 1);
    g.beginFill(0x000000, 1);
    g.drawRect(offset + 350, 50, 100, 100);
    g.endFill();
    g.lineStyle(0);
    g.beginFill(0x000000, 0.9);
    g.drawCircle(offset + 100, 100, 55);
    g.endFill();
  }, []);

  useEffect(() => {
    setLoaded(true);
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    window.addEventListener("resize", handleResize);
    // console.debug(windowWidth);
    if (windowWidth < 700) {
      offset = 0;
    }
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, [windowWidth]);

  if (!loaded) return <div className="h-[200px] w-full"></div>;

  return (
    <div className="h-[200px]">
      <div className="absolute left-0 w-full">
        <div className="overflow-x-auto">
          <Stage
            width={window.innerWidth}
            height={200}
            options={{ backgroundColor: 0xeeeeee }}
          >
            <Graphics draw={g => draw(g, offset)} />
          </Stage>
        </div>
      </div>
    </div>
  );
}
