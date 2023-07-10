import App from "next/app";
import { Analytics } from "@vercel/analytics/react";
import Umami from "../components/analytics";
import { ThemeProvider } from "next-themes";
import "./../styles/globals.css";
import { SessionProvider } from "next-auth/react";

class Site extends App {
  render() {
    const { Component, pageProps, session } = this.props;
    return (
      <SessionProvider session={session}>
        <ThemeProvider storageKey="theme" attribute="class">
          <Component {...pageProps} />
        </ThemeProvider>
        <Umami />
        <Analytics />
      </SessionProvider>
    );
  }
}
export default Site;
