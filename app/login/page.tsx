"use client"

import { useActionState, useState } from "react"
import Image from "next/image"
import { ArrowRight, Eye, EyeOff, Loader2 } from "lucide-react"

import { loginAction } from "@/app/actions/auth"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(loginAction, null)
  const [showPassword, setShowPassword] = useState(false)

  return (
    <main className="flex min-h-svh flex-col items-center justify-center bg-zinc-50/60 px-6 py-16">
      <div className="w-full max-w-sm">
        {/* Logo — fokus utama */}
        <div className="mb-12 flex flex-col items-center gap-6">
          <div className="relative flex h-32 w-32 items-center justify-center rounded-full border border-zinc-100">
            <div className="absolute inset-3 rounded-full border border-zinc-100" />
            <Image
              src="/assets/logo.png"
              alt="Satak"
              width={100}
              height={100}
              className="relative object-contain"
              priority
            />
          </div>

          <div className="text-center">
            <h1 className="text-xl font-semibold tracking-tight text-zinc-900">
              {process.env.NEXT_PUBLIC_APP_NAME}
            </h1>
            <p className="mt-1.5 text-sm text-zinc-500">
              Masuk untuk melihat informasi kehadiran Anda
            </p>
          </div>
        </div>

        {/* Form */}
        <Card className="rounded-2xl border-zinc-100 shadow-sm">
          <CardContent className="p-8">
            <form action={formAction}>
              <FieldGroup className="gap-5">
                <Field>
                  <FieldLabel
                    htmlFor="username"
                    className="text-xs font-bold uppercase tracking-wide text-zinc-500"
                  >
                    Nama pengguna
                  </FieldLabel>
                  <Input
                    id="username"
                    name="username"
                    type="text"
                    autoComplete="username"
                    placeholder="Masukkan nama pengguna"
                    className="h-12 rounded-lg border-zinc-200 bg-transparent px-4 text-[15px] shadow-none placeholder:text-zinc-400 focus-visible:border-primary focus-visible:ring-0"
                    required
                  />
                </Field>

                <Field>
                  <FieldLabel
                    htmlFor="password"
                    className="text-xs font-bold uppercase tracking-wide text-zinc-500"
                  >
                    Kata sandi
                  </FieldLabel>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Masukkan kata sandi"
                      className="h-12 rounded-lg border-zinc-200 bg-transparent px-4 pr-11 text-[15px] shadow-none placeholder:text-zinc-400 focus-visible:border-primary focus-visible:ring-0"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={
                        showPassword
                          ? "Sembunyikan kata sandi"
                          : "Tampilkan kata sandi"
                      }
                      className="absolute right-0 top-0 flex h-12 w-11 items-center justify-center text-zinc-400 transition-colors hover:text-primary"
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                </Field>

                {error && (
                  <FieldError className="-mt-1 text-center text-sm">
                    {error}
                  </FieldError>
                )}

                <Button
                  type="submit"
                  disabled={isPending}
                  className="mt-2 h-12 w-full gap-2 rounded-lg bg-primary text-[15px] font-medium text-primary-foreground shadow-none hover:bg-primary/90"
                >
                  {isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sedang masuk...
                    </>
                  ) : (
                    <>
                      Masuk
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </FieldGroup>
            </form>
          </CardContent>
        </Card>
      </div>

      <p className="mt-16 text-xs text-zinc-400">
        Satak Office Attendance · © {new Date().getFullYear()}
      </p>
    </main>
  )
}