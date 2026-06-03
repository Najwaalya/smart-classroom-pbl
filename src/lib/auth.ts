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

const users: User[] = [
  {
    email: "admin@gmail.com",
    nip: "197805122005011002",
    password: "197805122005011002",
    role: "admin",
    name: "Sri Whariyanti, S.S.",
  },
  {
    nim: "2341720024",
    password: "2341720024",
    role: "student",
    name: "Moch. A.B.A",
  },
];

export function login(identifier: string, password: string) {
  const user = users.find((u) => {
    // Login admin → email + NIP
    if (u.role === "admin") {
      return (
        u.email === identifier &&
        u.password === password
      );
    }

    // Login student → NIM + NIM
    if (u.role === "student") {
      return (
        u.nim === identifier &&
        u.password === password
      );
    }

    return false;
  });

  if (!user) return null;

  localStorage.setItem("role", user.role);
  localStorage.setItem("userName", user.name);

  if (user.role === "admin") {
    localStorage.setItem("userId", user.nip || "");
  } else {
    localStorage.setItem("userId", user.nim || "");
  }

  // Set role cookie for server-side middleware auth
  if (typeof window !== "undefined") {
    document.cookie = "role=" + user.role + "; path=/; max-age=86400";
  }

  return user;
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

export function changePassword(
  email: string,
  oldPassword: string,
  newPassword: string,
  isForgotPassword: boolean = false
): boolean {
  const user = users.find((u) => u.email === email || u.nim === email);

  if (!user) {
    return false;
  }

  // Jika forgot password, skip verifikasi password lama
  if (!isForgotPassword && user.password !== oldPassword) {
    return false;
  }

  user.password = newPassword;
  return true;
}