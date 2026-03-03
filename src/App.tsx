import { useState, useEffect, useCallback } from 'react';
import { listen } from '@tauri-apps/api/event';
import { fetchMetadataFromApi, deleteVideoFiles } from './services/api';
import { useVideoList } from './hooks/useVideoList';
import { useDownloadManager } from './hooks/useDownloadManager';
import { useSettings } from './hooks/useSettings';
import { VideoCard } from './components/VideoCard';
import { SettingsModal } from './components/SettingsModal';
import { useTranslation } from './hooks/useTranslation';
import { buildOutputPath, sanitizeFilename } from './utils/path';
import Tooltip from './components/Tooltip';
import type { MetadataResponse, PlaylistMetadataResponse, FetchResult } from './services/api';

function App() {
    const [url, setUrl] = useState('');
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const { t } = useTranslation();

    const { downloadDir, selectFolder } = useSettings();

    const {
        items,
        addSingleVideo,
        addPlaylistVideos,
        removeItem,
        toggleSelect,
        toggleSelectAll,
        setItemFormat,
        setItemResolution,
        updateItemStatus,
        clearList,
        getSelectedItems,
    } = useVideoList();

    const {
        isDownloading,
        isPaused,
        currentItemId,
        startDownload,
        pauseDownload,
        resumeDownload,
        cancelFullDownload,
        retryItem,
        removeFromQueue,
        addToQueue,
        updateItemInQueue,
    } = useDownloadManager({ updateItemStatus });

    const handleAddToList = useCallback(async (targetUrl?: string) => {
        const resolvedUrl = (targetUrl ?? url).trim();
        if (!resolvedUrl) return;
        setErrorMsg('');
        setIsAnalyzing(true);

        try {
            const data: FetchResult = await fetchMetadataFromApi(resolvedUrl);

            if (data.is_playlist && 'videos' in data) {
                const newItems = addPlaylistVideos(data as PlaylistMetadataResponse);
                if (isDownloading) addToQueue(newItems);
            } else {
                const singleData = data as MetadataResponse;
                const newItem = addSingleVideo(singleData, resolvedUrl);
                if (isDownloading && newItem) addToQueue([newItem]);
            }
            setUrl('');
        } catch (e) {
            setErrorMsg(String(e));
        } finally {
            setIsAnalyzing(false);
        }
    }, [url, addPlaylistVideos, addSingleVideo, isDownloading, addToQueue]);

    const handlePaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (text.trim()) {
                setUrl(text.trim());
            }
        } catch {
            // Clipboard access failed
        }
    };

    // Deep-link listener for browser extension
    useEffect(() => {
        let unlisten: (() => void) | null = null;

        const setup = async () => {
            unlisten = await listen<string>('deep-link-url', async (event) => {
                const receivedUrl = event.payload;
                if (receivedUrl) {
                    setUrl(receivedUrl);
                    await handleAddToList(receivedUrl);
                }
            });
        };
        setup();

        return () => {
            if (unlisten) unlisten();
        };
    }, [handleAddToList]);

    const handleRemoveItem = async (id: string) => {
        const item = items.find(i => i.id === id);
        if (item && downloadDir && (item.status === 'paused' || item.status === 'error' || item.status === 'downloading')) {
            const outDir = buildOutputPath(item.uploaderId, item.playlistTitle, downloadDir, item.sourcePlatform);
            const prefix = sanitizeFilename(item.title);
            deleteVideoFiles(outDir, prefix).catch(() => { });
        }
        removeFromQueue(id);
        removeItem(id);
    };

    const handleClearList = async () => {
        if (downloadDir) {
            for (const item of items) {
                if (item.status === 'paused' || item.status === 'error' || item.status === 'downloading') {
                    const outDir = buildOutputPath(item.uploaderId, item.playlistTitle, downloadDir, item.sourcePlatform);
                    const prefix = sanitizeFilename(item.title);
                    deleteVideoFiles(outDir, prefix).catch(() => { });
                }
                removeFromQueue(item.id);
            }
        }
        clearList();
    };

    const handleStartDownload = () => {
        if (!downloadDir) {
            setSettingsOpen(true);
            return;
        }
        const selected = getSelectedItems();
        if (selected.length === 0) return;
        startDownload(selected, downloadDir);
    };

    const handleRetry = (item: typeof items[0]) => {
        if (!downloadDir) {
            setSettingsOpen(true);
            return;
        }
        retryItem(item, downloadDir);
    };

    const handleUpdateResolutions = (id: string, resolutions: string[], defaultRes: string) => {
        updateItemStatus(id, { resolutions, resolution: defaultRes } as any);
        updateItemInQueue(id, { resolutions, resolution: defaultRes } as any);
    };

    const handleFormatChange = (id: string, format: 'mp4' | 'mp3') => {
        setItemFormat(id, format);
        updateItemInQueue(id, { format });
    };

    const handleResolutionChange = (id: string, resolution: string) => {
        setItemResolution(id, resolution);
        updateItemInQueue(id, { resolution });
    };

    const selectedCount = items.filter(i => i.selected).length;
    const allSelected = items.length > 0 && items.every(i => i.selected);
    const hasItems = items.length > 0;

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            if (url.trim()) handleAddToList();
        }
    };

    return (
        <div className="h-screen bg-neutral-900 text-gray-100 font-sans selection:bg-blue-500/30 flex flex-col overflow-hidden">
            {/* Header / URL Input Area */}
            <header className="flex items-center gap-4 px-6 py-3 border-b border-white/10 shrink-0">
                <div className="flex-1 flex gap-3">
                    <div className="flex-1 relative group">
                        <input
                            id="video-url"
                            name="video-url"
                            type="text"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={handleKeyDown}
                            autoComplete="off"
                            placeholder={t('header.urlPlaceholder')}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-4 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                            disabled={isAnalyzing}
                        />
                        {url && !isAnalyzing && (
                            <Tooltip text={t('common.clear')}>
                                <button
                                    onClick={() => setUrl('')}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-300 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </Tooltip>
                        )}
                    </div>

                    {/* Dynamic button: Paste when empty, Add to List when not */}
                    {isAnalyzing ? (
                        <button
                            disabled
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-500/20 text-blue-300 text-sm font-medium border border-blue-500/20 min-w-[130px] justify-center"
                        >
                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                            {t('header.analyzing')}
                        </button>
                    ) : !url.trim() ? (
                        /* Paste button */
                        <button
                            onClick={handlePaste}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm font-medium border border-amber-500/30 hover:border-amber-500/40 transition-all min-w-[130px] justify-center"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                            </svg>
                            {t('header.paste')}
                        </button>
                    ) : (
                        /* Add to list button */
                        <button
                            onClick={() => handleAddToList()}
                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-sm font-medium border border-emerald-500/30 hover:border-emerald-500/40 transition-all min-w-[130px] justify-center"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                            </svg>
                            {t('header.addToList')}
                        </button>
                    )}
                </div>

                {/* Settings button */}
                <Tooltip text={t('header.settings')}>
                    <button
                        onClick={() => setSettingsOpen(true)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-300 text-xs font-medium transition-all border border-white/10 hover:border-white/20"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </button>
                </Tooltip>
            </header>

            {/* Main Content */}
            <main className="flex-1 flex flex-col overflow-hidden px-6 py-4">

                {/* Error */}
                {errorMsg && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm font-medium animate-fadeIn mb-4 shrink-0">
                        {errorMsg}
                    </div>
                )}

                {/* Control Bar */}
                {hasItems && (
                    <div className="flex items-center justify-between mb-4 shrink-0 bg-white/[0.03] border border-white/10 rounded-xl px-4 py-3">
                        <div className="flex items-center gap-3">
                            {/* Select All */}
                            <label className="flex items-center gap-2 cursor-pointer group">
                                <div className="relative">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={toggleSelectAll}
                                        className="sr-only peer"
                                    />
                                    <div className="w-5 h-5 rounded-md border-2 border-white/20 bg-white/5 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center group-hover:border-white/40">
                                        {allSelected && (
                                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                            </svg>
                                        )}
                                    </div>
                                </div>
                                <span className="text-xs text-gray-400 font-medium">{t('controls.selectAll')}</span>
                            </label>
                            <span className="text-xs text-gray-500">
                                {t('controls.selectedCount', { count: selectedCount, total: items.length })}
                            </span>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Download / Pause / Resume / Cancel */}
                            {!isDownloading && !isPaused && (
                                <Tooltip text={t('controls.downloadSelected')}>
                                    <button
                                        onClick={handleStartDownload}
                                        disabled={selectedCount === 0}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 text-xs font-medium transition-all border border-blue-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                                        </svg>
                                        {t('controls.downloadSelected')}
                                    </button>
                                </Tooltip>
                            )}

                            {isDownloading && !isPaused && (
                                <>
                                    <Tooltip text={t('controls.pause')}>
                                        <button
                                            onClick={pauseDownload}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs font-medium transition-all border border-amber-500/20"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                                            </svg>
                                            {t('controls.pause')}
                                        </button>
                                    </Tooltip>
                                    <Tooltip text={t('common.cancel')}>
                                        <button
                                            onClick={cancelFullDownload}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition-all border border-red-500/20"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {t('common.cancel')}
                                        </button>
                                    </Tooltip>
                                </>
                            )}

                            {isPaused && (
                                <>
                                    <Tooltip text={t('controls.resume')}>
                                        <button
                                            onClick={resumeDownload}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 text-xs font-medium transition-all border border-emerald-500/20"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M8 5v14l11-7z" />
                                            </svg>
                                            {t('controls.resume')}
                                        </button>
                                    </Tooltip>
                                    <Tooltip text={t('common.cancel')}>
                                        <button
                                            onClick={cancelFullDownload}
                                            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs font-medium transition-all border border-red-500/20"
                                        >
                                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                            {t('common.cancel')}
                                        </button>
                                    </Tooltip>
                                </>
                            )}

                            {/* Clear List */}
                            {!isDownloading && !isPaused && (
                                <Tooltip text={t('controls.clearList')}>
                                    <button
                                        onClick={handleClearList}
                                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-gray-300 text-xs font-medium transition-all border border-white/10"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                        {t('controls.clearList')}
                                    </button>
                                </Tooltip>
                            )}
                        </div>
                    </div>
                )}

                {/* Video List */}
                {hasItems ? (
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 playlist-scroll">
                        {items.map((item) => (
                            <VideoCard
                                key={item.id}
                                item={item}
                                isDownloading={isDownloading}
                                isPaused={isPaused}
                                currentItemId={currentItemId}
                                onToggleSelect={toggleSelect}
                                onRemove={handleRemoveItem}
                                onFormatChange={handleFormatChange}
                                onResolutionChange={handleResolutionChange}
                                onUpdateResolutions={handleUpdateResolutions}
                                onRetry={handleRetry}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                            <svg className="w-16 h-16 mx-auto mb-4 opacity-30" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V3" />
                            </svg>
                            <p className="text-sm font-medium">{t('videoCard.listEmpty')}</p>
                            <p className="text-xs mt-1">{t('videoCard.listEmptySub')}</p>
                        </div>
                    </div>
                )}
            </main>

            {/* Settings Modal */}
            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                downloadDir={downloadDir}
                onSelectFolder={selectFolder}
            />
        </div>
    );
}

export default App;
