import { useState, useCallback } from "react";
import { toast } from "sonner";

interface AnalysisResponse {
  type: "stats" | "response_chunk" | "complete" | "error";
  data?: any;
  chunk?: string;
  error?: string;
}

interface UseAIAnalysisProps {
  onResponse?: (chunk: string) => void;
  onComplete?: (fullResponse: string) => void;
  onError?: (error: string) => void;
}

export const useAIAnalysis = ({
  onResponse,
  onComplete,
  onError,
}: UseAIAnalysisProps = {}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState("");
  const [stats, setStats] = useState<any>(null);

  const analyzeQuestion = useCallback(
    async (question: string) => {
      if (!question.trim()) {
        toast.error("Vui lòng nhập câu hỏi");
        return;
      }

      setIsLoading(true);
      setResponse("");
      setStats(null);

      try {
        const response = await fetch("/api/ai/analyze", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            question: question.trim(),
            stream: true,
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) {
          throw new Error("No response body");
        }

        const decoder = new TextDecoder();
        let fullResponse = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split("\n");

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const jsonStr = line.slice(6);
                if (jsonStr.trim() === "") continue;

                const data: AnalysisResponse = JSON.parse(jsonStr);

                switch (data.type) {
                  case "stats":
                    setStats(data.data);
                    break;

                  case "response_chunk":
                    if (data.chunk) {
                      fullResponse += data.chunk;
                      setResponse(fullResponse);
                      onResponse?.(data.chunk);
                    }
                    break;

                  case "complete":
                    onComplete?.(fullResponse);
                    break;

                  case "error":
                    throw new Error(data.error || "Unknown error");
                }
              } catch (parseError) {
                console.error("Error parsing SSE data:", parseError);
              }
            }
          }
        }
      } catch (error) {
        console.error("AI Analysis error:", error);
        const errorMessage =
          error instanceof Error ? error.message : "Có lỗi xảy ra";
        toast.error(errorMessage);
        onError?.(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [onResponse, onComplete, onError]
  );

  const clearResponse = useCallback(() => {
    setResponse("");
    setStats(null);
  }, []);

  return {
    analyzeQuestion,
    clearResponse,
    isLoading,
    response,
    stats,
  };
};
