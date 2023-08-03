import App from "next/app";
import Umami from "../components/analytics";
import { ThemeProvider } from "next-themes";
import "./../styles/globals.css";

class Site extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <>
        <ThemeProvider storageKey="theme" attribute="class">
          <Component {...pageProps} />
        </ThemeProvider>
        <Umami />
      </>
    );
  }
}
export default Site;
