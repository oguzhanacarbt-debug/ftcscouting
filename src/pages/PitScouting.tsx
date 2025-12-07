import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/appStore';
import { useToast } from '@/hooks/use-toast';
import { Save, Camera, Brain, Zap, Ruler, Code } from 'lucide-react';
import type { PitScoutEntry } from '@/models/DataModels';

const PitScouting = () => {
    const { toast } = useToast();
    const { currentEvent, scoutName, deviceId, addPitScoutEntry, pitScoutEntries } = useAppStore();
    const [teamNumber, setTeamNumber] = useState('');

    const [formData, setFormData] = useState({
        driveType: 'mecanum' as 'tank' | 'mecanum' | 'swerve' | 'other',
        motorCount: 4,
        programmingLanguage: 'java' as 'java' | 'blocks' | 'other',
        hasVision: false,
        canScoreSamples: true,
        canScoreSpecimens: true,
        canHangLow: false,
        canHangHigh: true,
        preferredStartPosition: 'right' as 'left' | 'center' | 'right',
        autoRoutines: '',
        strengths: '',
        weaknesses: '',
        photoUrls: [] as string[],
    });

    const resetForm = () => {
        setFormData({
            driveType: 'mecanum',
            motorCount: 4,
            programmingLanguage: 'java',
            hasVision: false,
            canScoreSamples: true,
            canScoreSpecimens: true,
            canHangLow: false,
            canHangHigh: true,
            preferredStartPosition: 'right',
            autoRoutines: '',
            strengths: '',
            weaknesses: '',
            photoUrls: [],
        });
        setTeamNumber('');
    };

    const handleSubmit = () => {
        if (!currentEvent) {
            toast({ title: 'Error', description: 'No event selected', variant: 'destructive' });
            return;
        }
        if (!teamNumber) {
            toast({ title: 'Error', description: 'Please enter a team number', variant: 'destructive' });
            return;
        }

        const entry: PitScoutEntry = {
            id: `pit_${Date.now()}_${deviceId}`,
            eventId: currentEvent.id,
            teamNumber: parseInt(teamNumber),
            scoutId: deviceId,
            scoutName,
            deviceId,
            ...formData,
            syncStatus: 'pending',
            version: 1,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        };

        addPitScoutEntry(entry);
        toast({ title: 'Saved!', description: `Pit entry for Team ${teamNumber} saved.` });
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

    // Calculate previously scouted teams count
    const scoutedTeamsCount = new Set(pitScoutEntries.filter(e => e.eventId === currentEvent.id).map(e => e.teamNumber)).size;

    return (
        <AppLayout>
            <div className="max-w-3xl mx-auto space-y-6 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Pit Scouting</h1>
                    <span className="text-sm text-muted-foreground">Teams Scouted: {scoutedTeamsCount}</span>
                </div>

                {/* Team Input */}
                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle className="text-lg">Team Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <Label>Team Number</Label>
                            <Input
                                type="number"
                                placeholder="e.g. 11115"
                                value={teamNumber}
                                onChange={(e) => setTeamNumber(e.target.value)}
                                className="text-lg font-mono placeholder:text-muted-foreground/50"
                            />
                        </div>
                    </CardContent>
                </Card>

                {/* Robot Specs */}
                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Zap className="w-5 h-5 text-primary" />
                            Robot Specs
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <Label>Drive Train</Label>
                                <Select value={formData.driveType} onValueChange={(v: any) => setFormData({ ...formData, driveType: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="mecanum">Mecanum</SelectItem>
                                        <SelectItem value="swerve">Swerve</SelectItem>
                                        <SelectItem value="tank">Tank / 6WD</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Language</Label>
                                <Select value={formData.programmingLanguage} onValueChange={(v: any) => setFormData({ ...formData, programmingLanguage: v })}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="java">Java / Kotlin</SelectItem>
                                        <SelectItem value="blocks">Blocks</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>Motor Count (Drive + Mech)</Label>
                                <div className="flex items-center gap-4">
                                    <Ruler className="w-4 h-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        min={0}
                                        max={20}
                                        value={formData.motorCount}
                                        onChange={(e) => setFormData({ ...formData, motorCount: parseInt(e.target.value) || 0 })}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/20 border border-secondary/50">
                                <div className="flex items-center gap-2">
                                    <Brain className="w-5 h-5 text-purple-400" />
                                    <div className="flex flex-col">
                                        <span className="font-medium">Limelight / Vision</span>
                                        <span className="text-xs text-muted-foreground">Is the robot using vision processing?</span>
                                    </div>
                                </div>
                                <Switch
                                    checked={formData.hasVision}
                                    onCheckedChange={(checked) => setFormData({ ...formData, hasVision: checked })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Capabilities */}
                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Code className="w-5 h-5 text-primary" />
                            Capabilities
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label>Score Samples</Label>
                                <Switch checked={formData.canScoreSamples} onCheckedChange={(v) => setFormData({ ...formData, canScoreSamples: v })} />
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label>Score Specimens</Label>
                                <Switch checked={formData.canScoreSpecimens} onCheckedChange={(v) => setFormData({ ...formData, canScoreSpecimens: v })} />
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label>Hang Low</Label>
                                <Switch checked={formData.canHangLow} onCheckedChange={(v) => setFormData({ ...formData, canHangLow: v })} />
                            </div>
                            <div className="flex items-center justify-between border p-3 rounded-md">
                                <Label>Hang High</Label>
                                <Switch checked={formData.canHangHigh} onCheckedChange={(v) => setFormData({ ...formData, canHangHigh: v })} />
                            </div>
                        </div>

                        <div className="space-y-2 pt-2">
                            <Label>Preferred Auto Start</Label>
                            <div className="flex gap-2">
                                {['left', 'center', 'right'].map((pos) => (
                                    <Button
                                        key={pos}
                                        variant={formData.preferredStartPosition === pos ? 'default' : 'outline'}
                                        className="flex-1 capitalize"
                                        onClick={() => setFormData({ ...formData, preferredStartPosition: pos as any })}
                                    >
                                        {pos}
                                    </Button>
                                ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Notes */}
                <Card className="glass border-border/50">
                    <CardHeader>
                        <CardTitle>Strategy & Notes</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="space-y-2">
                            <Label>Auto Routines</Label>
                            <Textarea
                                placeholder="Describe their auto paths (e.g. 1+3, park only)"
                                value={formData.autoRoutines}
                                onChange={(e) => setFormData({ ...formData, autoRoutines: e.target.value })}
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Strengths</Label>
                                <Textarea
                                    placeholder="Fast cycle time, reliable hang..."
                                    value={formData.strengths}
                                    onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Weaknesses</Label>
                                <Textarea
                                    placeholder="Gets pushed easily, intake jams..."
                                    value={formData.weaknesses}
                                    onChange={(e) => setFormData({ ...formData, weaknesses: e.target.value })}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Button size="lg" className="w-full bg-gradient-primary shadow-glow mb-8" onClick={handleSubmit}>
                    <Save className="w-5 h-5 mr-2" />
                    Save Pit Entry
                </Button>
            </div>
        </AppLayout>
    );
};

export default PitScouting;
