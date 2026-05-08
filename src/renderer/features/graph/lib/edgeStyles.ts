import { MarkerType } from "reactflow";

export const EDGE_STYLE = {
  hierarchy: { stroke: "rgba(0, 200, 255, 0.4)", strokeWidth: 1.5 },
  file: { stroke: "rgba(0, 255, 120, 0.4)", strokeWidth: 1.5 },
  call: { stroke: "rgba(180, 80, 255, 0.6)", strokeWidth: 1.5, strokeDasharray: "4 4" },
  incoming: { stroke: "rgba(180, 80, 255, 0.6)", strokeWidth: 1.5, strokeDasharray: "4 4" },
  arrow: MarkerType.ArrowClosed
};
