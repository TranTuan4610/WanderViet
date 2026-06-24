import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Bot, Send, User } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";

export const Route = createFileRoute("/ai-chat")({
  head: () => ({
    meta: [
      { title: "AI Chat WanderViet - Trợ lý du lịch thông minh" },
      {
        name: "description",
        content:
          "Trợ lý AI hỗ trợ tư vấn du lịch, đặt tour và giải đáp thắc mắc cho khách hàng WanderViet.",
      },
    ],
  }),
  component: AIChatPage,
});

type Msg = { id: string; role: "user" | "assistant"; content: string };

const GREETING: Msg = {
  id: "greet",
  role: "assistant",
  content:
    "Xin chào 👋 Tôi là trợ lý AI của WanderViet. Bạn muốn tư vấn tour, lịch trình, chi phí hay đặt dịch vụ du lịch?",
};

const SUGGESTIONS = [
  "Gợi ý tour nổi bật",
  "Giá tour Đà Nẵng 3N2Đ",
  "Cách thanh toán online",
  "Liên hệ tư vấn viên",
];

// Mock AI – dễ thay thế bằng API thật sau này
async function mockAIReply(prompt: string): Promise<string> {
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 600));
  const q = prompt.toLowerCase();
  if (/(xin chào|hello|hi|chào)/.test(q))
    return "Chào bạn! WanderViet có thể giúp gì cho chuyến đi sắp tới của bạn? 🌿";
  if (/(tour|lịch trình|du lịch|đi đâu)/.test(q))
    return "WanderViet đang có nhiều tour nổi bật: Hà Giang mùa hoa tam giác mạch, Đà Nẵng – Hội An 3N2Đ, Phú Quốc nghỉ dưỡng, Sapa săn mây. Bạn quan tâm điểm đến nào để mình gợi ý chi tiết?";
  if (/(giá|chi phí|bao nhiêu|cost|price)/.test(q))
    return "Giá tour phụ thuộc vào lịch trình, ngày khởi hành và số lượng khách. Bạn vui lòng để lại số điện thoại hoặc gọi 0865665046 để được tư vấn chính xác nhất nhé!";
  if (/(thanh toán|chuyển khoản|payment|sepay)/.test(q))
    return "WanderViet hỗ trợ thanh toán online qua chuyển khoản ngân hàng (xác nhận tự động qua SePay). Bạn có thể đặt và thanh toán ngay trên website một cách an toàn.";
  if (/(khách sạn|hotel|nghỉ dưỡng|resort)/.test(q))
    return "Mình có thể giúp bạn tìm khách sạn từ 3–5 sao tại Đà Nẵng, Nha Trang, Phú Quốc, Hà Nội… Bạn dự định đi vào ngày nào và mấy người ạ?";
  if (/(xe|thuê xe|ô tô|xe máy|rental)/.test(q))
    return "Bạn có thể thuê xe máy hoặc ô tô tự lái/có tài tại nhiều thành phố. Tham khảo trang Thuê xe của WanderViet để xem giá theo ngày nhé.";
  if (/(vé máy bay|flight|chuyến bay)/.test(q))
    return "WanderViet có vé máy bay nội địa và quốc tế giá tốt. Bạn cho mình biết điểm đi – điểm đến và ngày bay nhé!";
  if (/(liên hệ|hotline|sđt|số điện thoại|contact)/.test(q))
    return "Bạn có thể liên hệ WanderViet qua hotline/Zalo: 0865665046. Đội ngũ tư vấn viên hỗ trợ 24/7 nhé!";
  if (/(việt nam|hà nội|sài gòn|đà nẵng|huế|sapa|hạ long|phú quốc|nha trang|hội an|hà giang)/.test(q))
    return "Đây là điểm đến rất được yêu thích! WanderViet có nhiều lựa chọn tour và combo cho địa điểm này. Bạn muốn đi mấy ngày và ngân sách khoảng bao nhiêu?";
  return "Cảm ơn bạn đã nhắn 💚 Mình đã ghi nhận yêu cầu. Để được tư vấn chi tiết nhất, bạn có thể gọi/Zalo 0865665046 hoặc mô tả rõ hơn về chuyến đi mong muốn nhé!";
}

function AIChatPage() {
  const [messages, setMessages] = useState<Msg[]>([GREETING]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const reply = await mockAIReply(trimmed);
      setMessages((m) => [
        ...m,
        { id: crypto.randomUUID(), role: "assistant", content: reply },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/40 py-10 px-4">
        <div className="mx-auto max-w-3xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full text-white shadow-lg"
              style={{ background: "linear-gradient(135deg, #16A34A, #0EA5E9)" }}>
              <Bot className="h-7 w-7" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">AI Chat WanderViet</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Trợ lý AI hỗ trợ tư vấn du lịch, đặt tour và giải đáp thắc mắc cho khách hàng.
            </p>
          </div>

          <div className="rounded-2xl border bg-card shadow-xl overflow-hidden flex flex-col h-[70vh]">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  <div
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white ${
                      m.role === "user" ? "bg-primary" : ""
                    }`}
                    style={
                      m.role === "assistant"
                        ? { background: "linear-gradient(135deg, #16A34A, #0EA5E9)" }
                        : undefined
                    }
                  >
                    {m.role === "user" ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted text-foreground rounded-tl-sm"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-white"
                    style={{ background: "linear-gradient(135deg, #16A34A, #0EA5E9)" }}
                  >
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="rounded-2xl bg-muted px-4 py-3 text-sm">
                    <span className="inline-flex gap-1">
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.3s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50 [animation-delay:-0.15s]" />
                      <span className="h-2 w-2 animate-bounce rounded-full bg-foreground/50" />
                    </span>
                  </div>
                </div>
              )}
            </div>

            {messages.length <= 1 && (
              <div className="flex flex-wrap gap-2 px-4 pb-3 sm:px-6">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => send(s)}
                    className="rounded-full border bg-background px-3 py-1.5 text-xs text-foreground transition hover:bg-accent hover:scale-[1.03]"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}

            <form
              onSubmit={(e) => {
                e.preventDefault();
                send(input);
              }}
              className="border-t bg-background/60 p-3 sm:p-4 flex items-center gap-2"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Nhập câu hỏi của bạn..."
                className="flex-1 rounded-full border bg-background px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-primary/40"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                aria-label="Gửi"
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-white shadow-md transition hover:scale-105 active:scale-95 disabled:opacity-50"
                style={{ background: "linear-gradient(135deg, #16A34A, #0EA5E9)" }}
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </PageTransition>
  );
}
