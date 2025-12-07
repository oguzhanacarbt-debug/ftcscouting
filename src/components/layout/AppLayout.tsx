import { ReactNode, useEffect } from 'react';
import { Nav } from './Nav';
import { useAppStore } from '@/store/appStore';

interface AppLayoutProps {
  children: ReactNode;
}

export const AppLayout = ({ children }: AppLayoutProps) => {
  const { setOnline } = useAppStore();

  useEffect(() => {
    const handleOnline = () => setOnline(true);
    const handleOffline = () => setOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [setOnline]);

  return (
    <div className="min-h-screen bg-background bg-grid-pattern relative">
      {/* Background gradient glow */}
      <div className="fixed inset-0 bg-gradient-glow pointer-events-none" />
      
      <Nav />
      
      <main className="pt-20 pb-8 px-4 relative">
        <div className="container mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
};
