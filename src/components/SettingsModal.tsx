import React from 'react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    downloadDir: string;
    onSelectFolder: () => Promise<string | null>;
}
import { useTranslation } from '../hooks/useTranslation';
import { useSettings } from '../hooks/useSettings';
import Tooltip from './Tooltip';

export const SettingsModal: React.FC<SettingsModalProps> = ({
    isOpen,
    onClose,
    downloadDir,
    onSelectFolder,
}) => {
    const { t } = useTranslation();
    const { language, setLanguage } = useSettings();
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative bg-neutral-900 border border-white/10 rounded-2xl shadow-2xl shadow-black/50 w-full max-w-md mx-4 animate-fadeIn"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-white/10">
                    <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {t('settings.title')}
                    </h2>
                    <Tooltip text={t('common.close')}>
                        <button
                            onClick={onClose}
                            className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </Tooltip>
                </div>

                {/* Content */}
                <div className="p-5 space-y-4">
                    <div>
                        <label className="text-sm font-medium text-gray-300 mb-2 block">
                            {t('settings.downloadFolder')}
                        </label>
                        <div className="flex gap-2">
                            <div className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-gray-300 truncate min-h-[40px] flex items-center">
                                {downloadDir || (
                                    <span className="text-gray-500 italic">
                                        {t('settings.folderNotSelected')}
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={onSelectFolder}
                                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-medium transition-all flex items-center gap-2 shrink-0"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                                {t('common.select')}
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            {t('settings.folderHelp')}
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/5 space-y-4">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                            </svg>
                            {t('settings.language')}
                        </label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setLanguage('tr')}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${language === 'tr'
                                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                Türkçe
                            </button>
                            <button
                                onClick={() => setLanguage('en')}
                                className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${language === 'en'
                                    ? 'bg-blue-500/10 border-blue-500 text-blue-400'
                                    : 'bg-white/5 border-transparent text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                English
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-5 border-t border-white/10">
                    <button
                        onClick={onClose}
                        className="w-full py-2.5 bg-white/10 hover:bg-white/15 rounded-xl text-sm font-medium transition-all border border-white/10"
                    >
                        {t('common.close')}
                    </button>
                </div>
            </div>
        </div>
    );
};
