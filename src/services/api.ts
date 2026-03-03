import { invoke } from '@tauri-apps/api/core';

export interface MetadataResponse {
    title: string;
    thumbnail: string;
    uploader: string;
    uploader_id: string;
    video_id: string;
    duration: number;
    is_playlist: boolean;
    is_short: boolean;
    resolutions: string[];
    source_platform?: string;   // 'youtube' | 'instagram' | ...
    profile_picture?: string;   // IG profile picture fallback
    media_type?: string;        // 'video' | 'image' | 'carousel'
}

export interface PlaylistVideo {
    id: string;
    title: string;
    thumbnail: string;
    url: string;
    duration: number;
    uploader: string;
    uploader_id: string;
    is_short: boolean;
    source_platform?: string;
    profile_picture?: string;
    media_type?: string;
}

export interface PlaylistMetadataResponse {
    is_playlist: true;
    playlist_title: string;
    uploader: string;
    uploader_id: string;
    video_count: number;
    videos: PlaylistVideo[];
    source_platform?: string;
}

export interface VideoFormatsResponse {
    resolutions: string[];
}

export type FetchResult = MetadataResponse | PlaylistMetadataResponse;

export const fetchMetadataFromApi = async (url: string): Promise<FetchResult> => {
    try {
        const rawJson: string = await invoke('fetch_metadata', { url });
        const parsed = JSON.parse(rawJson);

        if (parsed.type === 'metadata') {
            return parsed.data;
        } else {
            throw new Error(parsed.message || 'Failed to fetch metadata.');
        }
    } catch (e) {
        throw new Error(String(e));
    }
}

export const fetchVideoFormats = async (url: string): Promise<VideoFormatsResponse> => {
    try {
        const rawJson: string = await invoke('fetch_video_formats', { url });
        const parsed = JSON.parse(rawJson);

        if (parsed.type === 'formats') {
            return parsed.data;
        } else {
            throw new Error(parsed.message || 'Failed to fetch formats.');
        }
    } catch (e) {
        throw new Error(String(e));
    }
}

export const executeDownload = async (
    url: string,
    outDir: string,
    format: string,
    resolution: string,
    filename: string = '',
    videoId: string = ''
): Promise<void> => {
    await invoke('start_download', { url, outDir, format, resolution, filename, videoId });
}

export const cancelDownload = async (): Promise<void> => {
    await invoke('cancel_download');
}

export const deleteVideoFiles = async (outDir: string, filenamePrefix: string): Promise<void> => {
    await invoke('delete_video_files', { outDir, filenamePrefix });
}
