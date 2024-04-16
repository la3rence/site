import { useRouter } from "next/router";
import { getTranslations } from "../lib/locales/index.mjs";

// HoC for i18n of site menus, headers, footers...
function withLocalization(Component) {
  return function WithLocalization(props) {
    const router = useRouter();
    const translations = getTranslations(router.locale);
    return <Component {...props} translations={translations} />;
  };
}

export default withLocalization;
