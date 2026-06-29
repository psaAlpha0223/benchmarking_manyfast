export default function SkeletonLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center gap-3 py-16">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-100 border-t-blue-600" />
      {label && <p className="text-sm text-gray-500">{label}</p>}
    </div>
  );
}
