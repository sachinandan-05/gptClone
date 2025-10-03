import React, { ReactNode, useState } from 'react';
import { Share2, MoreHorizontal, Archive, Flag, Trash2, ChevronDown, SquarePen } from 'lucide-react';
import { HiMenuAlt4 } from 'react-icons/hi';
import { DropdownMenuCheckboxes } from '../app/helper/dropdown';



interface NavbarProps {
  children?: ReactNode;
  isCollapsed: boolean;
  showSidebar: boolean;
  setShowSidebar: (show: boolean) => void;
}

export default function Navbar({ children, isCollapsed, showSidebar, setShowSidebar }: NavbarProps) {
  const [selected, setSelected] = useState("ChatGPT") // default shown in navbar
  const [showMenu, setShowMenu] = useState(false);


  return (
    <div className={`flex items-center justify-between px-4 lg:px-4 h-14 bg-[#212121] border-b border-[#2d2d2d] transition-all duration-300 ${!showSidebar ? 'lg:border-b-0 lg:bg-transparent' : ''}`}>
      {/* Mobile: Hamburger Menu + ChatGPT Button */}
      <div className='flex items-center gap-2 lg:hidden'>
       
        <button 
          onClick={() => setShowSidebar(true)} 
          className="h-10 w-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors relative -ml-1"
        >
          <HiMenuAlt4 className="h-6 w-6 text-white" />
          {/* Blue notification dot */}
          <span className="absolute top-2 right-2 h-2.5 w-2.5 bg-blue-500 rounded-full"></span>
        </button>

        <div className='hover:cursor-pointer lg:hidden'>
          <DropdownMenuCheckboxes selected={selected} setSelected={setSelected}  />
        </div>
       
      </div>

        {/* <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)} className="h-8 w-8 hover:cursor-pointer">
          <img src="/image.png" alt="" className='h-6 w-6 rounded-sm filter brightness-0 invert'/>
        </Button> */}
        <div className='hover:cursor-pointer lg:flex hidden'>
          <DropdownMenuCheckboxes selected={selected} setSelected={setSelected}  />
        </div>
    

      {/* Right: New Chat (mobile) / Share and More (desktop) */}
      <div className='flex items-center gap-2 relative'>
        {/* Mobile: New Chat Icon */}
        <button 
          className="lg:hidden h-10 w-10 flex items-center justify-center hover:bg-white/10 rounded-lg transition-colors -mr-1"
        >
          <SquarePen className="h-5 w-5 text-white strokeWidth={2}" />
        </button>

        {/* Desktop: Share Button */}
        <button className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full hover:bg-[#303030] text-white/90 cursor-pointer">
          <Share2 className='w-4 h-4' />
          <span className='text-sm'>Share</span>
        </button>

        {/* More menu (click toggles) */}
        <div className="relative">
          <button onClick={() => setShowMenu(v=>!v)} className='h-8 w-8 hidden lg:flex items-center justify-center rounded-full hover:bg-[#303030] cursor-pointer'>
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