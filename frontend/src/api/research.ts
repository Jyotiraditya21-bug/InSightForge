export interface StreamEvent {
  event: "status" | "chunk" | "done" | "error" | "critique_log";
  data: string;
}

/**
 * Initiates a Server-Sent Events stream from the backend research endpoint.
 * Uses fetch and reader streams to support HTTP POST requests.
 * 
 * @param query Research query string
 * @param onEvent Callback triggered for each SSE event (status, chunk, done, critique_log)
 * @param onError Callback triggered on network or execution errors
 * @param depth Research depth ('basic' or 'advanced')
 * @param sessionId Optional session identifier to isolate parallel runs
 */
export async function startResearchStream(
  query: string,
  onEvent: (event: StreamEvent) => void,
  onError: (error: any) => void,
  depth: string = "basic",
  sessionId?: string
) {
  try {
    const apiBaseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000";
    console.log("startResearchStream: Fetching", `${apiBaseUrl}/research`, "with query:", query, "depth:", depth, "session:", sessionId);
    const response = await fetch(`${apiBaseUrl}/research`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ query, depth, session_id: sessionId }),
    });

    console.log("startResearchStream: Response status:", response.status, response.statusText);

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("ReadableStream not supported by response.");
    }

    console.log("startResearchStream: Reader obtained successfully.");

    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      console.log("startResearchStream: Reading next chunk...");
      const { done, value } = await reader.read();
      console.log("startResearchStream: Chunk read. Done:", done, "Value length:", value?.length);
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // Split buffer by double newline (SSE event boundary, supporting CRLF and LF)
      const parts = buffer.split(/\r?\n\r?\n/);
      buffer = parts.pop() || ""; // Keep trailing partial event in buffer

      for (const part of parts) {
        if (!part.trim()) continue;

        let eventType: StreamEvent["event"] | null = null;
        let dataContent = "";

        // Split by single newline (CRLF or LF)
        const lines = part.split(/\r?\n/);
        for (const line of lines) {
          if (line.startsWith("event: ")) {
            eventType = line.slice(7).trim() as StreamEvent["event"];
          } else if (line.startsWith("data: ")) {
            dataContent = line.slice(6).trim();
          }
        }

        if (eventType && dataContent) {
          // Unescape newline codes if sent by backend
          const decodedData = dataContent.replace(/\\n/g, "\n");
          onEvent({ event: eventType, data: decodedData });
        }
      }
    }
  } catch (error) {
    onError(error);
  }
}
