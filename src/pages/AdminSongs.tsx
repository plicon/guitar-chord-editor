import { useState, useEffect } from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Trash2, ArrowLeft, Home, Loader2, FileText, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { AppFooter } from "../components/AppFooter";
import { APP_CONFIG } from "../config/appConfig";
import { getAdminAuthHeaders } from "@/services/adminAuth";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface SongListItem {
  id: string;
  title: string;
  createdAt?: string;
  updatedAt: string;
}

const apiUrl = APP_CONFIG.presets.cloudflareD1.apiUrl;

export default function AdminSongsPage() {
  const [songs, setSongs] = useState<SongListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadSongs();
  }, []);

  const loadSongs = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${apiUrl}/admin/songs?limit=200`, {
        headers: getAdminAuthHeaders(),
      });
      if (!response.ok) throw new Error(response.statusText);
      const result = await response.json();
      setSongs(result.data || []);
    } catch (error) {
      console.error("Failed to load songs:", error);
      toast.error("Failed to load songs");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      const response = await fetch(`${apiUrl}/admin/songs/${id}`, {
        method: "DELETE",
        headers: getAdminAuthHeaders(),
      });
      if (!response.ok && response.status !== 404) {
        throw new Error(response.statusText);
      }
      setSongs((prev) => prev.filter((s) => s.id !== id));
      toast.success("Song deleted");
    } catch (error) {
      console.error("Failed to delete song:", error);
      toast.error("Failed to delete song");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 md:gap-3 min-w-0">
              <img
                src="/ms-icon-310x310.png"
                alt="Fretkit Logo"
                className="w-12 h-12 md:w-24 md:h-24 flex-shrink-0"
              />
              <div className="min-w-0">
                <h1 className="text-lg md:text-4xl font-bold text-foreground truncate">
                  Fretkit
                </h1>
                <span className="hidden md:inline text-lg font-bold text-foreground">
                  {" "}- Admin Panel
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link to="/admin">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Admin Dashboard
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link to="/">
                  <Home className="w-4 h-4 mr-2" />
                  Back to App
                </Link>
              </Button>
              <ThemeToggle />
            </div>
          </div>

          <p className="text-muted-foreground mt-1 text-sm md:text-base">
            Manage songs
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto p-4 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Songs</h2>
          <span className="text-sm text-muted-foreground">
            {!loading && `${songs.length} song${songs.length !== 1 ? "s" : ""}`}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : songs.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No songs found.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {songs.map((song) => {
              const dateStr = song.createdAt || song.updatedAt;
              const isPrivate = /^\[.*\]/.test(song.title || "");
              const displayTitle = song.title || "(Untitled)";
              return (
                <li
                  key={song.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-card"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium truncate">{displayTitle}</p>
                      {isPrivate && (
                        <Badge variant="secondary" className="flex-shrink-0 gap-1">
                          <Lock className="w-3 h-3" />
                          Private
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {dateStr
                        ? formatDistanceToNow(new Date(dateStr), { addSuffix: true })
                        : "—"}
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    className="ml-3 flex-shrink-0"
                    onClick={() => handleDelete(song.id)}
                    disabled={deletingId === song.id}
                  >
                    {deletingId === song.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete
                      </>
                    )}
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <AppFooter className="mt-8" />
    </>
  );
}
