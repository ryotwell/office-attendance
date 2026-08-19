"use client"

import { useActionState } from "react"

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
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img
            src="/assets/logo.png"
            alt="Satak Office"
            className="mx-auto mb-2 h-12 w-auto"
          />
          <CardTitle>Satak Office</CardTitle>
          <CardDescription>Masuk ke akun Anda</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="username">Username</FieldLabel>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  placeholder="nama.pengguna"
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="password">Kata Sandi</FieldLabel>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  required
                />
              </Field>
            </FieldGroup>
            {error && <FieldError>{error}</FieldError>}
            <Button type="submit" className="w-full" disabled={isPending}>
              {isPending ? "Masuk…" : "Masuk"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}