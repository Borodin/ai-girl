import i18n from 'i18next';
import Backend from 'i18next-fs-backend';

export const initLang = async () => {
  return new Promise((resolve, reject) => {
    i18n.use(Backend).init(
      {
        lng: 'en',
        fallbackLng: 'en',
        preload: ['en', 'ru'],

        ns: ['translations'],
        defaultNS: 'translations',
        backend: {
          loadPath: './src/locales/{{lng}}.json',
        },
        interpolation: {
          escapeValue: false,
        },
      },
      (err, t) => {
        if (err) {
          reject(err);
        } else {
          resolve(t);
        }
      }
    );
  });
};
export default i18n;
