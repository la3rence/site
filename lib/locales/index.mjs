// you can add more localization json like this and export
import en from "./en.json" with { type: "json" };
import zh from "./zh.json" with { type: "json" };

export const getTranslations = locale => {
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
  return translations;
};
