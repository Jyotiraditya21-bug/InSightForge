import React, { useState } from "react";
import { Search, Sparkles, Mic } from "lucide-react";

interface SearchBarProps {
  onSearch: (query: string, depth: "basic" | "advanced", compare: boolean) => void;
  isLoading: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSearch, isLoading }) => {
  const [query, setQuery] = useState("");
  const [depth, setDepth] = useState<"basic" | "advanced">("basic");
  const [compare, setCompare] = useState(false);
  const [isListening, setIsListening] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim() && !isLoading) {
      onSearch(query.trim(), depth, compare);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Voice speech recognition is not supported in this browser. Please try Chrome or Safari.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setQuery(transcript);
      // Auto submit voice queries
      if (transcript.trim()) {
        onSearch(transcript.trim(), depth, compare);
      }
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="flex flex-col gap-3 w-full">
      <form onSubmit={handleSubmit} className="w-full">
        <div 
          className="glass-panel search-bar-wrapper flex items-center gap-2" 
          style={{ 
            padding: "6px 8px 6px 16px",
            borderColor: isListening ? "rgba(221, 155, 126, 0.3)" : "",
            boxShadow: isListening ? "0 0 0 2px rgba(221, 155, 126, 0.15)" : ""
          }}
        >
          <div className="text-gray-400 flex items-center justify-center">
            <Search size={18} />
          </div>
          <input
            id="search-query-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={isListening ? "Listening closely... speak now" : "What would you like me to research today?..."}
            disabled={isLoading || isListening}
            className="flex-1 bg-transparent border-none outline-none py-2 text-white placeholder-gray-500 text-base"
          />
          
          {/* Voice Input Button */}
          <button
            id="voice-input-button"
            type="button"
            onClick={handleVoiceInput}
            disabled={isLoading}
            className="flex items-center justify-center cursor-pointer transition-all border-none"
            style={{
              background: isListening ? "rgba(221, 155, 126, 0.1)" : "rgba(255, 255, 255, 0.02)",
              border: isListening ? "1px solid rgba(221, 155, 126, 0.25)" : "1px solid rgba(255, 255, 255, 0.04)",
              color: isListening ? "var(--accent-apricot)" : "var(--text-secondary)",
              borderRadius: "50%",
              width: "40px",
              height: "40px",
            }}
            title="Start voice dictation"
          >
            <Mic size={18} className={isListening ? "active-pulse" : ""} />
          </button>

          <button
            id="research-submit-button"
            type="submit"
            disabled={isLoading || !query.trim() || isListening}
            className="gradient-btn"
            style={{ height: "40px", padding: "0 20px", minWidth: "110px", borderRadius: "8px" }}
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                <span style={{ fontSize: "0.85rem" }}>Running...</span>
              </div>
            ) : (
              <>
                <Sparkles size={14} />
                <span style={{ fontSize: "0.85rem" }}>Research</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* Control Toggles */}
      <div className="flex flex-wrap items-center justify-between px-3 gap-3" style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
        <div className="flex items-center gap-4">
          {/* Depth settings (hidden in comparison mode as it runs both) */}
          {!compare && (
            <div className="flex items-center gap-2">
              <span>Research Depth:</span>
              <div className="flex bg-[rgba(255,255,255,0.03)] border border-[rgba(253,165,129,0.08)] rounded-lg p-0.5">
                <button
                  id="depth-basic-button"
                  type="button"
                  onClick={() => setDepth("basic")}
                  className="cursor-pointer border-none px-3 py-1 rounded-md text-xs transition-all"
                  style={{
                    background: depth === "basic" ? "rgba(252, 165, 129, 0.15)" : "transparent",
                    color: depth === "basic" ? "var(--accent-peach)" : "var(--text-muted)",
                    fontWeight: depth === "basic" ? "600" : "normal"
                  }}
                >
                  Basic
                </button>
                <button
                  id="depth-advanced-button"
                  type="button"
                  onClick={() => setDepth("advanced")}
                  className="cursor-pointer border-none px-3 py-1 rounded-md text-xs transition-all"
                  style={{
                    background: depth === "advanced" ? "rgba(252, 165, 129, 0.15)" : "transparent",
                    color: depth === "advanced" ? "var(--accent-peach)" : "var(--text-muted)",
                    fontWeight: depth === "advanced" ? "600" : "normal"
                  }}
                >
                  Advanced
                </button>
              </div>
            </div>
          )}
          {compare && (
            <span className="text-xs text-amber-300 font-medium">
              ⚡ Running Basic and Advanced research concurrently
            </span>
          )}
        </div>

        {/* Side-by-Side Comparison Toggle */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            id="compare-depths-toggle"
            type="checkbox"
            checked={compare}
            onChange={(e) => setCompare(e.target.checked)}
            className="cursor-pointer"
            style={{ accentColor: "var(--accent-apricot)" }}
          />
          <span>Compare Depths (Side-by-Side)</span>
        </label>
      </div>
    </div>
  );
};

