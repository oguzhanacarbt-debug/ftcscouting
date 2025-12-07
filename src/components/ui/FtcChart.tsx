import { useRef, useEffect, useMemo } from 'react';
import { cn } from '@/lib/utils';

interface DataPoint {
  x: number;
  y: number;
  label?: string;
}

interface ChartProps {
  data: DataPoint[];
  type: 'line' | 'bar' | 'heatmap';
  width?: number;
  height?: number;
  className?: string;
  colors?: {
    primary?: string;
    secondary?: string;
    grid?: string;
    text?: string;
  };
  showGrid?: boolean;
  showLabels?: boolean;
  animate?: boolean;
  title?: string;
  xAxisLabel?: string;
  yAxisLabel?: string;
}

interface BarChartData {
  label: string;
  value: number;
  color?: string;
}

interface BarChartProps {
  data: BarChartData[];
  width?: number;
  height?: number;
  className?: string;
  horizontal?: boolean;
  showValues?: boolean;
  title?: string;
}

interface HeatmapData {
  x: number;
  y: number;
  value: number;
}

interface HeatmapProps {
  data: HeatmapData[];
  width?: number;
  height?: number;
  gridSize?: number;
  className?: string;
  colorScale?: 'thermal' | 'viridis' | 'plasma';
  title?: string;
}

// Helper to get color from value (0-1)
const getHeatColor = (value: number, scale: 'thermal' | 'viridis' | 'plasma' = 'thermal'): string => {
  const clampedValue = Math.max(0, Math.min(1, value));
  
  if (scale === 'thermal') {
    const r = Math.round(255 * Math.min(1, clampedValue * 2));
    const g = Math.round(255 * Math.min(1, clampedValue * 1.5 - 0.5));
    const b = Math.round(255 * Math.max(0, 1 - clampedValue * 2));
    return `rgb(${r}, ${g}, ${b})`;
  }
  
  // Default thermal
  const hue = (1 - clampedValue) * 240;
  return `hsl(${hue}, 80%, 50%)`;
};

