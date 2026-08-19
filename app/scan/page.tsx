import { Building2 } from "lucide-react"
import Image from "next/image"

import { QrScanner } from "@/app/components/qr-scanner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { signOutAction } from "@/app/actions/auth"

export default function ScanPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <Image
            src="/assets/logo.png"
            alt="Satak Office Attendance logo"
            width={48}
            height={48}
            className="mx-auto mb-2 h-auto w-auto"
          />
          <CardTitle>Scan Attendance</CardTitle>
          <CardDescription>Scan your employee QR to check in</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <QrScanner />
          <form action={signOutAction}>
            <Button type="submit" variant="outline" className="w-full">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Building2 className="size-3.5" />
        Satak Office Attendance
      </p>
    </div>
  )
}
