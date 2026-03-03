import sys
import json
import yt_dlp
import re
import os


class MyLogger:
    def debug(self, msg):
        pass
    def warning(self, msg):
        pass
    def error(self, msg):
        if '"type": "error"' not in msg:
            print(json.dumps({"type": "error", "message": msg}), flush=True)


def detect_platform(url: str) -> str:
    if 'instagram.com' in url or 'instagr.am' in url:
        return 'instagram'
    return 'youtube'


def extract_ig_shortcode(url: str) -> str:
    """Extract Instagram shortcode (e.g., DTuzM5rFPpU)."""
    match = re.search(r'instagram\.com/(?:p|reel|tv)/([A-Za-z0-9_-]+)', url)
    return match.group(1) if match else ''


def extract_ig_username_from_url(url: str) -> str:
    """Extract username from Instagram URL."""
    match = re.search(r'instagram\.com/(?:stories/)?([A-Za-z0-9_.]+)', url)
    if match:
        username = match.group(1)
        if username not in ('p', 'reel', 'tv', 'reels', 'stories', 'explore'):
            return username
    return ''


def detect_media_type(info: dict) -> str:
    """Detect Instagram post type."""
    ext = info.get('ext', '')
    if ext in ('jpg', 'jpeg', 'png', 'webp'):
        return 'image'
    return 'video'


def get_instagram_profile_picture(url: str) -> str:
    """Fetch Instagram profile picture."""
    try:
        match = re.search(r'instagram\.com/([A-Za-z0-9_.]+)', url)
        if not match:
            return ''
        username = match.group(1)
        if username in ('p', 'reel', 'tv', 'stories', 'reels'):
            return ''

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'logger': MyLogger(),
        }
        profile_url = f'https://www.instagram.com/{username}/'
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(profile_url, download=False)
            return info.get('thumbnail', '') or info.get('avatar', '') or ''
    except Exception:
        return ''


def fetch_metadata(url: str):
    platform = detect_platform(url)

    ydl_opts = {
        'extract_flat': 'in_playlist',
        'quiet': True,
        'no_warnings': True,
        'logger': MyLogger(),
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)

            is_playlist = info.get('_type') == 'playlist' or 'entries' in info

            if is_playlist:
                entries = list(info.get('entries', []))
                playlist_title = info.get('title', 'Playlist')
                uploader = info.get('uploader', 'Unknown')
                uploader_id = info.get('uploader_id', '') or info.get('channel_id', '') or uploader

                videos = []
                for entry in entries:
                    if entry is None:
                        continue
                    video_url = entry.get('url') or entry.get('webpage_url') or ''
                    if not video_url and entry.get('id'):
                        if platform == 'instagram':
                            video_url = f"https://www.instagram.com/p/{entry['id']}/"
                        else:
                            video_url = f"https://www.youtube.com/watch?v={entry['id']}"

                    entry_uploader_id = entry.get('uploader_id', '') or entry.get('channel_id', '') or uploader_id
                    entry_duration = entry.get('duration', 0) or 0

                    # Set thumbnail
                    thumb = ''
                    if entry.get('thumbnails'):
                        thumb = entry['thumbnails'][-1].get('url', '')
                    elif entry.get('thumbnail'):
                        thumb = entry['thumbnail']

                    videos.append({
                        "id": entry.get('id', ''),
                        "title": entry.get('title', 'Unknown'),
                        "thumbnail": thumb,
                        "url": video_url,
                        "duration": entry_duration,
                        "uploader": entry.get('uploader', uploader),
                        "uploader_id": entry_uploader_id,
                        "is_short": 0 < entry_duration <= 60,
                        "source_platform": platform,
                        "media_type": detect_media_type(entry),
                    })

                data = {
                    "is_playlist": True,
                    "playlist_title": playlist_title,
                    "uploader": uploader,
                    "uploader_id": uploader_id,
                    "video_count": len(videos),
                    "videos": videos,
                    "source_platform": platform,
                }
                print(json.dumps({"type": "metadata", "data": data}), flush=True)

            else:
                # Single video/image
                # Re-fetch with extract_flat=False for Instagram to get more details
                if platform == 'instagram':
                    with yt_dlp.YoutubeDL({'quiet': True, 'no_warnings': True, 'logger': MyLogger()}) as ydl2:
                        info = ydl2.extract_info(url, download=False)

                formats = info.get('formats', [])
                resolutions = sorted(list(set(
                    [f.get('height') for f in formats if f.get('vcodec') != 'none' and f.get('height') is not None]
                )), reverse=True)

                duration = info.get("duration", 0) or 0

                # YouTube uploader_id fallback
                uploader_id = info.get('uploader_id', '') or info.get('channel_id', '') or info.get('uploader', 'unknown')

                thumbnail = info.get("thumbnail", "")
                profile_picture = ""
                media_type = detect_media_type(info)
                title = info.get("title", "")
                uploader_name = info.get("uploader", "Unknown")
                video_id = info.get("id", "")

                if platform == 'instagram':
                    # Instagram: We need the handle (username)
                    # 'channel' is usually the handle, 'uploader' is display name
                    ig_username = info.get('channel', '')
                    
                    if not ig_username or ig_username == info.get('uploader', ''):
                        # Fallback to uploader_url or webpage_url if handle is missing
                        possibilities = [
                            info.get('uploader_url', ''),
                            info.get('channel_url', ''),
                            info.get('webpage_url', '')
                        ]
                        for p in possibilities:
                            if p and 'instagram.com/' in p:
                                # Skip parts like /p/ or /reel/ to extract username
                                match = re.search(r'instagram\.com/(?!p/|reel/|tv/|stories/)([A-Za-z0-9_.]+)', p)
                                if match:
                                    ig_username = match.group(1)
                                    break
                    
                    if not ig_username:
                        ig_username = extract_ig_username_from_url(url) or 'instagram'

                    # Clean handle
                    ig_username = ig_username.lower()
                    
                    uploader_id = ig_username
                    uploader_name = ig_username

                    # Extract shortcode
                    shortcode = extract_ig_shortcode(url) or video_id or str(abs(hash(url)) % 10**9)
                    video_id = shortcode

                    # Title format: username-shortcode
                    title = f"{ig_username}-{shortcode}"

                    # Instagram CDN URLs often expire, clearing them to use frontend fallback
                    thumbnail = "" 

                    # Instagram videos usually return empty resolutions
                    if not resolutions:
                        resolutions = ['best']

                data = {
                    "title": title,
                    "thumbnail": thumbnail,
                    "uploader": uploader_name,
                    "uploader_id": uploader_id,
                    "video_id": video_id,
                    "duration": duration,
                    "is_playlist": False,
                    "is_short": 0 < duration <= 60,
                    "resolutions": [str(r) for r in resolutions],
                    "source_platform": platform,
                    "profile_picture": profile_picture,
                    "media_type": media_type,
                }
                print(json.dumps({"type": "metadata", "data": data}), flush=True)

    except Exception as e:
        print(json.dumps({"type": "error", "message": str(e)}), flush=True)


