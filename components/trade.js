import React, { useState, useEffect, useRef } from "react";
import config from "../lib/config.mjs";

/**
 * Real-time stock price. Just for fun :)
 *
 * @param {string} company
 */
const Trade = ({ symbol }) => {
  const [price, setPrice] = useState(0);
  const [previous, setPrevious] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);

  useEffect(() => {
    const fetchPrevious = async () => {
      const res = await fetch(`https://trade.${config.domain}/quote?symbol=${symbol}`);
      const json = await res.json();
      const floatString = json?.pc;
      const float = Number.parseFloat(floatString);
      setPrevious(float);
    };
    fetchPrevious();

    const createWebSocket = () => {
      const socket = new WebSocket(`wss://trade.${config.domain}`);

      socket.onopen = () => {
        console.log("WebSocket connection established");
        setIsConnected(true);
        socket.send(JSON.stringify({ type: "subscribe", symbol: symbol }));
      };

      socket.onmessage = event => {
        console.debug(event.data);
        let receivedData = {};
        try {
          receivedData = JSON.parse(event.data);
        } catch (error) {
          console.warn("websocket data parse failed", event.data);
        }
        if (receivedData && receivedData?.data) {
          const floatString = receivedData?.data[0]?.p;
          if (receivedData?.data[0]?.s === symbol) {
            const float = Number.parseFloat(floatString);
            setPrice(float.toFixed(2));
          }
        }
      };

      socket.onerror = error => {
        console.error("WebSocket error:", error);
      };

      socket.onclose = () => {
        setIsConnected(false);
        console.log("WebSocket connection closed. Reconnecting...");
        setTimeout(createWebSocket, 1000);
      };
      wsRef.current = socket;
    };

    createWebSocket();

    // 清理函数
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [symbol]);

  // fallback the t-1 price
  if (!price || price == 0 || !isConnected) {
    return <span className="font-bold">■{previous}$</span>;
  }

  return (
    <span className={`font-bold ${previous > price ? "text-green-600" : "text-red-600"} `}>
      {previous < price ? "▲" : "▼"}
      {price}$
    </span>
  );
};

export default Trade;
