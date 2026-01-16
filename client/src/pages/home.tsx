import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Play, ChevronLeft, ChevronRight, ExternalLink, RefreshCw, Tv } from "lucide-react";
import type { StateResponse, InitResponse, PlayResponse, NavigateResponse, NewRoomResponse } from "@shared/routes";

export default function Home() {
  const [folderUrl, setFolderUrl] = useState("");
  const { toast } = useToast();

  const { data: state, isLoading: stateLoading } = useQuery<StateResponse>({
    queryKey: ["/api/state"],
  });

  const initMutation = useMutation<InitResponse, Error, string>({
    mutationFn: async (url: string) => {
      const res = await apiRequest("POST", "/api/init", { folderUrl: url });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/state"] });
      toast({
        title: "Playlist Loaded",
        description: `Found ${data.episodes.length} videos. Watch2Gether room is ready!`,
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const playMutation = useMutation<PlayResponse, Error, number>({
    mutationFn: async (index: number) => {
      const res = await apiRequest("POST", "/api/play", { index });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/state"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const navigateMutation = useMutation<NavigateResponse, Error, "next" | "prev">({
    mutationFn: async (direction) => {
      const res = await apiRequest("POST", "/api/navigate", { direction });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/state"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const newRoomMutation = useMutation<NewRoomResponse, Error>({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/new-room", {});
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/state"] });
      toast({
        title: "New Room Created",
        description: "A new Watch2Gether room has been created.",
      });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (folderUrl.trim()) {
      initMutation.mutate(folderUrl.trim());
    }
  };

  const hasPlaylist = state?.episodes && state.episodes.length > 0;
  const currentEpisode = hasPlaylist ? state.episodes[state.currentIndex] : null;

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Tv className="w-8 h-8 text-primary" />
            <h1 className="text-3xl font-bold" data-testid="text-title">
              Watch2Gether Drive Player
            </h1>
          </div>
          <p className="text-muted-foreground" data-testid="text-subtitle">
            Watch Google Drive videos together with friends
          </p>
        </div>

        {/* Folder Input */}
        <Card>
          <CardContent className="pt-6">
            <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                placeholder="Paste Google Drive folder URL..."
                value={folderUrl}
                onChange={(e) => setFolderUrl(e.target.value)}
                className="flex-1"
                data-testid="input-folder-url"
              />
              <Button 
                type="submit" 
                disabled={initMutation.isPending || !folderUrl.trim()}
                data-testid="button-load-folder"
              >
                {initMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  "Load Folder"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Room Link */}
        {state?.roomId && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Watch2Gether Room</p>
                  <a
                    href={`https://w2g.tv/rooms/${state.roomId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1"
                    data-testid="link-w2g-room"
                  >
                    w2g.tv/rooms/{state.roomId}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <Button
                  variant="outline"
                  onClick={() => newRoomMutation.mutate()}
                  disabled={newRoomMutation.isPending}
                  data-testid="button-new-room"
                >
                  {newRoomMutation.isPending ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  New Room
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Current Episode & Navigation */}
        {hasPlaylist && currentEpisode && (
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="bg-gradient-to-r from-primary/80 to-primary rounded-lg p-4 text-center">
                <p className="text-xs uppercase tracking-wider text-primary-foreground/80 mb-1">
                  Now Playing
                </p>
                <p className="text-lg font-semibold text-primary-foreground" data-testid="text-current-episode">
                  {currentEpisode.name}
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => navigateMutation.mutate("prev")}
                  disabled={state.currentIndex === 0 || navigateMutation.isPending}
                  data-testid="button-prev"
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => navigateMutation.mutate("next")}
                  disabled={state.currentIndex === state.episodes.length - 1 || navigateMutation.isPending}
                  data-testid="button-next"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Episode List */}
        {hasPlaylist && (
          <Card>
            <CardContent className="pt-6">
              <h2 className="text-lg font-semibold mb-3" data-testid="text-episode-count">
                Episodes ({state.episodes.length})
              </h2>
              <ScrollArea className="h-[400px] pr-4">
                <div className="space-y-2">
                  {state.episodes.map((episode, index) => (
                    <button
                      key={episode.id}
                      onClick={() => playMutation.mutate(index)}
                      disabled={playMutation.isPending}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors hover-elevate ${
                        index === state.currentIndex
                          ? "bg-primary/20 border border-primary/40"
                          : "bg-secondary/50 border border-transparent"
                      }`}
                      data-testid={`button-episode-${index}`}
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          index === state.currentIndex
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        }`}
                      >
                        {index === state.currentIndex ? (
                          <Play className="w-3 h-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span
                        className={`flex-1 truncate ${
                          index === state.currentIndex ? "text-foreground font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {episode.name}
                      </span>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Loading State */}
        {stateLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}

        {/* Empty State */}
        {!stateLoading && !hasPlaylist && (
          <Card>
            <CardContent className="py-12 text-center">
              <Tv className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">No Videos Loaded</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Paste a Google Drive folder URL above to get started. Make sure the folder is publicly accessible or shared with anyone with the link.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
