import React from "react";
import { Search, Database, FileText, CheckCircle2, Brain, ShieldCheck, Save } from "lucide-react";

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

  return (
    <div className="glass-panel p-6 w-full flex flex-col gap-4 relative overflow-hidden" style={{ minHeight: "120px" }}>
      {/* Decorative background glows */}
      <div className="absolute" style={{ left: "-40px", top: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(252, 165, 129, 0.04)", filter: "blur(40px)", pointerEvents: "none" }}></div>
      <div className="absolute" style={{ right: "-40px", bottom: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(224, 122, 95, 0.04)", filter: "blur(40px)", pointerEvents: "none" }}></div>

      <div className="flex w-full justify-between items-center" style={{ gap: "8px", zIndex: 1, overflowX: "auto", paddingBottom: "8px" }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const status = getStepStatus(step.id);
          const isCompleted = status === "completed";
          
          return (
            <React.Fragment key={step.id}>
              <div className={`agent-node ${status} flex-1`} style={{ minWidth: "100px" }}>
                <div className={`agent-icon-wrapper`}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={20} />}
                </div>
                <div className="text-center mt-3">
                  <h4 className={`text-xs font-semibold`} style={{ margin: 0, color: status === "active" ? "var(--accent-apricot)" : isCompleted ? "#34d399" : "var(--text-secondary)" }}>
                    {step.name}
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-1" style={{ margin: "2px 0 0 0", lineHeight: 1.2 }}>{step.desc}</p>
                </div>
              </div>
              
              {idx < steps.length - 1 && (
                <div className={`agent-connector ${isCompleted ? "completed" : ""}`} style={{ minWidth: "15px" }}></div>
              )}
            </React.Fragment>
          );
        })}
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

