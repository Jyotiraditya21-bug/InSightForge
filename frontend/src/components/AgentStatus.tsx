import React from "react";
import { Search, Database, FileText, CheckCircle2 } from "lucide-react";

interface AgentStatusProps {
  currentAgent: "search" | "rag" | "writer" | null;
  isLoading: boolean;
}

export const AgentStatus: React.FC<AgentStatusProps> = ({ currentAgent, isLoading }) => {
  const steps = [
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
      desc: "Synthesizing report with Groq LLM",
      icon: FileText,
    },
  ];

  if (!isLoading && !currentAgent) return null;

  const getStepStatus = (stepId: string) => {
    if (!isLoading) return "completed";
    if (currentAgent === stepId) return "active";
    
    const order = ["search", "rag", "writer"];
    const currentIndex = order.indexOf(currentAgent || "");
    const stepIndex = order.indexOf(stepId);
    
    if (stepIndex < currentIndex) return "completed";
    return "pending";
  };

  return (
    <div className="glass-panel p-6 w-full flex flex-col md-flex-row items-center justify-between relative overflow-hidden" style={{ minHeight: "120px" }}>
      {/* Decorative background glows */}
      <div className="absolute" style={{ left: "-40px", top: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(129, 140, 248, 0.05)", filter: "blur(40px)", pointerEvents: "none" }}></div>
      <div className="absolute" style={{ right: "-40px", bottom: "-40px", width: "160px", height: "160px", borderRadius: "50%", background: "rgba(192, 132, 252, 0.05)", filter: "blur(40px)", pointerEvents: "none" }}></div>

      <div className="flex w-full justify-between items-center" style={{ gap: "12px", zIndex: 1 }}>
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const status = getStepStatus(step.id);
          const isCompleted = status === "completed";
          
          return (
            <React.Fragment key={step.id}>
              <div className={`agent-node ${status} flex-1`}>
                <div className={`agent-icon-wrapper`}>
                  {isCompleted ? <CheckCircle2 size={22} /> : <Icon size={22} />}
                </div>
                <div className="text-center mt-4">
                  <h4 className={`text-sm font-semibold`} style={{ margin: 0, color: status === "active" ? "var(--accent-blue)" : isCompleted ? "#34d399" : "var(--text-secondary)" }}>
                    {step.name}
                  </h4>
                  <p className="text-xs text-gray-500 mt-1" style={{ margin: "4px 0 0 0" }}>{step.desc}</p>
                </div>
              </div>
              
              {idx < steps.length - 1 && (
                <div className={`agent-connector ${isCompleted ? "completed" : ""}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
