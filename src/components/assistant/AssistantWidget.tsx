"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Bot, X, Send, Sparkles, ChevronDown } from "lucide-react";

// ─── Tipe Data ────────────────────────────────────────────────────────────────

type MessageRole = "user" | "assistant";

interface ChatMessage {
  role: MessageRole;
  text: string;
  // Timestamp ditambahkan agar tiap bubble bisa menampilkan jam pengiriman
  timestamp: Date;
}

// ─── Konstanta ────────────────────────────────────────────────────────────────

/** Pesan sambutan awal dari asisten saat widget pertama dibuka */
const INITIAL_MESSAGE: ChatMessage = {
  role: "assistant",
  text: "Halo! 👋 Saya **Asisten AI ClassTrack**.\n\nSaya siap bantu kamu soal ruangan, jadwal kelas, status sensor IoT, atau panduan booking. Kamu bisa langsung ketik pertanyaan, atau pilih contoh pertanyaan di bawah ini ya!",
  timestamp: new Date(),
};

/**
 * Quick-reply pills yang tampil di area atas chat.
 * Setiap item langsung mengirim pesan ketika diklik —
 * tidak hanya mengisi input, tapi langsung dispatch ke AI.
 */
const QUICK_REPLIES = [
  "Ruangan kosong mana sekarang?",
  "Bagaimana cara mencari jadwal kelas?",
  "Apa arti status sensor PIR/IR/DHT?",
  "Saya bingung cara booking ruangan.",
] as const;

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Format jam HH:MM dari objek Date */
function formatTime(date: Date): string {
  return date.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * Render teks pesan: ubah \n menjadi <br/> dan **bold** jadi <strong>.
 * Ini cara simpel agar AI bisa pakai line break & bold tanpa library markdown penuh.
 */
function renderText(text: string) {
  // Split per baris dulu, lalu proses inline bold
  const lines = text.split("\n");
  return lines.map((line, lineIdx) => {
    // Proses **bold** di tiap baris
    const parts = line.split(/(\*\*[^*]+\*\*)/g);
    const rendered = parts.map((part, partIdx) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={partIdx} className="font-black">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return <span key={partIdx}>{part}</span>;
    });
    return (
      <span key={lineIdx}>
        {rendered}
        {/* Tambahkan <br/> di antara baris, kecuali baris terakhir */}
        {lineIdx < lines.length - 1 && <br />}
      </span>
    );
  });
}

// ─── Sub-komponen: Typing Indicator ──────────────────────────────────────────

/**
 * Animasi tiga titik yang muncul saat AI sedang "mengetik".
 * Pakai CSS animation staggered biar terlihat natural.
 */
