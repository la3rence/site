import Image from "next/image";
import { useState } from "react";
import cfg from "../lib/config.mjs";

export default function RewardImages({ text, translations }) {
  const [copied, setCopied] = useState(false);
  const eth = cfg.ethAddress;

  const copyEth = async () => {
    try {
      await navigator.clipboard.writeText(eth);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      // fallback
    }
  };

  return (
    <div className="text-center">
      <div className="filter grayscale-50 contrast-200">
        <div>
          <Image
            className="inline-block dark:invert mx-5 my-0"
            src="/images/alipay.svg"
            width={120}
            height={120}
            alt="qrcode-alipay"
          ></Image>
          <Image
            className="inline-block dark:invert mx-5 mt-0 mb-0"
            src="/images/wechat-reward.png"
            width={100}
            height={100}
            alt="qrcode-alipay"
          ></Image>
        </div>
        <small>{text}</small>
      </div>
      {eth && (
        <div className="mt=0 mb-2">
          <div
            onClick={copyEth}
            className="flex items-center justify-center gap-1.5 cursor-pointer group"
          >
            <span className="text-xs text-zinc-400 dark:text-zinc-500">EVM</span>
            <span className="text-xs text-black dark:text-white whitespace-nowrap">
              {eth.slice(0, 6)}...{eth.slice(-4)}
            </span>
            <span className="text-xs text-zinc-400 dark:text-zinc-500 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
              {copied ? translations["Copied"] : translations["Copy"]}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
