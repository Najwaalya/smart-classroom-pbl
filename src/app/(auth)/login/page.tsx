"use client";

import Link from "next/link";

import {
  Eye,
  HelpCircle,
  AlertTriangle,
  X,
} from "lucide-react";

import { useState } from "react";

import { useRouter } from "next/navigation";

import styles from "./login.module.scss";

import { login } from "@/lib/auth";

import PasswordInput from "@/components/auth/PasswordInput";

import ChangePasswordModal from "@/components/auth/ChangePasswordModal";

export default function Login() {
  const router = useRouter();

  const [identifier, setIdentifier] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [isForgotOpen, setForgotOpen] =
    useState(false);

  const [loginError, setLoginError] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(false);

  // LOGIN — async karena fungsi login sekarang memanggil API Cosmos
  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();
    setIsLoading(true);
    setLoginError(false);

    const user = await login(
      identifier,
      password
    );

    setIsLoading(false);

    // LOGIN GAGAL
    if (!user) {
      setLoginError(true);
      return;
    }

    // LOGIN BERHASIL
    router.push("/dashboard");
  }

  return (
    <div className={styles.container}>

      {/* CHANGE PASSWORD MODAL */}
      <ChangePasswordModal
        isOpen={isForgotOpen}
        mode="forgot"
        onClose={() =>
          setForgotOpen(false)
        }
      />

      {/* LOGIN ERROR MODAL */}
      {loginError && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">

          {/* BACKDROP */}
          <div
            className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            onClick={() =>
              setLoginError(false)
            }
          />

          {/* MODAL */}
          <div className="relative bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden">

            {/* HEADER */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">

              <div className="flex items-center gap-2 text-red-500">

                <AlertTriangle size={18} />

                <h2 className="text-base font-black text-slate-800">
                  Login Gagal
                </h2>
              </div>

              <button
                onClick={() =>
                  setLoginError(false)
                }
                className="p-1.5 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* CONTENT */}
            <div className="p-6 flex flex-col items-center text-center gap-4">

              <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center">

                <AlertTriangle
                  size={28}
                  className="text-red-500"
                />
              </div>

              <div>
                <p className="text-base font-black text-slate-800">
                  NIM / Email atau Password Salah
                </p>

                <p className="text-sm text-slate-500 mt-1 leading-relaxed">
                  Pastikan data login yang
                  kamu masukkan sudah benar
                  dan coba lagi.
                </p>
              </div>

              <button
                onClick={() =>
                  setLoginError(false)
                }
                className="w-full py-3 bg-red-500 text-white text-sm font-black rounded-xl hover:bg-red-600 transition-all"
              >
                Coba Lagi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOP BAR */}
      <div className={styles.topBar}>

        <Link
          href="/"
          className={styles.logo}
        >
          SmartClass
        </Link>

        <button
          className={styles.helpBtn}
          title="Help"
        >
          <HelpCircle size={20} />
        </button>
      </div>

      <div className={styles.mainWrapper}>

        {/* LEFT SIDE */}
        <div className={styles.leftSide}>

          <div className={styles.formBox}>

            {/* HEADER */}
            <div className={styles.header}>

              <div className={styles.iconWrapper}>

                <Eye
                  size={20}
                  strokeWidth={2.5}
                />
              </div>

              <h1 className={styles.title}>
                SmartClass
              </h1>

              <p className={styles.subtitle}>
                Smart Classroom Monitoring
                System
              </p>
            </div>

            {/* FORM */}
            <form
              className={styles.form}
              onSubmit={handleSubmit}
            >

              {/* IDENTIFIER */}
              <div className={styles.inputGroup}>

                <label className={styles.label}>
                  NIM / Email
                </label>

                <input
                  type="text"
                  placeholder="Masukkan NIM atau Email"
                  value={identifier}
                  onChange={(e) =>
                    setIdentifier(
                      e.target.value
                    )
                  }
                  required
                  className={styles.input}
                />
              </div>

              {/* PASSWORD */}
              <div className={styles.inputGroup}>

                <div
                  className={
                    styles.forgotPasswordWrapper
                  }
                >

                  <label
                    className={styles.label}
                  >
                    Password
                  </label>

                  <button
                    type="button"
                    onClick={() =>
                      setForgotOpen(true)
                    }
                    className={
                      styles.forgotPasswordBtn
                    }
                  >
                    Forgot Password?
                  </button>
                </div>

                <PasswordInput
                  label=""
                  value={password}
                  onChange={setPassword}
                />
              </div>

              {/* BUTTON */}
              <button
                type="submit"
                disabled={isLoading}
                className={`${styles.submitBtn} ${isLoading ? "opacity-70 cursor-not-allowed" : ""}`}
              >
                {isLoading ? "Memverifikasi..." : "Sign In"}
              </button>
            </form>
          </div>
        </div>

        {/* RIGHT SIDE IMAGE */}
        <div className={styles.rightSide}>

          <div className={styles.imageBox}>

            <div
              className={
                styles.imageOverlay
              }
            />

            <div
              className={
                styles.imageGradient
              }
            />
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className={styles.footer}>

        <div>
          © 2026 SmartClass.
          All Rights Reserved.
        </div>

        <div
          className={
            styles.footerLinks
          }
        >

          <button
            className={
              styles.footerLink
            }
          >
            Privacy
          </button>

          <button
            className={
              styles.footerLink
            }
          >
            Terms
          </button>
        </div>
      </div>
    </div>
  );
}