import { Loader2 } from 'lucide-react';

export function PageLoader() {
  return (
    <div className="flex items-center justify-center h-full min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-9 h-9 text-rose-700 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Duke ngarkuar...</p>
      </div>
    </div>
  );
}
