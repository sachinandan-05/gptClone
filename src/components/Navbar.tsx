import React, { ReactNode, useState } from 'react';
import { MessageCircleDashed } from 'lucide-react';
import { DropdownMenuCheckboxes } from '../app/helper/dropdown';

interface NavbarProps {
  children?: ReactNode;
  isCollapsed: boolean;
  isSidebarOpen?: boolean;
  onToggleSidebar: () => void;
}

export default function Navbar({ children, isSidebarOpen = true, onToggleSidebar }: NavbarProps) {
  const [selected, setSelected] = useState("ChatGPT") // default shown in navbar

  return (
    <div className={`flex items-center justify-between p-4 h-16 transition-all duration-300 ${isSidebarOpen ? 'border-b border-[#303030] bg-[#212121]' : 'border-b-0 bg-transparent'}`}>
      <div className='flex items-center gap-4 w-full'>
        {children}
        <div className="flex-1 flex items-center justify-between">
          <div className='flex items-center gap-2'>
            <DropdownMenuCheckboxes selected={selected} setSelected={setSelected} />
          </div>
          <div className="flex items-center gap-4">
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
