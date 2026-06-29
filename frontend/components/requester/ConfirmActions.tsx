export default function ConfirmActions({
  onConfirm,
  onEdit,
  confirming,
}: {
  onConfirm: () => void;
  onEdit: () => void;
  confirming: boolean;
}) {
  return (
    <div className="flex gap-3">
      <button
        type="button"
        onClick={onEdit}
        disabled={confirming}
        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
      >
        이전 요청 내용 수정하기
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={confirming}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-700 disabled:opacity-50"
      >
        {confirming ? "확정 처리 중..." : "맞아요 ✓ (확정)"}
      </button>
    </div>
  );
}
