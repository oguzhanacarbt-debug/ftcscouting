import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/use-toast';
import { ChevronLeft, ChevronRight, Save, Users } from 'lucide-react';
import type { ScoutEntry, Alliance } from '@/models/DataModels';

const Scouting = () => {
  const { toast } = useToast();
  const { currentEvent, matches, teams, scoutName, deviceId, addScoutEntry } = useAppStore();
  const [matchIndex, setMatchIndex] = useState(0);
  const [selectedTeam, setSelectedTeam] = useState<number | null>(null);
  const [alliance, setAlliance] = useState<Alliance>('red');

  const currentMatch = matches[matchIndex];

  const [formData, setFormData] = useState({
    autoSampleScored: 0,
    autoSpecimenScored: 0,
    autoParked: false,
    autoNotes: '',
    teleopSampleScored: 0,
    teleopSpecimenScored: 0,
    teleopNotes: '',
    endgameParked: false,
    endgameHanging: 'none' as 'none' | 'low' | 'high',
    endgameNotes: '',
    driverSkill: 3 as 1 | 2 | 3 | 4 | 5,
    robotSpeed: 3 as 1 | 2 | 3 | 4 | 5,
    defenseRating: 3 as 1 | 2 | 3 | 4 | 5,
    overallNotes: '',
  });

  const resetForm = () => {
    setFormData({
      autoSampleScored: 0,
      autoSpecimenScored: 0,
      autoParked: false,
      autoNotes: '',
      teleopSampleScored: 0,
      teleopSpecimenScored: 0,
      teleopNotes: '',
      endgameParked: false,
      endgameHanging: 'none',
      endgameNotes: '',
      driverSkill: 3,
      robotSpeed: 3,
      defenseRating: 3,
      overallNotes: '',
    });
    setSelectedTeam(null);
  };

  const handleSubmit = () => {
    if (!currentMatch || !selectedTeam || !currentEvent) {
      toast({ title: 'Error', description: 'Please select a team', variant: 'destructive' });
      return;
    }

    const entry: ScoutEntry = {
      id: `scout_${Date.now()}_${deviceId}`,
      eventId: currentEvent.id,
      matchId: currentMatch.id,
      teamNumber: selectedTeam,
      alliance,
      scoutId: deviceId,
      scoutName,
      deviceId,
      ...formData,
      localTimestamp: Date.now(),
      syncStatus: 'pending',
      version: 1,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    addScoutEntry(entry);
    toast({ title: 'Saved!', description: `Entry for Team ${selectedTeam} saved.` });
    resetForm();
  };

  if (!currentEvent) {
    return (
      <AppLayout>
        <div className="text-center py-16">
          <h2 className="text-xl font-semibold text-foreground">No event selected</h2>
          <p className="text-muted-foreground mt-2">Go to Home to select an event first.</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
        {/* Match Navigator */}
        <Card className="glass border-border/50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <Button variant="ghost" size="icon" onClick={() => setMatchIndex(Math.max(0, matchIndex - 1))} disabled={matchIndex === 0}>
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Qualification Match</p>
                <p className="text-2xl font-bold font-mono text-foreground">Q{currentMatch?.matchNumber || 1}</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMatchIndex(Math.min(matches.length - 1, matchIndex + 1))} disabled={matchIndex >= matches.length - 1}>
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Team Selection */}
        {currentMatch && (
          <Card className="glass border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" />
                Select Team to Scout
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-team-red mb-2">Red Alliance</p>
                <div className="flex gap-2">
                  {currentMatch.redAlliance.map((num) => (
                    <Button
                      key={num}
                      variant={selectedTeam === num ? 'default' : 'outline'}
                      className={selectedTeam === num ? 'bg-team-red hover:bg-team-red/90' : 'border-team-red/50 text-team-red'}
                      onClick={() => { setSelectedTeam(num); setAlliance('red'); }}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-team-blue mb-2">Blue Alliance</p>
                <div className="flex gap-2">
                  {currentMatch.blueAlliance.map((num) => (
                    <Button
                      key={num}
                      variant={selectedTeam === num ? 'default' : 'outline'}
                      className={selectedTeam === num ? 'bg-team-blue hover:bg-team-blue/90' : 'border-team-blue/50 text-team-blue'}
                      onClick={() => { setSelectedTeam(num); setAlliance('blue'); }}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {selectedTeam && (
          <>
            {/* Autonomous */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Autonomous</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Samples Scored</Label>
                    <Input type="number" min={0} value={formData.autoSampleScored} onChange={(e) => setFormData({ ...formData, autoSampleScored: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Specimens Scored</Label>
                    <Input type="number" min={0} value={formData.autoSpecimenScored} onChange={(e) => setFormData({ ...formData, autoSpecimenScored: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={formData.autoParked} onCheckedChange={(v) => setFormData({ ...formData, autoParked: v })} />
                  <Label>Parked in Observation Zone</Label>
                </div>
              </CardContent>
            </Card>

            {/* TeleOp */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>TeleOp</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Samples Scored</Label>
                    <Input type="number" min={0} value={formData.teleopSampleScored} onChange={(e) => setFormData({ ...formData, teleopSampleScored: parseInt(e.target.value) || 0 })} />
                  </div>
                  <div>
                    <Label>Specimens Scored</Label>
                    <Input type="number" min={0} value={formData.teleopSpecimenScored} onChange={(e) => setFormData({ ...formData, teleopSpecimenScored: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Endgame */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Endgame</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  {(['none', 'low', 'high'] as const).map((h) => (
                    <Button key={h} variant={formData.endgameHanging === h ? 'default' : 'outline'} onClick={() => setFormData({ ...formData, endgameHanging: h })}>
                      {h === 'none' ? 'No Hang' : `${h.charAt(0).toUpperCase() + h.slice(1)} Rung`}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Ratings */}
            <Card className="glass border-border/50">
              <CardHeader>
                <CardTitle>Ratings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { key: 'driverSkill', label: 'Driver Skill' },
                  { key: 'robotSpeed', label: 'Robot Speed' },
                  { key: 'defenseRating', label: 'Defense' },
                ].map(({ key, label }) => (
                  <div key={key}>
                    <div className="flex justify-between mb-2">
                      <Label>{label}</Label>
                      <Badge variant="outline">{formData[key as keyof typeof formData]}/5</Badge>
                    </div>
                    <Slider value={[formData[key as keyof typeof formData] as number]} onValueChange={([v]) => setFormData({ ...formData, [key]: v as 1|2|3|4|5 })} min={1} max={5} step={1} />
                  </div>
                ))}
                <div>
                  <Label>Notes</Label>
                  <Textarea value={formData.overallNotes} onChange={(e) => setFormData({ ...formData, overallNotes: e.target.value })} placeholder="Any observations..." />
                </div>
              </CardContent>
            </Card>

            {/* Submit */}
            <Button size="lg" className="w-full bg-gradient-primary shadow-glow" onClick={handleSubmit}>
              <Save className="w-5 h-5 mr-2" />
              Save Scout Entry
            </Button>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Scouting;
