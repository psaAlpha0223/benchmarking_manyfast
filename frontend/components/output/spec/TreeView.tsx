"use client";

import { useMemo, useState } from "react";
import { ReactFlow, Background, Controls, type Node, type Edge } from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import type { FunctionSpec } from "@/types/output";

const LEVEL_X = { category: 0, feature: 260, sub: 520 };
const ROW_HEIGHT = 56;

function buildGraph(spec: FunctionSpec, expanded: boolean): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const categoryRows = new Map<string, number[]>();
  let row = 0;

  spec.features.forEach((feature) => {
    const startRow = row;

    if (expanded) {
      feature.sub_features.forEach((sub) => {
        nodes.push({
          id: sub.id,
          position: { x: LEVEL_X.sub, y: row * ROW_HEIGHT },
          data: { label: `${sub.id} ${sub.name}` },
          style: { fontSize: 11, width: 220 },
        });
        edges.push({ id: `e-${feature.id}-${sub.id}`, source: feature.id, target: sub.id });
        row += 1;
      });
    }

    if (!expanded || feature.sub_features.length === 0) row += 1;

    const endRow = row - 1;
    const featureY = ((startRow + endRow) / 2) * ROW_HEIGHT;

    nodes.push({
      id: feature.id,
      position: { x: LEVEL_X.feature, y: featureY },
      data: { label: `${feature.id} ${feature.name}` },
      style: { fontSize: 12, width: 220 },
    });
    edges.push({
      id: `e-cat-${feature.category}-${feature.id}`,
      source: `cat-${feature.category}`,
      target: feature.id,
    });

    categoryRows.set(feature.category, [...(categoryRows.get(feature.category) ?? []), featureY]);
  });

  for (const [category, rows] of categoryRows) {
    const avgY = rows.reduce((sum, y) => sum + y, 0) / rows.length;
    nodes.unshift({
      id: `cat-${category}`,
      position: { x: LEVEL_X.category, y: avgY },
      data: { label: category },
      style: { fontSize: 13, fontWeight: 600, width: 160 },
    });
  }

  return { nodes, edges };
}

export default function TreeView({ spec }: { spec: FunctionSpec }) {
  const [expanded, setExpanded] = useState(true);
  const { nodes, edges } = useMemo(() => buildGraph(spec, expanded), [spec, expanded]);

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="self-end rounded-md border border-gray-300 px-3 py-1 text-xs text-gray-700"
      >
        {expanded ? "전체 접기" : "전체 보기"}
      </button>
      <div style={{ height: "75vh" }} className="rounded-md border border-gray-200">
        <ReactFlow nodes={nodes} edges={edges} fitView>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </div>
  );
}
