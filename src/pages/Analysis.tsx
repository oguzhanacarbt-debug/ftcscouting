import { useMemo } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppStore } from '@/store/appStore';
import { calculateAllTeamStats, predictMatch } from '@/analysis/AnalysisEngine';
import { LineChart, BarChart, StatCard } from '@/components/ui/FtcChart';
import { TrendingUp, Target, Zap, Award } from 'lucide-react';

const Analysis = () => {
  const { currentEvent, teams, matches, scoutEntries } = useAppStore();

  const teamStats = useMemo(() => {
    if (!currentEvent || teams.length === 0) return new Map();
    return calculateAllTeamStats(teams.map(t => t.number), currentEvent.id, scoutEntries);
  }, [currentEvent, teams, scoutEntries]);

  const topTeams = useMemo(() => {
    return [...teamStats.values()]
      .filter(s => s.matchesPlayed > 0)
      .sort((a, b) => b.eloRating - a.eloRating)
      .slice(0, 8);
  }, [teamStats]);

  const upcomingPredictions = useMemo(() => {
    return matches
      .filter(m => m.status === 'pending')
      .slice(0, 5)
      .map(m => ({ match: m, prediction: predictMatch(m, teamStats) }));
  }, [matches, teamStats]);

  if (!currentEvent) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold">No event selected</h2>
          <p className="text-muted-foreground mt-2">Go to Home to select an event first.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 animate-fade-in">
        <h1 className="text-2xl font-bold text-foreground">Team Analysis</h1>

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard label="Teams Scouted" value={topTeams.length} subValue={`of ${teams.length}`} />
          <StatCard label="Matches Recorded" value={scoutEntries.length} />
          <StatCard label="Top ELO" value={topTeams[0]?.eloRating || '-'} subValue={topTeams[0] ? `Team ${topTeams[0].teamNumber}` : ''} trend="up" />
          <StatCard label="Avg Points" value={topTeams.length ? Math.round(topTeams.reduce((s, t) => s + t.avgTotalPoints, 0) / topTeams.length) : 0} />
        </div>

        {/* Top Teams Chart */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Award className="w-5 h-5 text-primary" />Top Teams by ELO</CardTitle>
          </CardHeader>
          <CardContent>
            {topTeams.length > 0 ? (
              <BarChart
                data={topTeams.map(t => ({ label: String(t.teamNumber), value: t.eloRating, color: 'hsl(24, 100%, 55%)' }))}
                width={600}
                height={200}
                horizontal
              />
            ) : (
              <p className="text-muted-foreground text-center py-8">Scout some matches to see team rankings</p>
            )}
          </CardContent>
        </Card>

        {/* Match Predictions */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Target className="w-5 h-5 text-primary" />Upcoming Match Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            {upcomingPredictions.length > 0 ? (
              <div className="space-y-3">
                {upcomingPredictions.map(({ match, prediction }) => (
                  <div key={match.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border">
                    <div className="text-sm font-mono">Q{match.matchNumber}</div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-team-red font-mono">{match.redAlliance.join(', ')}</span>
                        <span className="block text-xs text-muted-foreground">{Math.round(prediction.redWinProbability * 100)}%</span>
                      </div>
                      <span className="text-muted-foreground">vs</span>
                      <div>
                        <span className="text-team-blue font-mono">{match.blueAlliance.join(', ')}</span>
                        <span className="block text-xs text-muted-foreground">{Math.round(prediction.blueWinProbability * 100)}%</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">±{Math.round(prediction.confidenceBand * 100)}%</div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">No upcoming matches</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Analysis;
