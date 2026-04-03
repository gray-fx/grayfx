import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Routes, Route } from "react-router-dom";

import Index from "./pages/Index";
import Status from "./pages/Status";
import StatusUpdate from "./pages/StatusUpdate";
import UnfollowFinder from "./pages/UnfollowFinder";
import ScoreboardControl from "./pages/ScoreboardControl";
import ScoreboardDisplay from "./pages/ScoreboardDisplay";
import Booking from "./pages/Booking";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <HashRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/status" element={<Status />} />
          <Route path="/statusupdate" element={<StatusUpdate />} />
          <Route path="/unfollow" element={<UnfollowFinder />} />
          <Route path="/scoreboard-control" element={<ScoreboardControl />} />
          <Route path="/scoreboard" element={<ScoreboardDisplay />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </HashRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
