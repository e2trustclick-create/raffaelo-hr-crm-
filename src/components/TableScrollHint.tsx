import { MoveHorizontal } from 'lucide-react';

export function TableScrollHint() {
  return (
    <div className="md:hidden flex items-center justify-center gap-1.5 py-2 text-[10px] font-medium text-slate-400 border-t border-slate-100 bg-slate-50/60">
      <MoveHorizontal className="w-3 h-3 shrink-0" />
      <span>Rrëshqit majtas / djathtas për më shumë kolona</span>
    </div>
  );
}
