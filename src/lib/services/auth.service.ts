import { userContainer } from "@/lib/cosmos";

export type UserRole = "admin" | "mahasiswa";

export interface User {
  id: string;
  email?: string;
  nim?: string;
  nip?: string;
  password: string;
  role: UserRole;
  name: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface LoginResponse {
  success: boolean;
  user?: {
    id: string;
    name: string;
    role: UserRole;
    email?: string;
    nim?: string;
    nip?: string;
  };
  message?: string;
}

/**
 * Login user dengan email/NIM dan password
 */
export async function loginUser(
  identifier: string,
  password: string
): Promise<LoginResponse> {
  try {
    // Query untuk mencari user berdasarkan email atau NIM
    const querySpec = {
      query:
        "SELECT * FROM c WHERE (c.email = @identifier OR c.nim = @identifier OR c.nip = @identifier) AND c.password = @password",
      parameters: [
        { name: "@identifier", value: identifier },
        { name: "@password", value: password },
      ],
    };

    const { resources: users } = await userContainer.items
      .query<User>(querySpec)
      .fetchAll();

    if (users.length === 0) {
      return {
        success: false,
        message: "Email/NIM atau password salah",
      };
    }

    const user = users[0];

    return {
      success: true,
      user: {
        id: user.nip || user.nim || user.id,
        name: user.name,
        role: user.role,
        email: user.email,
        nim: user.nim,
        nip: user.nip,
      },
    };
  } catch (error) {
    console.error("Login error:", error);
    return {
      success: false,
      message: "Terjadi kesalahan saat login",
    };
  }
}

/**
 * Get user by ID
 */
export async function getUserById(userId: string): Promise<User | null> {
  try {
    const querySpec = {
      query: "SELECT * FROM c WHERE c.id = @userId OR c.nim = @userId OR c.nip = @userId",
      parameters: [{ name: "@userId", value: userId }],
    };

    const { resources: users } = await userContainer.items
      .query<User>(querySpec)
      .fetchAll();

    return users.length > 0 ? users[0] : null;
  } catch (error) {
    console.error("Get user error:", error);
    return null;
  }
}

/**
 * Change password
 */
export async function changePassword(
  userId: string,
  oldPassword: string,
  newPassword: string
): Promise<{ success: boolean; message: string }> {
  try {
    const user = await getUserById(userId);

    if (!user) {
      return { success: false, message: "User tidak ditemukan" };
    }

    if (user.password !== oldPassword) {
      return { success: false, message: "Password lama salah" };
    }

    // Update password
    user.password = newPassword;
    user.updatedAt = new Date().toISOString();

    await userContainer.item(user.id, user.id).replace(user);

    return { success: true, message: "Password berhasil diubah" };
  } catch (error) {
    console.error("Change password error:", error);
    return { success: false, message: "Gagal mengubah password" };
  }
}

/**
 * Create default users if not exist (untuk development)
 */
export async function seedDefaultUsers() {
  try {
    const defaultUsers: User[] = [
      {
        id: "197805122005011002",
        email: "dosen@gmail.com",
        nip: "197805122005011002",
        password: "197805122005011002",
        role: "admin",
        name: "Dr. Budi Santoso, M.T.",
        createdAt: new Date().toISOString(),
      },
      {
        id: "2341720024",
        nim: "2341720024",
        password: "2341720024",
        role: "mahasiswa",
        name: "Moch. A.B.A",
        createdAt: new Date().toISOString(),
      },
    ];

    for (const user of defaultUsers) {
      const existing = await getUserById(user.id);
      if (!existing) {
        await userContainer.items.create(user);
        console.log(`Created user: ${user.name}`);
      }
    }
  } catch (error) {
    console.error("Seed users error:", error);
  }
}
