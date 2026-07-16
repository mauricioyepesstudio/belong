export type GraphNodeType = "user" | "project" | "community" | "event" | "skill" | "goal";

export type GraphNode = {
  id: string;
  type: GraphNodeType;
  label: string;
  href?: string;
  meta?: string;
};

export type GraphEdge = {
  source: string;
  target: string;
  label: string;
};

export type BelongGraphData = {
  nodes: GraphNode[];
  edges: GraphEdge[];
  centerId: string;
  stats: {
    people: number;
    projects: number;
    communities: number;
    events: number;
    skills: number;
  };
};
