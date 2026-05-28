import { NextResponse } from "next/server";
import { userContainer } from "@/lib/cosmos";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();
    const otp = (body.otp || "").trim();
    const newPassword = (body.newPassword || "").trim();

    if (!email || !otp || !newPassword) {
      return NextResponse.json(
        { success: false, message: "Email, OTP, dan password baru harus diisi." },
        { status: 400 }
      );
    }

    if (newPassword.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password minimal 6 karakter." },
        { status: 400 }
      );
    }

    const querySpec = {
      query: "SELECT * FROM c WHERE c.email = @identifier OR c.nim = @identifier",
      parameters: [{ name: "@identifier", value: email }],
    };

    const { resources: users } = await userContainer.items.query(querySpec).fetchAll();

    if (!users.length) {
      return NextResponse.json(
        { success: false, message: "Email atau NIM tidak ditemukan." },
        { status: 404 }
      );
    }

    const user = users[0];

    if (!user.otpCode || !user.otpExpiry) {
      return NextResponse.json(
        { success: false, message: "Kode OTP belum diminta atau sudah kadaluarsa." },
        { status: 400 }
      );
    }

    if (user.otpCode !== otp) {
      return NextResponse.json(
        { success: false, message: "Kode OTP tidak valid." },
        { status: 400 }
      );
    }

    if (new Date(user.otpExpiry).getTime() < Date.now()) {
      return NextResponse.json(
        { success: false, message: "Kode OTP sudah kadaluarsa." },
        { status: 400 }
      );
    }

    await userContainer.items.upsert(
      {
        ...user,
        password: newPassword,
        otpCode: null,
        otpExpiry: null,
        updatedAt: new Date().toISOString(),
      },
      { partitionKey: user.id }
    );

    return NextResponse.json({
      success: true,
      message: "Password berhasil diperbarui.",
    });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      { success: false, message: "Gagal menyimpan password baru." },
      { status: 500 }
    );
  }
}
