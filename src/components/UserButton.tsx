'use client';

import { useUser, useClerk } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { LogIn, LogOut, User } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// Function to clear all cookies
function clearAllCookies() {
  const cookies = document.cookie.split(';');
  
  for (let i = 0; i < cookies.length; i++) {
    const cookie = cookies[i];
    const eqPos = cookie.indexOf('=');
    const name = eqPos > -1 ? cookie.substring(0, eqPos).trim() : cookie.trim();
    
    // Clear cookie for all possible paths and domains
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=${window.location.hostname};`;
    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${window.location.hostname};`;
  }
  
  // Also clear localStorage and sessionStorage
  localStorage.clear();
  sessionStorage.clear();
}

export function UserProfile() {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  // Handle client-side logout with cookie clearing
  const handleSignOut = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isSigningOut) return;
    
    setIsSigningOut(true);
    console.log('🔐 Starting client-side logout...');
    
    try {
      // Step 1: Clear all cookies immediately
      console.log('🍪 Clearing all cookies...');
      clearAllCookies();
      
      // Step 2: Sign out from Clerk (non-blocking)
      console.log('🔐 Signing out from Clerk...');
      signOut().catch((err) => {
        console.log('⚠️ Clerk signOut warning (ignored):', err);
      });
      
      // Step 3: Immediate hard redirect after short delay
      setTimeout(() => {
        console.log('🔄 Performing hard redirect to clear session...');
        window.location.replace('/');
      }, 100);
      
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Force redirect anyway
      window.location.replace('/');
    }
  };

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
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            className="h-8 w-8 rounded-full p-0 hover:bg-gray-700"
          >
            <div className="w-8 h-8 rounded-full bg-gray-600 flex items-center justify-center text-white">
              {user?.imageUrl ? (
                <img 
                  src={user.imageUrl} 
                  alt={user.username || 'User'} 
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <User size={16} />
              )}
            </div>
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent 
          align="end" 
          className="w-56 bg-[#202123] border border-gray-700"
        >
          <DropdownMenuLabel className="text-white">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium">
                {user?.fullName || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-400">
                {user?.primaryEmailAddress?.emailAddress}
              </p>
            </div>
          </DropdownMenuLabel>
          
          <DropdownMenuSeparator className="bg-gray-700" />
          
          <DropdownMenuItem 
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="text-red-400 hover:text-red-300 hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <LogOut className={`w-4 h-4 mr-2 ${isSigningOut ? 'animate-spin' : ''}`} />
            {isSigningOut ? 'Signing out...' : 'Sign out'}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
