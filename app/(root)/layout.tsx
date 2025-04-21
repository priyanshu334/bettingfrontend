// app/login/layout.tsx
import Navbar from '@/components/Navbar';
import NavigationBar from '@/components/NavigationBar';
import type { ReactNode } from 'react';

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>
        {/* This layout is only for login */}
      
          <Navbar/>
          <NavigationBar/>
          {children}
        
      </body>
    </html>
  );
}
