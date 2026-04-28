export type UserRole = "dosen" | "mahasiswa";

export type User = {
  email: string;
  password: string;
  role: UserRole;
  name: string;
  id: string; // NIP untuk dosen, NIM untuk mahasiswa
};

const users: User[] = [
  {
    email: "dosen@gmail.com",
    password: "123456",
    role: "dosen",
    name: "Dr. Budi Santoso, M.T.",
    id: "197805122005011002",
  },
  {
    email: "mahasiswa@gmail.com",
    password: "123456",
    role: "mahasiswa",
    name: "Moch. A.B.A",
    id: "2341720024",
  },
];

export function login(email: string, password: string) {
  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) return null;

  localStorage.setItem("role", user.role);
  localStorage.setItem("email", user.email);
  localStorage.setItem("userName", user.name);
  localStorage.setItem("userId", user.id);

  return user;
}

export function getRole(): UserRole | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role") as UserRole | null;
}

export function getUserInfo(): { name: string; id: string; role: UserRole } | null {
  if (typeof window === "undefined") return null;
  const role = localStorage.getItem("role") as UserRole | null;
  const name = localStorage.getItem("userName");
  const id   = localStorage.getItem("userId");
  if (!role || !name || !id) return null;
  return { role, name, id };
}

export function changePassword(email: string, oldPassword: string, newPassword: string, isReset = false): boolean {
  const user = users.find((u) => u.email === email);
  if (!user) return false;
  // Mode reset (dari forgot password): bypass cek password lama
  if (!isReset && user.password !== oldPassword) return false;
  user.password = newPassword;
  return true;
}

export function logout() {
  localStorage.clear();
}
