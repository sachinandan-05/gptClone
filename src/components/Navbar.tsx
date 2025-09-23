import React, { ReactNode, useState } from 'react';
import { Share2, MoreHorizontal, Archive, Flag, Trash2 } from 'lucide-react';
import { DropdownMenuCheckboxes } from '../app/helper/dropdown';
import { Button } from './ui/button';

interface NavbarProps {
  children?: ReactNode;
  isCollapsed: boolean;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
}

export default function Navbar({ children, isCollapsed, showSidebar, setShowSidebar }: NavbarProps) {
  const [selected, setSelected] = useState("ChatGPT") // default shown in navbar
  const [showMenu, setShowMenu] = useState(false);
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  return (
    <div className={`flex items-center justify-between px-4 h-14 border-gray-500 transition-all duration-300 ${showSidebar ? 'border-b-[0.5px] border-[#303030] bg-[#212121]' : 'lg:border-b-0 bg-transparent'}`}>
      {/* Left: app selector */}
      <div className='flex items-center gap-2'>
        <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)} className="h-8 w-8 hover:cursor-pointer">
          <img src="/image.png" alt="" className='h-6 w-6 rounded-sm filter brightness-0 invert'/>
        </Button>
        <div className='hidden sm:block hover:cursor-pointer '>
        <DropdownMenuCheckboxes selected={selected} setSelected={setSelected}  />
        </div>
      </div>

      {/* Right: Share and more */}
      <div className='flex items-center gap-2 relative'>
        <button className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#303030] text-white/90 cursor-pointer">
          <Share2 className='w-4 h-4' />
          <span className='text-sm'>Share</span>
        </button>
        {/* More menu (click toggles) */}
        <div className="relative">
          <button onClick={() => setShowMenu(v=>!v)} className='h-8 w-8 flex items-center justify-center rounded-full hover:bg-[#303030] cursor-pointer'>
            <MoreHorizontal className='w-5 h-5' />
          </button>
          {showMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#2b2b2b] border border-white/10 shadow-[0_8px_30px_rgba(0,0,0,0.4)] p-3 z-50">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-white cursor-pointer">
                <Archive className='w-4 h-4' />
                <span>Archive</span>
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-white cursor-pointer">
                <Flag className='w-4 h-4' />
                <span>Report</span>
              </button>
              <button onClick={() => { setShowMenu(false); window.dispatchEvent(new CustomEvent('delete-current-chat')); }} className="w-full flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-white/5 text-red-400 cursor-pointer">
                <Trash2 className='w-4 h-4' />
                <span>Delete</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}