import { BaseEdge, EdgeLabelRenderer, EdgeProps, getBezierPath } from "reactflow";

export const AnimatedDependencyEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
  style
}: EdgeProps<{ label?: string; accent?: string; showLabel?: boolean }>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition
  });

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: data?.accent || "rgba(148,163,184,0.6)", ...style }}
      />
      {data?.label && data.showLabel && (
        <EdgeLabelRenderer>
          <div
            className="nodrag nopan pointer-events-none rounded-full border border-white/10 bg-[#07111f]/90 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-slate-300 shadow-lg backdrop-blur"
            style={{ position: "absolute", transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)` }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
};
