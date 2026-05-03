import A from "./a";
import config from "../lib/config.mjs";
import withLocalization from "./withI18n";

const { copyrightYear, siteTitle } = config;

const Footer = ({ translations }) => {
  return (
    <footer className="text-sm mx-4 mt-16 mb-24 text-center">
      <div className="mt-0">
        <A href="/privacy" self="true">
          <span className="mr-1">{translations["Privacy"]}</span>
        </A>
        ·{" "}
        <A href="https://status.lawrenceli.me/">
          <span className="mr-1">{translations["Status"]}</span>
        </A>
        · <span>{copyrightYear} ©️ </span>
        <A href="/" self="true">
          <span>{siteTitle}</span>
        </A>
      </div>
    </footer>
  );
};

// footer component
export default withLocalization(Footer);
