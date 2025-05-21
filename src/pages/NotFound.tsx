
import React from 'react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import AppLayout from '@/components/AppLayout';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <AppLayout>
      <div className="flex flex-col items-center justify-center py-16">
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <p className="text-xl text-gray-600 mb-8">Page not found</p>
        <Button onClick={() => navigate('/')}>
          Return to Home
        </Button>
      </div>
    </AppLayout>
  );
};

export default NotFound;
