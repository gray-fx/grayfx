import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Availability from "./pages/Availability";
import AdminPanel from "./pages/AdminPanel";
import UnfollowFinder from "./pages/UnfollowFinder";
import ScoreboardControl from "./pages/ScoreboardControl";
import ScoreboardDisplay from "./pages/ScoreboardDisplay";
import Booking from "./pages/Booking";
import Upload from "./pages/Upload";
import Downloads from "./pages/Downloads";
import AthleteFinder from "./pages/AthleteFinder";
import DAS5000Control from "./pages/DAS5000Control";
import DAS5000Display from "./pages/DAS5000Display";
import Payments from "./pages/Payments";
import ThankYou from "./pages/ThankYou";
import GamesLobby from "./pages/GamesLobby";
import NotFound from "./pages/NotFound";
import DiscordOAuthHandler from "./components/panel/DiscordOAuthHandler";
import PanelLogin from "./pages/panel/PanelLogin";
import PanelDashboard from "./pages/panel/PanelDashboard";
import PanelModLogs from "./pages/panel/PanelModLogs";
import PanelCommand from "./pages/panel/PanelCommand";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <DiscordOAuthHandler />
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/panel/login" element={<PanelLogin />} />
          <Route path="/panel" element={<PanelDashboard />} />
          <Route path="/panel/logs" element={<PanelModLogs />} />
          <Route path="/panel/command" element={<PanelCommand />} />
          <Route path="/availability" element={<Availability />} />
          <Route path="/admin/panel" element={<AdminPanel />} />
          <Route path="/unfollow" element={<UnfollowFinder />} />
          <Route path="/scoreboard-control" element={<ScoreboardControl />} />
          <Route path="/scoreboard" element={<ScoreboardDisplay />} />
          <Route path="/book" element={<Booking />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/downloads" element={<Downloads />} />
          <Route path="/athlete-finder" element={<AthleteFinder />} />
          <Route path="/das5000-control" element={<DAS5000Control />} />
          <Route path="/das5000" element={<DAS5000Display />} />
          <Route path="/payments" element={<Payments />} />
          <Route path="/thank-you" element={<ThankYou />} />
          <Route path="/games" element={<GamesLobby />} />
          <Route path="/g/:code" element={<ScoreboardDisplay />} />
          <Route path="/g/:code/control" element={<ScoreboardControl />} />
          <Route path="/d/:code" element={<DAS5000Display />} />
          <Route path="/d/:code/control" element={<DAS5000Control />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
