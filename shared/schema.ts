import { z } from "zod";

// Episode/Video from Google Drive
export interface Episode {
  id: string;
  name: string;
  streamUrl: string;
}

// App state
export interface AppState {
  folderId: string | null;
  roomId: string | null;
  currentEpisodeIndex: number;
  episodes: Episode[];
}

// Request/Response types
export const initRequestSchema = z.object({
  folderUrl: z.string().min(1, "Folder URL is required"),
});

export type InitRequest = z.infer<typeof initRequestSchema>;

export interface InitResponse {
  roomId: string;
  episodes: { id: string; name: string }[];
  currentIndex: number;
}

export interface StateResponse {
  roomId: string | null;
  episodes: { id: string; name: string }[];
  currentIndex: number;
}

export const playRequestSchema = z.object({
  index: z.number().int().min(0),
});

export type PlayRequest = z.infer<typeof playRequestSchema>;

export interface PlayResponse {
  currentIndex: number;
  episode: { id: string; name: string };
}

export const navigateRequestSchema = z.object({
  direction: z.enum(["next", "prev"]),
});

export type NavigateRequest = z.infer<typeof navigateRequestSchema>;

export interface NavigateResponse {
  currentIndex: number;
  episode: { id: string; name: string };
}

export interface NewRoomResponse {
  roomId: string;
}

export interface ErrorResponse {
  error: string;
}
