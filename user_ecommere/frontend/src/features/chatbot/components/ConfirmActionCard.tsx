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

export function ConfirmActionCard({
  calls,
  decided,
  onDecide,
}: {
  calls: ChatConfirmCall[];
  decided?: boolean;
  onDecide: (approve: boolean) => void;
}) {
  const isDecided = Boolean(decided);

  const handleConfirm = () => {
    if (isDecided) return;
    onDecide(true);
  };

  const handleReject = () => {
    if (isDecided) return;
    onDecide(false);
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
            className="flex items-center justify-between gap-2"
          >
            <span className="font-medium text-foreground flex-1 break-words">
              {call.summary}
            </span>
            {renderRiskBadge(call.risk)}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 pt-2 border-t border-border">
        {isDecided ? (
          <span className="text-xs font-medium text-muted-foreground">
            Đã phản hồi
          </span>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            disabled={isDecided}
            onClick={handleConfirm}
          >
            Xác nhận
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isDecided}
            onClick={handleReject}
          >
            Từ chối
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmActionCard;
