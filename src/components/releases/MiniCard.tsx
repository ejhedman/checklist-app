import React from "react";

const MiniCard: React.FC<{ title: string; children: React.ReactNode; wide?: boolean }> = ({ title, children }) => (
  <div className={`flex flex-col items-center bg-white rounded-lg shadow-sm px-2 sm:px-4 pt-2 sm:pt-3 pb-1 sm:pb-2`}>
    <div className="w-full flex items-center border-b border-gray-200 overflow-hidden" style={{height: '15px'}}>
      <span className="text-[10px] sm:text-xs font-medium text-muted-foreground text-center w-full truncate leading-normal">
        {title}
      </span>
    </div>
    <div className="w-full pt-1 sm:pt-2 flex justify-center items-center pr-2 sm:pr-4 pl-2 sm:pl-4">
      {children}
    </div>
  </div>
);

export default MiniCard; 