import A, { Icon } from "./a";
import config from "./../lib/config.json";
import QRCode from "react-qr-code";
import { useState } from "react";
let { siteTitle, twitter, github, authorEmail } = config;

const Contact = () => {
  let [showQR, setShouQR] = useState(false);
  const showQRCode = () => setShouQR(!showQR);

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
  return (
    <div className="mx-4 my-16 text-sm text-gray-400 text-center">
      <Icon network="twitter" url={`https://twitter.com/${twitter}`} />
      <Icon network="github" url={`https://github.com/${github}`} />
      <Icon network="email" url={`mailto:${authorEmail}`} />
      <Icon onClick={showQRCode} />
      <br />
      <A href="/" self="true">
        {new Date().getFullYear()} ©️ {siteTitle}
      </A>
      <br />
      {showQR && <QR />}
    </div>
  );
};

// footer component
export default Contact;
