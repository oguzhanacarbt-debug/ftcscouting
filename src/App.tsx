import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Home from "./pages/Home";
import Scouting from "./pages/Scouting";
import Analysis from "./pages/Analysis";
import PitScouting from "./pages/PitScouting";
import Schedule from "./pages/Schedule";
import AllianceSelection from "./pages/AllianceSelection";
import StrategyBoard from "./pages/StrategyBoard";
import TeamComparison from "./pages/TeamComparison";
import QrSync from "./pages/QrSync";
import LiveTracker from "./pages/LiveTracker";
import OpponentAnalysis from "./pages/OpponentAnalysis";
import TeamTrends from "./pages/TeamTrends";
import MatchPredictions from "./pages/MatchPredictions";
import MLInsights from "./pages/MLInsights";
import LiveUpdates from "./pages/LiveUpdates";
import AdvancedTeamSearch from "./pages/AdvancedTeamSearch";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/scouting" element={<Scouting />} />
          <Route path="/pit-scouting" element={<PitScouting />} />
          <Route path="/pit-map" element={<Navigate to="/pit-scouting" replace />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/analysis" element={<Analysis />} />
          <Route path="/alliance-selection" element={<AllianceSelection />} />
          <Route path="/compare" element={<TeamComparison />} />
          <Route path="/strategy" element={<StrategyBoard />} />
          <Route path="/sync" element={<QrSync />} />
          <Route path="/live" element={<LiveTracker />} />
          <Route path="/opponent" element={<OpponentAnalysis />} />
          <Route path="/trends" element={<TeamTrends />} />
          <Route path="/predictions" element={<MatchPredictions />} />
          <Route path="/ml-insights" element={<MLInsights />} />
          <Route path="/live-updates" element={<LiveUpdates />} />
          <Route path="/team-search" element={<AdvancedTeamSearch />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
