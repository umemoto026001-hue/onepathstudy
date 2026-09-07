"use server";

import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function authenticate(
  _prevState: string | undefined,
  formData: FormData,
) {
  const employeeNumber = formData.get("employeeNumber");

  try {
    // A Server Action's redirect() performs a client-side navigation, and a
    // second redirect thrown while rendering the destination (the app
    // layout's mustChangePassword check) is not reliably followed after
    // that — so decide the real destination here, before signIn redirects.
    const user =
      typeof employeeNumber === "string"
        ? await prisma.user.findUnique({
            where: { employeeNumber },
            select: { mustChangePassword: true },
          })
        : null;

    await signIn("credentials", {
      employeeNumber,
      password: formData.get("password"),
      redirectTo: user?.mustChangePassword ? "/change-password" : "/dashboard",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "社員番号またはパスワードが正しくありません。";
        default:
          return "ログインに失敗しました。時間をおいて再度お試しください。";
      }
    }
    throw error;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
