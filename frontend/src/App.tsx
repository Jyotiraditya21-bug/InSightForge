import { useState, useEffect } from "react";
import { SearchBar } from "./components/SearchBar";
import { AgentStatus } from "./components/AgentStatus";
import { ReportStream } from "./components/ReportStream";
import { startResearchStream } from "./api/research";
import { Cpu, AlertCircle, Trash2, History, ArrowRight } from "lucide-react";

interface HistoryItem {
  query: string;
  report: string;
  timestamp: string;
}

const PRESET_QUERIES = [
  "Compare LangGraph vs AutoGen",
  "ChromaDB vector database guide",
  "Explain the transformer model architecture"
];

function App() {
  const [report, setReport] = useState("");
  const [currentAgent, setCurrentAgent] = useState<"search" | "rag" | "writer" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [selectedHistoryQuery, setSelectedHistoryQuery] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    const saved = localStorage.getItem("research_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    setError(null);
    setReport("");
    setCurrentAgent(null);
    setSelectedHistoryQuery(null);

    let accumulatedReport = "";

    await startResearchStream(
      query,
      (event) => {
        if (event.event === "status") {
          setCurrentAgent(event.data as "search" | "rag" | "writer");
        } else if (event.event === "chunk") {
          accumulatedReport += event.data;
          setReport(accumulatedReport);
        } else if (event.event === "done") {
          setIsLoading(false);
          if (accumulatedReport.trim()) {
            setHistory((prev) => {
              const filtered = prev.filter((item) => item.query.toLowerCase() !== query.toLowerCase());
              const updated = [
                {
                  query,
                  report: accumulatedReport,
                  timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                },
                ...filtered
              ].slice(0, 10);
              localStorage.setItem("research_history", JSON.stringify(updated));
              return updated;
            });
          }
        } else if (event.event === "error") {
          setError(event.data);
          setIsLoading(false);
        }
      },
      (err) => {
        setError(err.message || "Failed to establish stream connection.");
        setIsLoading(false);
      }
    );
  };

  const handleLoadHistory = (item: HistoryItem) => {
    if (isLoading) return;
    setReport(item.report);
    setCurrentAgent(null);
    setError(null);
    setSelectedHistoryQuery(item.query);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("research_history");
    setSelectedHistoryQuery(null);
  };

  return (
    <div className="app-container flex flex-col gap-6">
      <header className="header-section">
        <div className="flex justify-center items-center gap-3 mb-2" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
          <div className="gradient-progress" style={{ width: "42px", height: "42px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 0 20px rgba(99, 102, 241, 0.4)" }}>
            <Cpu size={24} style={{ color: "#fff" }} />
          </div>
          <h1 className="header-title" style={{ margin: 0, fontSize: "2.5rem" }}>
            <span className="gradient-text">Research</span>OS
          </h1>
        </div>
        <p className="header-subtitle" style={{ margin: "4px 0 0 0" }}>
          A multi-agent retrieval-augmented pipeline powered by LangGraph, ChromaDB, and Groq.
        </p>
      </header>

      <main className="main-content-layout">
        {/* Left Column: Input and Stream output */}
        <div className="main-left-column">
          <SearchBar onSearch={handleSearch} isLoading={isLoading} />
          
          {/* Preset Prompts */}
          <div className="preset-container">
            {PRESET_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => !isLoading && handleSearch(q)}
                disabled={isLoading}
                className="preset-chip"
              >
                {q}
              </button>
            ))}
          </div>

          <AgentStatus currentAgent={currentAgent} isLoading={isLoading} />

          {error && (
            <div className="glass-panel p-4 flex items-center gap-3 w-full" style={{ borderColor: "rgba(239, 68, 68, 0.3)", background: "rgba(239, 68, 68, 0.05)", boxSizing: "border-box" }}>
              <AlertCircle size={20} style={{ color: "#f87171" }} />
              <span className="text-sm" style={{ color: "#f87171" }}>{error}</span>
            </div>
          )}

          <ReportStream report={report} isStreaming={isLoading && currentAgent === "writer"} />
        </div>

        {/* Right Column: Sidebar for History */}
        <div className="main-right-column">
          <div className="glass-panel p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "8px" }}>
              <div className="flex items-center gap-2 text-indigo-400 font-semibold" style={{ fontSize: "0.95rem" }}>
                <History size={16} />
                <span>Recent History</span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={handleClearHistory}
                  className="text-gray-500 hover:text-red-400 transition-colors bg-transparent border-none cursor-pointer flex items-center gap-1"
                  style={{ fontSize: "0.8rem" }}
                  title="Clear history"
                >
                  <Trash2 size={14} />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {history.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">
                No research history yet. Run a search to see it here.
              </div>
            ) : (
              <div className="flex flex-col gap-2" style={{ maxHeight: "350px", overflowY: "auto", paddingRight: "4px" }}>
                {history.map((item, index) => (
                  <div
                    key={index}
                    onClick={() => handleLoadHistory(item)}
                    className={`history-card flex flex-col gap-1 ${selectedHistoryQuery === item.query ? "active" : ""}`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <span className="font-semibold text-xs text-white truncate" style={{ maxWidth: "150px" }}>
                        {item.query}
                      </span>
                      <span className="text-gray-500" style={{ fontSize: "0.7rem" }}>
                        {item.timestamp}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-indigo-400" style={{ fontSize: "0.75rem" }}>
                      <span>View Report</span>
                      <ArrowRight size={10} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="text-center text-xs text-gray-500 mt-4" style={{ marginTop: "40px", opacity: 0.7 }}>
        Powered by Tavily • sentence-transformers • ChromaDB • Groq Llama 3.3
      </footer>
    </div>
  );
}

export default App;
// 
