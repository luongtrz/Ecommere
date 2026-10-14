import { Loader2, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { ChatToolStep } from '../types';

export function ToolCallCard({ step }: { step: ChatToolStep }) {
  return (
    <Collapsible className="group w-full rounded-xl border border-border/70 bg-card/60 text-card-foreground text-xs overflow-hidden shadow-sm transition-colors hover:border-border">
      <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-3.5 py-2 text-left font-medium hover:bg-muted/40 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {step.status === 'running' && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-amber-400 shrink-0" />
        )}
        {step.status === 'ok' && (
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
        )}
        {step.status === 'error' && (
          <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
        )}
        <span className="flex-1 truncate font-medium text-foreground/90">{step.summary}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/60 transition-transform duration-200 group-data-[state=open]:rotate-180 shrink-0" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border/60 bg-muted/20 px-3.5 py-2.5 text-xs text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap break-words">
        {step.status === 'running' ? 'Đang thực hiện…' : (step.resultSummary ?? null)}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default ToolCallCard;
