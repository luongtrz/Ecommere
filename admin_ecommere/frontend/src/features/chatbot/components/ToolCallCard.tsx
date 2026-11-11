import { Loader2, CheckCircle2, XCircle, ChevronDown } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { ChatToolStep } from '../types';

export function ToolCallCard({ step }: { step: ChatToolStep }) {
  const hasDetails =
    step.status === 'running' ||
    Boolean(step.resultSummary && step.resultSummary.trim().length > 0);

  const statusIcon = (
    <span
      className="flex h-3.5 w-3.5 shrink-0 items-center justify-center"
      aria-hidden="true"
    >
      {step.status === 'running' && (
        <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
      )}
      {step.status === 'ok' && (
        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-500 shrink-0" />
      )}
      {step.status === 'error' && (
        <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
      )}
    </span>
  );

  if (!hasDetails) {
    return (
      <div className="w-full rounded-xl border border-border bg-card text-card-foreground text-xs overflow-hidden shadow-sm">
        <div className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium">
          {statusIcon}
          <span className="flex-1 truncate">{step.summary}</span>
        </div>
      </div>
    );
  }

  return (
    <Collapsible className="group w-full rounded-xl border border-border bg-card text-card-foreground text-xs overflow-hidden shadow-sm">
      <CollapsibleTrigger className="group flex w-full items-center gap-2 px-3 py-2 text-left font-medium hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
        {statusIcon}
        <span className="flex-1 truncate">{step.summary}</span>
        <ChevronDown className="h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform duration-200 motion-reduce:transition-none group-data-[state=open]:rotate-180" />
      </CollapsibleTrigger>
      <CollapsibleContent className="border-t border-border px-3 py-2 text-muted-foreground whitespace-pre-wrap break-words">
        {step.status === 'running'
          ? 'Đang thực hiện…'
          : (step.resultSummary ?? null)}
      </CollapsibleContent>
    </Collapsible>
  );
}

export default ToolCallCard;
