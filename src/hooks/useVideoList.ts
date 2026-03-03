import { useState, useEffect, useCallback, useRef } from 'react';
import type { MetadataResponse, PlaylistMetadataResponse } from '../services/api';

const LIST_KEY = 'ytdownloader-list';

export type VideoStatus = 'idle' | 'downloading' | 'complete' | 'error' | 'paused';

export interface VideoListItem {
    id: string;
    url: string;
    title: string;
    thumbnail: string;
    uploader: string;
    uploaderId: string;
    duration: number;
    isShort: boolean;
    resolutions: string[];
    selected: boolean;
    format: 'mp4' | 'mp3';
    resolution: string;
    status: VideoStatus;
    progress: number;
    speed: string;
    eta: string;
    errorMessage: string;
    playlistTitle?: string;
    sourcePlatform?: string;    // 'youtube' | 'instagram'
    profilePicture?: string;    // IG profile picture
    mediaType?: string;         // 'video' | 'image' | 'carousel'
}

function loadList(): VideoListItem[] {
    try {
        const stored = localStorage.getItem(LIST_KEY);
        if (stored) {
            const items: VideoListItem[] = JSON.parse(stored);
            return items.map(item => ({
                ...item,
                status: item.status === 'downloading' ? 'paused' : item.status,
                speed: '',
                eta: '',
            }));
        }
    } catch {
        // Parse error
    }
    return [];
}

function saveList(items: VideoListItem[]) {
    localStorage.setItem(LIST_KEY, JSON.stringify(items));
}

export const useVideoList = () => {
    const [items, setItems] = useState<VideoListItem[]>(() => loadList());
    const itemsRef = useRef<VideoListItem[]>(items);

    useEffect(() => {
        itemsRef.current = items;
        saveList(items);
    }, [items]);

    const addSingleVideo = useCallback((data: MetadataResponse, videoUrl: string): VideoListItem | null => {
        const itemId = data.video_id || `${Date.now()}`;
        if (itemsRef.current.some(item => item.id === itemId)) {
            return null;
        }

        const newItem: VideoListItem = {
            id: itemId,
            url: videoUrl,
            title: data.title,
            thumbnail: data.thumbnail,
            uploader: data.uploader,
            uploaderId: data.uploader_id,
            duration: data.duration,
            isShort: data.is_short,
            resolutions: data.resolutions,
            selected: true,
            format: data.source_platform === 'instagram' && data.media_type === 'image' ? 'mp4' : 'mp4',
            resolution: data.resolutions.length > 0 ? data.resolutions[0] : '1080',
            status: 'idle',
            progress: 0,
            speed: '',
            eta: '',
            errorMessage: '',
            sourcePlatform: data.source_platform,
            profilePicture: data.profile_picture,
            mediaType: data.media_type,
        };

        setItems(prev => [...prev, newItem]);
        return newItem;
    }, []);

    const addPlaylistVideos = useCallback((data: PlaylistMetadataResponse): VideoListItem[] => {
        const existingIds = new Set(itemsRef.current.map(item => item.id));
        const newItems: VideoListItem[] = data.videos
            .filter(v => !existingIds.has(v.id))
            .map(v => ({
                id: v.id,
                url: v.url,
                title: v.title,
                thumbnail: v.thumbnail,
                uploader: v.uploader,
                uploaderId: v.uploader_id,
                duration: v.duration,
                isShort: v.is_short,
                resolutions: ['2160', '1440', '1080', '720', '480', '360'],
                selected: true,
                format: 'mp4' as const,
                resolution: '1080',
                status: 'idle' as VideoStatus,
                progress: 0,
                speed: '',
                eta: '',
                errorMessage: '',
                playlistTitle: data.playlist_title,
                sourcePlatform: v.source_platform || data.source_platform,
                profilePicture: v.profile_picture,
                mediaType: v.media_type,
            }));

        if (newItems.length > 0) {
            setItems(prev => [...prev, ...newItems]);
        }
        return newItems;
    }, []);

    const removeItem = useCallback((id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    }, []);

    const toggleSelect = useCallback((id: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, selected: !item.selected } : item
        ));
    }, []);

    const toggleSelectAll = useCallback(() => {
        setItems(prev => {
            const allSelected = prev.every(item => item.selected);
            return prev.map(item => ({ ...item, selected: !allSelected }));
        });
    }, []);

    const setItemFormat = useCallback((id: string, format: 'mp4' | 'mp3') => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, format } : item
        ));
    }, []);

    const setItemResolution = useCallback((id: string, resolution: string) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, resolution } : item
        ));
    }, []);

    const updateItemStatus = useCallback((id: string, updates: Partial<VideoListItem>) => {
        setItems(prev => prev.map(item =>
            item.id === id ? { ...item, ...updates } : item
        ));
    }, []);

    const clearList = useCallback(() => {
        setItems([]);
    }, []);

    const getSelectedItems = useCallback(() => {
        return items.filter(item => item.selected);
    }, [items]);

    return {
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
    };
};
