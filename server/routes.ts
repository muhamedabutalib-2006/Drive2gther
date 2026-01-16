import type { Express } from "express";
import type { Server } from "http";
import axios from "axios";
import { storage } from "./storage";
import { api } from "@shared/routes";
import type { Episode } from "@shared/schema";
import { z } from "zod";

const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
const W2G_API_KEY = process.env.W2G_API_KEY;

// Extract folder ID from Google Drive URL
function extractFolderId(url: string): string | null {
  const patterns = [
    /\/folders\/([a-zA-Z0-9-_]+)/,
    /id=([a-zA-Z0-9-_]+)/,
    /^([a-zA-Z0-9-_]+)$/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

// Convert Google Drive file to streaming URL
function getDriveStreamUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/preview`;
}

// Fetch video files from Google Drive folder
async function fetchVideos(folderId: string): Promise<Episode[]> {
  let allFiles: any[] = [];
  let pageToken: string | null = null;
  
  do {
    const params: any = {
      key: GOOGLE_API_KEY,
      q: `'${folderId}' in parents and mimeType contains 'video/'`,
      fields: 'nextPageToken, files(id, name, mimeType, webViewLink, webContentLink)',
      pageSize: 1000,
      orderBy: 'name',
      supportsAllDrives: true,
      includeItemsFromAllDrives: true
    };
    
    if (pageToken) {
      params.pageToken = pageToken;
    }
    
    console.log('Fetching videos from folder:', folderId, 'Page token:', pageToken || 'first page');
    const response = await axios.get('https://www.googleapis.com/drive/v3/files', { params });
    
    const files = response.data.files || [];
    allFiles = allFiles.concat(files);
    pageToken = response.data.nextPageToken;
    
    console.log('Fetched', files.length, 'files. Total so far:', allFiles.length);
  } while (pageToken);
  
  console.log('Total files found:', allFiles.length);
  
  return allFiles.map(file => ({
    id: file.id,
    name: file.name,
    streamUrl: getDriveStreamUrl(file.id)
  }));
}

// Create Watch2Gether room
async function createW2GRoom(): Promise<string> {
  console.log('Creating W2G room...');
  const response = await axios.post(
    'https://api.w2g.tv/rooms/create.json',
    {
      w2g_api_key: W2G_API_KEY,
      share: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      bg_color: '#1a1a1a',
      bg_opacity: '90'
    }
  );
  console.log('W2G room created:', response.data.streamkey);
  return response.data.streamkey;
}

// Update Watch2Gether room with new video
async function updateW2GRoom(roomId: string, videoUrl: string): Promise<void> {
  await axios.post(
    `https://api.w2g.tv/rooms/${roomId}/sync_update`,
    {
      w2g_api_key: W2G_API_KEY,
      item_url: videoUrl
    }
  );
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Initialize with folder
  app.post(api.init.path, async (req, res) => {
    try {
      const { folderUrl } = api.init.input.parse(req.body);
      console.log('Received folder URL:', folderUrl);
      
      const folderId = extractFolderId(folderUrl);
      console.log('Extracted folder ID:', folderId);
      
      if (!folderId) {
        return res.status(400).json({ error: 'Invalid Google Drive folder URL' });
      }
      
      // Fetch videos
      const videos = await fetchVideos(folderId);
      console.log('Videos found:', videos.length);
      
      if (videos.length === 0) {
        return res.status(404).json({ 
          error: 'No videos found in folder. Make sure the folder is publicly accessible.' 
        });
      }
      
      // Sort videos by name with proper numeric sorting
      videos.sort((a, b) => {
        const getNumber = (name: string) => {
          const match = name.match(/(\d+)/);
          return match ? parseInt(match[1], 10) : 0;
        };
        
        const numA = getNumber(a.name);
        const numB = getNumber(b.name);
        
        if (numA !== numB) {
          return numA - numB;
        }
        
        return a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      });
      
      // Create W2G room if needed
      const state = storage.getState();
      let roomId = state.roomId;
      if (!roomId) {
        console.log('Creating new W2G room...');
        roomId = await createW2GRoom();
        storage.setRoomId(roomId);
      }
      
      // Update state
      storage.setFolderId(folderId);
      storage.setEpisodes(videos);
      storage.setCurrentEpisodeIndex(0);
      
      // Load first episode
      if (videos.length > 0) {
        const firstVideo = videos[0];
        console.log('Loading first episode:', firstVideo.name, 'URL:', firstVideo.streamUrl);
        await updateW2GRoom(roomId, firstVideo.streamUrl);
      }
      
      res.json({
        roomId,
        episodes: videos.map(v => ({ id: v.id, name: v.name })),
        currentIndex: 0
      });
    } catch (error: any) {
      console.error('Error in /api/init:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: error.message || 'Failed to initialize' });
    }
  });

  // Get current state
  app.get(api.state.path, (req, res) => {
    const state = storage.getState();
    res.json({
      roomId: state.roomId,
      episodes: state.episodes.map(v => ({ id: v.id, name: v.name })),
      currentIndex: state.currentEpisodeIndex
    });
  });

  // Play specific episode
  app.post(api.play.path, async (req, res) => {
    try {
      const { index } = api.play.input.parse(req.body);
      const state = storage.getState();
      
      if (!state.roomId || state.episodes.length === 0) {
        return res.status(400).json({ error: 'No playlist initialized' });
      }
      
      if (index < 0 || index >= state.episodes.length) {
        return res.status(400).json({ error: 'Invalid episode index' });
      }
      
      storage.setCurrentEpisodeIndex(index);
      const episode = state.episodes[index];
      console.log('Playing episode:', episode.name, 'URL:', episode.streamUrl);
      await updateW2GRoom(state.roomId, episode.streamUrl);
      
      res.json({
        currentIndex: index,
        episode: { id: episode.id, name: episode.name }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Navigate episodes
  app.post(api.navigate.path, async (req, res) => {
    try {
      const { direction } = api.navigate.input.parse(req.body);
      const state = storage.getState();
      
      if (!state.roomId || state.episodes.length === 0) {
        return res.status(400).json({ error: 'No playlist initialized' });
      }
      
      let newIndex = state.currentEpisodeIndex;
      if (direction === 'next') {
        newIndex = Math.min(newIndex + 1, state.episodes.length - 1);
      } else if (direction === 'prev') {
        newIndex = Math.max(newIndex - 1, 0);
      }
      
      if (newIndex !== state.currentEpisodeIndex) {
        storage.setCurrentEpisodeIndex(newIndex);
        const episode = state.episodes[newIndex];
        console.log('Navigating to episode:', episode.name, 'URL:', episode.streamUrl);
        await updateW2GRoom(state.roomId, episode.streamUrl);
      }
      
      const currentState = storage.getState();
      const currentEpisode = currentState.episodes[currentState.currentEpisodeIndex];
      
      res.json({
        currentIndex: currentState.currentEpisodeIndex,
        episode: { id: currentEpisode.id, name: currentEpisode.name }
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: error.errors[0].message });
      }
      res.status(500).json({ error: error.message });
    }
  });

  // Create new room
  app.post(api.newRoom.path, async (req, res) => {
    try {
      console.log('Creating new W2G room...');
      const roomId = await createW2GRoom();
      storage.setRoomId(roomId);
      
      // If we have episodes loaded, load the current one
      const state = storage.getState();
      if (state.episodes.length > 0) {
        const episode = state.episodes[state.currentEpisodeIndex];
        await updateW2GRoom(roomId, episode.streamUrl);
      }
      
      res.json({ roomId });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  return httpServer;
}
