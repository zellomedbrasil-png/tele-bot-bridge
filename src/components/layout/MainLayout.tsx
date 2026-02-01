import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-hidden">
        {children}
      </main>
    </div>
  );
}
