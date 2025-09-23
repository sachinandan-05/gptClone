'use client';

import { UserButton, useUser } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { LogIn } from 'lucide-react';
import Link from 'next/link';

export function UserProfile() {
  const { isLoaded, isSignedIn } = useUser();

  if (!isLoaded) {
    return <div className="w-8 h-8 rounded-full bg-gray-600 animate-pulse"></div>;
  }

  if (!isSignedIn) {
    return (
      <Button asChild variant="ghost" size="sm" className="text-gray-300 hover:text-white">
        <Link href="/sign-in">
          <LogIn className="w-4 h-4 mr-2" />
          Sign in
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center">
      <UserButton 
        afterSignOutUrl="/"
        appearance={{
          elements: {
            avatarBox: 'h-8 w-8',
            userButtonPopoverCard: 'bg-[#202123] border border-gray-700',
            userPreviewMainIdentifier: 'text-white',
            userButtonPopoverActionButtonText: 'text-gray-300 hover:text-white',
            userButtonPopoverActionButton: 'hover:bg-gray-700',
            userButtonPopoverActionButtonIcon: 'text-gray-400',
            userButtonPopoverFooter: 'hidden',
          },
        }}
      />
    </div>
  );
}
