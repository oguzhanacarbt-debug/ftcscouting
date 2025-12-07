import { useState, useRef, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Eraser, Undo, Download, Trash2, Palette } from 'lucide-react';

const StrategyBoard = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [color, setColor] = useState('#ef4444'); // Default red
    const [brushSize, setBrushSize] = useState(4);

    // Setup canvas scaling and dimensions
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const parent = canvas.parentElement;
        if (parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            // Draw field background
            drawField(ctx, canvas.width, canvas.height);
        }

        // Handle resize
        const handleResize = () => {
            if (parent) {
                // Save current drawing
                const tempCanvas = document.createElement('canvas');
                tempCanvas.width = canvas.width;
                tempCanvas.height = canvas.height;
                const tempCtx = tempCanvas.getContext('2d');
                tempCtx?.drawImage(canvas, 0, 0);

                canvas.width = parent.clientWidth;
                canvas.height = parent.clientHeight;

                // Redraw field and previous content
                if (ctx) {
                    ctx.lineCap = 'round';
                    ctx.lineJoin = 'round';
                    drawField(ctx, canvas.width, canvas.height);
                    ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
                }
            }
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const drawField = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
        // Field carpet
        ctx.fillStyle = '#1e1e1e'; // Dark gray mat
        ctx.fillRect(0, 0, width, height);

        // Grid lines (tiles) - approx 6x6 tiles
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        const tileSizeX = width / 6;
        const tileSizeY = height / 6;

        for (let i = 1; i < 6; i++) {
            // Vertical
            ctx.beginPath();
            ctx.moveTo(i * tileSizeX, 0);
            ctx.lineTo(i * tileSizeX, height);
            ctx.stroke();
            // Horizontal
            ctx.beginPath();
            ctx.moveTo(0, i * tileSizeY);
            ctx.lineTo(width, i * tileSizeY);
            ctx.stroke();
        }

        // Center element (generic representation)
        ctx.strokeStyle = '#444';
        ctx.lineWidth = 4;
        ctx.strokeRect(width / 2 - tileSizeX, height / 2 - tileSizeY, tileSizeX * 2, tileSizeY * 2);
    };

    const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        const { x, y } = getCoordinates(e, canvas);

        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.strokeStyle = color;
        ctx.lineWidth = brushSize;
    };

    const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const { x, y } = getCoordinates(e, canvas);
        ctx.lineTo(x, y);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const getCoordinates = (e: React.MouseEvent | React.TouchEvent, canvas: HTMLCanvasElement) => {
        const rect = canvas.getBoundingClientRect();
        let clientX, clientY;

        if ('touches' in e) {
            clientX = e.touches[0].clientX;
            clientY = e.touches[0].clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    };

    const clearBoard = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            drawField(ctx, canvas.width, canvas.height);
        }
    };

    const downloadBoard = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const link = document.createElement('a');
        link.download = `strategy-board-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
    };

    return (
        <AppLayout>
            <div className="max-w-6xl mx-auto h-[calc(100vh-140px)] flex flex-col gap-4 animate-fade-in">
                <div className="flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-foreground">Strategy Whiteboard</h1>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={downloadBoard}>
                            <Download className="w-4 h-4 mr-2" />
                            Save
                        </Button>
                        <Button variant="destructive" size="sm" onClick={clearBoard}>
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear
                        </Button>
                    </div>
                </div>

                <div className="flex-1 flex gap-4 overflow-hidden">
                    {/* Toolbar */}
                    <Card className="glass border-border/50 w-16 md:w-20 flex flex-col items-center py-4 gap-4">
                        <div className="flex flex-col gap-2 w-full px-2">
                            <span className="text-xs text-center text-muted-foreground">Color</span>
                            <button
                                className={`w-8 h-8 rounded-full bg-red-500 mx-auto ring-2 ${color === '#ef4444' ? 'ring-white' : 'ring-transparent'}`}
                                onClick={() => setColor('#ef4444')}
                            />
                            <button
                                className={`w-8 h-8 rounded-full bg-blue-500 mx-auto ring-2 ${color === '#3b82f6' ? 'ring-white' : 'ring-transparent'}`}
                                onClick={() => setColor('#3b82f6')}
                            />
                            <button
                                className={`w-8 h-8 rounded-full bg-yellow-400 mx-auto ring-2 ${color === '#facc15' ? 'ring-white' : 'ring-transparent'}`}
                                onClick={() => setColor('#facc15')}
                            />
                            <button
                                className={`w-8 h-8 rounded-full bg-white mx-auto ring-2 ${color === '#ffffff' ? 'ring-white' : 'ring-transparent'}`}
                                onClick={() => setColor('#ffffff')}
                            />
                        </div>

                        <div className="w-full px-2 mt-4">
                            <span className="text-xs text-center block text-muted-foreground mb-2">Size</span>
                            <Slider
                                orientation="vertical"
                                min={2}
                                max={20}
                                step={1}
                                value={[brushSize]}
                                onValueChange={([v]) => setBrushSize(v)}
                                className="h-32 mx-auto"
                            />
                        </div>
                    </Card>

                    {/* Canvas Area */}
                    <Card className="glass border-border/50 flex-1 relative overflow-hidden">
                        <CardContent className="p-0 h-full">
                            <canvas
                                ref={canvasRef}
                                className="touch-none cursor-crosshair w-full h-full"
                                onMouseDown={startDrawing}
                                onMouseMove={draw}
                                onMouseUp={stopDrawing}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchMove={draw}
                                onTouchEnd={stopDrawing}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
};

export default StrategyBoard;
