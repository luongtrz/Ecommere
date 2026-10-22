import { Loader2, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { ChatToolStep } from '../types';

export function ToolCallCard({ step }: { step: ChatToolStep }) {
  return (
    <Collapsible className="group w-full rounded-xl border border-slate-200 bg-slate-50/70 text-xs overflow-hidden shadow-sm transition-all hover:border-slate-300">
      <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-medium hover:bg-slate-100/80 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-teal-500">
        {step.status === 'running' && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-500 shrink-0" />
        )}
        {step.status === 'ok' && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
        )}
        {step.status === 'error' && (
          <XCircle className="h-3.5 w-3.5 text-rose-600 shrink-0" />
        )}
        <span className="flex-1 truncate font-medium text-slate-800">
          {step.summary}
        </span>
        <ChevronDown className="h-3.5 w-3.5 text-slate-400 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-600 font-mono leading-relaxed whitespace-pre-wrap break-words">
        {step.status === 'running'
          ? 'Đang thực hiện…'
          : (step.resultSummary ?? null)}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default ToolCallCard;
