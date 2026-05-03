import Image from "next/image";
import { useState } from "react";
import cfg from "../lib/config.mjs";

export default function RewardImages({ text, translations }) {
  const [copied, setCopied] = useState(false);
  const eth = cfg.ethAddress;
  const rewardURL = cfg.rewardURL;

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
      <div>
        <div className="flex flex-wrap items-center justify-center gap-4 my-4">
          <div className="size-[168px] bg-white rounded-md border border-zinc-200 flex items-center justify-center overflow-hidden">
            {rewardURL ? (
              <a href={rewardURL} target="_blank" rel="noopener noreferrer">
                <Image
                  className="block size-[196px] object-contain"
                  src="/images/alipay.svg"
                  width={196}
                  height={196}
                  alt="qrcode-alipay"
                ></Image>
              </a>
            ) : (
              <Image
                className="block size-[196px] object-contain"
                src="/images/alipay.svg"
                width={196}
                height={196}
                alt="qrcode-alipay"
              ></Image>
            )}
          </div>
          <div className="size-[168px] bg-white p-3 rounded-md border border-zinc-200 flex items-center justify-center">
            <Image
              className="block size-36 object-contain"
              src="/images/wechat-reward.png"
              width={144}
              height={144}
              alt="qrcode-wechat-reward"
            ></Image>
          </div>
        </div>
        {text && <small>{text}</small>}
      </div>
      {eth && (
        <div className="mt-0 mb-2">
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
