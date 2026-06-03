import React, { memo } from "react";
import { Search, Database, FileText, CheckCircle2, Brain, ShieldCheck, Save } from "lucide-react";
import ReactFlow, { Background, Position, Handle, MarkerType, type Edge, type Node } from "reactflow";
import "reactflow/dist/style.css";

interface CritiqueLog {
  score: number;
  feedback: string;
  attempts: number;
}

interface AgentStatusProps {
  currentAgent: "memory_retrieve" | "search" | "rag" | "writer" | "critique" | "memory_store" | null;
  isLoading: boolean;
  critiqueLog?: CritiqueLog | null;
}

const CustomAgentNode = memo(({ data }: { data: any }) => {
  const Icon = data.icon;
  const status = data.status; // 'active' | 'completed' | 'pending'
  const isCompleted = status === "completed";
  
  return (
    <div className={`agent-flow-node ${status}`}>
      {/* Target Handles */}
      {data.id !== "memory_retrieve" && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: "transparent", border: "none", width: 0, height: 0 }}
        />
      )}
      
      {/* Top handles for critique loopback */}
      {data.id === "writer" && (
        <Handle
          type="target"
          id="top-in"
          position={Position.Top}
          style={{ background: "transparent", border: "none", width: 0, height: 0 }}
        />
      )}
      {data.id === "critique" && (
        <Handle
          type="source"
          id="top-out"
          position={Position.Top}
          style={{ background: "transparent", border: "none", width: 0, height: 0 }}
        />
      )}

      <div className="agent-flow-icon-wrapper">
        {isCompleted ? <CheckCircle2 size={16} /> : Icon ? <Icon size={16} /> : null}
      </div>
      <div className="agent-flow-content">
        <div className="agent-flow-name">{data.name}</div>
        <div className="agent-flow-desc">{data.desc}</div>
      </div>

      {/* Source Handles */}
      {data.id !== "memory_store" && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: "transparent", border: "none", width: 0, height: 0 }}
        />
      )}
    </div>
  );
});

const nodeTypes = {
  agent: CustomAgentNode,
};

