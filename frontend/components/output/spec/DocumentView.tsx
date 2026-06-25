import type { FunctionSpec } from "@/types/output";

export default function DocumentView({ spec }: { spec: FunctionSpec }) {
  const rows = spec.features.flatMap((feature) =>
    feature.sub_features.map((sub) => ({ ...sub, category: feature.category }))
  );

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse text-left text-xs">
        <thead>
          <tr className="bg-gray-50">
            <th className="border border-gray-200 px-2 py-1">기능 ID</th>
            <th className="border border-gray-200 px-2 py-1">기능명</th>
            <th className="border border-gray-200 px-2 py-1">설명</th>
            <th className="border border-gray-200 px-2 py-1">우선순위</th>
            <th className="border border-gray-200 px-2 py-1">비고</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td className="border border-gray-200 px-2 py-1 text-gray-500">{row.id}</td>
              <td className="border border-gray-200 px-2 py-1 font-medium text-gray-900">
                {row.name}
              </td>
              <td className="border border-gray-200 px-2 py-1 text-gray-600">{row.description}</td>
              <td className="border border-gray-200 px-2 py-1">{row.priority}</td>
              <td className="border border-gray-200 px-2 py-1 text-gray-500">{row.notes ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
