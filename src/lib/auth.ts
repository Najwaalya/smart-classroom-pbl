type User = {
  email: string;
  password: string;
  role: "dosen" | "mahasiswa";
};

const users: User[] = [
  {
    email: "dosen@gmail.com",
    password: "123456",
    role: "dosen",
  },
  {
    email: "mahasiswa@gmail.com",
    password: "123456",
    role: "mahasiswa",
  },
];

export function login(email: string, password: string) {
  const user = users.find(
    (u) => u.email === email && u.password === password
  );

  if (!user) return null;

  localStorage.setItem("role", user.role);
  localStorage.setItem("email", user.email);

  return user;
}

export function getRole() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("role");
}

export function logout() {
  localStorage.clear();
}