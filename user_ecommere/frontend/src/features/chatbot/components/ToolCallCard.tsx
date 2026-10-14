import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { ChatToolStep } from '../types';

export function ToolCallCard({ step }: { step: ChatToolStep }) {
  return (
    <Collapsible className="w-full rounded-2xl border border-border/70 bg-card text-card-foreground text-xs md:text-[13px] overflow-hidden shadow-sm transition-all duration-300 hover:border-accent/40">
      <CollapsibleTrigger className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left font-medium hover:bg-muted/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        {step.status === 'running' && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-accent shrink-0" />
        )}
        {step.status === 'ok' && (
          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
        )}
        {step.status === 'error' && (
          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
        )}
        <span className="flex-1 truncate text-foreground font-medium">{step.summary}</span>
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border/60 bg-muted/20 px-3.5 py-2.5 text-[11px] md:text-xs text-muted-foreground whitespace-pre-wrap break-words leading-relaxed">
        {step.status === 'running' ? 'Đang thực hiện…' : (step.resultSummary ?? null)}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default ToolCallCard;
