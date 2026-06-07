"use client";

import { useState } from "react";

import { KeyRound, X } from "lucide-react";

import PasswordInput from "./PasswordInput";

import { changePassword } from "@/lib/auth";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "change" | "forgot";
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
  mode = "change",
}: ChangePasswordModalProps) {
  const isForgotMode = mode === "forgot";

  const [identifier, setIdentifier] =
    useState("");

  const [otp, setOtp] = useState("");

  const [oldPw, setOldPw] =
    useState("");

  const [newPw, setNewPw] =
    useState("");

  const [confirmPw, setConfirmPw] =
    useState("");

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  const [step, setStep] = useState(1);

  const [isSubmitting, setIsSubmitting] =
    useState(false);

  function resetForm() {
    setIdentifier("");
    setOtp("");
    setOldPw("");
    setNewPw("");
    setConfirmPw("");
    setError("");
    setSuccess(false);
    setStep(1);
  }

  function handleClose() {
    resetForm();
    onClose();
  }

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");

    if (isForgotMode) {
      if (step === 1) {
        if (!identifier.trim()) {
          setError("Masukkan email atau NIM yang terdaftar.");
          return;
        }

        setIsSubmitting(true);

        try {
          const res = await fetch("/api/auth/forgot-password", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: identifier.trim() }),
          });

          const data = await res.json();

          if (!res.ok) {
            setError(data.message || "Gagal mengirim kode OTP.");
            return;
          }

          setStep(2);
          setSuccess(true);
        } catch {
          setError("Terjadi kesalahan saat mengirim kode OTP.");
        } finally {
          setIsSubmitting(false);
        }

        return;
      }

      if (!otp.trim()) {
        setError("Masukkan kode OTP dari email Anda.");
        return;
      }

      if (newPw.length < 6) {
        setError("Password minimal 6 karakter.");
        return;
      }

      if (newPw !== confirmPw) {
        setError("Konfirmasi password tidak cocok.");
        return;
      }

      setIsSubmitting(true);

      try {
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: identifier.trim(),
            otp: otp.trim(),
            newPassword: newPw,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Gagal menyimpan password baru.");
          return;
        }

        setSuccess(true);
        setTimeout(() => {
          handleClose();
        }, 1500);
      } catch {
        setError("Terjadi kesalahan saat menyimpan password baru.");
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    if (newPw.length < 6) {
      setError("Password minimal 6 karakter.");
      return;
    }

    if (newPw !== confirmPw) {
      setError("Konfirmasi password tidak cocok.");
      return;
    }

    const currentIdentifier =
      localStorage.getItem("email") ||
      localStorage.getItem("userId") ||
      "";

    const ok = await changePassword(
      currentIdentifier,
      oldPw,
      newPw
    );

    if (!ok) {
      setError("Password lama salah.");
      return;
    }

    setSuccess(true);
    setTimeout(() => {
      handleClose();
    }, 1500);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      {/* BACKDROP */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={handleClose}
      />

      {/* MODAL */}
      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">

          <div className="flex items-center gap-2 text-[var(--color-primary)]">

            <KeyRound size={18} />

            <h2 className="text-base font-black">
              {isForgotMode ? "Lupa Password" : "Ganti Password"}
            </h2>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6 flex flex-col gap-4"
        >
          {isForgotMode && (
            <div className="text-xs text-slate-500 bg-slate-50 rounded-xl p-3">
              Langkah {step} dari 2: {step === 1 ? "Masukkan email atau NIM yang terdaftar." : "Verifikasi kode OTP lalu buat password baru."}
            </div>
          )}

          {isForgotMode && step === 1 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-700">
                Masukkan Email atau NIM Terdaftar
              </label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="contoh: 2341720024 atau user@mail.com"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
              />
            </div>
          )}

          {isForgotMode && step === 2 && (
            <>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700">
                  Masukkan Kode OTP dari Email
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Contoh: 123456"
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-0 transition focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary)]/10"
                />
              </div>

              <PasswordInput
                label="Password Baru"
                value={newPw}
                onChange={setNewPw}
              />

              <PasswordInput
                label="Konfirmasi Password Baru"
                value={confirmPw}
                onChange={setConfirmPw}
              />
            </>
          )}

          {!isForgotMode && (
            <>
              <PasswordInput
                label="Password Lama"
                value={oldPw}
                onChange={setOldPw}
              />

              <PasswordInput
                label="Password Baru"
                value={newPw}
                onChange={setNewPw}
              />

              <PasswordInput
                label="Konfirmasi Password Baru"
                value={confirmPw}
                onChange={setConfirmPw}
              />
            </>
          )}

          {/* ERROR */}
          {error && (
            <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* SUCCESS */}
          {success && (
            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
              {isForgotMode
                ? (step === 1 ? "Kode verifikasi telah dipersiapkan. Silakan lanjutkan ke langkah berikutnya." : "Password berhasil diubah!")
                : "Password berhasil diubah!"}
            </p>
          )}

          {/* BUTTON */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-[var(--color-primary)] text-white text-sm font-black rounded-xl hover:opacity-90 transition-all disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting
              ? "Memproses..."
              : isForgotMode
                ? (step === 1 ? "Kirim Kode Verifikasi ke Email" : "Simpan Password Baru")
                : "Simpan Password"}
          </button>
        </form>
      </div>
    </div>
  );
}