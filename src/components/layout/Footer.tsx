import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto py-4 px-6 border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Kepler College. All rights reserved.</p>
        <p>Developed by <span className="font-medium text-foreground">Amani Alain</span></p>
      </div>
    </footer>
  );
}
