import React, { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Copy, Check, FileText, Download } from "lucide-react";

interface ReportStreamProps {
  report: string;
  isStreaming: boolean;
}

export const ReportStream: React.FC<ReportStreamProps> = ({ report, isStreaming }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [report]);

  const handleCopy = async () => {
    if (report) {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownload = () => {
    if (report) {
      const blob = new Blob([report], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `research-report-${new Date().toISOString().split("T")[0]}.md`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  if (!report) return null;

  return (
    <div className="glass-panel p-6 w-full flex flex-col relative" style={{ minHeight: "200px" }}>
      <div className="flex justify-between items-center mb-4" style={{ borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "12px" }}>
        <div className="flex items-center gap-2 text-indigo-400 font-semibold" style={{ color: "var(--accent-indigo)" }}>
          <FileText size={18} />
          <span>Research Report</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            style={{ padding: "4px 8px", outline: "none" }}
          >
            {copied ? (
              <>
                <Check size={16} style={{ color: "#34d399" }} />
                <span style={{ color: "#34d399" }}>Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Markdown</span>
              </>
            )}
          </button>
          <button
            onClick={handleDownload}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors bg-transparent border-none cursor-pointer"
            style={{ padding: "4px 8px", outline: "none" }}
          >
            <Download size={16} />
            <span>Download .md</span>
          </button>
        </div>
      </div>

      <div
        ref={containerRef}
        className="markdown-body"
        style={{ maxHeight: "600px", minHeight: "150px", overflowY: "auto", paddingRight: "8px" }}
      >
        <ReactMarkdown>{report}</ReactMarkdown>
        {isStreaming && (
          <div className="flex items-center gap-2 mt-4 text-gray-500" style={{ padding: "8px 0" }}>
            <div className="flex gap-1">
              <span className="w-2 h-2 rounded-full active-pulse" style={{ backgroundColor: "var(--accent-indigo)", display: "inline-block", width: "8px", height: "8px" }}></span>
              <span className="w-2 h-2 rounded-full active-pulse" style={{ backgroundColor: "var(--accent-purple)", display: "inline-block", width: "8px", height: "8px", animationDelay: "0.3s" }}></span>
              <span className="w-2 h-2 rounded-full active-pulse" style={{ backgroundColor: "var(--accent-magenta)", display: "inline-block", width: "8px", height: "8px", animationDelay: "0.6s" }}></span>
            </div>
            <span className="text-xs italic" style={{ color: "var(--text-muted)" }}>Generating report...</span>
          </div>
        )}
      </div>
    </div>
  );
};
