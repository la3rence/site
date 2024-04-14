import { useRouter } from "next/router";
import en from "../lib/locales/en.json";
import zh from "../lib/locales/zh.json";

// HoC for i18n of site menus, headers, footers...
function withLocalization(Component) {
  return function WithLocalization(props) {
    const router = useRouter();
    const { locale } = router;
    let translations;

    switch (locale) {
      case "en":
        translations = en;
        break;
      case "zh":
        translations = zh;
        break;
      default:
        translations = en;
    }
    return <Component {...props} translations={translations} />;
  };
}

export default withLocalization;