export const LineChart = ({
  data,
  width = 400,
  height = 200,
  className,
  colors = {},
  showGrid = true,
  animate = true,
  title,
}: ChartProps) => {
  const svgRef = useRef<SVGSVGElement>(null);
  
  const {
    primary = 'hsl(24, 100%, 55%)',
    grid = 'hsl(220, 15%, 18%)',
    text = 'hsl(215, 15%, 55%)',
  } = colors;

  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const { minX, maxX, minY, maxY, path, points } = useMemo(() => {
    if (data.length === 0) {
      return { minX: 0, maxX: 1, minY: 0, maxY: 1, path: '', points: [] };
    }

    const xs = data.map(d => d.x);
    const ys = data.map(d => d.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys) * 0.9;
    const maxY = Math.max(...ys) * 1.1;

    const scaleX = (x: number) => ((x - minX) / (maxX - minX)) * chartWidth + padding.left;
    const scaleY = (y: number) => chartHeight - ((y - minY) / (maxY - minY)) * chartHeight + padding.top;

    const points = data.map(d => ({ x: scaleX(d.x), y: scaleY(d.y), ...d }));
    const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

    return { minX, maxX, minY, maxY, path, points };
  }, [data, chartWidth, chartHeight, padding]);

  return (
    <div className={cn('relative', className)}>
      {title && (
        <h4 className="text-sm font-medium text-foreground mb-2">{title}</h4>
      )}
      <svg ref={svgRef} width={width} height={height} className="overflow-visible">
        {/* Grid */}
        {showGrid && (
          <g>
            {[0, 0.25, 0.5, 0.75, 1].map(ratio => (
              <line
                key={ratio}
                x1={padding.left}
                x2={width - padding.right}
                y1={padding.top + chartHeight * ratio}
                y2={padding.top + chartHeight * ratio}
                stroke={grid}
                strokeDasharray="4 4"
                opacity={0.5}
              />
            ))}
          </g>
        )}

        {/* Y-axis labels */}
        <g fill={text} fontSize="10" fontFamily="monospace">
          <text x={padding.left - 8} y={padding.top} textAnchor="end" dominantBaseline="middle">
            {Math.round(maxY)}
          </text>
          <text x={padding.left - 8} y={padding.top + chartHeight} textAnchor="end" dominantBaseline="middle">
            {Math.round(minY)}
          </text>
        </g>

        {/* Line */}
        <path
          d={path}
          fill="none"
          stroke={primary}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animate ? 'animate-fade-in' : ''}
        />

        {/* Area under curve */}
        <path
          d={`${path} L ${points[points.length - 1]?.x || 0} ${padding.top + chartHeight} L ${padding.left} ${padding.top + chartHeight} Z`}
          fill={primary}
          opacity={0.1}
        />

        {/* Data points */}
        {points.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={4}
            fill={primary}
            className="hover:r-6 transition-all cursor-pointer"
          >
            <title>{`${point.label || point.x}: ${point.y}`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

export const BarChart = ({
  data,
  width = 400,
  height = 200,
  className,
  horizontal = false,
  showValues = true,
  title,
}: BarChartProps) => {
  const padding = { top: 20, right: 20, bottom: 40, left: 60 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.map(d => d.value), 1);
  const barWidth = horizontal 
    ? chartHeight / data.length - 4
    : chartWidth / data.length - 4;

  return (
    <div className={cn('relative', className)}>
      {title && (
        <h4 className="text-sm font-medium text-foreground mb-2">{title}</h4>
      )}
      <svg width={width} height={height} className="overflow-visible">
        {/* Bars */}
        {data.map((item, i) => {
          const value = item.value / maxValue;
          const color = item.color || 'hsl(24, 100%, 55%)';
          
          if (horizontal) {
            const barHeight = value * chartWidth;
            const y = padding.top + (chartHeight / data.length) * i + 2;
            
            return (
              <g key={i}>
                <rect
                  x={padding.left}
                  y={y}
                  width={barHeight}
                  height={barWidth}
                  fill={color}
                  rx={4}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
                <text
                  x={padding.left - 8}
                  y={y + barWidth / 2}
                  textAnchor="end"
                  dominantBaseline="middle"
                  fontSize="10"
                  fill="hsl(215, 15%, 55%)"
                  fontFamily="monospace"
                >
                  {item.label}
                </text>
                {showValues && (
                  <text
                    x={padding.left + barHeight + 8}
                    y={y + barWidth / 2}
                    dominantBaseline="middle"
                    fontSize="10"
                    fill="hsl(210, 20%, 98%)"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {item.value.toFixed(1)}
                  </text>
                )}
              </g>
            );
          } else {
            const barHeight = value * chartHeight;
            const x = padding.left + (chartWidth / data.length) * i + 2;
            
            return (
              <g key={i}>
                <rect
                  x={x}
                  y={padding.top + chartHeight - barHeight}
                  width={barWidth}
                  height={barHeight}
                  fill={color}
                  rx={4}
                  className="animate-fade-in"
                  style={{ animationDelay: `${i * 50}ms` }}
                />
                <text
                  x={x + barWidth / 2}
                  y={height - padding.bottom + 16}
                  textAnchor="middle"
                  fontSize="10"
                  fill="hsl(215, 15%, 55%)"
                  fontFamily="monospace"
                >
                  {item.label}
                </text>
                {showValues && (
                  <text
                    x={x + barWidth / 2}
                    y={padding.top + chartHeight - barHeight - 8}
                    textAnchor="middle"
                    fontSize="10"
                    fill="hsl(210, 20%, 98%)"
                    fontWeight="bold"
                    fontFamily="monospace"
                  >
                    {item.value.toFixed(1)}
                  </text>
                )}
              </g>
            );
          }
        })}
      </svg>
    </div>
  );
};

export const Heatmap = ({
  data,
  width = 400,
  height = 300,
  gridSize = 20,
  className,
  colorScale = 'thermal',
  title,
}: HeatmapProps) => {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  const gridCols = Math.ceil(width / gridSize);
  const gridRows = Math.ceil(height / gridSize);
  
  // Create grid accumulator
  const grid = useMemo(() => {
    const g: number[][] = Array.from({ length: gridRows }, () => 
      Array.from({ length: gridCols }, () => 0)
    );
    
    data.forEach(point => {
      const col = Math.floor((point.x / width) * gridCols);
      const row = Math.floor((point.y / height) * gridRows);
      if (row >= 0 && row < gridRows && col >= 0 && col < gridCols) {
        g[row][col] += point.value;
      }
    });
    
    return g;
  }, [data, gridCols, gridRows, width, height]);
  
  const gridMax = useMemo(() => 
    Math.max(...grid.flat(), 1)
  , [grid]);

  return (
    <div className={cn('relative', className)}>
      {title && (
        <h4 className="text-sm font-medium text-foreground mb-2">{title}</h4>
      )}
      <svg width={width} height={height} className="rounded-lg overflow-hidden">
        <rect width={width} height={height} fill="hsl(220, 18%, 7%)" />
        
        {grid.map((row, rowIdx) =>
          row.map((value, colIdx) => {
            if (value === 0) return null;
            const normalizedValue = value / gridMax;
            
            return (
              <rect
                key={`${rowIdx}-${colIdx}`}
                x={colIdx * gridSize}
                y={rowIdx * gridSize}
                width={gridSize}
                height={gridSize}
                fill={getHeatColor(normalizedValue, colorScale)}
                opacity={0.3 + normalizedValue * 0.7}
              />
            );
          })
        )}
        
        {/* Original data points */}
        {data.map((point, i) => (
          <circle
            key={i}
            cx={point.x}
            cy={point.y}
            r={Math.min(8, 2 + (point.value / maxValue) * 6)}
            fill={getHeatColor(point.value / maxValue, colorScale)}
            opacity={0.8}
          />
        ))}
      </svg>
      
      {/* Legend */}
      <div className="flex items-center justify-between mt-2 text-xs text-muted-foreground">
        <span>Low</span>
        <div 
          className="w-32 h-2 rounded-full"
          style={{
            background: `linear-gradient(to right, ${getHeatColor(0, colorScale)}, ${getHeatColor(0.5, colorScale)}, ${getHeatColor(1, colorScale)})`
          }}
        />
        <span>High</span>
      </div>
    </div>
  );
};

// Stat display component
interface StatCardProps {
  label: string;
  value: string | number;
  subValue?: string;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export const StatCard = ({ label, value, subValue, trend, className }: StatCardProps) => (
  <div className={cn(
    'stat-card p-4 rounded-xl border border-border bg-gradient-card',
    className
  )}>
    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
    <div className="flex items-baseline gap-2 mt-1">
      <span className="text-2xl font-bold font-mono text-foreground">{value}</span>
      {trend && (
        <span className={cn(
          'text-xs font-medium',
          trend === 'up' && 'text-success',
          trend === 'down' && 'text-destructive',
          trend === 'neutral' && 'text-muted-foreground'
        )}>
          {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'}
        </span>
      )}
    </div>
    {subValue && (
      <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
    )}
  </div>
);
