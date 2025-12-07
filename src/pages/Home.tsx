import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { createFtcApi } from '@/api/FtcApi';
import { TeamLookup } from '@/components/TeamLookup';
import {
  ClipboardList,
  MapPin,
  BarChart3,
  Calendar,
  Users,
  Zap,
  ChevronRight,
  Loader2,
  Download,
  QrCode,
  Activity,
  Target,
  Brain,
  Sparkles,
  Radio,
  Search,
} from 'lucide-react';
import type { Event } from '@/models/DataModels';

const Home = () => {
  const navigate = useNavigate();
  const {
    currentEvent,
    setCurrentEvent,
    scoutName,
    setScoutName,
    setEvents,
    setTeams,
    setMatches,
    matches, // Added matches to destructuring
    isDemoMode,
    setDemoMode,
    scoutEntries,
    pitScoutEntries,
    userTeamNumber,
    setUserTeamNumber,
  } = useAppStore();

  const [events, setLocalEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(false);
  const [nameInput, setNameInput] = useState(scoutName);
  const [teamInput, setTeamInput] = useState(userTeamNumber ? userTeamNumber.toString() : '');
  const [tempScoutName, setTempScoutName] = useState('');
  const [tempTeamNumber, setTempTeamNumber] = useState('');

  // Event search and filter state
  const [eventSearch, setEventSearch] = useState('');
  const [eventTypeFilter, setEventTypeFilter] = useState('all');

  // Filter events based on search and type
  const filteredEvents = events.filter((event) => {
    const matchesSearch =
      event.name.toLowerCase().includes(eventSearch.toLowerCase()) ||
      event.city?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      event.state?.toLowerCase().includes(eventSearch.toLowerCase()) ||
      event.code.toLowerCase().includes(eventSearch.toLowerCase());

    const matchesType =
      eventTypeFilter === 'all' ||
      event.type.toLowerCase().includes(eventTypeFilter.toLowerCase());

    return matchesSearch && matchesType;
  });

  useEffect(() => {
    loadEvents();
    if (currentEvent) {
      loadEventData(currentEvent);
    }
  }, []);

  const loadEvents = async () => {
    setLoading(true);
    try {
      // Use API key from environment or prompt/default
      const apiKey = import.meta.env.VITE_FTC_API_KEY || "";
      if (!apiKey) {
        console.warn("VITE_FTC_API_KEY is not set. Events may not load.");
      }
      const api = createFtcApi(apiKey);
      const fetchedEvents = await api.getEvents();
      // Ensure fetchedEvents is an array
      const eventsList = Array.isArray(fetchedEvents) ? fetchedEvents : [];
      setLocalEvents(eventsList);
      setEvents(eventsList);
      setDemoMode(false);
    } catch (error) {
      console.error('Failed to load events:', error);
      setLocalEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEventData = async (event: Event) => {
    setLoading(true);
    try {
      const apiKey = import.meta.env.VITE_FTC_API_KEY || "";
      const api = createFtcApi(apiKey);
      const [teams, matches] = await Promise.all([
        api.getTeams(event.code),
        api.getMatches(event.code),
      ]);
      setTeams(teams);
      setMatches(matches);
    } catch (error) {
      console.error('Failed to load event data:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectEvent = async (event: Event) => {
    setCurrentEvent(event);
    await loadEventData(event);
  };

  const saveName = () => {
    if (nameInput.trim()) {
      setScoutName(nameInput.trim());
    }
    if (teamInput.trim()) {
      setUserTeamNumber(parseInt(teamInput.trim()));
    }
  };

  const downloadCSV = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const exportMatchData = () => {
    if (scoutEntries.length === 0) {
      alert("No match data to export.");
      return;
    }

    // Define headers
    const headers = [
      'Team Number', 'Match', 'Alliance', 'Scout', 'Auto Samples', 'Auto Specimens', 'Auto Park',
      'TeleOp Samples', 'TeleOp Specimens', 'Endgame Hang', 'Driver Skill', 'Speed', 'Defense', 'Notes'
    ];

    // Map data
    const rows = scoutEntries.map(e => {
      const match = matches.find(m => m.id === e.matchId);
      return [
        e.teamNumber,
        match ? match.matchNumber : '?',
        e.alliance,
        e.scoutName,
        e.autoSampleScored,
        e.autoSpecimenScored,
        e.autoParked ? 'Yes' : 'No',
        e.teleopSampleScored,
        e.teleopSpecimenScored,
        e.endgameHanging,
        e.driverSkill,
        e.robotSpeed,
        e.defenseRating,
        `"${(e.overallNotes || '').replace(/"/g, '""')}"`
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `match_data_${currentEvent?.code || 'all'}.csv`);
  };

  const exportPitData = () => {
    if (pitScoutEntries.length === 0) {
      alert("No pit data to export.");
      return;
    }

    const headers = [
      'Team Number', 'Scout', 'Drive Train', 'Motors', 'Vision', 'Auto Routines', 'Strengths', 'Weaknesses'
    ];

    const rows = pitScoutEntries.map(e => [
      e.teamNumber,
      e.scoutName,
      e.driveType,
      e.motorCount,
      e.hasVision ? 'Yes' : 'No',
      `"${(e.autoRoutines || '').replace(/"/g, '""')}"`,
      `"${(e.strengths || '').replace(/"/g, '""')}"`,
      `"${(e.weaknesses || '').replace(/"/g, '""')}"`
    ].join(','));

    const csvContent = [headers.join(','), ...rows].join('\n');
    downloadCSV(csvContent, `pit_data_${currentEvent?.code || 'all'}.csv`);
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-8 animate-fade-in">
        {/* Hero Section */}
        <div className="text-center py-8">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">FTC INTO THE DEEP</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            FTC <span className="text-gradient-primary">Scouting</span> Platform
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Real-time match scouting, team analysis, and predictive insights for FIRST Tech Challenge competitions.
          </p>
        </div>

        {/* Scout Name Input */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              Scout Setup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3 flex-col sm:flex-row">
              <Input
                placeholder="YOUR Name"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onBlur={saveName}
                className="bg-input border-border"
              />
              <Input
                placeholder="YOUR Team #"
                value={teamInput}
                onChange={(e) => setTeamInput(e.target.value)}
                onBlur={saveName}
                type="number"
                className="bg-input border-border sm:w-32"
              />
              <Button onClick={saveName} disabled={!nameInput.trim()}>
                Save
              </Button>
            </div>
            {scoutName && (
              <p className="text-sm text-muted-foreground mt-2">
                Scouting as <span className="text-foreground font-medium">{scoutName}</span>
                {userTeamNumber && <span> for Team <span className="text-foreground font-medium">{userTeamNumber}</span></span>}
              </p>
            )}
          </CardContent>
        </Card>



        {/* Advanced Team Search */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary" />
              Advanced Team Search
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Search FTC teams with comprehensive data from FTCScout.org including historical stats, OPR/DPR/CCWM, event rankings, and awards
            </p>
            <Button onClick={() => navigate('/team-search')} className="w-full gap-2">
              <Search className="w-4 h-4" />
              Open Advanced Team Search
            </Button>
          </CardContent>
        </Card>


        {/* Event Selection */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" />
              Select Event
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            ) : (
              <div className="space-y-4">
                {/* Search and Filter */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex-1">
                    <Input
                      placeholder="Search events by name, city, or state..."
                      value={eventSearch}
                      onChange={(e) => setEventSearch(e.target.value)}
                      className="bg-input border-border"
                    />
                  </div>
                  <select
                    value={eventTypeFilter}
                    onChange={(e) => setEventTypeFilter(e.target.value)}
                    className="px-4 py-2 rounded-md border border-border bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Types</option>
                    <option value="league">League</option>
                    <option value="qualifier">Qualifier</option>
                    <option value="championship">Championship</option>
                    <option value="scrimmage">Scrimmage</option>
                  </select>
                </div>

                {/* Events List */}
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map((event) => (
                      <button
                        key={event.id}
                        onClick={() => selectEvent(event)}
                        className={`w-full p-4 rounded-lg border text-left transition-all ${currentEvent?.id === event.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="font-semibold text-foreground">{event.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {event.city}, {event.state} • {event.startDate}
                            </p>
                          </div>
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No events found matching your search</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        {currentEvent && scoutName && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <Button
              size="lg"
              className="h-auto py-6 bg-gradient-primary hover:opacity-90 shadow-glow"
              onClick={() => navigate('/scouting')}
            >
              <div className="flex flex-col items-center gap-2">
                <ClipboardList className="w-8 h-8" />
                <span className="font-semibold">Start Scouting</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6"
              onClick={() => navigate('/pit-scouting')}
            >
              <div className="flex flex-col items-center gap-2">
                <MapPin className="w-8 h-8" />
                <span className="font-semibold">Pit Scouting</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6"
              onClick={() => navigate('/schedule')}
            >
              <div className="flex flex-col items-center gap-2">
                <Calendar className="w-8 h-8" />
                <span className="font-semibold">Schedule</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6 bg-primary/5 border-primary/20"
              onClick={() => navigate('/live')}
            >
              <div className="flex flex-col items-center gap-2">
                <Activity className="w-8 h-8 text-primary" />
                <span className="font-semibold text-primary">Live Tracker</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6"
              onClick={() => navigate('/analysis')}
            >
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                <span className="font-semibold">Analysis</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6"
              onClick={() => navigate('/opponent')}
            >
              <div className="flex flex-col items-center gap-2">
                <Target className="w-8 h-8" />
                <span className="font-semibold">Opponent Analysis</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6"
              onClick={() => navigate('/strategy')}
            >
              <div className="flex flex-col items-center gap-2">
                <Zap className="w-8 h-8" />
                <span className="font-semibold">Strategy</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6"
              onClick={() => navigate('/compare')}
            >
              <div className="flex flex-col items-center gap-2">
                <BarChart3 className="w-8 h-8" />
                <span className="font-semibold">Compare Teams</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6"
              onClick={() => navigate('/sync')}
            >
              <div className="flex flex-col items-center gap-2">
                <QrCode className="w-8 h-8" />
                <span className="font-semibold">Offline Sync</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6 bg-purple-500/5 border-purple-500/20"
              onClick={() => navigate('/predictions')}
            >
              <div className="flex flex-col items-center gap-2">
                <Sparkles className="w-8 h-8 text-purple-500" />
                <span className="font-semibold text-purple-500">Match Predictions</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6 bg-blue-500/5 border-blue-500/20"
              onClick={() => navigate('/ml-insights')}
            >
              <div className="flex flex-col items-center gap-2">
                <Brain className="w-8 h-8 text-blue-500" />
                <span className="font-semibold text-blue-500">ML Insights</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6 bg-red-500/5 border-red-500/20"
              onClick={() => navigate('/live-updates')}
            >
              <div className="flex flex-col items-center gap-2">
                <Radio className="w-8 h-8 text-red-500" />
                <span className="font-semibold text-red-500">Live Updates</span>
              </div>
            </Button>
            <Button
              size="lg"
              variant="secondary"
              className="h-auto py-6 lg:col-span-1"
              onClick={() => navigate('/alliance-selection')}
            >
              <div className="flex flex-col items-center gap-2">
                <Users className="w-8 h-8" />
                <span className="font-semibold">Alliance Selection</span>
              </div>
            </Button>
          </div>
        )}
        {/* Data Management */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-primary" />
              Data Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Button variant="outline" className="w-full" onClick={exportMatchData}>
                <Download className="w-4 h-4 mr-2" />
                Export Match Data (CSV)
              </Button>
              <Button variant="outline" className="w-full" onClick={exportPitData}>
                <Download className="w-4 h-4 mr-2" />
                Export Pit Data (CSV)
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Home;
