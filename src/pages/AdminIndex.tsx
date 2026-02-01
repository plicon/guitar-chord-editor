import { ThemeToggle } from "../components/ThemeToggle";
import { Button } from "../components/ui/button";
import { Home, Music, Guitar } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";

export default function AdminIndexPage() {
  return (
    <>
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 md:py-6">
          <div className="flex items-center justify-between gap-2">
            {/* Logo and title */}
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

            {/* Actions */}
            <div className="flex items-center gap-2">
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
            Manage presets and content
          </p>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto p-4 md:p-8 max-w-4xl">
        <h2 className="text-2xl font-bold mb-6">Admin Dashboard</h2>
        
        <div className="grid gap-6 md:grid-cols-2">
          {/* Strumming Patterns Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Music className="w-6 h-6 text-primary" />
                <CardTitle>Strumming Patterns</CardTitle>
              </div>
              <CardDescription>
                Manage strumming pattern presets - create, edit, and delete patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/strumming-patterns">
                  <Music className="w-4 h-4 mr-2" />
                  Manage Patterns
                </Link>
              </Button>
            </CardContent>
          </Card>

          {/* Chord Presets Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Guitar className="w-6 h-6 text-primary" />
                <CardTitle>Chord Presets</CardTitle>
              </div>
              <CardDescription>
                Manage chord presets - create, edit, and delete chord diagrams
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button asChild className="w-full">
                <Link to="/admin/chords">
                  <Guitar className="w-4 h-4 mr-2" />
                  Manage Chords
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
