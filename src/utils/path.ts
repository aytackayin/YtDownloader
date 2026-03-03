export const sanitizeFilename = (s: string) => s.replace(/[<>:"/\\|?*]/g, '_').trim();

// Extract username from Instagram URL
export const extractInstagramUsername = (url: string): string => {
    const match = url.match(/instagram\.com\/(?:reel|p|tv|stories\/)?([A-Za-z0-9_.]+)/);
    return match ? match[1] : 'instagram';
};

export const buildOutputPath = (
    uploaderId: string,
    playlistTitle: string | undefined,
    baseDir: string,
    sourcePlatform?: string
): string => {
    const safeUploaderId = sanitizeFilename(uploaderId || 'unknown');

    if (sourcePlatform === 'instagram') {
        // Instagram: base/{username}
        return `${baseDir}/${safeUploaderId}`;
    }

    if (playlistTitle) {
        const safePlaylistTitle = sanitizeFilename(playlistTitle);
        return `${baseDir}/${safeUploaderId}/${safePlaylistTitle}`;
    }
    return `${baseDir}/${safeUploaderId}`;
};
