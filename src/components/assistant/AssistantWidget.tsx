"use client";

import { useEffect, useRef, useState } from "react";

type ChatMessage = {
  role: "user" | "assistant";
  text: string;
};

const initialMessages: ChatMessage[] = [
  {
    role: "assistant",
    text: "Halo! Saya Asisten AI ClassTrack. Saya dapat membantu Anda dengan pertanyaan tentang ruangan, jadwal, sensor, atau penggunaan website. Jika Anda tidak paham cara menggunakan aplikasi, cukup tuliskan masalahnya dan saya akan bantu langkah demi langkah.",
  },
];

const suggestedPrompts = [
  "Ruangan kosong mana sekarang?",
  "Bagaimana cara mencari jadwal kelas?",
  "Apa arti status sensor PIR/IR/DHT?",
  "Saya bingung cara booking ruangan.",
];

export default function AssistantWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  async function sendMessage() {
    const trimmed = query.trim();
    if (!trimmed) return;

    const nextMessages = [...messages, { role: "user", text: trimmed }];
    setMessages(nextMessages);
    setQuery("");
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: trimmed }),
      });
      const json = await res.json();

      const answer =
        typeof json.answer === "string"
          ? json.answer
          : "Maaf, saya tidak dapat menjawab saat ini. Coba ulangi lagi dengan pertanyaan berbeda.";

      setMessages((prev) => [...prev, { role: "assistant", text: answer }]);
    } catch (err) {
      console.error("Assistant error:", err);
      setError("Terjadi kesalahan saat memproses pertanyaan. Coba lagi nanti.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Maaf, tidak dapat menghubungkan ke Asisten AI. Silakan coba lagi nanti.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    sendMessage();
  }

  return (
    <div className="fixed bottom-6 right-6 z-[250] flex flex-col items-end">
      {isOpen ? (
        <div className="w-[360px] max-w-[calc(100vw-2rem)] rounded-3xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-900/5">
          <div className="flex items-center justify-between gap-3 border-b border-slate-200 px-4 py-3 bg-slate-50 rounded-t-3xl">
            <div>
              <p className="text-sm font-black text-slate-900">Asisten AI ClassTrack</p>
              <p className="text-xs text-slate-500">Tanya data ruangan, jadwal, sensor, atau minta tutorial penggunaan.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-500 hover:text-slate-900 transition-colors"
            >
              Tutup
            </button>
          </div>

          <div className="space-y-3 border-b border-slate-200 px-4 py-3 bg-slate-50">
            <p className="text-xs uppercase tracking-[0.16em] text-slate-500">Contoh pertanyaan</p>
            <div className="flex flex-wrap gap-2">
              {suggestedPrompts.map((prompt) => (
                <button
                  key={prompt}
                  type="button"
                  onClick={() => {
                    setQuery(prompt);
                    inputRef.current?.focus();
                  }}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          <div className="max-h-[330px] overflow-y-auto px-4 py-3 space-y-3">
            {messages.map((message, index) => (
              <div key={index} className={message.role === "user" ? "text-right" : "text-left"}>
                <div
                  className={`inline-block rounded-2xl px-4 py-3 text-sm leading-6 ${
                    message.role === "user"
                      ? "bg-slate-900 text-white"
                      : "bg-slate-100 text-slate-800"
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
            {error && <div className="text-xs text-rose-600">{error}</div>}
          </div>

          <form onSubmit={handleSubmit} className="border-t border-slate-200 px-4 py-3 bg-white rounded-b-3xl">
            <label htmlFor="assistant-query" className="sr-only">Tanya Asisten AI</label>
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                id="assistant-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Tanyakan misal: 'Bagaimana cara booking ruangan?'"
                className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
              <button
                type="submit"
                disabled={isLoading}
                className="rounded-2xl bg-[var(--color-primary)] px-4 py-3 text-xs font-black text-white uppercase tracking-[.12em] transition hover:bg-slate-900 disabled:opacity-60"
              >
                {isLoading ? "Mengirim..." : "Kirim"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex items-center gap-2 rounded-full bg-[var(--color-primary)] px-4 py-3 text-sm font-black text-white shadow-2xl shadow-slate-900/10 transition hover:bg-slate-900"
        >
          Asisten AI
          <span className="inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-2 ring-white" />
        </button>
      )}
    </div>
  );
}
