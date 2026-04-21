"use client";

import Link from "next/link";
import { Eye, EyeOff, HelpCircle } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import styles from "./login.module.scss";

export default function Login() {
  const router = useRouter();
  const [showPw, setShowPw] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app: call API. For now just navigate to dashboard.
    router.push("/");
  };

  return (
    <div className={styles.container}>

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
                <label className={styles.label}>
                  Work Email
                </label>
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
                  <label className={styles.label}>
                    Security Password
                  </label>
                  <button
                    type="button"
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

              <button
                type="submit"
                className={styles.submitBtn}
              >
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

        {/* Right Side Image Panel (Hidden on mobile) */}
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
