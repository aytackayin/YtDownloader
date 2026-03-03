import { useState, useRef, useCallback, useEffect } from 'react';
import { listen } from '@tauri-apps/api/event';
import { executeDownload, cancelDownload, deleteVideoFiles } from '../services/api';
import type { VideoListItem } from './useVideoList';
import { buildOutputPath, sanitizeFilename } from '../utils/path';

interface DownloadManagerProps {
    updateItemStatus: (id: string, updates: Partial<VideoListItem>) => void;
}

export const useDownloadManager = ({ updateItemStatus }: DownloadManagerProps) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [currentItemId, setCurrentItemId] = useState<string | null>(null);

    const queueRef = useRef<VideoListItem[]>([]);
    const currentIndexRef = useRef(0);
    const isProcessingRef = useRef(false);
    const isPausedRef = useRef(false);
    const isCancelledRef = useRef(false);
    const outDirRef = useRef('');
    const lastErrorRef = useRef('');
    const resolveCompleteRef = useRef<((result: 'complete' | 'error' | 'cancelled') => void) | null>(null);
    const currentVideoIdRef = useRef('');
    const unlistenRef = useRef<(() => void) | null>(null);
    const cancelUnlistenRef = useRef<(() => void) | null>(null);

    // Set up cancel event listener
    useEffect(() => {
        const setupCancelListener = async () => {
            const unlisten = await listen<string>('download-cancelled', () => {
                if (resolveCompleteRef.current) {
                    resolveCompleteRef.current('cancelled');
                    resolveCompleteRef.current = null;
                }
            });
            cancelUnlistenRef.current = unlisten;
        };
        setupCancelListener();
        return () => {
            if (cancelUnlistenRef.current) {
                cancelUnlistenRef.current();
            }
        };
    }, []);

    const setupVideoListener = useCallback(async (videoId: string) => {
        // Clear previous listener
        if (unlistenRef.current) {
            unlistenRef.current();
            unlistenRef.current = null;
        }

        const eventName = `download-progress-${videoId}`;
        const unlisten = await listen<string>(eventName, (event) => {
            try {
                const data = JSON.parse(event.payload);
                if (data.type === 'progress') {
                    updateItemStatus(videoId, {
                        progress: data.percentage,
                        speed: data.speed,
                        eta: data.eta,
                    });
                } else if (data.type === 'complete') {
                    updateItemStatus(videoId, { progress: 100 });
                    if (resolveCompleteRef.current) {
                        resolveCompleteRef.current('complete');
                        resolveCompleteRef.current = null;
                    }
                } else if (data.type === 'error') {
                    lastErrorRef.current = data.message || 'Unknown error';
                    if (resolveCompleteRef.current) {
                        resolveCompleteRef.current('error');
                        resolveCompleteRef.current = null;
                    }
                }
            } catch {
                // JSON parse error
            }
        });

        unlistenRef.current = unlisten;
    }, [updateItemStatus]);

    const waitForComplete = (): Promise<'complete' | 'error' | 'cancelled'> => {
        return new Promise((resolve) => {
            resolveCompleteRef.current = resolve;
        });
    };


    const processQueue = useCallback(async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        isPausedRef.current = false;
        isCancelledRef.current = false;
        setIsPaused(false);
        setIsDownloading(true);

        while (currentIndexRef.current < queueRef.current.length) {
            if (isPausedRef.current || isCancelledRef.current) break;

            const item = queueRef.current[currentIndexRef.current];
            currentVideoIdRef.current = item.id;
            setCurrentItemId(item.id);
            lastErrorRef.current = '';

            updateItemStatus(item.id, {
                status: 'downloading',
                progress: 0,
                speed: '',
                eta: '',
                errorMessage: '',
            });

            // Set up video-specific listener
            await setupVideoListener(item.id);

            const outDir = buildOutputPath(item.uploaderId, item.playlistTitle, outDirRef.current, item.sourcePlatform);
            const sanitizedTitle = sanitizeFilename(item.title);

            await executeDownload(
                item.url,
                outDir,
                item.format,
                item.resolution,
                sanitizedTitle,
                item.id
            );

            const result = await waitForComplete();

            if (result === 'complete') {
                updateItemStatus(item.id, {
                    status: 'complete',
                    progress: 100,
                    speed: '',
                    eta: '',
                    selected: false,
                });
            } else if (result === 'error') {
                updateItemStatus(item.id, {
                    status: 'error',
                    errorMessage: lastErrorRef.current || 'Download failed',
                    speed: '',
                    eta: '',
                });
                lastErrorRef.current = '';
            } else if (result === 'cancelled') {
                if (isCancelledRef.current) {
                    // Full cancel
                    updateItemStatus(item.id, {
                        status: 'idle',
                        progress: 0,
                        speed: '',
                        eta: '',
                    });
                    break;
                } else {
                    // Pause
                    updateItemStatus(item.id, {
                        status: 'paused',
                        speed: '',
                        eta: '',
                    });
                    isPausedRef.current = true;
                    setIsPaused(true);
                    break;
                }
            }

            // Clear listener and wait briefly
            if (unlistenRef.current) {
                unlistenRef.current();
                unlistenRef.current = null;
            }
            currentIndexRef.current++;
            await new Promise(r => setTimeout(r, 300));
        }

        isProcessingRef.current = false;

        if (!isPausedRef.current) {
            setIsDownloading(false);
            setCurrentItemId(null);
        }
    }, [updateItemStatus, setupVideoListener]);

    const startDownload = useCallback(async (selectedItems: VideoListItem[], baseDir: string) => {
        if (selectedItems.length === 0 || !baseDir) return;

        setIsDownloading(true);
        setIsPaused(false);
        outDirRef.current = baseDir;
        currentIndexRef.current = 0;
        queueRef.current = [...selectedItems];
        isProcessingRef.current = false;

        await processQueue();
    }, [processQueue]);

    const pauseDownload = useCallback(async () => {
        isPausedRef.current = true;
        setIsPaused(true);
        await cancelDownload();
    }, []);

    const resumeDownload = useCallback(async () => {
        if (!isPausedRef.current) return;
        isPausedRef.current = false;
        isCancelledRef.current = false;
        setIsPaused(false);
        setIsDownloading(true);
        isProcessingRef.current = false;

        setIsDownloading(true);
        isProcessingRef.current = false;

        // Restart queue processing from current index
        await processQueue();
    }, [processQueue]);

    const cancelFullDownload = useCallback(async () => {
        isCancelledRef.current = true;
        isPausedRef.current = false;
        setIsPaused(false);

        // Clean up current partial file
        if (currentItemId && outDirRef.current) {
            const item = queueRef.current.find(i => i.id === currentItemId);
            if (item) {
                const outDir = buildOutputPath(item.uploaderId, item.playlistTitle, outDirRef.current, item.sourcePlatform);
                const prefix = sanitizeFilename(item.title);
                // Delay for process exit and file lock release
                setTimeout(() => {
                    deleteVideoFiles(outDir, prefix).catch(() => { });
                }, 1000);
            }
        }

        await cancelDownload();

        // Clear listeners
        if (unlistenRef.current) {
            unlistenRef.current();
            unlistenRef.current = null;
        }

        // Reset state after delay
        setTimeout(() => {
            setIsDownloading(false);
            setCurrentItemId(null);
            isProcessingRef.current = false;
        }, 500);
    }, [currentItemId]);

    const retryItem = useCallback(async (item: VideoListItem, baseDir: string) => {
        if (isProcessingRef.current) return;

        setIsDownloading(true);
        setIsPaused(false);
        isCancelledRef.current = false;
        outDirRef.current = baseDir;
        currentIndexRef.current = 0;
        queueRef.current = [item];
        isProcessingRef.current = false;

        await processQueue();
    }, [processQueue]);

    const removeFromQueue = useCallback((id: string) => {
        const index = queueRef.current.findIndex(item => item.id === id);
        if (index !== -1) {
            // Shift index if removed item was before current
            if (index < currentIndexRef.current) {
                currentIndexRef.current--;
            }
            // If current item is removed, its slot is taken by next item
            queueRef.current.splice(index, 1);
        }
    }, []);

    const addToQueue = useCallback(async (newItems: VideoListItem[]) => {
        if (newItems.length === 0) return;
        const existingIds = new Set(queueRef.current.map(i => i.id));
        const toAdd = newItems.filter(i => !existingIds.has(i.id));
        if (toAdd.length === 0) return;
        // Add to queueRef — loop will pick it up
        queueRef.current = [...queueRef.current, ...toAdd];

        // Restart if loop has finished
        if (!isProcessingRef.current && !isPausedRef.current && !isCancelledRef.current) {
            await processQueue();
        }
    }, [processQueue]);

    const updateItemInQueue = useCallback((id: string, updates: Partial<VideoListItem>) => {
        const index = queueRef.current.findIndex(item => item.id === id);
        if (index !== -1) {
            queueRef.current[index] = { ...queueRef.current[index], ...updates };
        }
    }, []);

    return {
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
    };
};
