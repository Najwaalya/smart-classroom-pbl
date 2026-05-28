"use client";

import Link from "next/link";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [key]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password !== form.confirm) {
      setError("Password dan konfirmasi password tidak cocok.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, emailOrNim: form.email, password: form.password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.message || "Gagal mendaftar.");
        setIsLoading(false);
        return;
      }

      router.push("/login");
    } catch (err) {
      setError("Terjadi kesalahan jaringan.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-slate-50 to-slate-100 flex flex-col font-sans">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 md:px-10 py-6 w-full z-20">
        <Link href="/" className="flex items-center gap-2 text-[#183182] font-bold text-xl">
          <Eye size={22} strokeWidth={2.5} />
          SmartClass
        </Link>
        <button className="flex items-center gap-2 text-[#183182] hover:text-[#122460]" title="Help">
          <HelpCircle size={20} />
        </button>
      </div>

      {/* Main */}
      <div className="flex-1 flex items-center justify-center px-4 md:px-10 pb-10">
        <div className="w-full max-w-6xl rounded-2xl overflow-hidden shadow-2xl bg-white/80 backdrop-blur-xl border border-slate-200">
          <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] min-h-[72vh]">
            {/* Left - form */}
            <div className="p-8 md:p-12 flex items-center justify-center bg-white">
              <div className="w-full max-w-lg">
                <div className="mb-8">
                  <h1 className="text-3xl md:text-4xl font-black text-slate-900">Buat Akun Baru</h1>
                  <p className="mt-3 text-sm text-slate-600">Daftarkan akun baru untuk mengakses dashboard monitoring.</p>
                </div>

                {error && (
                  <div className="mb-6 rounded-2xl bg-red-50 border border-red-200 px-4 py-3 text-sm font-semibold text-red-700">
                    {error}
                  </div>
                )}

                <form className="space-y-5" onSubmit={handleSubmit}>
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Nama Lengkap</label>
                    <input
                      type="text"
                      required
                      value={form.name}
                      onChange={handleChange("name")}
                      placeholder="Masukkan nama lengkap"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#183182] focus:ring-2 focus:ring-[#183182]/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">NIM / Email</label>
                    <input
                      type="text"
                      required
                      value={form.email}
                      onChange={handleChange("email")}
                      placeholder="nim123@polinema.ac.id"
                      className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 text-sm font-semibold text-slate-900 outline-none focus:border-[#183182] focus:ring-2 focus:ring-[#183182]/20"
                    />
                  </div>

                  <div className="grid gap-4 lg:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Password</label>
                      <div className="relative">
                        <input
                          type={showPw ? "text" : "password"}
                          required
                          minLength={6}
                          value={form.password}
                          onChange={handleChange("password")}
                          placeholder="••••••••"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 pr-12 text-sm font-semibold text-slate-900 outline-none focus:border-[#183182] focus:ring-2 focus:ring-[#183182]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                        >
                          {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold uppercase tracking-widest text-slate-600 mb-2">Konfirmasi Password</label>
                      <div className="relative">
                        <input
                          type={showConfirm ? "text" : "password"}
                          required
                          minLength={6}
                          value={form.confirm}
                          onChange={handleChange("confirm")}
                          placeholder="••••••••"
                          className="w-full rounded-2xl border border-slate-200 bg-slate-100 px-5 py-3 pr-12 text-sm font-semibold text-slate-900 outline-none focus:border-[#183182] focus:ring-2 focus:ring-[#183182]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirm((p) => !p)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800"
                        >
                          {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`${isLoading ? "bg-slate-500 cursor-not-allowed" : "bg-[#183182] hover:bg-[#122460]"} w-full rounded-[1.5rem] py-4 text-sm font-black text-white shadow-lg shadow-slate-400/20 transition-all`}
                  >
                    {isLoading ? "Mendaftar..." : "Daftar Akun"}
                  </button>
                </form>

                <p className="mt-6 text-center text-sm text-slate-600">
                  Sudah punya akun?{' '}
                  <Link href="/login" className="font-black text-[#183182] hover:underline">Login di sini</Link>
                </p>
              </div>
            </div>

            {/* Right - image */}
            <div className="relative hidden lg:block bg-[#183182] text-white">
              <div className="absolute inset-0 bg-[url('/images/jti-polinema.jpg')] bg-cover bg-center opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-br from-[#183182]/80 via-[#183182]/60 to-[#0f163a]/80" />
              <div className="relative flex h-full items-center justify-center p-10">
                <div className="max-w-xs text-center">
                  <h2 className="text-2xl font-black">Selamat Datang!</h2>
                  <p className="mt-4 text-sm leading-relaxed text-slate-100/90">Bergabung menjadi pengguna SmartClass untuk memudahkan monitoring ruang kelas dan jadwal secara real-time.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full px-6 md:px-10 py-6 flex flex-col md:flex-row justify-between items-center text-[10px] font-semibold text-slate-500 uppercase tracking-[0.18em] gap-3">
        <div>© 2026 SmartClass. All Rights Reserved.</div>
        <div className="flex gap-4">
          <button className="text-slate-500 hover:text-slate-700">Privacy</button>
          <button className="text-slate-500 hover:text-slate-700">Terms</button>
        </div>
      </div>
    </div>
  );
}
