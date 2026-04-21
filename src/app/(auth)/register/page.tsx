"use client";

import Link from "next/link";
import { Eye, EyeOff, HelpCircle, Network } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      setError("Password tidak cocok!");
      return;
    }
    setError("");
    router.push("/");
  };

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  return (
    <div className="min-h-screen bg-gradient-to-tr from-[#f3f9f6] via-[#f7f9fc] to-[#f8f9ff] flex flex-col relative font-sans">

      {/* Top Bar */}
      <div className="flex justify-between items-center px-6 md:px-10 py-6 w-full z-20">
        <Link href="/" className="flex items-center gap-2 text-[#183182] font-bold text-xl tracking-tight">
          <Eye size={22} strokeWidth={2.5} />
          ClassTrack
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-[10px] font-bold text-slate-500 tracking-widest uppercase hidden sm:inline">
            Help Center
          </span>
          <button className="text-[#183182] hover:text-[#0b1740] transition-colors" title="Help">
            <HelpCircle size={20} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-4 md:px-12 pb-6 w-full">
        <div className="w-full max-w-6xl min-h-[75vh] rounded-2xl md:rounded-[2rem] overflow-hidden relative shadow-2xl flex items-center justify-center bg-slate-200">

          {/* Background Image */}
          <div
            className="absolute inset-0 bg-cover bg-center brightness-[1.05] z-0 opacity-90"
            style={{
              backgroundImage:
                "url('https://images.unsplash.com/photo-1541888081198-636c7a6e138a?q=80&w=2070&auto=format&fit=crop')",
            }}
          />
          <div className="absolute inset-0 bg-blue-900/10 mix-blend-overlay z-0" />

          {/* Glass Card */}
          <div className="relative z-10 w-full max-w-2xl px-4 md:px-6 my-8 md:my-10">
            <div className="bg-white/60 backdrop-blur-xl rounded-[2rem] p-6 md:p-12 shadow-2xl border border-white/60 w-full relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-white/50 to-transparent pointer-events-none" />

              <div className="relative z-10">
                <div className="mb-6 md:mb-8 text-center md:text-left">
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-800 tracking-tight">
                    Create Account
                  </h1>
                  <p className="text-sm font-medium text-slate-600 mt-2">
                    Daftarkan akun untuk mengakses dashboard monitoring.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 px-4 py-2.5 bg-red-50 border border-red-200 text-red-600 text-xs font-semibold rounded-xl">
                    {error}
                  </div>
                )}

                <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        placeholder="Dr. Julian Vane"
                        value={form.name}
                        onChange={handleChange("name")}
                        required
                        className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#183182]/50 text-sm font-bold text-slate-800 placeholder:text-slate-500 placeholder:font-medium focus:bg-white/90 transition-all backdrop-blur-md"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">
                        Institutional Email
                      </label>
                      <input
                        type="email"
                        placeholder="vane@academy.edu"
                        value={form.email}
                        onChange={handleChange("email")}
                        required
                        className="w-full px-5 py-3.5 rounded-2xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#183182]/50 text-sm font-bold text-slate-800 placeholder:text-slate-500 placeholder:font-medium focus:bg-white/90 transition-all backdrop-blur-md"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">
                        Password
                      </label>
                      <div className="relative">
                        <input
                          type={showPw ? "text" : "password"}
                          placeholder="••••••••"
                          value={form.password}
                          onChange={handleChange("password")}
                          required
                          minLength={6}
                          className="w-full px-5 py-3.5 pr-10 rounded-2xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#183182]/50 text-sm font-bold text-slate-800 placeholder:font-medium tracking-widest focus:bg-white/90 transition-all backdrop-blur-md"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-2 ml-1">
                        Confirm Password
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          placeholder="••••••••"
                          value={form.confirm}
                          onChange={handleChange("confirm")}
                          required
                          className="w-full px-5 py-3.5 pr-10 rounded-2xl bg-white/50 border border-white/60 focus:outline-none focus:ring-2 focus:ring-[#183182]/50 text-sm font-bold text-slate-800 placeholder:font-medium tracking-widest focus:bg-white/90 transition-all backdrop-blur-md"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-[#183182]/90 backdrop-blur-md text-white rounded-[1.25rem] font-bold text-sm mt-2 hover:bg-[#122460] active:scale-95 transition-all shadow-lg shadow-[#183182]/30"
                  >
                    Create Account
                  </button>
                </form>

                <div className="mt-6 text-center text-xs font-medium text-slate-700">
                  Sudah punya akun?{" "}
                  <Link href="/login" className="text-[#183182] font-bold hover:underline">
                    Sign In
                  </Link>
                </div>

                <div className="mt-6 flex flex-col justify-center items-center gap-3 opacity-70">
                  <span className="text-[8px] font-bold text-slate-700 uppercase tracking-[0.2em]">
                    Enterprise Authentication
                  </span>
                  <div className="w-8 h-8 rounded-full border border-slate-400 flex items-center justify-center backdrop-blur-sm bg-white/30">
                    <Network size={14} className="text-slate-700" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="w-full px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-center text-[9px] font-bold text-slate-400 uppercase tracking-widest z-20 gap-3">
        <div>© 2024 ClassTrack. All Rights Reserved.</div>
        <div className="flex gap-4">
          <button className="hover:text-slate-500 transition-colors">Privacy</button>
          <button className="hover:text-slate-500 transition-colors">Terms</button>
        </div>
      </div>
    </div>
  );
}