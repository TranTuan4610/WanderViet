import { useEffect, useRef, useState } from "react";
import { Bot, MessageCircle, Phone, X } from "lucide-react";
import { Link } from "@tanstack/react-router";

// ====== CẤU HÌNH LIÊN HỆ WANDERVIET ======
const CONTACT_ITEMS = [
  {
    label: "Zalo",
    href: "https://zalo.me/0865665046",
    type: "external" as const,
    iconBg: "#0B74FF",
    icon: <span className="text-white font-extrabold text-sm leading-none">Z</span>,
    aria: "Mở Zalo",
  },
  {
    label: "Messenger",
    href: "https://www.facebook.com/share/1NFigWzoju/",
    type: "external" as const,
    iconBg: "#7C3AED",
    icon: <MessageCircle className="h-4 w-4 text-white" strokeWidth={2.5} />,
    aria: "Mở Messenger",
  },
  {
    label: "Gọi điện",
    href: "tel:0865665046",
    type: "phone" as const,
    iconBg: "#10B981",
    icon: <Phone className="h-4 w-4 text-white" strokeWidth={2.5} />,
    aria: "Gọi điện thoại 0865665046",
  },
  {
    label: "AI Chat",
    href: "/ai-chat",
    type: "internal" as const,
    iconBg: "linear-gradient(135deg, #F59E0B, #16A34A)",
    icon: <Bot className="h-4 w-4 text-white" strokeWidth={2.5} />,
    aria: "Mở AI Chat WanderViet",
  },
];

export function FloatingContactBubble() {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="fixed bottom-5 right-5 z-[9999] flex flex-col items-end gap-3 md:bottom-8 md:right-8"
    >
      {/* Pill list */}
      <div className="flex flex-col items-end gap-3">
        {CONTACT_ITEMS.map((item, i) => {
          const pillClass =
            "group flex items-center justify-between gap-3 rounded-full pl-5 pr-1.5 text-white shadow-2xl backdrop-blur-md border border-white/10 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97] hover:brightness-110 w-[220px] h-[56px] md:w-[240px] md:h-[64px]";
          const pillStyle = {
            background: "rgba(15, 23, 42, 0.92)",
            transitionDelay: open ? `${i * 50}ms` : "0ms",
            transform: open ? "translateY(0)" : "translateY(12px)",
            opacity: open ? 1 : 0,
            pointerEvents: open ? ("auto" as const) : ("none" as const),
          };
          const inner = (
            <>
              <span className="font-semibold text-[15px] md:text-base">{item.label}</span>
              <span
                className="flex h-11 w-11 items-center justify-center rounded-full md:h-12 md:w-12 shadow-inner"
                style={{ background: item.iconBg }}
              >
                {item.icon}
              </span>
            </>
          );
          if (item.type === "internal") {
            return (
              <Link
                key={item.label}
                to={item.href}
                aria-label={item.aria}
                className={pillClass}
                style={pillStyle}
                onClick={() => setOpen(false)}
              >
                {inner}
              </Link>
            );
          }
          return (
            <a
              key={item.label}
              href={item.href}
              aria-label={item.aria}
              target={item.type === "external" ? "_blank" : undefined}
              rel={item.type === "external" ? "noopener noreferrer" : undefined}
              className={pillClass}
              style={pillStyle}
            >
              {inner}
            </a>
          );
        })}
      </div>

      {/* Main button + collapsed label */}
      <div className="flex items-center gap-3">
        {!open && (
          <span
            className="hidden sm:inline-flex items-center rounded-full px-4 py-2 text-sm font-semibold text-white shadow-lg backdrop-blur-md border border-white/10"
            style={{ background: "rgba(15, 23, 42, 0.92)" }}
          >
            Tư vấn ngay
          </span>
        )}
        <button
          type="button"
          aria-label={open ? "Đóng menu liên hệ" : "Mở menu liên hệ"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full text-white transition-all duration-300 hover:scale-105 active:scale-95 md:h-16 md:w-16"
          style={{
            background: "linear-gradient(135deg, #16A34A, #0EA5E9)",
            boxShadow:
              "0 12px 40px -6px rgba(14, 165, 233, 0.55), 0 0 0 6px rgba(14, 165, 233, 0.12)",
          }}
        >
          {open ? (
            <X className="h-6 w-6" strokeWidth={2.5} />
          ) : (
            <>
              <MessageCircle className="h-6 w-6" strokeWidth={2.3} />
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[11px] font-bold text-white ring-2 ring-white">
                1
              </span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

export default FloatingContactBubble;
