import { useState, useEffect, useRef } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAppStore } from '@/store/appStore';
import { Html5QrcodeScanner } from 'html5-qrcode';
import QRCode from 'react-qr-code';
import { QrCode, Scan, Upload, FileJson, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { ScoutEntry, PitScoutEntry } from '@/models/DataModels';

const QrSync = () => {
    const { toast } = useToast();
    const {
        currentEvent,
        scoutEntries,
        pitScoutEntries,
        addScoutEntry,
        addPitScoutEntry,
        updateScoutEntry,
        updatePitScoutEntry,
        matches
    } = useAppStore();

    // Send State
    const [sendType, setSendType] = useState<'match' | 'pit' | 'bulk'>('match');
    const [selectedId, setSelectedId] = useState<string>('');
    const [qrData, setQrData] = useState<string>('');

    // Receive State
    const [scannedData, setScannedData] = useState<any>(null);
    const [isScanning, setIsScanning] = useState(false);

    // Generate QR when selection changes
    useEffect(() => {
        if (sendType === 'bulk') {
            if (!currentEvent) {
                setQrData('');
                return;
            }
            const matchData = scoutEntries.filter(e => e.eventId === currentEvent.id);
            const pitData = pitScoutEntries.filter(e => e.eventId === currentEvent.id);

            // Basic compression: map to smaller objects if needed, but for now sending raw
            // We strip matchNumber from sending logic if it was added dynamically, 
            // but here we are sending from store so it's clean.
            const data = {
                type: 'bulk_sync',
                eventId: currentEvent.id,
                scoutEntries: matchData,
                pitScoutEntries: pitData,
                count: matchData.length + pitData.length
            };
            setQrData(JSON.stringify(data));
            return;
        }

        if (!selectedId) {
            setQrData('');
            return;
        }

        let data = null;
        if (sendType === 'match') {
            const entry = scoutEntries.find(e => e.id === selectedId);
            if (entry) {
                const match = matches.find(m => m.id === entry.matchId);
                data = { type: 'scout_entry', ...entry, matchNumber: match?.matchNumber };
            }
        } else if (sendType === 'pit') {
            const entry = pitScoutEntries.find(e => e.id === selectedId);
            if (entry) data = { type: 'pit_entry', ...entry };
        }

        if (data) {
            setQrData(JSON.stringify(data));
        }
    }, [selectedId, sendType, scoutEntries, pitScoutEntries, matches, currentEvent]);

    // Scanner
    useEffect(() => {
        if (isScanning && !scannedData) {
            const scanner = new Html5QrcodeScanner(
                "reader",
                { fps: 10, qrbox: { width: 250, height: 250 } },
                false
            );

            scanner.render((decodedText) => {
                try {
                    const parsed = JSON.parse(decodedText);
                    if (['scout_entry', 'pit_entry', 'bulk_sync'].includes(parsed.type)) {
                        setScannedData(parsed);
                        scanner.clear();
                        setIsScanning(false);
                    }
                } catch (e) {
                    console.error('Invalid QR data', e);
                }
            }, (error) => {
                // Ignore errors
            });

            return () => {
                scanner.clear().catch(console.error);
            };
        }
    }, [isScanning, scannedData]);

    const handleImport = () => {
        if (!scannedData) return;

        try {
            let count = 0;
            if (scannedData.type === 'bulk_sync') {
                // Import Match Data
                if (Array.isArray(scannedData.scoutEntries)) {
                    scannedData.scoutEntries.forEach((entry: any) => {
                        const existing = scoutEntries.find(e => e.id === entry.id);
                        if (existing) updateScoutEntry(entry.id, entry);
                        else addScoutEntry(entry);
                        count++;
                    });
                }
                // Import Pit Data
                if (Array.isArray(scannedData.pitScoutEntries)) {
                    scannedData.pitScoutEntries.forEach((entry: any) => {
                        const existing = pitScoutEntries.find(e => e.id === entry.id);
                        if (existing) updatePitScoutEntry(entry.id, entry);
                        else addPitScoutEntry(entry);
                        count++;
                    });
                }
                toast({ title: 'Bulk Import Complete', description: `Imported/Updated ${count} entries.` });
            }
            else if (scannedData.type === 'scout_entry') {
                const existing = scoutEntries.find(e => e.id === scannedData.id);
                // Remove extra props like matchNumber before saving if strict types, but Typescript runtime ignores extra props mostly. 
                // However, we should be clean.
                const { matchNumber, type, ...cleanEntry } = scannedData;

                if (existing) {
                    updateScoutEntry(scannedData.id, cleanEntry);
                    toast({ title: 'Updated', description: 'Existing match entry updated.' });
                } else {
                    addScoutEntry(cleanEntry as ScoutEntry);
                    toast({ title: 'Imported', description: 'New match entry added.' });
                }
            } else if (scannedData.type === 'pit_entry') {
                const existing = pitScoutEntries.find(e => e.id === scannedData.id);
                const { type, matchNumber, ...cleanEntry } = scannedData;

                if (existing) {
                    updatePitScoutEntry(scannedData.id, cleanEntry);
                    toast({ title: 'Updated', description: 'Existing pit entry updated.' });
                } else {
                    addPitScoutEntry(cleanEntry as PitScoutEntry);
                    toast({ title: 'Imported', description: 'New pit entry added.' });
                }
            }
            setScannedData(null);
        } catch (e) {
            toast({ title: 'Error', description: 'Failed to import data.', variant: 'destructive' });
        }
    };

    return (
        <AppLayout>
            <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
                <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                    <QrCode className="w-8 h-8 text-primary" />
                    Offline Sync
                </h1>

                <Tabs defaultValue="receive" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="send">Generate QR (Send)</TabsTrigger>
                        <TabsTrigger value="receive">Scan QR (Receive)</TabsTrigger>
                    </TabsList>

                    {/* SEND TAB */}
                    <TabsContent value="send" className="space-y-4 mt-4">
                        <Card className="glass border-border/50">
                            <CardHeader>
                                <CardTitle>Share Data</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Data Type</label>
                                    <Select value={sendType} onValueChange={(v: any) => { setSendType(v); setSelectedId(''); }}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="match">Match Scouting</SelectItem>
                                            <SelectItem value="pit">Pit Scouting</SelectItem>
                                            <SelectItem value="bulk">Bulk Sync (Current Event)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {sendType !== 'bulk' && (
                                    <div className="space-y-2">
                                        <label className="text-sm font-medium">Select Entry</label>
                                        <Select value={selectedId} onValueChange={setSelectedId}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Choose an entry to share..." />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {sendType === 'match' ? (
                                                    scoutEntries.length > 0 ? scoutEntries.map(e => {
                                                        const match = matches.find(m => m.id === e.matchId);
                                                        return (
                                                            <SelectItem key={e.id} value={e.id}>
                                                                Match {match ? match.matchNumber : '?'} - Team {e.teamNumber} ({e.scoutName})
                                                            </SelectItem>
                                                        );
                                                    }) : <SelectItem value="none" disabled>No match entries found</SelectItem>
                                                ) : (
                                                    pitScoutEntries.length > 0 ? pitScoutEntries.map(e => (
                                                        <SelectItem key={e.id} value={e.id}>
                                                            Team {e.teamNumber} - Pit Data ({e.scoutName})
                                                        </SelectItem>
                                                    )) : <SelectItem value="none" disabled>No pit entries found</SelectItem>
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                )}

                                {qrData && (
                                    <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl mt-4">
                                        <QRCode value={qrData} />
                                        <p className="text-sm text-gray-500 mt-4 text-center">
                                            {sendType === 'bulk'
                                                ? "Scan to import all data for this event."
                                                : "Scan this code with another device to transfer this entry."}
                                        </p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* RECEIVE TAB */}
                    <TabsContent value="receive" className="space-y-4 mt-4">
                        <Card className="glass border-border/50">
                            <CardHeader>
                                <CardTitle>Scan Data</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {!isScanning && !scannedData && (
                                    <Button size="lg" className="w-full h-32 text-xl" onClick={() => setIsScanning(true)}>
                                        <Scan className="w-12 h-12 mr-2" />
                                        Start Camera
                                    </Button>
                                )}

                                {isScanning && (
                                    <div className="rounded-xl overflow-hidden bg-black">
                                        <div id="reader" className="w-full"></div>
                                        <Button variant="destructive" className="w-full mt-2" onClick={() => setIsScanning(false)}>
                                            Stop Scanning
                                        </Button>
                                    </div>
                                )}

                                {scannedData && (
                                    <div className="bg-muted/50 p-6 rounded-xl space-y-4 border border-primary/20">
                                        <div className="flex items-center gap-4 text-green-500">
                                            <CheckCircle2 className="w-8 h-8" />
                                            <div>
                                                <h3 className="font-bold text-lg">Data Found!</h3>
                                                <p className="text-sm text-foreground/80">
                                                    {scannedData.type === 'bulk_sync'
                                                        ? `Bulk Sync: ${scannedData.count} Entries`
                                                        : scannedData.type === 'scout_entry'
                                                            ? `Match ${scannedData.matchNumber} - Team ${scannedData.teamNumber}`
                                                            : `Pit Data - Team ${scannedData.teamNumber}`
                                                    }
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {scannedData.type === 'bulk_sync' ? 'Ready to import.' : `Scouted by: ${scannedData.scoutName}`}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex gap-2">
                                            <Button className="flex-1" onClick={handleImport}>
                                                <Upload className="w-4 h-4 mr-2" />
                                                Import Data
                                            </Button>
                                            <Button variant="outline" onClick={() => { setScannedData(null); setIsScanning(true); }}>
                                                Rescan
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
};

export default QrSync;
