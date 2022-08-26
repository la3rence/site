import App from "next/app";
import { ThemeProvider } from "next-themes";
import "./../styles/globals.css";

class Site extends App {
  render() {
    const { Component, pageProps } = this.props;
    return (
      <ThemeProvider storageKey="">
        <Component {...pageProps} />
      </ThemeProvider>
    );
  }
}
export default Site;
