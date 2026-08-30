"use client"

import { useActionState } from "react"
import Image from "next/image"
import { LockKeyhole, UserRound, LogIn, ShieldCheck } from "lucide-react"

import { loginAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(loginAction, null)

  return (
    <main className="relative flex min-h-svh items-center justify-center overflow-hidden bg-gradient-to-br from-blue-50 via-white to-blue-100 p-5">
      <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl" />
      <div className="absolute -bottom-32 -right-32 h-80 w-80 rounded-full bg-green-200/40 blur-3xl" />

      <Card className="relative w-full max-w-md rounded-3xl border-none bg-white/90 shadow-xl backdrop-blur">
        <CardHeader className="space-y-5 text-center">
          <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-blue-50 shadow-inner">
            <Image src="/assets/logo.png" alt="Logo" width={70} height={70} className="object-contain" />
          </div>

          <div>
            <CardTitle className="text-2xl font-bold text-gray-800">
              {process.env.NEXT_PUBLIC_APP_NAME}
            </CardTitle>
            <CardDescription className="mt-2 text-base">
              Silakan masuk untuk melihat informasi Anda
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <form action={formAction} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username" className="text-base">
                  Nama Pengguna
                </FieldLabel>
                <div className="relative">
                  <UserRound className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Masukkan nama pengguna"
                    className="h-14 rounded-xl pl-12 text-base"
                    required
                  />
                </div>
              </Field>

              <Field>
                <FieldLabel htmlFor="password" className="text-base">
                  Kata Sandi
                </FieldLabel>
                <div className="relative">
                  <LockKeyhole className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    placeholder="Masukkan kata sandi"
                    className="h-14 rounded-xl pl-12 text-base"
                    required
                  />
                </div>
              </Field>
            </FieldGroup>

            {error && <FieldError className="text-center">{error}</FieldError>}

            <Button
              type="submit"
              disabled={isPending}
              className="h-14 w-full gap-3 rounded-xl text-lg font-semibold shadow-md"
            >
              {isPending ? (
                "Sedang masuk..."
              ) : (
                <>
                  <LogIn className="h-5 w-5" />
                  Masuk
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      <footer className="absolute bottom-8 flex flex-col items-center gap-1 text-center text-sm text-muted-foreground">
        <span className="font-medium">Satak Office Attendance</span>
        <span>© {new Date().getFullYear()} Satak Saas</span>
      </footer>
    </main>
  )
}