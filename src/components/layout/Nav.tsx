import { cn } from '@/lib/utils';
import { NavLink } from 'react-router-dom';
import {
  Home,
  ClipboardList,
  MapPin,
  BarChart3,
  Settings,
  Wifi,
  WifiOff,
  RefreshCw,
  Users,
} from 'lucide-react';
import { useAppStore } from '@/store/appStore';
import { Badge } from '@/components/ui/badge';
import { ThemeToggle } from '@/components/ThemeToggle';

const navItems = [
  { path: '/', label: 'Home', icon: Home },
  { path: '/scouting', label: 'Scouting', icon: ClipboardList },
  { path: '/pit-map', label: 'Pit Map', icon: MapPin },
  { path: '/analysis', label: 'Analysis', icon: BarChart3 },
];

export const Nav = () => {
  const { isOnline, isSyncing, syncQueue, isDemoMode, currentEvent } = useAppStore();
  const pendingCount = syncQueue.length;

  return (
    <header className="fixed top-0 left-0 right-0 z-50 glass border-b border-border/50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center shadow-glow">
              <ClipboardList className="w-5 h-5 text-primary-foreground" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-foreground">FTC Scout</h1>
              {currentEvent && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {currentEvent.name}
                </p>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {navItems.map(({ path, label, icon: Icon }) => (
              <NavLink
                key={path}
                to={path}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-primary text-primary-foreground shadow-glow'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  )
                }
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Status indicators */}
          <div className="flex items-center gap-3">
            {isDemoMode && (
              <Badge variant="outline" className="border-warning text-warning text-xs">
                Demo
              </Badge>
            )}

            {/* Sync status */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-1.5 text-warning">
                <RefreshCw className={cn('w-4 h-4', isSyncing && 'animate-spin')} />
                <span className="text-xs font-mono">{pendingCount}</span>
              </div>
            )}

            {/* Online status */}
            <div className={cn(
              'flex items-center gap-1.5 text-xs',
              isOnline ? 'text-success' : 'text-destructive'
            )}>
              {isOnline ? (
                <Wifi className="w-4 h-4" />
              ) : (
                <WifiOff className="w-4 h-4" />
              )}
            </div>

            {/* Theme toggle */}
            <ThemeToggle />

            {/* Settings button */}
            <button
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
