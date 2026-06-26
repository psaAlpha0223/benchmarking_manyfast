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
        className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 disabled:opacity-50"
      >
        수정할게요 ✎
      </button>
      <button
        type="button"
        onClick={onConfirm}
        disabled={confirming}
        className="rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {confirming ? "확정 처리 중..." : "맞아요 ✓ (확정)"}
      </button>
    </div>
  );
}
