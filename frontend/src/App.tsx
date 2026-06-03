import { useState, useEffect } from "react";
import { SearchBar } from "./components/SearchBar";
import { AgentStatus } from "./components/AgentStatus";
import { ReportStream } from "./components/ReportStream";
import { ReportComparison } from "./components/ReportComparison";
import { startResearchStream } from "./api/research";
import { Cpu, AlertCircle, Trash2, History, ArrowRight } from "lucide-react";

interface HistoryItem {
  query: string;
  report: string;
  timestamp: string;
}

interface CritiqueLog {
  score: number;
  feedback: string;
  attempts: number;
}

const PRESET_QUERIES = [
  "Compare LangGraph vs AutoGen",
  "ChromaDB vector database guide",
  "Explain the transformer model architecture"
];

function App() {
  // Mode selection
  const [compareMode, setCompareMode] = useState(false);

  // Single mode state
  const [report, setReport] = useState("");
  const [currentAgent, setCurrentAgent] = useState<"memory_retrieve" | "search" | "rag" | "writer" | "critique" | "memory_store" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [critiqueLog, setCritiqueLog] = useState<CritiqueLog | null>(null);

  // Comparison mode states
  const [reportBasic, setReportBasic] = useState("");
  const [reportAdvanced, setReportAdvanced] = useState("");
  const [currentAgentBasic, setCurrentAgentBasic] = useState<"memory_retrieve" | "search" | "rag" | "writer" | "critique" | "memory_store" | null>(null);
  const [currentAgentAdvanced, setCurrentAgentAdvanced] = useState<"memory_retrieve" | "search" | "rag" | "writer" | "critique" | "memory_store" | null>(null);
  const [isLoadingBasic, setIsLoadingBasic] = useState(false);
  const [isLoadingAdvanced, setIsLoadingAdvanced] = useState(false);
  const [errorBasic, setErrorBasic] = useState<string | null>(null);
  const [errorAdvanced, setErrorAdvanced] = useState<string | null>(null);

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

  // Helper to generate session ID
  const generateSessionId = () => Math.random().toString(36).substring(2, 15);

  const handleSearch = async (query: string, depth: "basic" | "advanced" = "basic", compare: boolean = false) => {
    setCompareMode(compare);
    setSelectedHistoryQuery(null);

    if (!compare) {
      setIsLoading(true);
      setError(null);
      setReport("");
      setCurrentAgent(null);
      setCritiqueLog(null);

      let accumulatedReport = "";
      const sessionId = generateSessionId();

      await startResearchStream(
        query,
        (event) => {
          if (event.event === "status") {
            setCurrentAgent(event.data as any);
          } else if (event.event === "critique_log") {
            try {
              setCritiqueLog(JSON.parse(event.data));
            } catch (e) {
              console.error("Failed to parse critique log", e);
            }
          } else if (event.event === "chunk") {
            accumulatedReport += event.data;
            setReport(accumulatedReport);
          } else if (event.event === "done") {
            setIsLoading(false);
            if (accumulatedReport.trim()) {
              saveToHistory(query, accumulatedReport);
            }
          } else if (event.event === "error") {
            setError(event.data);
            setIsLoading(false);
          }
        },
        (err) => {
          setError(err.message || "Failed to establish stream connection.");
          setIsLoading(false);
        },
        depth,
        sessionId
      );
    } else {
      // Comparison Mode: Fire basic and advanced requests concurrently
      setIsLoadingBasic(true);
      setIsLoadingAdvanced(true);
      setErrorBasic(null);
      setErrorAdvanced(null);
      setReportBasic("");
      setReportAdvanced("");
      setCurrentAgentBasic(null);
      setCurrentAgentAdvanced(null);

      let accumulatedBasic = "";
      let accumulatedAdvanced = "";

      const sessionBasic = generateSessionId();
      const sessionAdvanced = generateSessionId();

      // Trigger Basic Depth
      startResearchStream(
        query,
        (event) => {
          if (event.event === "status") {
            setCurrentAgentBasic(event.data as any);
          } else if (event.event === "chunk") {
            accumulatedBasic += event.data;
            setReportBasic(accumulatedBasic);
          } else if (event.event === "done") {
            setIsLoadingBasic(false);
          } else if (event.event === "error") {
            setErrorBasic(event.data);
            setIsLoadingBasic(false);
          }
        },
        (err) => {
          setErrorBasic(err.message || "Basic stream failure.");
          setIsLoadingBasic(false);
        },
        "basic",
        sessionBasic
      );

      // Trigger Advanced Depth
      startResearchStream(
        query,
        (event) => {
          if (event.event === "status") {
            setCurrentAgentAdvanced(event.data as any);
          } else if (event.event === "chunk") {
            accumulatedAdvanced += event.data;
            setReportAdvanced(accumulatedAdvanced);
          } else if (event.event === "done") {
            setIsLoadingAdvanced(false);
            if (accumulatedAdvanced.trim()) {
              saveToHistory(query, accumulatedAdvanced);
            }
          } else if (event.event === "error") {
            setErrorAdvanced(event.data);
            setIsLoadingAdvanced(false);
          }
        },
        (err) => {
          setErrorAdvanced(err.message || "Advanced stream failure.");
          setIsLoadingAdvanced(false);
        },
        "advanced",
        sessionAdvanced
      );
    }
  };

  const saveToHistory = (query: string, reportContent: string) => {
    setHistory((prev) => {
      const filtered = prev.filter((item) => item.query.toLowerCase() !== query.toLowerCase());
      const updated = [
        {
          query,
          report: reportContent,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        },
        ...filtered
      ].slice(0, 10);
      localStorage.setItem("research_history", JSON.stringify(updated));
      return updated;
    });
  };

  const handleLoadHistory = (item: HistoryItem) => {
    if (isLoading || isLoadingBasic || isLoadingAdvanced) return;
    setCompareMode(false);
    setReport(item.report);
    setCurrentAgent(null);
    setCritiqueLog(null);
    setError(null);
    setSelectedHistoryQuery(item.query);
  };

  const handleClearHistory = () => {
    setHistory([]);
    localStorage.removeItem("research_history");
    setSelectedHistoryQuery(null);
  };

  const isResearchRunning = isLoading || isLoadingBasic || isLoadingAdvanced;

  return (
    <div className="app-container flex flex-col gap-6">
      <header className="header-section scroll-reveal">
        <div className="flex justify-center items-center gap-3 mb-2" style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(221, 155, 126, 0.08)", border: "1px solid rgba(221, 155, 126, 0.15)" }}>
            <Cpu size={20} style={{ color: "var(--accent-apricot)" }} />
          </div>
          <h1 className="header-title" style={{ margin: 0, fontSize: "2.2rem", fontWeight: 700, letterSpacing: "-0.03em" }}>
            <span className="gradient-text">InSightForge</span>
          </h1>
        </div>
      </header>

      <main className="main-content-layout">
        {/* Left Column: Input and Stream output */}
        <div className="main-left-column scroll-reveal">
          <SearchBar onSearch={handleSearch} isLoading={isResearchRunning} />
          
          {/* Preset Prompts */}
          <div className="preset-container">
            {PRESET_QUERIES.map((q) => (
              <button
                id={`preset-query-${q.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}
                key={q}
                onClick={() => !isResearchRunning && handleSearch(q, "basic", false)}
                disabled={isResearchRunning}
                className="preset-chip"
              >
                {q}
              </button>
            ))}
          </div>

          {/* Render output panels based on Compare Mode */}
          {compareMode ? (
            <div className="flex flex-col gap-4 w-full">
              {errorBasic && (
                <div className="glass-panel p-4 flex items-center gap-3 w-full scroll-reveal" style={{ borderColor: "rgba(224, 122, 95, 0.3)", background: "rgba(224, 122, 95, 0.05)", boxSizing: "border-box" }}>
                  <AlertCircle size={20} style={{ color: "var(--accent-apricot)" }} />
                  <span className="text-sm" style={{ color: "var(--accent-peach)" }}>Basic Depth Error: {errorBasic}</span>
                </div>
              )}
              {errorAdvanced && (
                <div className="glass-panel p-4 flex items-center gap-3 w-full scroll-reveal" style={{ borderColor: "rgba(224, 122, 95, 0.3)", background: "rgba(224, 122, 95, 0.05)", boxSizing: "border-box" }}>
                  <AlertCircle size={20} style={{ color: "var(--accent-apricot)" }} />
                  <span className="text-sm" style={{ color: "var(--accent-peach)" }}>Advanced Depth Error: {errorAdvanced}</span>
                </div>
              )}
              <ReportComparison
                reportBasic={reportBasic}
                reportAdvanced={reportAdvanced}
                isStreamingBasic={isLoadingBasic}
                isStreamingAdvanced={isLoadingAdvanced}
                statusBasic={currentAgentBasic}
                statusAdvanced={currentAgentAdvanced}
              />
            </div>
          ) : (
            <>
              <AgentStatus currentAgent={currentAgent} isLoading={isLoading} critiqueLog={critiqueLog} />

              {error && (
                <div className="glass-panel p-4 flex items-center gap-3 w-full scroll-reveal" style={{ borderColor: "rgba(224, 122, 95, 0.3)", background: "rgba(224, 122, 95, 0.05)", boxSizing: "border-box" }}>
                  <AlertCircle size={20} style={{ color: "var(--accent-apricot)" }} />
                  <span className="text-sm" style={{ color: "var(--accent-peach)" }}>{error}</span>
                </div>
              )}

              <ReportStream report={report} isStreaming={isLoading && currentAgent === "writer"} />
            </>
          )}
        </div>

        {/* Right Column: Sidebar for History */}
        <div className="main-right-column scroll-reveal">
          <div className="glass-panel p-4 flex flex-col gap-4">
            <div className="flex justify-between items-center" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "8px" }}>
              <div className="flex items-center gap-2 text-indigo-400 font-semibold" style={{ fontSize: "0.95rem" }}>
                <History size={16} />
                <span>Recent History</span>
              </div>
              {history.length > 0 && (
                <button
                  id="clear-history-button"
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
                    id={`history-item-${index}`}
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

      <footer className="text-center text-gray-500 mt-4 flex flex-col gap-1" style={{ marginTop: "40px", opacity: 0.65, fontSize: "11px" }}>
        <div>InSightForge — A self-correcting multi-agent research engine with persistent memory and side-by-side depth comparison.</div>
        <div style={{ opacity: 0.8, marginTop: "2px" }}>Powered by Tavily AI • sentence-transformers • ChromaDB • Groq Llama 3.3</div>
      </footer>
    </div>
  );
}

export default App;

// 
