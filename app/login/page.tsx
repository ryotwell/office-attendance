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
import { Building2 } from "lucide-react"

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(loginAction, null)

  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <img
            src="/assets/logo.png"
            alt="Satak Office"
            className="mx-auto mb-2 h-12 w-auto"
          />
          <CardTitle className="text-xl font-bold">{process.env.NEXT_PUBLIC_APP_NAME}</CardTitle>
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

      <footer className="absolute bottom-16 flex flex-col items-center gap-1 text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          <span>Satak Office Attendance</span>
        </div>

        <span>
          © {new Date().getFullYear()} Satak Saas. All rights reserved.
        </span>
      </footer>
    </div>
  )
}