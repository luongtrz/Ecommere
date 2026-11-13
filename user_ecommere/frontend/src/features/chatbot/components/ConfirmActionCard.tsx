import { useState, useRef, useEffect } from 'react';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ChatConfirmCall } from '../types';

function renderRiskBadge(risk: ChatConfirmCall['risk']) {
  switch (risk) {
    case 'WRITE':
      return (
        <Badge variant="secondary" className="shrink-0">
          Thay đổi dữ liệu
        </Badge>
      );
    case 'SENSITIVE':
      return (
        <Badge variant="outline" className="shrink-0">
          Cần xác nhận
        </Badge>
      );
    case 'DESTRUCTIVE':
      return (
        <Badge variant="destructive" className="shrink-0">
          Không thể hoàn tác
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="shrink-0">
          {risk}
        </Badge>
      );
  }
}

export interface ConfirmActionCardProps {
  calls: ChatConfirmCall[];
  decided?: boolean;
  onSubmit: (decisions: Array<{ callId: string; approve: boolean }>) => void;
}

export function ConfirmActionCard({
  calls,
  decided,
  onSubmit,
}: ConfirmActionCardProps) {
  const isDecided = Boolean(decided);
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const [choices, setChoices] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (decided) {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }, [decided]);

  useEffect(() => {
    submittingRef.current = false;
    setSubmitting(false);
  }, [calls]);

  const isBusy = isDecided || submitting;

  const submitDecisions = async (
    decisions: Array<{ callId: string; approve: boolean }>,
  ) => {
    if (isBusy || submittingRef.current) return;
    submittingRef.current = true;
    setSubmitting(true);
    try {
      const result: unknown = onSubmit(decisions);
      if (result && typeof (result as Promise<unknown>).then === 'function') {
        await result;
        submittingRef.current = false;
        setSubmitting(false);
      }
    } catch {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const handleChoice = (callId: string, approve: boolean) => {
    if (isBusy) return;
    setChoices((prev) => ({
      ...prev,
      [callId]: approve,
    }));
  };

  const handleBulk = (approve: boolean) => {
    if (isBusy) return;
    const next: Record<string, boolean> = {};
    for (const call of calls) {
      next[call.id] = approve;
    }
    setChoices(next);
  };

  const allChosen =
    calls.length > 0 &&
    calls.every((call) => typeof choices[call.id] === 'boolean');

  const handleSubmit = async () => {
    if (isBusy || submittingRef.current || !allChosen) return;
    const decisions = calls.map((call) => ({
      callId: call.id,
      approve: Boolean(choices[call.id]),
    }));
    await submitDecisions(decisions);
  };

  if (calls.length === 0) {
    return null;
  }

  if (calls.length === 1) {
    const call = calls[0];
    return (
      <div
        role="group"
        aria-label="Xác nhận thao tác"
        className="w-full rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm space-y-2.5 text-xs"
      >
        <div className="flex items-start justify-between gap-2">
          <span
            className={cn(
              'font-medium flex-1 break-words whitespace-pre-line',
              isDecided ? 'text-muted-foreground' : 'text-foreground',
            )}
          >
            {call.summary}
          </span>
          {renderRiskBadge(call.risk)}
        </div>

        {isDecided ? (
          <div className="flex items-center gap-1.5 pt-2 border-t border-border text-xs font-medium text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
            <span>Đã gửi quyết định</span>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-border">
            {submitting && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mr-auto">
                <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                <span>Đang xử lý…</span>
              </div>
            )}
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isBusy}
              onClick={() =>
                submitDecisions([{ callId: call.id, approve: true }])
              }
              className="min-h-11 sm:min-h-9"
            >
              Xác nhận
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() =>
                submitDecisions([{ callId: call.id, approve: false }])
              }
              className="min-h-11 sm:min-h-9"
            >
              Từ chối
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      role="group"
      aria-label="Xác nhận thao tác"
      className="w-full rounded-xl border border-border bg-card p-3 text-card-foreground shadow-sm space-y-3 text-xs"
    >
      <div className="space-y-2">
        {calls.map((call, index) => (
          <div
            key={call.id || index}
            className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-2.5"
          >
            <div className="flex items-start justify-between gap-2">
              <span
                className={cn(
                  'font-medium flex-1 break-words whitespace-pre-line',
                  isDecided ? 'text-muted-foreground' : 'text-foreground',
                )}
              >
                {call.summary}
              </span>
              {renderRiskBadge(call.risk)}
            </div>
            {!isDecided && (
              <div className="flex flex-wrap items-center justify-end gap-1.5 pt-1">
                <Button
                  type="button"
                  variant={choices[call.id] === true ? 'default' : 'outline'}
                  size="sm"
                  aria-pressed={choices[call.id] === true}
                  disabled={isBusy}
                  onClick={() => handleChoice(call.id, true)}
                  className="min-h-11 sm:min-h-9"
                >
                  Xác nhận
                </Button>
                <Button
                  type="button"
                  variant={
                    choices[call.id] === false ? 'destructive' : 'outline'
                  }
                  size="sm"
                  aria-pressed={choices[call.id] === false}
                  disabled={isBusy}
                  onClick={() => handleChoice(call.id, false)}
                  className="min-h-11 sm:min-h-9"
                >
                  Từ chối
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      {isDecided ? (
        <div className="flex items-center gap-1.5 pt-2 border-t border-border text-xs font-medium text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-success shrink-0" />
          <span>Đã gửi quyết định</span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
          <div className="flex flex-wrap items-center gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => handleBulk(true)}
              className="min-h-11 sm:min-h-9"
            >
              Xác nhận tất cả
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => handleBulk(false)}
              className="min-h-11 sm:min-h-9"
            >
              Từ chối tất cả
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="default"
              size="sm"
              disabled={isBusy || !allChosen}
              onClick={handleSubmit}
              className="min-h-11 sm:min-h-9"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5 shrink-0" />
                  <span>Đang xử lý…</span>
                </>
              ) : (
                'Gửi quyết định'
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default ConfirmActionCard;
