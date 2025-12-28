
import React from 'react';
import { Bot, Info } from 'lucide-react';

interface Props {
  narration: string;
  message: string;
}

export const HUD: React.FC<Props> = ({ narration, message }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* AI Narrator Box */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex gap-4 items-start shadow-inner backdrop-blur-sm">
        <div className="bg-blue-500/10 p-2 rounded-full border border-blue-500/20 shrink-0">
          <Bot className="text-blue-400" size={24} />
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-blue-400 uppercase tracking-widest mb-1">Cynical Narrator</h4>
          <p className="text-zinc-300 text-sm italic leading-relaxed">
            "{narration}"
          </p>
        </div>
      </div>

      {/* Game Message Box */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 flex gap-4 items-start shadow-inner backdrop-blur-sm">
        <div className="bg-zinc-800 p-2 rounded-full border border-zinc-700 shrink-0">
          <Info className="text-zinc-400" size={24} />
        </div>
        <div>
          <h4 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-1">System Status</h4>
          <p className="text-white text-sm font-medium">
            {message}
          </p>
        </div>
      </div>
    </div>
  );
};
