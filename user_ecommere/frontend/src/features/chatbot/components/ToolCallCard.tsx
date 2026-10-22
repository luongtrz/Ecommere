import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { ChatToolStep } from '../types';

export function ToolCallCard({ step }: { step: ChatToolStep }) {
  return (
    <Collapsible className="w-full rounded-xl border border-slate-200 bg-white text-slate-900 text-xs md:text-sm overflow-hidden shadow-sm transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 font-sans">
      <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-medium hover:bg-slate-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
        {step.status === 'running' && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-600 shrink-0" />
        )}
        {step.status === 'ok' && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        )}
        {step.status === 'error' && (
          <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
        )}
        <span className="flex-1 truncate text-slate-800 font-medium">
          {step.summary}
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-xs text-slate-600 whitespace-pre-wrap break-words leading-relaxed">
        {step.status === 'running'
          ? 'Đang thực hiện…'
          : (step.resultSummary ?? null)}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default ToolCallCard;
