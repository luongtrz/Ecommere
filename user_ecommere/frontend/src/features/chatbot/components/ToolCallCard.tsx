import { Loader2, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { ChatToolStep } from '../types';

export function ToolCallCard({ step }: { step: ChatToolStep }) {
  const hasContent = Boolean(step.resultSummary && step.resultSummary.trim().length > 0);
  const canExpand = step.status === 'running' || hasContent;

  if (!canExpand) {
    return (
      <div className="w-full rounded-xl border border-border bg-card text-card-foreground text-xs overflow-hidden shadow-sm">
        <div className="flex min-h-[36px] w-full items-center gap-2 px-3 py-2 text-left font-medium">
          <span className="flex h-3.5 w-3.5 items-center justify-center shrink-0" aria-hidden="true">
            {step.status === 'running' && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
            )}
            {step.status === 'ok' && (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            )}
            {step.status === 'error' && (
              <XCircle className="h-3.5 w-3.5 text-destructive" />
            )}
          </span>
          <span className="flex-1 truncate">{step.summary}</span>
        </div>
      </div>
    );
  }

  return (
    <Collapsible className="group w-full rounded-xl border border-border bg-card text-card-foreground text-xs overflow-hidden shadow-sm">
      <CollapsibleTrigger className="flex min-h-11 sm:min-h-[36px] w-full items-center gap-2 px-3 py-2 text-left font-medium hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        <span className="flex h-3.5 w-3.5 items-center justify-center shrink-0" aria-hidden="true">
          {step.status === 'running' && (
            <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
          )}
          {step.status === 'ok' && (
            <CheckCircle2 className="h-3.5 w-3.5 text-success" />
          )}
          {step.status === 'error' && (
            <XCircle className="h-3.5 w-3.5 text-destructive" />
          )}
        </span>
        <span className="flex-1 truncate">{step.summary}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 motion-reduce:transition-none" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border px-3 py-2 text-muted-foreground whitespace-pre-wrap break-words">
        {step.status === 'running' ? 'Đang thực hiện…' : (step.resultSummary ?? null)}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default ToolCallCard;
