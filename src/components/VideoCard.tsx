import React from 'react';
import type { VideoListItem } from '../hooks/useVideoList';
import { fetchVideoFormats } from '../services/api';
import { useTranslation } from '../hooks/useTranslation';
import Tooltip from './Tooltip';

interface VideoCardProps {
    item: VideoListItem;
    isDownloading: boolean;
    isPaused: boolean;
    currentItemId: string | null;
    onToggleSelect: (id: string) => void;
    onRemove: (id: string) => void;
    onFormatChange: (id: string, format: 'mp4' | 'mp3') => void;
    onResolutionChange: (id: string, resolution: string) => void;
    onUpdateResolutions: (id: string, resolutions: string[], defaultRes: string) => void;
    onRetry: (item: VideoListItem) => void;
}

function formatDuration(seconds: number | null): string {
    if (!seconds || seconds <= 0) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
}

const isInstagram = (item: VideoListItem) =>
    item.sourcePlatform === 'instagram' ||
    item.url?.includes('instagram.com');

export const VideoCard: React.FC<VideoCardProps> = ({
    item,
    isDownloading,
    currentItemId,
    onToggleSelect,
    onRemove,
    onFormatChange,
    onResolutionChange,
    onUpdateResolutions,
    onRetry,
}) => {
    const { t } = useTranslation();
    const [loadingFormats, setLoadingFormats] = React.useState(false);
    const [formatsLoaded, setFormatsLoaded] = React.useState(false);
    const [thumbBroken, setThumbBroken] = React.useState(false);

    const isCurrentlyDownloading = currentItemId === item.id && item.status === 'downloading';
    const canRetry = item.status === 'error' && !isDownloading;
    const canRemove = !isCurrentlyDownloading;
    const showProgress = item.status === 'downloading';
    const showError = item.status === 'error' && item.errorMessage;
    const isInsta = isInstagram(item);

    // Thumbnail: null if missing or broken
    const displayThumbnail = thumbBroken ? null : (item.thumbnail || item.profilePicture || null);

    // Card colors based on status
    const getCardClasses = () => {
        switch (item.status) {
            case 'complete':
                return 'border-emerald-500/40 bg-emerald-500/[0.06]';
            case 'downloading':
                return 'border-amber-500/40 bg-amber-500/[0.06]';
            case 'paused':
                return 'border-amber-500/30 bg-amber-500/[0.04]';
            case 'error':
                return 'border-red-500/40 bg-red-500/[0.06]';
            default:
                return item.selected
                    ? 'border-blue-500/30 bg-blue-500/[0.03]'
                    : 'border-white/[0.06] bg-white/[0.02]';
        }
    };

    const getBadge = () => {
        switch (item.status) {
            case 'downloading':
                return (
                    <span className="flex items-center gap-1 text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full font-medium">
                        <svg className="animate-spin w-2.5 h-2.5" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        {t('videoCard.downloading')}
                    </span>
                );
            case 'complete':
                return (
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-full font-medium">
                        ✓ {t('videoCard.completed')}
                    </span>
                );
            case 'error':
                return (
                    <span className="text-[10px] text-red-400 bg-red-500/15 px-2 py-0.5 rounded-full font-medium">
                        ✕ {t('videoCard.error')}
                    </span>
                );
            case 'paused':
                return (
                    <span className="text-[10px] text-amber-400 bg-amber-500/15 px-2 py-0.5 rounded-full font-medium">
                        ⏸ {t('videoCard.paused')}
                    </span>
                );
            default:
                return null;
        }
    };

    const cardRef = React.useRef<HTMLDivElement>(null);

    const handleLoadFormats = React.useCallback(async () => {
        if (formatsLoaded || loadingFormats || isInsta) return;
        setLoadingFormats(true);

        await new Promise(r => setTimeout(r, Math.random() * 300));

        try {
            const data = await fetchVideoFormats(item.url);
            if (data.resolutions.length > 0) {
                const newDefault = data.resolutions.includes(item.resolution)
                    ? item.resolution
                    : data.resolutions[0];
                onUpdateResolutions(item.id, data.resolutions, newDefault);
                setFormatsLoaded(true);
            }
        } catch {
            // Failed to load formats
        }
        setLoadingFormats(false);
    }, [item.url, item.id, item.resolution, formatsLoaded, loadingFormats, onUpdateResolutions, isInsta]);

    // Lazy Loading: Load formats when card is visible
    React.useEffect(() => {
        if (!item.playlistTitle || formatsLoaded || loadingFormats || isInsta) return;

        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting) {
                handleLoadFormats();
                observer.disconnect();
            }
        }, { threshold: 0.1 });

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, [item.playlistTitle, formatsLoaded, loadingFormats, handleLoadFormats, isInsta]);

    const isEditable = item.status === 'idle' || item.status === 'error';

    return (
        <div ref={cardRef} className={`group relative border rounded-xl p-3 transition-all duration-300 hover:bg-white/[0.04] ${getCardClasses()}`}>
            <div className="flex items-start gap-3">
                {/* Checkbox */}
                <label className="flex items-center cursor-pointer mt-1 shrink-0">
                    <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => onToggleSelect(item.id)}
                        className="sr-only peer"
                    />
                    <div className={`w-5 h-5 rounded-md border-2 border-white/20 bg-white/5 peer-checked:bg-blue-500 peer-checked:border-blue-500 transition-all flex items-center justify-center hover:border-white/40`}>
                        {item.selected && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </div>
                </label>

                {/* Thumbnail */}
                <div className={`relative shrink-0 bg-neutral-800 rounded-lg overflow-hidden ${isInsta && item.mediaType === 'image' ? 'w-16 h-16' : 'w-28 h-16'}`}>
                    {displayThumbnail ? (
                        <img
                            src={displayThumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover"
                            loading="lazy"
                            onError={() => setThumbBroken(true)}
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-600">
                            {isInsta ? (
                                /* Instagram icon */
                                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                                </svg>
                            ) : (
                                <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            )}
                        </div>
                    )}
                    {/* Status overlay */}
                    {item.status === 'complete' && (
                        <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-emerald-400 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                    )}
                    {item.status === 'error' && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center">
                            <svg className="w-6 h-6 text-red-400 drop-shadow" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                    )}
                    {/* Duration (Hidden for IG images) */}
                    {!(isInsta && item.mediaType === 'image') && (
                        <span className="absolute bottom-1 right-1 bg-black/80 text-[10px] text-gray-300 px-1.5 py-0.5 rounded font-mono">
                            {formatDuration(item.duration)}
                        </span>
                    )}

                    {/* Platform badge */}
                    {isInsta ? (
                        <span className="absolute top-1 left-1 bg-gradient-to-r from-purple-600/90 to-pink-600/90 text-[9px] text-white px-1.5 py-0.5 rounded font-bold">
                            {item.mediaType === 'image' ? '📷' : '📹'} IG
                        </span>
                    ) : (
                        <>
                            {item.isShort && (
                                <span className="absolute top-1 left-1 bg-red-600/90 text-[9px] text-white px-1.5 py-0.5 rounded font-bold">
                                    SHORT
                                </span>
                            )}
                            {item.playlistTitle && !item.isShort && (
                                <span className="absolute top-1 left-1 bg-blue-600/80 text-[9px] text-white px-1.5 py-0.5 rounded font-medium truncate max-w-[80px]">
                                    📋 Playlist
                                </span>
                            )}
                        </>
                    )}

                    {/* Loading Overlay */}
                    {loadingFormats && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center animate-fadeIn">
                            <svg className="animate-spin w-6 h-6 text-blue-400" viewBox="0 0 24 24" fill="none">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                            </svg>
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-200 line-clamp-2 leading-tight">
                        {item.title}
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">{item.uploader}</p>
                    {/* Status badge */}
                    {item.status !== 'idle' && (
                        <div className="mt-1">
                            {getBadge()}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Format/Resolution selection */}
                    {isEditable && !isInsta && (
                        <>
                            <select
                                value={item.format}
                                onChange={(e) => onFormatChange(item.id, e.target.value as 'mp4' | 'mp3')}
                                className="bg-neutral-800 text-xs border border-white/10 rounded-lg px-2 py-1.5 text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                            >
                                <option value="mp4">MP4</option>
                                <option value="mp3">MP3</option>
                            </select>
                            {item.format === 'mp4' && (
                                <div className="relative">
                                    <select
                                        value={item.resolution}
                                        onChange={(e) => onResolutionChange(item.id, e.target.value)}
                                        onFocus={handleLoadFormats}
                                        className="bg-neutral-800 text-xs border border-white/10 rounded-lg px-2 py-1.5 text-gray-300 focus:outline-none focus:ring-1 focus:ring-blue-500/50"
                                    >
                                        {item.resolutions.map((r) => (
                                            <option key={r} value={r}>{r}p</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </>
                    )}

                    {/* Retry button */}
                    {canRetry && (
                        <Tooltip text={t('videoCard.retry')}>
                            <button
                                onClick={() => onRetry(item)}
                                className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 transition-all border border-emerald-500/20 hover:border-emerald-500/30"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                            </button>
                        </Tooltip>
                    )}

                    {/* Remove button */}
                    {canRemove && (
                        <Tooltip text={t('videoCard.removeFromList')}>
                            <button
                                onClick={() => onRemove(item.id)}
                                className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 transition-all border border-red-500/15 hover:border-red-500/25"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Progress Bar */}
            {showProgress && (
                <div className="mt-2 animate-fadeIn">
                    <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                        <div
                            className="bg-gradient-to-r from-amber-400 to-yellow-500 h-2 rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${item.progress}%` }}
                        />
                    </div>
                    <div className="flex justify-between mt-1 text-[10px] text-gray-400">
                        <span>%{item.progress.toFixed(1)}</span>
                        <div className="flex gap-3">
                            {item.speed && <span>⚡ {item.speed}</span>}
                            {item.eta && <span>⏱ {item.eta}</span>}
                        </div>
                    </div>
                </div>
            )}

            {/* Error message */}
            {showError && (
                <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded-lg px-3 py-1.5 animate-fadeIn">
                    {item.errorMessage}
                </div>
            )}
        </div>
    );
};
