import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, Download, FileText, BarChart2, Layers } from "lucide-react";

interface ReportComparisonProps {
  reportBasic: string;
  reportAdvanced: string;
  isStreamingBasic: boolean;
  isStreamingAdvanced: boolean;
  statusBasic: string | null;
  statusAdvanced: string | null;
}

export const ReportComparison: React.FC<ReportComparisonProps> = ({
  reportBasic,
  reportAdvanced,
  isStreamingBasic,
  isStreamingAdvanced,
  statusBasic,
  statusAdvanced,
}) => {
  const containerBasicRef = useRef<HTMLDivElement>(null);
  const containerAdvancedRef = useRef<HTMLDivElement>(null);
  const [copiedBasic, setCopiedBasic] = useState(false);
  const [copiedAdvanced, setCopiedAdvanced] = useState(false);

  // Auto-scroll as streaming
  useEffect(() => {
    if (containerBasicRef.current && isStreamingBasic) {
      containerBasicRef.current.scrollTop = containerBasicRef.current.scrollHeight;
    }
  }, [reportBasic, isStreamingBasic]);

  useEffect(() => {
    if (containerAdvancedRef.current && isStreamingAdvanced) {
      containerAdvancedRef.current.scrollTop = containerAdvancedRef.current.scrollHeight;
    }
  }, [reportAdvanced, isStreamingAdvanced]);

  const handleCopy = async (text: string, setCopied: (c: boolean) => void) => {
    if (text) {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = (text: string, filename: string) => {
    if (text) {
      const blob = new Blob([text], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  // Metric helpers
  const getWordCount = (text: string) => {
    if (!text.trim()) return 0;
    return text.trim().split(/\s+/).length;
  };

  const getSourceCount = (text: string) => {
    // Regex matches md links: [title](url) where url is HTTP/HTTPS
    const regex = /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g;
    const matches = text.match(regex);
    return matches ? new Set(matches).size : 0; // unique sources
  };

  const getStatusText = (status: string | null, isStreaming: boolean, hasContent: boolean) => {
    if (isStreaming) return "Writing report...";
    if (status === "done" || (!isStreaming && hasContent)) return "Completed";
    if (status) return `Agent: ${status}`;
    return "Pending...";
  };

  const basicWords = getWordCount(reportBasic);
  const advancedWords = getWordCount(reportAdvanced);
  const basicSources = getSourceCount(reportBasic);
  const advancedSources = getSourceCount(reportAdvanced);

  return (
    <div className="flex flex-col gap-6 w-full scroll-reveal">
      {/* Metrics Dashboard */}
      {(reportBasic || reportAdvanced) && (
        <div className="glass-panel p-4 flex flex-col md-flex-row justify-around items-center gap-4 text-sm" style={{ background: "rgba(252, 165, 129, 0.03)" }}>
          <div className="flex items-center gap-2 text-indigo-400 font-semibold" style={{ color: "var(--accent-apricot)" }}>
            <BarChart2 size={18} />
            <span>Comparison Metrics</span>
          </div>
          
          <div className="flex gap-8 items-center flex-wrap justify-center">
            <div className="text-center">
              <span className="text-xs text-gray-500 block">Word Count Diff</span>
              <span className="font-bold text-white">
                {basicWords} vs {advancedWords}{" "}
                <span className="text-xs font-normal" style={{ color: "var(--accent-peach)" }}>
                  ({advancedWords - basicWords >= 0 ? `+${advancedWords - basicWords}` : advancedWords - basicWords} words)
                </span>
              </span>
            </div>

            <div className="text-center" style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: "32px" }}>
              <span className="text-xs text-gray-500 block">Unique Citations</span>
              <span className="font-bold text-white">
                {basicSources} vs {advancedSources}{" "}
                <span className="text-xs font-normal" style={{ color: "var(--accent-peach)" }}>
                  ({advancedSources - basicSources >= 0 ? `+${advancedSources - basicSources}` : advancedSources - basicSources} sources)
                </span>
              </span>
            </div>
            
            <div className="text-center" style={{ borderLeft: "1px solid var(--border-color)", paddingLeft: "32px" }}>
              <span className="text-xs text-gray-500 block">Depth Factor</span>
              <span className="font-semibold text-white flex items-center gap-1">
                <Layers size={14} style={{ color: "var(--accent-rose)" }} />
                <span>1.0x vs 2.0x Context</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Side-by-Side Panels */}
      <div className="flex flex-col md:flex-row gap-6 w-full" style={{ display: "flex", flexDirection: "row", gap: "24px", flexWrap: "wrap" }}>
        
        {/* Basic Panel */}
        <div className="glass-panel p-6 flex flex-col relative flex-1 min-w-[280px]" style={{ minHeight: "350px", flex: "1 1 0" }}>
          <div className="flex justify-between items-center mb-4" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
            <div>
              <div className="flex items-center gap-2 font-semibold text-white" style={{ fontSize: "1.1rem" }}>
                <FileText size={18} style={{ color: "var(--accent-peach)" }} />
                <span>Basic Depth Report</span>
              </div>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Status: {getStatusText(statusBasic, isStreamingBasic && statusBasic === "writer", !!reportBasic)}
              </span>
            </div>
            {reportBasic && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCopy(reportBasic, setCopiedBasic)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                >
                  {copiedBasic ? <Check size={14} style={{ color: "#34d399" }} /> : <Copy size={14} />}
                  <span>{copiedBasic ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={() => handleDownload(reportBasic, "basic-report.md")}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                >
                  <Download size={14} />
                  <span>Get .md</span>
                </button>
              </div>
            )}
          </div>

          <div
            ref={containerBasicRef}
            className="markdown-body"
            style={{ maxHeight: "500px", minHeight: "150px", overflowY: "auto", paddingRight: "8px" }}
          >
            {reportBasic ? (
              <ReactMarkdown>{reportBasic}</ReactMarkdown>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-500 italic py-12">
                Waiting to begin basic research...
              </div>
            )}
            {isStreamingBasic && statusBasic === "writer" && (
              <div className="flex items-center gap-2 mt-4 text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full active-pulse" style={{ backgroundColor: "var(--accent-apricot)", display: "inline-block" }}></span>
                <span className="text-[10px] italic">Generating report...</span>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Panel */}
        <div className="glass-panel p-6 flex flex-col relative flex-1 min-w-[280px]" style={{ minHeight: "350px", flex: "1 1 0" }}>
          <div className="flex justify-between items-center mb-4" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
            <div>
              <div className="flex items-center gap-2 font-semibold text-white" style={{ fontSize: "1.1rem" }}>
                <FileText size={18} style={{ color: "var(--accent-apricot)" }} />
                <span>Advanced Depth Report</span>
              </div>
              <span className="text-[10px] text-gray-500 block mt-0.5">
                Status: {getStatusText(statusAdvanced, isStreamingAdvanced && statusAdvanced === "writer", !!reportAdvanced)}
              </span>
            </div>
            {reportAdvanced && (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleCopy(reportAdvanced, setCopiedAdvanced)}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                >
                  {copiedAdvanced ? <Check size={14} style={{ color: "#34d399" }} /> : <Copy size={14} />}
                  <span>{copiedAdvanced ? "Copied" : "Copy"}</span>
                </button>
                <button
                  onClick={() => handleDownload(reportAdvanced, "advanced-report.md")}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
                >
                  <Download size={14} />
                  <span>Get .md</span>
                </button>
              </div>
            )}
          </div>

          <div
            ref={containerAdvancedRef}
            className="markdown-body"
            style={{ maxHeight: "500px", minHeight: "150px", overflowY: "auto", paddingRight: "8px" }}
          >
            {reportAdvanced ? (
              <ReactMarkdown>{reportAdvanced}</ReactMarkdown>
            ) : (
              <div className="flex items-center justify-center h-full text-xs text-gray-500 italic py-12">
                Waiting to begin advanced research...
              </div>
            )}
            {isStreamingAdvanced && statusAdvanced === "writer" && (
              <div className="flex items-center gap-2 mt-4 text-gray-500">
                <span className="w-1.5 h-1.5 rounded-full active-pulse" style={{ backgroundColor: "var(--accent-apricot)", display: "inline-block" }}></span>
                <span className="text-[10px] italic">Generating report...</span>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
