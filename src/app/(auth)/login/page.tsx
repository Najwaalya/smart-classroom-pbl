"use client";

import Link from "next/link";
import { Eye, EyeOff, HelpCircle, KeyRound, X, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.scss";
import { login, changePassword } from "@/lib/auth";

// ── Modal Forgot Password ──────────────────────────────────────────────────

type ForgotStep = "email" | "reset" | "success";

function ForgotPasswordModal({ onClose }: { onClose: () => void }) {
  const [step, setStep]         = useState<ForgotStep>("email");
  const [email, setEmail]       = useState("");
  const [newPw, setNewPw]       = useState("");
  const [confirmPw, setConfirm] = useState("");
  const [showNew, setShowNew]   = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [error, setError]       = useState("");

  // Daftar email yang terdaftar (simulasi — cocokkan dengan users di auth.ts)
  const REGISTERED_EMAILS = ["dosen@gmail.com", "mahasiswa@gmail.com"];

  function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (!REGISTERED_EMAILS.includes(email.toLowerCase().trim())) {
      setError("Email tidak terdaftar di sistem.");
      return;
    }
    setStep("reset");
  }

  function handleResetSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (newPw.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }
    if (newPw !== confirmPw) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }
    // Gunakan changePassword dengan password lama kosong (bypass — reset flow)
    // Karena ini reset, kita langsung update tanpa verifikasi password lama
    const ok = changePassword(email, undefined as unknown as string, newPw, true);
    if (!ok) {
      setError("Gagal mengubah password. Coba lagi.");
      return;
    }
    setStep("success");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
          <div className="flex items-center gap-2 text-[#183182]">
            <KeyRound size={18} />
            <h2 className="text-base font-black text-slate-800">
              {step === "email"   && "Lupa Password"}
              {step === "reset"   && "Buat Password Baru"}
              {step === "success" && "Password Diperbarui"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* ── Step 1: Input Email ── */}
        {step === "email" && (
          <form onSubmit={handleEmailSubmit} className="p-6 flex flex-col gap-4">
            <p className="text-sm text-slate-500 leading-relaxed">
              Masukkan email yang terdaftar. Kami akan memverifikasi akun Anda sebelum mengizinkan reset password.
            </p>

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Email Terdaftar
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="name@institution.edu"
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#183182]/30 focus:border-[#183182] transition-all"
              />
            </div>

            {error && (
              <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#183182] text-white text-sm font-black rounded-xl hover:bg-[#122460] transition-all mt-1"
            >
              Verifikasi Email
            </button>
          </form>
        )}

        {/* ── Step 2: Set Password Baru ── */}
        {step === "reset" && (
          <form onSubmit={handleResetSubmit} className="p-6 flex flex-col gap-4">
            <button
              type="button"
              onClick={() => { setStep("email"); setError(""); }}
              className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-slate-700 uppercase tracking-widest w-fit"
            >
              <ArrowLeft size={12} /> Kembali
            </button>

            <div className="px-3 py-2.5 bg-emerald-50 border border-emerald-100 rounded-xl">
              <p className="text-xs font-bold text-emerald-700">
                Email <span className="font-black">{email}</span> terverifikasi.
              </p>
            </div>

            {/* Password Baru */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Password Baru
              </label>
              <div className="relative">
                <input
                  type={showNew ? "text" : "password"}
                  value={newPw}
                  onChange={(e) => setNewPw(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#183182]/30 focus:border-[#183182] transition-all"
                />
                <button type="button" onClick={() => setShowNew(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showNew ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Konfirmasi */}
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1.5">
                Konfirmasi Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPw}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-10 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#183182]/30 focus:border-[#183182] transition-all"
                />
                <button type="button" onClick={() => setShowConfirm(p => !p)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showConfirm ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#183182] text-white text-sm font-black rounded-xl hover:bg-[#122460] transition-all mt-1"
            >
              Simpan Password Baru
            </button>
          </form>
        )}

        {/* ── Step 3: Sukses ── */}
        {step === "success" && (
          <div className="p-6 flex flex-col items-center gap-4 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
              <KeyRound size={28} className="text-emerald-600" />
            </div>
            <div>
              <p className="text-base font-black text-slate-800">Password Berhasil Diubah!</p>
              <p className="text-sm text-slate-500 mt-1">
                Silakan login menggunakan password baru Anda.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-3 bg-[#183182] text-white text-sm font-black rounded-xl hover:bg-[#122460] transition-all"
            >
              Kembali ke Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Halaman Login ──────────────────────────────────────────────────────────

export default function Login() {
  const router = useRouter();
  const [showPw, setShowPw]           = useState(false);
  const [email, setEmail]             = useState("");
  const [password, setPassword]       = useState("");
  const [isForgotOpen, setForgotOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const user = login(email, password);
    if (!user) {
      alert("Email atau password salah!");
      return;
    }
    router.push("/");
  };

  return (
    <div className={styles.container}>
      {isForgotOpen && <ForgotPasswordModal onClose={() => setForgotOpen(false)} />}

      {/* Top Bar */}
      <div className={styles.topBar}>
        <Link href="/" className={styles.logo}>
          ClassTrack
        </Link>
        <button className={styles.helpBtn} title="Help">
          <HelpCircle size={20} />
        </button>
      </div>

      <div className={styles.mainWrapper}>

        {/* Left Side / Form */}
        <div className={styles.leftSide}>
          <div className={styles.formBox}>
            <div className={styles.header}>
              <div className={styles.iconWrapper}>
                <Eye size={20} strokeWidth={2.5} />
              </div>
              <h1 className={styles.title}>ClassTrack</h1>
              <p className={styles.subtitle}>
                Smart Classroom Monitoring System
              </p>
            </div>

            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.inputGroup}>
                <label className={styles.label}>Work Email</label>
                <input
                  type="email"
                  placeholder="name@institution.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.inputGroup}>
                <div className={styles.forgotPasswordWrapper}>
                  <label className={styles.label}>Security Password</label>
                  <button
                    type="button"
                    onClick={() => setForgotOpen(true)}
                    className={styles.forgotPasswordBtn}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPw ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className={`${styles.input} ${styles.inputPassword}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((p) => !p)}
                    className={styles.togglePasswordBtn}
                  >
                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button type="submit" className={styles.submitBtn}>
                Sign In
              </button>
            </form>

            <div className={styles.registerPrompt}>
              New to ClassTrack?{" "}
              <Link href="/register" className={styles.registerLink}>
                Create Account
              </Link>
            </div>
          </div>
        </div>

        {/* Right Side Image Panel */}
        <div className={styles.rightSide}>
          <div className={styles.imageBox}>
            <div className={styles.imageOverlay} />
            <div className={styles.imageGradient} />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className={styles.footer}>
        <div>© 2024 ClassTrack. All Rights Reserved.</div>
        <div className={styles.footerLinks}>
          <button className={styles.footerLink}>Privacy</button>
          <button className={styles.footerLink}>Terms</button>
        </div>
      </div>
    </div>
  );
}