function TypingIndicator() {
  return (
    <div className="flex items-end gap-3 mb-3">
      {/* Avatar AI */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[#3b5fd4] flex items-center justify-center shrink-0 shadow-sm">
        <Bot size={14} className="text-white" />
      </div>
      {/* Bubble titik-titik */}
      <div className="bg-slate-100 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full bg-slate-400"
          style={{ animation: "assistantDot 1.2s ease-in-out infinite 0ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-slate-400"
          style={{ animation: "assistantDot 1.2s ease-in-out infinite 200ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-slate-400"
          style={{ animation: "assistantDot 1.2s ease-in-out infinite 400ms" }}
        />
      </div>
    </div>
  );
}

// ─── Sub-komponen: Message Bubble ─────────────────────────────────────────────

interface MessageBubbleProps {
  message: ChatMessage;
}

/**
 * Satu bubble percakapan. User di kanan (biru gelap), AI di kiri (abu).
 * Masing-masing punya timestamp dan avatar.
 */
function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  if (isUser) {
    return (
      // Wrapper dianimasikan slide-in dari kanan
      <div
        className="flex items-end justify-end gap-2 mb-3"
        style={{ animation: "assistantSlideRight 0.25s ease-out forwards" }}
      >
        <div className="flex flex-col items-end gap-1 max-w-[80%]">
          <div className="bg-[var(--color-primary)] text-white rounded-2xl rounded-br-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm">
            {renderText(message.text)}
          </div>
          {/* Timestamp di bawah bubble */}
          <span className="text-[10px] text-slate-400 pr-1">
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    );
  }

  // Bubble AI — slide dari kiri
  return (
    <div
      className="flex items-end gap-2 mb-3"
      style={{ animation: "assistantSlideLeft 0.25s ease-out forwards" }}
    >
      {/* Avatar AI kecil */}
      <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[#3b5fd4] flex items-center justify-center shrink-0 shadow-sm mb-5">
        <Bot size={14} className="text-white" />
      </div>
      <div className="flex flex-col items-start gap-1 max-w-[85%]">
        <div className="bg-slate-100 text-slate-800 rounded-2xl rounded-bl-sm px-4 py-2.5 text-sm leading-relaxed shadow-sm">
          {renderText(message.text)}
        </div>
        {/* Timestamp di bawah bubble */}
        <span className="text-[10px] text-slate-400 pl-1">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

// ─── Komponen Utama: AssistantWidget ─────────────────────────────────────────

export default function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
  const [inputValue, setInputValue] = useState("");
  const [isTyping, setIsTyping] = useState(false); // Kontrol animasi "AI sedang mengetik"
  const [unreadCount, setUnreadCount] = useState(0); // Badge notif saat widget tutup

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Anchor untuk auto-scroll

  // Auto-focus input setiap kali widget dibuka
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      setUnreadCount(0); // Reset badge saat dibuka
    }
  }, [isOpen]);

  // Auto-scroll ke pesan terbaru setiap kali messages berubah atau typing indicator muncul
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  /**
   * Fungsi utama pengiriman pesan.
   * Menerima teks opsional — kalau ada, pakai itu; kalau tidak, pakai nilai input.
   * Ini yang bikin quick-reply bisa langsung kirim tanpa ketik manual.
   */
  const sendMessage = useCallback(
    async (overrideText?: string) => {
      const textToSend = (overrideText ?? inputValue).trim();
      if (!textToSend || isTyping) return;

      // Tambahkan pesan user ke list percakapan
      const userMessage: ChatMessage = {
        role: "user",
        text: textToSend,
        timestamp: new Date(),
      };

      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInputValue(""); // Kosongkan input setelah kirim
      setIsTyping(true); // Tampilkan typing indicator

      try {
        /**
         * Kirim seluruh riwayat percakapan (multi-turn) ke API,
         * bukan hanya pertanyaan terakhir. Ini biar AI bisa
         * memahami konteks percakapan sebelumnya.
         */
        const res = await fetch("/api/assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            // Payload multi-turn: array semua pesan
            messages: updatedMessages.map((m) => ({
              role: m.role,
              text: m.text,
            })),
            // Pertanyaan terakhir juga dikirim terpisah biar backward-compatible
            question: textToSend,
          }),
        });

        const json = await res.json();

        // Sedikit delay artifisial biar typing indicator tidak langsung hilang
        // (terasa lebih natural, tidak berasa sistem menjawab instan)
        await new Promise((r) => setTimeout(r, 400));

        const answerText =
          typeof json.answer === "string" && json.answer.trim()
            ? json.answer
            : "Maaf, saya tidak bisa memproses pertanyaan itu sekarang. Coba tanyakan hal lain ya!";

        const aiMessage: ChatMessage = {
          role: "assistant",
          text: answerText,
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, aiMessage]);

        // Kalau widget sedang tertutup, tambah badge unread
        if (!isOpen) {
          setUnreadCount((c) => c + 1);
        }
      } catch (err) {
        console.error("[AssistantWidget] Fetch error:", err);
        // Kalau error jaringan, tetap tampilkan pesan fallback dari AI
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            text: "Waduh, sepertinya koneksi ke server bermasalah. Coba refresh halaman dan tanya ulang ya! 🙏",
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsTyping(false);
      }
    },
    [inputValue, isTyping, messages, isOpen]
  );

  /** Submit dari form (tekan Enter atau klik tombol Kirim) */
  function handleFormSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    sendMessage();
  }

  /** Klik quick-reply langsung trigger sendMessage dengan teks pill yang diklik */
  function handleQuickReply(promptText: string) {
    sendMessage(promptText);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      {/*
        Injeksi keyframe CSS untuk animasi typing dots dan bubble slide.
        Tidak pakai file CSS terpisah agar widget ini tetap self-contained.
      */}
      <style>{`
        @keyframes assistantDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes assistantSlideLeft {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes assistantSlideRight {
          from { opacity: 0; transform: translateX(10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes assistantFadeUp {
          from { opacity: 0; transform: translateY(16px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes assistantPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.5); }
          50%       { box-shadow: 0 0 0 7px rgba(16, 185, 129, 0); }
        }
      `}</style>

      {/* ── Posisi fixed di pojok kanan bawah ── */}
      <div className="fixed bottom-6 right-6 z-[250] flex flex-col items-end gap-3">

        {/* ══ PANEL CHAT ══════════════════════════════════════════════════════ */}
        {isOpen && (
          <div
            className="w-[370px] max-w-[calc(100vw-2rem)] rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 flex flex-col"
            style={{
              animation: "assistantFadeUp 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
              // Tinggi maksimum chat panel — biar tidak overflow layar kecil
              maxHeight: "min(600px, calc(100vh - 120px))",
            }}
          >
            {/* ── Header Gradient ─────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-[var(--color-primary)] to-[#2a4bc4] px-4 py-3.5 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                {/* Ikon AI */}
                <div className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-inner">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-sm font-black text-white leading-tight">
                    Asisten AI ClassTrack
                  </p>
                  {/* Status online dengan indikator hijau */}
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                    <span className="text-[10px] text-white/80 font-semibold tracking-wide">
                      Online · Siap Membantu
                    </span>
                  </div>
                </div>
              </div>
              {/* Tombol Tutup */}
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Tutup asisten"
                className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors"
              >
                <X size={15} className="text-white" />
              </button>
            </div>

            {/* ── Quick Reply Pills ────────────────────────────────────────── */}
            <div className="bg-slate-50 border-b border-slate-200 px-4 py-3 shrink-0">
              <p className="text-[9px] font-black uppercase tracking-[0.18em] text-slate-400 mb-2">
                Contoh Pertanyaan
              </p>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REPLIES.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    disabled={isTyping}
                    onClick={() => handleQuickReply(prompt)}
                    className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[10.5px] font-semibold text-slate-600 transition-all hover:border-[var(--color-primary)] hover:text-[var(--color-primary)] hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* ── Area Pesan (Scrollable) ──────────────────────────────────── */}
            <div className="flex-1 overflow-y-auto px-4 py-4 bg-white min-h-0">
              {messages.map((msg, idx) => (
                <MessageBubble key={idx} message={msg} />
              ))}

              {/* Typing indicator — muncul saat isTyping = true */}
              {isTyping && <TypingIndicator />}

              {/*
                Anchor tak terlihat di paling bawah.
                useEffect akan scroll ke sini setiap kali pesan baru masuk.
              */}
              <div ref={messagesEndRef} />
            </div>

            {/* ── Form Input ───────────────────────────────────────────────── */}
            <form
              onSubmit={handleFormSubmit}
              className="border-t border-slate-100 bg-white px-4 py-3 shrink-0"
            >
              <div className="flex items-center gap-2">
                <label htmlFor="assistant-chat-input" className="sr-only">
                  Tanya Asisten AI ClassTrack
                </label>
                <input
                  ref={inputRef}
                  id="assistant-chat-input"
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  disabled={isTyping}
                  placeholder="Tanyakan misal: 'Bagaimana cara booking?'"
                  className="flex-1 min-w-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-[13px] text-slate-700 placeholder:text-slate-400 focus:outline-none focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/20 transition-all disabled:opacity-60"
                />
                {/* Tombol Kirim */}
                <button
                  type="submit"
                  disabled={isTyping || !inputValue.trim()}
                  aria-label="Kirim pesan"
                  className="w-10 h-10 rounded-2xl bg-[var(--color-primary)] flex items-center justify-center shrink-0 transition-all hover:bg-[var(--color-primary-dark)] disabled:opacity-50 disabled:cursor-not-allowed shadow-md hover:shadow-lg"
                >
                  <Send size={15} className="text-white" />
                </button>
              </div>
              {/* Teks kecil di bawah input */}
              <p className="text-[9.5px] text-slate-400 text-center mt-2 font-medium">
                Asisten AI · Diberdayakan oleh ClassTrack IoT Platform
              </p>
            </form>
          </div>
        )}

        {/* ══ FAB BUTTON (Floating Action Button) ═══════════════════════════ */}
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-label={isOpen ? "Tutup asisten AI" : "Buka asisten AI"}
          className="relative inline-flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[#2a4bc4] px-5 py-3 text-sm font-black text-white shadow-xl transition-all hover:shadow-2xl hover:scale-105 active:scale-95"
          style={{ boxShadow: "0 8px 32px rgba(24,49,130,0.35)" }}
        >
          {isOpen ? (
            // Saat widget terbuka, tampilkan chevron turun
            <>
              <ChevronDown size={16} />
              Tutup
            </>
          ) : (
            // Saat widget tertutup, tampilkan ikon sparkles + teks
            <>
              <Sparkles size={15} />
              Asisten AI
              {/* Indikator status hijau — pakai pulse animation */}
              <span
                className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white"
                style={{ animation: "assistantPulse 2s ease-in-out infinite" }}
              />
              {/* Badge unread — muncul kalau ada pesan baru saat widget tutup */}
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center shadow">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </>
          )}
        </button>
      </div>
    </>
  );
}