export const AgentStatus: React.FC<AgentStatusProps> = ({ currentAgent, isLoading, critiqueLog }) => {
  const steps = [
    {
      id: "memory_retrieve",
      name: "Memory Retrieve",
      desc: "Checking past research context",
      icon: Brain,
    },
    {
      id: "search",
      name: "Search Agent",
      desc: "Querying Tavily for web context",
      icon: Search,
    },
    {
      id: "rag",
      name: "RAG Agent",
      desc: "Indexing & retrieving from ChromaDB",
      icon: Database,
    },
    {
      id: "writer",
      name: "Writer Agent",
      desc: "Synthesizing report with Groq",
      icon: FileText,
    },
    {
      id: "critique",
      name: "Critique Agent",
      desc: "Scoring & reviewing report",
      icon: ShieldCheck,
    },
    {
      id: "memory_store",
      name: "Memory Store",
      desc: "Storing context for future runs",
      icon: Save,
    },
  ];

  if (!isLoading && !currentAgent) return null;

  const getStepStatus = (stepId: string) => {
    if (!isLoading) return "completed";
    if (currentAgent === stepId) return "active";
    
    const order = ["memory_retrieve", "search", "rag", "writer", "critique", "memory_store"];
    const currentIndex = order.indexOf(currentAgent || "");
    const stepIndex = order.indexOf(stepId);
    
    if (stepIndex < currentIndex) return "completed";
    return "pending";
  };

  const getEdgeStyle = (sourceId: string, targetId: string) => {
    const targetStatus = getStepStatus(targetId);
    const sourceStatus = getStepStatus(sourceId);
    
    const isActive = currentAgent === targetId;
    const isCompleted = sourceStatus === "completed" && targetStatus === "completed";
    
    if (isActive) {
      return {
        style: { stroke: "var(--accent-apricot)", strokeWidth: 2 },
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#dd9b7e",
        },
      };
    } else if (isCompleted) {
      return {
        style: { stroke: "#10b981", strokeWidth: 2 },
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "#10b981",
        },
      };
    } else {
      return {
        style: { stroke: "rgba(255, 255, 255, 0.08)", strokeWidth: 1.5 },
        animated: false,
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: "rgba(255, 255, 255, 0.08)",
        },
      };
    }
  };

  const isLooping = !!(critiqueLog && critiqueLog.score < 8 && currentAgent === "writer");
  const hasLooped = !!(critiqueLog && critiqueLog.attempts > 1);

  let loopbackEdgeStyle: any = {
    style: { stroke: "rgba(255, 255, 255, 0.04)", strokeWidth: 1.5, strokeDasharray: "4,4" },
    animated: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: "rgba(255, 255, 255, 0.04)",
    },
  };

  if (isLooping) {
    loopbackEdgeStyle = {
      style: { stroke: "var(--accent-apricot)", strokeWidth: 2.5, strokeDasharray: "4,4" },
      animated: true,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#dd9b7e",
      },
    };
  } else if (hasLooped && !isLoading) {
    loopbackEdgeStyle = {
      style: { stroke: "#10b981", strokeWidth: 2, strokeDasharray: "4,4" },
      animated: false,
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#10b981",
      },
    };
  }

  const nodes: Node[] = steps.map((step, idx) => {
    const status = getStepStatus(step.id);
    return {
      id: step.id,
      type: "agent",
      data: {
        id: step.id,
        name: step.name,
        desc: step.desc,
        icon: step.icon,
        status: status,
      },
      position: { x: idx * 170 + 20, y: 65 },
    };
  });

  const edges: Edge[] = [
    {
      id: "e-mem-search",
      source: "memory_retrieve",
      target: "search",
      type: "smoothstep",
      ...getEdgeStyle("memory_retrieve", "search"),
    },
    {
      id: "e-search-rag",
      source: "search",
      target: "rag",
      type: "smoothstep",
      ...getEdgeStyle("search", "rag"),
    },
    {
      id: "e-rag-writer",
      source: "rag",
      target: "writer",
      type: "smoothstep",
      ...getEdgeStyle("rag", "writer"),
    },
    {
      id: "e-writer-critique",
      source: "writer",
      target: "critique",
      type: "smoothstep",
      ...getEdgeStyle("writer", "critique"),
    },
    {
      id: "e-critique-memstore",
      source: "critique",
      target: "memory_store",
      type: "smoothstep",
      ...getEdgeStyle("critique", "memory_store"),
    },
    {
      id: "e-critique-writer-loop",
      source: "critique",
      sourceHandle: "top-out",
      target: "writer",
      targetHandle: "top-in",
      type: "default",
      ...loopbackEdgeStyle,
    },
  ];

  return (
    <div className="glass-panel p-6 w-full flex flex-col gap-4 relative overflow-hidden" style={{ minHeight: "120px" }}>
      {/* Decorative background glows */}
      <div className="absolute" style={{ left: "-40px", top: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(252, 165, 129, 0.04)", filter: "blur(40px)", pointerEvents: "none" }}></div>
      <div className="absolute" style={{ right: "-40px", bottom: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(224, 122, 95, 0.04)", filter: "blur(40px)", pointerEvents: "none" }}></div>

      <div style={{ height: "180px", width: "100%", zIndex: 1 }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          nodesDraggable={false}
          nodesConnectable={false}
          elementsSelectable={false}
          panOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={false}
          zoomOnPinch={false}
          zoomOnDoubleClick={false}
          preventScrolling={true}
          fitView
          fitViewOptions={{ padding: 0.05, minZoom: 0.4, maxZoom: 1 }}
          proOptions={{ hideAttribution: true }}
        >
          <Background color="rgba(255, 255, 255, 0.02)" gap={12} size={1} />
        </ReactFlow>
      </div>

      {/* Critique Log Box */}
      {critiqueLog && (
        <div className="scroll-reveal p-3 rounded-lg text-xs" style={{
          background: critiqueLog.score >= 8 ? "rgba(52, 211, 153, 0.06)" : "rgba(224, 122, 95, 0.06)",
          border: critiqueLog.score >= 8 ? "1px solid rgba(52, 211, 153, 0.2)" : "1px solid rgba(224, 122, 95, 0.2)",
          color: critiqueLog.score >= 8 ? "#a7f3d0" : "#ffedd5",
          zIndex: 1
        }}>
          <div className="flex justify-between items-center font-semibold mb-1">
            <span>Critique Evaluation (Attempt {critiqueLog.attempts})</span>
            <span style={{
              background: critiqueLog.score >= 8 ? "rgba(52, 211, 153, 0.2)" : "rgba(224, 122, 95, 0.2)",
              padding: "2px 6px",
              borderRadius: "4px",
              color: critiqueLog.score >= 8 ? "#34d399" : "var(--accent-peach)"
            }}>
              Score: {critiqueLog.score}/10
            </span>
          </div>
          <p style={{ margin: 0, opacity: 0.9, lineHeight: 1.4 }}>
            <strong>Feedback:</strong> {critiqueLog.feedback}
          </p>
          {critiqueLog.score < 8 && currentAgent === "writer" && (
            <div className="mt-2 text-xs italic font-medium active-pulse" style={{ color: "var(--accent-apricot)" }}>
              🔄 Report score was below threshold. Writer Agent is regenerating...
            </div>
          )}
        </div>
      )}
    </div>
  );
};