def fetch_video_formats(url: str):
    platform = detect_platform(url)

    # No format fetch needed for Instagram
    if platform == 'instagram':
        print(json.dumps({"type": "formats", "data": {"resolutions": ["best"]}}), flush=True)
        return

    ydl_opts = {
        'extract_flat': False,
        'quiet': True,
        'no_warnings': True,
        'logger': MyLogger(),
        'skip_download': True,
        'no_playlist': True,
    }

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            info = ydl.extract_info(url, download=False)
            formats = info.get('formats', [])
            resolutions = sorted(list(set(
                [f.get('height') for f in formats if f.get('vcodec') != 'none' and f.get('height') is not None]
            )), reverse=True)

            data = {"resolutions": [str(r) for r in resolutions]}
            print(json.dumps({"type": "formats", "data": data}), flush=True)
    except Exception as e:
        print(json.dumps({"type": "error", "message": str(e)}), flush=True)


def progress_hook(d):
    if d['status'] == 'downloading':
        try:
            total = d.get('total_bytes') or d.get('total_bytes_estimate') or 1
            downloaded = d.get('downloaded_bytes', 0)
            percent = round((downloaded / total) * 100, 2)
        except Exception:
            percent = 0.0

        speed = d.get('_speed_str', '0 B/s').strip()
        eta = d.get('_eta_str', 'Unknown').strip()

        speed = re.sub(r'\x1b[^m]*m', '', speed)
        eta = re.sub(r'\x1b[^m]*m', '', eta)

        print(json.dumps({
            "type": "progress",
            "percentage": percent,
            "speed": speed,
            "eta": eta
        }), flush=True)


def download_video(url, out_dir, format_type, resolution, filename):
    platform = detect_platform(url)

    if filename:
        safe_name = re.sub(r'[<>:"/\\|?*]', '_', filename).strip()
        # Set template format
        if platform == 'instagram':
            outtmpl = os.path.join(out_dir, f"{safe_name}.%(ext)s")
        else:
            outtmpl = os.path.join(out_dir, f"{safe_name}.%(ext)s")
    else:
        outtmpl = os.path.join(out_dir, "%(title)s.%(ext)s")

    os.makedirs(out_dir, exist_ok=True)

    ydl_opts = {
        'outtmpl': outtmpl,
        'progress_hooks': [progress_hook],
        'noprogress': True,
        'quiet': True,
        'no_warnings': True,
        'logger': MyLogger(),
    }

    if platform == 'instagram':
        # Forced best format for IG
        ydl_opts['format'] = 'best'
        # Download as image if applicable
        if format_type == 'image':
            ydl_opts['writethumbnail'] = True
    elif format_type == "mp3":
        ydl_opts['format'] = 'bestaudio/best'
        ydl_opts['postprocessors'] = [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }]
    else:
        if resolution == 'best':
            ydl_opts['format'] = 'bestvideo+bestaudio/best'
        else:
            ydl_opts['format'] = f'bestvideo[height<={resolution}]+bestaudio/best/best'
        ydl_opts['merge_output_format'] = 'mp4'

    try:
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            ydl.download([url])
        print(json.dumps({"type": "complete"}), flush=True)
    except Exception as e:
        print(json.dumps({"type": "error", "message": str(e)}), flush=True)


if __name__ == "__main__":
    if len(sys.argv) < 2:
        sys.exit(1)

    command = sys.argv[1]

    if command == "metadata":
        fetch_metadata(sys.argv[2])
    elif command == "formats":
        fetch_video_formats(sys.argv[2])
    elif command == "download":
        url = sys.argv[2]
        out_dir = sys.argv[3]
        fmt = sys.argv[4]
        res = sys.argv[5] if len(sys.argv) > 5 else "1080"
        fname = sys.argv[6] if len(sys.argv) > 6 else ""
        download_video(url, out_dir, fmt, res, fname)
    else:
        fetch_metadata(sys.argv[1])
