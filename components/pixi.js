import { Stage, Graphics } from "@pixi/react";
import { useCallback, useEffect, useState } from "react";

export default function GraphicsExample() {
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    setLoaded(true);
  });
  const draw = useCallback(g => {
    g.clear();
    g.beginFill(0x000000);
    g.lineStyle(4, 0x000000, 1);
    g.moveTo(250, 50);
    g.lineTo(190, 150);
    g.lineTo(310, 150);
    g.endFill();
    g.lineStyle(2, 0x000000, 1);
    g.beginFill(0x000000, 1);
    g.drawRect(350, 50, 100, 100);
    g.endFill();
    g.lineStyle(0);
    g.beginFill(0x000000, 0.9);
    g.drawCircle(100, 100, 55);
    g.endFill();
  }, []);

  if (!loaded) return <div className="h-[200px] w-full"></div>;

  return (
    <div className="h-[200px]">
      <div className="absolute left-0 w-full flex items-center justify-center p-0 ">
        <div className="w-1/3 h-[200px] bg-[#eee] "></div>
        <div className="overflow-x-auto">
          <Stage
            width={768}
            height={200}
            options={{ backgroundColor: 0xeeeeee }}
          >
            <Graphics draw={draw} />
          </Stage>
        </div>
        <div className="w-1/3 h-[200px] bg-[#eee]"></div>
      </div>
    </div>
  );
}
