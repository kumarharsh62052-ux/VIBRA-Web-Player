# VIBRA Web Player

A browser-based companion to the VIBRA JavaFX desktop music player. Built with plain HTML, CSS and JavaScript.

## Run locally

Open `index.html` in a modern browser. For best results, use VS Code Live Server or run a local static server.

## Features
- Dark purple VIBRA-inspired interface
- Add local audio files from your device
- Search by title and filename
- Play, pause, previous, next, seek and volume
- Create playlists and add selected songs
- Like songs
- Track files are stored in browser IndexedDB on the device where they were added

## Important limitations
- This is a browser-local demo. Audio files are not uploaded to a server and are not shared with visitors.
- Browser storage is local to each browser/device. Users need to add their own audio files.
- Playlist and liked-song state is currently held in memory for the active page session; persistent playlist syncing/login is not included.
- Use audio files you own or are permitted to use.

## Deploy
This is a static website. Import the repository into Vercel or Netlify, using the project root as the root directory. No build command or output directory is required; `index.html` is the entry point.
