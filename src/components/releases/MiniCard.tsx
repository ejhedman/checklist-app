import React from "react";

const MiniCard: React.FC<{ title: string; children: React.ReactNode; wide?: boolean }> = ({ title, children, wide }) => (
  <div className={`flex flex-col items-center bg-white rounded-lg shadow-sm px-4 pt-3 pb-2 `}>
    <div className="w-full flex items-center border-b border-gray-200 overflow-hidden" style={{height: '15px'}}>
      <span className="text-xs font-medium text-muted-foreground text-center w-full truncate leading-normal">
        {title}
      </span>
    </div>
    <div className="w-full pt-2 flex justify-center items-center pr-4 pl-4">
      {children}
    </div>
  </div>
);

export default MiniCard; 