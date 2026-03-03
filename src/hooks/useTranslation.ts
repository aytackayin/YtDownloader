import { useSettings } from './useSettings';
import tr from '../locales/tr.json';
import en from '../locales/en.json';

const translations = { tr, en };

export const useTranslation = () => {
    const { language } = useSettings();

    const t = (path: string, params?: Record<string, string | number>) => {
        const keys = path.split('.');
        let current: any = translations[language];

        for (const key of keys) {
            if (current && current[key]) {
                current = current[key];
            } else {
                return path; // Return path if key not found
            }
        }

        if (typeof current !== 'string') return path;

        let result = current;
        if (params) {
            Object.entries(params).forEach(([key, value]) => {
                result = result.replace(`{${key}}`, String(value));
            });
        }

        return result;
    };

    return { t, language };
};
