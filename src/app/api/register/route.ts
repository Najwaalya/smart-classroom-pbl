import { NextResponse } from "next/server";
import { userContainer } from "@/lib/cosmos";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, emailOrNim, password } = body;

    if (!name || !emailOrNim || !password) {
      return NextResponse.json(
        { success: false, message: "Nama, NIM/Email, dan password harus diisi" },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password minimal 6 karakter" },
        { status: 400 }
      );
    }

    const isEmail = emailOrNim.includes("@");
    const id = isEmail ? emailOrNim.toLowerCase() : emailOrNim;
    const querySpec = {
      query: "SELECT * FROM c WHERE c.email = @identifier OR c.nim = @identifier",
      parameters: [{ name: "@identifier", value: emailOrNim }],
    };

    const { resources: existingUsers } = await userContainer.items
      .query(querySpec)
      .fetchAll();

    if (existingUsers.length > 0) {
      return NextResponse.json(
        { success: false, message: "Email atau NIM sudah terdaftar" },
        { status: 409 }
      );
    }

    const newUser = {
      id,
      name,
      password,
      role: "mahasiswa",
      createdAt: new Date().toISOString(),
      ...(isEmail ? { email: emailOrNim.toLowerCase() } : { nim: emailOrNim }),
    };

    await userContainer.items.create(newUser);

    return NextResponse.json({ success: true, message: "Registrasi berhasil" });
  } catch (error) {
    console.error("POST /api/register error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan saat registrasi" },
      { status: 500 }
    );
  }
}
