import A, { Icon } from "./a";
import config from "../lib/config.mjs";
import QRCode from "react-qr-code";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { SocialIcon } from "react-social-icons";

let { siteTitle, twitter, github, authorEmail } = config;

const Footer = () => {
  let [showQR, setShouQR] = useState(false);
  const showQRCode = () => setShouQR(!showQR);
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const QR = () => (
    <div className={"p-1 border inline-block mt-2"}>
      <QRCode
        value={window.location.href}
        size={64}
        bgColor="#fff"
        fgColor="#222"
      />
    </div>
  );

  if (!mounted) {
    return null;
  }

  return (
    <div className="mx-4 mt-16 mb-24 text-sm text-gray-400 text-center">
      <Icon network="twitter" url={`https://twitter.com/${twitter}`} />
      <Icon network="email" url={`mailto:${authorEmail}`} />
      <Icon network="github" url={`https://github.com/${github}`} />
      {/* <Icon onClick={showQRCode} /> */}
      {/* <SocialIcon
        network="tiktok"
        style={{ height: 20, width: 20 }}
        className="ml-2 cursor-pointer hover:scale-150 hover:transition-transform rounded-full border-2 border-zinc-300 dark:border-zinc-600"
        bgColor="#999"
        fgColor="#999"
        onClick={() => {
          if (theme === "light") {
            setTheme("dark");
          } else {
            setTheme("light");
          }
        }}
      /> */}
      <div className="mt-2">
        <A href="/" self="true">
          {new Date().getFullYear()} ©️{" "}
          <span className="underline">{siteTitle}</span>
        </A>
      </div>
      {/* {showQR && <QR />} */}
    </div>
  );
};

// footer component
export default Footer;
