import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import AdminIndexPage from "./pages/AdminIndex";
import AdminStrummingPatternsPage from "./pages/AdminStrummingPatterns";
import AdminChordsPage from "./pages/AdminChords";
import AdminSongsPage from "./pages/AdminSongs";
import { AdminLayout } from "./components/AdminLayout";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/admin" element={<AdminLayout><AdminIndexPage /></AdminLayout>} />
            <Route path="/admin/strumming-patterns" element={<AdminLayout><AdminStrummingPatternsPage /></AdminLayout>} />
            <Route path="/admin/chords" element={<AdminLayout><AdminChordsPage /></AdminLayout>} />
            <Route path="/admin/songs" element={<AdminLayout><AdminSongsPage /></AdminLayout>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
