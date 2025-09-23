import React, { ReactNode, useState } from 'react';
import { MessageCircleDashed } from 'lucide-react';
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
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };
  return (
    <div className={`flex items-center justify-between p-4 h-16  border-gray-500 transition-all duration-300 ${showSidebar ? 'border-b-[0.5px] border-[#303030] bg-[#212121]' : 'lg:border-b-0 bg-transparent'}` }>
      <div className='flex items-center gap-4 w-full'>
        {children}
        <div className="flex-1 flex items-center justify-between">
          <span className='flex items-center gap-2'>
            <Button variant="ghost" size="icon" onClick={() => setShowSidebar(true)} className="h-8 w-8 ml-auto">
              <img src="/image.png" alt="" className='h-6 w-6 rounded-sm filter brightness-0 invert'/>
            </Button>
            {/* <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <line x1="4" x2="20" y1="12" y2="12" />
                <line x1="4" x2="20" y1="6" y2="6" />
                <line x1="4" x2="20" y1="18" y2="18" />
              </svg> 
            </Button> */}
            <DropdownMenuCheckboxes selected={selected} setSelected={setSelected} />
          </span>
          <div className="flex items-center gap-4 hidden lg:flex">
            <button className="bg-[#373668] hover:bg-[#4a4080] transition-colors duration-200 rounded-full px-4 py-2 cursor-pointer">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-[#5856D6] rounded transform rotate-45"></div>
                <span className="text-white font-normal text-sm">Upgrade to Go</span>
              </div>
            </button>
            <div className='cursor-pointer hover:bg-[#424242] p-2 rounded-full h-8 w-8 flex items-center justify-center'>
              <MessageCircleDashed className='h-4 w-4' onClick={() => {}}/>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}