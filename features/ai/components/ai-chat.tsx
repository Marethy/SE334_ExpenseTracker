"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Loader2, Brain, TrendingUp, BarChart3 } from "lucide-react";
import { useAIAnalysis } from "@/features/ai/api/use-ai-analysis";
import { usePaywall } from "@/features/subscriptions/hooks/use-paywall";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";

interface ChatMessage {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  stats?: any;
}

const SAMPLE_QUESTIONS = [
  "Phân tích chi tiêu của tôi trong tháng này",
  "Tôi có thể tiết kiệm được bao nhiêu?",
  "So sánh thu nhập và chi tiêu 3 tháng gần đây",
  "Đề xuất cách cải thiện tài chính cá nhân",
  "Danh mục nào tôi chi tiêu nhiều nhất?",
];

export const AIChat = () => {
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { shouldBlock, triggerPaywall } = usePaywall();

  const { analyzeQuestion, isLoading, clearResponse } = useAIAnalysis({
    onResponse: (chunk) => {
      setCurrentResponse((prev) => prev + chunk);
    },
    onComplete: (fullResponse) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "ai",
        content: fullResponse,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setCurrentResponse("");
    },
    onError: (error) => {
      const errorMessage: ChatMessage = {
        id: Date.now().toString(),
        type: "ai",
        content: `Xin lỗi, có lỗi xảy ra: ${error}`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      setCurrentResponse("");
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentResponse]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || isLoading) return;

    if (shouldBlock) {
      triggerPaywall();
      return;
    }

    // Add user message
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content: question,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setQuestion("");

    // Analyze question
    await analyzeQuestion(question);
  };

  const handleSampleQuestion = (sampleQuestion: string) => {
    if (shouldBlock) {
      triggerPaywall();
      return;
    }
    setQuestion(sampleQuestion);
  };

  const clearChat = () => {
    setMessages([]);
    setCurrentResponse("");
    clearResponse();
  };

  return (
    <div className="space-y-6">
      {/* Premium Notice */}
      {shouldBlock && (
        <Card className="border-yellow-200 bg-gradient-to-r from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-800">
              <Brain className="size-5" />
              AI Financial Analysis - Premium Feature
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-yellow-700 mb-4">
              Tính năng phân tích tài chính AI chỉ dành cho thành viên Premium.
              Nâng cấp ngay để nhận được phân tích chuyên sâu về tình hình tài
              chính.
            </p>
            <Button
              onClick={triggerPaywall}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600"
            >
              Nâng cấp Premium
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Sample Questions */}
      {!shouldBlock && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="size-5" />
              Câu hỏi gợi ý
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {SAMPLE_QUESTIONS.map((sampleQ, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSampleQuestion(sampleQ)}
                  disabled={isLoading}
                  className="text-xs"
                >
                  {sampleQ}
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chat Messages */}
      <Card className="h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Brain className="size-5" />
            AI Financial Assistant
          </CardTitle>
          {messages.length > 0 && (
            <Button variant="outline" size="sm" onClick={clearChat}>
              Xóa lịch sử
            </Button>
          )}
        </CardHeader>

        <CardContent className="flex-1 flex flex-col space-y-4">
          {/* Messages Container */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-4">
            {messages.length === 0 && !currentResponse && (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Brain className="size-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">
                    Chào mừng đến với AI Financial Assistant
                  </h3>
                  <p className="text-muted-foreground">
                    Hỏi tôi bất cứ điều gì về tình hình tài chính của bạn
                  </p>
                </div>
              </div>
            )}

            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.type === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-lg p-4 ${
                    message.type === "user"
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-900"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                  <p
                    className={`text-xs mt-2 ${
                      message.type === "user"
                        ? "text-blue-100"
                        : "text-gray-500"
                    }`}
                  >
                    {message.timestamp.toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            ))}

            {/* Current AI Response */}
            {currentResponse && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg p-4 bg-gray-100 text-gray-900">
                  <div className="flex items-center gap-2 mb-2">
                    <Loader2 className="size-4 animate-spin" />
                    <Badge variant="secondary" className="text-xs">
                      Đang phân tích...
                    </Badge>
                  </div>
                  <p className="whitespace-pre-wrap">{currentResponse}</p>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <Separator />

          {/* Input Form */}
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Textarea
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder={
                shouldBlock
                  ? "Nâng cấp Premium để sử dụng AI Assistant"
                  : "Hỏi về tình hình tài chính của bạn..."
              }
              disabled={isLoading || shouldBlock}
              className="flex-1 min-h-[44px] max-h-[120px] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
            />
            <Button
              type="submit"
              disabled={!question.trim() || isLoading || shouldBlock}
              size="sm"
              className="self-end"
            >
              {isLoading ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Send className="size-4" />
              )}
            </Button>
          </form>

          <p className="text-xs text-muted-foreground text-center">
            Nhấn Enter để gửi, Shift+Enter để xuống dòng
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
