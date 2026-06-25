"use client";

import { useState } from "react";
import type { FunctionSpec } from "@/types/output";

export default function DirectoryView({ spec }: { spec: FunctionSpec }) {
  const categories = [...new Set(spec.features.map((f) => f.category))];
  const [selectedCategory, setSelectedCategory] = useState<string | null>(categories[0] ?? null);
  const [selectedFeatureId, setSelectedFeatureId] = useState<string | null>(null);

  const featuresInCategory = spec.features.filter((f) => f.category === selectedCategory);
  const selectedFeature = spec.features.find((f) => f.id === selectedFeatureId);

  return (
    <div className="grid grid-cols-3 gap-2" style={{ height: "75vh" }}>
      <div className="overflow-auto rounded-md border border-gray-200 p-2">
        <p className="mb-1 px-2 text-xs font-medium text-gray-400">대분류</p>
        {categories.map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => {
              setSelectedCategory(category);
              setSelectedFeatureId(null);
            }}
            className={`block w-full rounded px-2 py-1.5 text-left text-sm ${
              category === selectedCategory
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="overflow-auto rounded-md border border-gray-200 p-2">
        <p className="mb-1 px-2 text-xs font-medium text-gray-400">기능 목록</p>
        {featuresInCategory.map((feature) => (
          <button
            key={feature.id}
            type="button"
            onClick={() => setSelectedFeatureId(feature.id)}
            className={`block w-full rounded px-2 py-1.5 text-left text-sm ${
              feature.id === selectedFeatureId
                ? "bg-gray-900 text-white"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            <span className="text-xs text-gray-400">{feature.id}</span> {feature.name}
            <span className="ml-1 text-xs text-gray-400">({feature.sub_features.length})</span>
          </button>
        ))}
      </div>

      <div className="overflow-auto rounded-md border border-gray-200 p-3">
        {selectedFeature ? (
          <div className="flex flex-col gap-3 text-sm">
            <p className="font-medium text-gray-900">{selectedFeature.name}</p>
            <p className="text-gray-600">{selectedFeature.description}</p>
            <div className="flex flex-col gap-2">
              {selectedFeature.sub_features.map((sub) => (
                <div key={sub.id} className="rounded border border-gray-100 p-2">
                  <p className="text-xs font-medium text-gray-900">
                    {sub.id} {sub.name}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{sub.description}</p>
                  <p className="mt-1 text-xs text-gray-400">우선순위: {sub.priority}</p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-gray-400">기능을 선택해주세요.</p>
        )}
      </div>
    </div>
  );
}
