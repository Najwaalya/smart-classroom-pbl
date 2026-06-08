export type UserRole = "admin" | "student";

export type User = {
  email?: string;
  nim?: string;
  nip?: string;
  password: string;
  role: UserRole;
  name: string;
  class?: string;
};

/**
 * Login — memanggil API /api/auth/login yang terhubung ke CosmosDB.
 * Mengembalikan object user jika berhasil, null jika gagal.
 */
export async function login(identifier: string, password: string): Promise<User | null> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    const data = await res.json();

    if (!res.ok || !data.success || !data.user) {
      return null;
    }

    const user = data.user as {
      id: string;
      name: string;
      role: UserRole;
      email?: string;
      nim?: string;
      nip?: string;
      class?: string;
    };

    // Simpan ke localStorage agar getRole() / getUserInfo() bisa membacanya
    localStorage.setItem("role",     user.role);
    localStorage.setItem("userName", user.name);
    localStorage.setItem("userId",   user.nip ?? user.nim ?? user.id);

    if (user.class) {
      localStorage.setItem("userClass", user.class);
    }

    // Set cookie role untuk middleware server-side
    document.cookie = `role=${user.role}; path=/; max-age=86400`;

    return {
      role:     user.role,
      name:     user.name,
      password: "",          // tidak perlu disimpan di client
      email:    user.email,
      nim:      user.nim,
      nip:      user.nip,
      class:    user.class,
    };
  } catch (err) {
    console.error("[auth] login error:", err);
    return null;
  }
}


export function getRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem("role");
  if (role === "dosen") {
    localStorage.setItem("role", "admin");
    return "admin";
  }
  return role as UserRole | null;
}

export function getUserInfo(): {
  name: string;
  id: string;
  role: UserRole;
} | null {
  if (typeof window === "undefined") return null;

  const role = localStorage.getItem("role") as UserRole | null;
  const name = localStorage.getItem("userName");
  const id = localStorage.getItem("userId");

  if (!role || !name || !id) return null;

  return { role, name, id };
}

export function logout() {
  localStorage.clear();
  // Clear role cookie
  if (typeof window !== "undefined") {
    document.cookie = "role=; path=/; max-age=0";
  }
}

/**
 * Ganti password via API (terhubung ke CosmosDB).
 * isForgotPassword=true → skip verifikasi password lama.
 */
export async function changePassword(
  email: string,
  oldPassword: string,
  newPassword: string,
  isForgotPassword: boolean = false
): Promise<boolean> {
  try {
    const endpoint = isForgotPassword
      ? "/api/auth/reset-password"
      : "/api/auth/reset-password";

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        identifier: email,
        oldPassword: isForgotPassword ? undefined : oldPassword,
        newPassword,
        isForgotPassword,
      }),
    });

    const data = await res.json();
    return res.ok && data.success === true;
  } catch (err) {
    console.error("[auth] changePassword error:", err);
    return false;
  }
}