import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Onboarding from "./pages/Onboarding";
import ProfileSetup from "./pages/ProfileSetup";
import DesignReveal from "./pages/DesignReveal";
import DiscoverPage from "./pages/DiscoverPage";
import Profile from "./pages/Profile";
import BodygraphPage from "./pages/BodygraphPage";
import EnvironmentPage from "./pages/EnvironmentPage";
import GroupDynamicsPage from "./pages/GroupDynamicsPage";
import MatchesPage from "./pages/MatchesPage";
import ChatPage from "./pages/ChatPage";
import UnleashCheckPage from "./pages/UnleashCheckPage";
import OAuthConsent from "./pages/OAuthConsent";
import NotFound from "./pages/NotFound";
import { UserStateProvider } from "@/hooks/useUserState";
import { RequireStage } from "@/components/RequireStage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <UserStateProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/onboarding"
              element={
                <RequireStage gate="onboarding">
                  <Onboarding />
                </RequireStage>
              }
            />
            <Route
              path="/design-reveal"
              element={
                <RequireStage gate="reveal">
                  <DesignReveal />
                </RequireStage>
              }
            />
            <Route
              path="/profile-setup"
              element={
                <RequireStage gate="profile-setup">
                  <ProfileSetup />
                </RequireStage>
              }
            />
            <Route
              path="/discover"
              element={
                <RequireStage gate="app">
                  <DiscoverPage />
                </RequireStage>
              }
            />
            <Route
              path="/profile"
              element={
                <RequireStage gate="app">
                  <Profile />
                </RequireStage>
              }
            />
            <Route
              path="/bodygraph"
              element={
                <RequireStage gate="app">
                  <BodygraphPage />
                </RequireStage>
              }
            />
            <Route
              path="/environment"
              element={
                <RequireStage gate="app">
                  <EnvironmentPage />
                </RequireStage>
              }
            />
            <Route
              path="/group-dynamics"
              element={
                <RequireStage gate="app">
                  <GroupDynamicsPage />
                </RequireStage>
              }
            />
            <Route
              path="/matches"
              element={
                <RequireStage gate="app">
                  <MatchesPage />
                </RequireStage>
              }
            />
            <Route
              path="/chat/:matchId"
              element={
                <RequireStage gate="app">
                  <ChatPage />
                </RequireStage>
              }
            />
            <Route
              path="/unleash/:matchId"
              element={
                <RequireStage gate="app">
                  <UnleashCheckPage />
                </RequireStage>
              }
            />
            <Route path="/.lovable/oauth/consent" element={<OAuthConsent />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </UserStateProvider>
      </BrowserRouter>

    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
