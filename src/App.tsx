import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Profile from "./pages/Profile";
import BodygraphPage from "./pages/BodygraphPage";
import EnvironmentPage from "./pages/EnvironmentPage";
import CompatibilityPage from "./pages/CompatibilityPage";
import MatchesPage from "./pages/MatchesPage";
import ChatPage from "./pages/ChatPage";
import UnleashCheckPage from "./pages/UnleashCheckPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/bodygraph" element={<BodygraphPage />} />
          <Route path="/environment" element={<EnvironmentPage />} />
          <Route path="/compatibility" element={<CompatibilityPage />} />
          <Route path="/matches" element={<MatchesPage />} />
          <Route path="/chat/:matchId" element={<ChatPage />} />
          <Route path="/unleash/:matchId" element={<UnleashCheckPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
