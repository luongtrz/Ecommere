import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import type { ChatToolStep } from '../types';

export function ToolCallCard({ step }: { step: ChatToolStep }) {
  return (
    <Collapsible className="w-full rounded-xl border border-border bg-card text-card-foreground text-xs overflow-hidden shadow-sm">
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-left font-medium hover:bg-muted/50 transition-colors">
        {step.status === 'running' && (
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
        )}
        {step.status === 'ok' && (
          <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
        )}
        {step.status === 'error' && (
          <XCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
        )}
        <span className="flex-1 truncate">{step.summary}</span>
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
