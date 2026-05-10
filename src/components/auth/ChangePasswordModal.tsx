"use client";

import { useState } from "react";

import { KeyRound, X } from "lucide-react";

import PasswordInput from "./PasswordInput";

import { changePassword } from "@/lib/auth";

interface ChangePasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ChangePasswordModal({
  isOpen,
  onClose,
}: ChangePasswordModalProps) {
  const [oldPw, setOldPw] = useState("");

  const [newPw, setNewPw] = useState("");

  const [confirmPw, setConfirmPw] = useState("");

  const [error, setError] = useState("");

  const [success, setSuccess] = useState(false);

  function handleSubmit(e: React.FormEvent) {
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

    const email = localStorage.getItem("email") ?? "";

    const ok = changePassword(
      email,
      oldPw,
      newPw
    );

    if (!ok) {
      setError("Password lama salah.");
      return;
    }

    setSuccess(true);

    setTimeout(() => {
      setSuccess(false);

      setOldPw("");
      setNewPw("");
      setConfirmPw("");

      onClose();
    }, 1500);
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">

      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
        onClick={onClose}
      />

      <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">

        {/* HEADER */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">

          <div className="flex items-center gap-2 text-[var(--color-primary)]">
            <KeyRound size={18} />

            <h2 className="text-base font-black">
              Ganti Password
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100"
          >
            <X size={16} />
          </button>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleSubmit}
          className="p-6 flex flex-col gap-4"
        >

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

          {/* ERROR */}
          {error && (
            <p className="text-xs font-bold text-red-500 bg-red-50 px-3 py-2 rounded-lg">
              {error}
            </p>
          )}

          {/* SUCCESS */}
          {success && (
            <p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg">
              Password berhasil diubah!
            </p>
          )}

          <button
            type="submit"
            className="w-full py-3 bg-[var(--color-primary)] text-white text-sm font-black rounded-xl hover:opacity-90 transition-all"
          >
            Simpan Password
          </button>
        </form>
      </div>
    </div>
  );
}