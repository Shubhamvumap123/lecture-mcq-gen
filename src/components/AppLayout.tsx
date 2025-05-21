
import React from 'react';
import { Toaster } from '@/components/ui/sonner';

interface AppLayoutProps {
  children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container py-4">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-primary">LectureMCQ</h1>
            <span className="ml-2 text-sm text-gray-500">v1.0</span>
          </div>
        </div>
      </header>
      <main className="container py-6">
        {children}
      </main>
      <footer className="bg-white border-t mt-auto">
        <div className="container py-4 text-center text-sm text-gray-500">
          <p>LectureMCQ - Generate MCQs from lecture videos</p>
        </div>
      </footer>
      <Toaster />
    </div>
  );
};

export default AppLayout;
