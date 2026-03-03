import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

const SETTINGS_KEY = 'ytdownloader-settings';

interface Settings {
    downloadDir: string;
    language: 'tr' | 'en';
}

const defaultSettings: Settings = {
    downloadDir: '',
    language: 'tr',
};

interface SettingsContextType {
    downloadDir: string;
    language: 'tr' | 'en';
    setDownloadDir: (dir: string) => void;
    setLanguage: (lang: 'tr' | 'en') => void;
    selectFolder: () => Promise<string | null>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export const SettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<Settings>(() => {
        try {
            const stored = localStorage.getItem(SETTINGS_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                if (parsed && typeof parsed === 'object') {
                    return {
                        downloadDir: typeof parsed.downloadDir === 'string' ? parsed.downloadDir : defaultSettings.downloadDir,
                        language: (parsed.language === 'tr' || parsed.language === 'en') ? parsed.language : defaultSettings.language
                    };
                }
            }
        } catch (e) {
            console.error("Error loading settings:", e);
        }
        return defaultSettings;
    });

    useEffect(() => {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }, [settings]);

    const selectFolder = useCallback(async () => {
        try {
            const selected = await open({
                directory: true,
                multiple: false,
                title: 'Select Download Folder',
            });
            if (selected && typeof selected === 'string') {
                setSettings(prev => ({ ...prev, downloadDir: selected }));
                return selected;
            }
        } catch {
            // Dialog error
        }
        return null;
    }, []);

    const setDownloadDir = useCallback((dir: string) => {
        setSettings(prev => ({ ...prev, downloadDir: dir }));
    }, []);

    const setLanguage = useCallback((lang: 'tr' | 'en') => {
        setSettings(prev => ({ ...prev, language: lang }));
    }, []);

    return (
        <SettingsContext.Provider value={{
            downloadDir: settings.downloadDir,
            language: settings.language,
            setDownloadDir,
            setLanguage,
            selectFolder
        }}>
            {children}
        </SettingsContext.Provider>
    );
};

export const useSettingsContext = () => {
    const context = useContext(SettingsContext);
    if (!context) {
        throw new Error('useSettingsContext must be used within a SettingsProvider');
    }
    return context;
};
