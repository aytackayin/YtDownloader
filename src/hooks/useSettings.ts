import { useSettingsContext } from '../context/SettingsContext';

export const useSettings = () => {
    const { downloadDir, language, setDownloadDir, setLanguage, selectFolder } = useSettingsContext();

    return {
        downloadDir,
        language,
        setDownloadDir,
        setLanguage,
        selectFolder,
    };
};
