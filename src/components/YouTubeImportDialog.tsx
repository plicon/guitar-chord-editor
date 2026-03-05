/**
 * YouTubeImportDialog
 * 
 * Dialog with a YouTube URL input that extracts chords from a guitar tutorial
 * video and creates a Song from it.
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Youtube, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { isValidYouTubeUrl, generateFromYouTube, YouTubeGenerateResult } from '@/services/youtubeImport';

interface YouTubeImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (result: YouTubeGenerateResult) => void;
}

export function YouTubeImportDialog({ open, onOpenChange, onImport }: YouTubeImportDialogProps) {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = url.trim().length > 0 && isValidYouTubeUrl(url);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || isLoading) return;

    setError(null);
    setIsLoading(true);

    try {
      const result = await generateFromYouTube(url);
      result.sourceUrl = url.trim();
      toast.success(`Imported "${result.chart.title}" — ${result.chart.sections.length} sections found`);
      onImport(result);
      onOpenChange(false);
      setUrl('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to import from YouTube';
      setError(message);
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Youtube className="w-5 h-5 text-destructive" />
            Import from YouTube
          </DialogTitle>
          <DialogDescription>
            Paste a YouTube guitar tutorial URL. The AI will extract chords, sections, and strumming patterns from the video transcript.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="text"
              placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError(null);
              }}
              disabled={isLoading}
              className={error ? 'border-destructive' : ''}
              autoFocus
            />
            {url.trim().length > 0 && !isValid && (
              <p className="text-xs text-destructive">
                Please enter a valid YouTube URL
              </p>
            )}
            {error && (
              <p className="text-xs text-destructive">{error}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!isValid || isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Youtube className="w-4 h-4 mr-2" />
                  Import
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
