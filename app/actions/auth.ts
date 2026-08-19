"use server"

import { AuthError } from "next-auth"
import { signIn, signOut } from "@/auth"

export async function loginAction(
  prevState: string | null,
  formData: FormData
) {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/",
    })
    return null
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return "Username atau kata sandi salah"
        default:
          return "Terjadi kesalahan"
      }
    }
    throw error
  }
}

export async function signOutAction(formData?: FormData) {
  await signOut({ redirectTo: "/login" })
}
