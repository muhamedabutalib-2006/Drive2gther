import type { Episode, AppState } from "@shared/schema";

export interface IStorage {
  getState(): AppState;
  setFolderId(folderId: string): void;
  setRoomId(roomId: string): void;
  setEpisodes(episodes: Episode[]): void;
  setCurrentEpisodeIndex(index: number): void;
  getCurrentEpisode(): Episode | undefined;
}

export class MemStorage implements IStorage {
  private state: AppState;

  constructor() {
    this.state = {
      folderId: null,
      roomId: null,
      currentEpisodeIndex: 0,
      episodes: [],
    };
  }

  getState(): AppState {
    return { ...this.state };
  }

  setFolderId(folderId: string): void {
    this.state.folderId = folderId;
  }

  setRoomId(roomId: string): void {
    this.state.roomId = roomId;
  }

  setEpisodes(episodes: Episode[]): void {
    this.state.episodes = episodes;
  }

  setCurrentEpisodeIndex(index: number): void {
    this.state.currentEpisodeIndex = index;
  }

  getCurrentEpisode(): Episode | undefined {
    return this.state.episodes[this.state.currentEpisodeIndex];
  }
}

export const storage = new MemStorage();
