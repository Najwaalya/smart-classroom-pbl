import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { userContainer } from "@/lib/cosmos";

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email || "").trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Alamat email harus diisi." },
        { status: 400 }
      );
    }

    if (!email.includes("@")) {
      return NextResponse.json(
        { success: false, message: "Harap masukkan alamat email yang terdaftar." },
        { status: 400 }
      );
    }

    const querySpec = {
      query: "SELECT * FROM c WHERE c.email = @identifier",
      parameters: [{ name: "@identifier", value: email }],
    };

    const { resources: users } = await userContainer.items.query(querySpec).fetchAll();

    if (!users.length) {
      console.error("OTP send failed: email not found in Cosmos DB", { email });
      return NextResponse.json(
        { success: false, message: "Alamat email tidak ditemukan di database." },
        { status: 404 }
      );
    }

    const user = users[0];

    if (!user.email) {
      console.error("OTP send failed: user has no email field", { userId: user.id });
      return NextResponse.json(
        { success: false, message: "Akun ini tidak memiliki alamat email untuk pengiriman OTP." },
        { status: 400 }
      );
    }
    const otp = generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    await userContainer.items.upsert(
      {
        ...user,
        otpCode: otp,
        otpExpiry: expiry,
        updatedAt: new Date().toISOString(),
      },
      { partitionKey: user.id } as any
    );

    const emailUser = process.env.EMAIL_SERVER_USER;
    const emailPass = process.env.EMAIL_SERVER_PASSWORD;

    if (!emailUser || !emailPass) {
      console.error("OTP send failed: SMTP credentials are missing", {
        hasEmailUser: Boolean(emailUser),
        hasEmailPass: Boolean(emailPass),
      });
      return NextResponse.json(
        { success: false, message: "Konfigurasi SMTP email belum tersedia di environment." },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: emailUser,
        pass: emailPass,
      },
    });

    await transporter.verify();

    const mailOptions = {
      from: emailUser,
      to: user.email,
      subject: "Kode OTP Reset Password SmartClass",
      html: `
        <div style="font-family: Arial, sans-serif; color: #0f172a; line-height: 1.5;">
          <h2 style="color: #0f766e;">Reset Password SmartClass</h2>
          <p>Anda meminta kode verifikasi untuk mengatur ulang password.</p>
          <p>Kode OTP Anda adalah:</p>
          <div style="font-size: 28px; font-weight: 700; letter-spacing: 4px; color: #111827; background: #ecfeff; padding: 12px 16px; border-radius: 10px; display: inline-block;">${otp}</div>
          <p>Kode ini berlaku selama 10 menit.</p>
          <p>Jika Anda tidak meminta reset password, abaikan email ini.</p>
        </div>
      `,
      text: `Reset Password SmartClass\nKode OTP Anda: ${otp}\nKode ini berlaku selama 10 menit.`,
    };

    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Kode OTP telah dikirim ke email Anda.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString(),
    });
    return NextResponse.json(
      { success: false, message: "Gagal mengirim kode OTP. Lihat terminal untuk detail error." },
      { status: 500 }
    );
  }
}
