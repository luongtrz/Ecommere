import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
}: {
  calls: ChatConfirmCall[];
  decided?: boolean;
  onSubmit: (decisions: Array<{ callId: string; approve: boolean }>) => void;
}) {
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
    submittingRef.current = true;
    setSubmitting(true);
    const decisions = calls.map((call) => ({
      callId: call.id,
      approve: Boolean(choices[call.id]),
    }));
    try {
      const result = onSubmit(decisions);
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
            className="flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/20 p-2 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center justify-between gap-2 flex-1 min-w-0">
              <span className="font-medium text-foreground flex-1 break-words whitespace-pre-line">
                {call.summary}
              </span>
              {renderRiskBadge(call.risk)}
            </div>
            <div className="flex items-center gap-1.5 shrink-0 justify-end">
              <Button
                type="button"
                variant={choices[call.id] === true ? 'default' : 'outline'}
                size="sm"
                aria-pressed={choices[call.id] === true}
                disabled={isBusy}
                onClick={() => handleChoice(call.id, true)}
              >
                Xác nhận
              </Button>
              <Button
                type="button"
                variant={choices[call.id] === false ? 'destructive' : 'outline'}
                size="sm"
                aria-pressed={choices[call.id] === false}
                disabled={isBusy}
                onClick={() => handleChoice(call.id, false)}
              >
                Từ chối
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => handleBulk(true)}
          >
            Xác nhận tất cả
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isBusy}
            onClick={() => handleBulk(false)}
          >
            Từ chối tất cả
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isDecided ? (
            <span className="text-xs font-medium text-muted-foreground">
              Đã phản hồi
            </span>
          ) : null}
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isBusy || !allChosen}
            onClick={handleSubmit}
          >
            Gửi quyết định
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmActionCard;
