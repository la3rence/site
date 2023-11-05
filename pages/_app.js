import App from "next/app";
import { ThemeProvider } from "next-themes";
import "../styles/globals.css";
import "../styles/gist.css";
import config from "../lib/config.mjs";
import Umami from "../components/analytics";

class Site extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <>
        <ThemeProvider storageKey="theme" attribute="class">
          <Component {...pageProps} />
        </ThemeProvider>
        {config.enableAnalytics && <Umami />}
      </>
    );
  }
}
export default Site;
