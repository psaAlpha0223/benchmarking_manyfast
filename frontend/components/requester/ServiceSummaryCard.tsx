import type { SummaryCard } from "@/lib/api";

export default function ServiceSummaryCard({ card }: { card: SummaryCard }) {
  return (
    <div className="rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-900">{card.service_name}</h2>
      <p className="mt-2 text-sm text-gray-700">{card.purpose}</p>

      <p className="mt-4 text-xs font-medium text-gray-500">주요 사용자</p>
      <p className="mt-1 text-sm text-gray-700">{card.target_users}</p>

      <p className="mt-4 text-xs font-medium text-gray-500">핵심 기능</p>
      <ul className="mt-1 flex flex-wrap gap-2">
        {card.key_features.map((feature) => (
          <li
            key={feature}
            className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-700"
          >
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
