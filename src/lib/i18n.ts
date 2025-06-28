
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";

import fr from "../locales/fr/common.json";
import ar from "../locales/ar/common.json";

const resources = {
  fr: {
    translation: fr,
  },
  ar: {
    translation: ar,
  },
};

i18n.use(initReactI18next).init({
  resources,
  lng: Localization.locale,
  fallbackLng: "fr",
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
});

export default i18n;
