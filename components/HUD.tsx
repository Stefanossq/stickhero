
import React from 'react';
import { Bot, Info } from 'lucide-react';

interface Props {
  narration: string;
  message: string;
}

export const HUD: React.FC<Props> = ({ narration, message }) => {
  return (
    <div className="flex flex-col gap-4">
      {/* AI Narrator Box */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
        <div className="flex items-center gap-2">
          <div className="bg-blue-500/10 p-2 rounded-full border border-blue-500/20">
            <Bot className="text-blue-400" size={18} />
          </div>
          <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Cynical Narrator</h4>
        </div>
        <p className="text-zinc-300 text-sm italic leading-relaxed pl-1">
          "{narration}"
        </p>
      </div>

      {/* Game Message Box */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 flex flex-col gap-3 shadow-inner">
        <div className="flex items-center gap-2">
          <div className="bg-zinc-800 p-2 rounded-full border border-zinc-700">
            <Info className="text-zinc-400" size={18} />
          </div>
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">System Relay</h4>
        </div>
        <p className="text-white text-sm font-medium pl-1">
          {message}
        </p>
      </div>
    </div>
  );
};
