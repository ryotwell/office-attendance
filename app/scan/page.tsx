import { Building2, MapPin } from "lucide-react"
import Image from "next/image"

import { signOutAction } from "@/app/actions/auth"
import { OfficeMap } from "@/app/components/office-map"
import { QrScanner } from "@/app/components/qr-scanner"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { OFFICE_LOCATION, OFFICE_RADIUS_METERS } from "@/lib/geo"

export default function ScanPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <Image
            src="/assets/logo.png"
            alt="Logo Satak Office Attendance"
            width={80}
            height={80}
            loading="eager"
            className="mx-auto mb-2 h-auto w-auto"
          />
          <CardTitle>{process.env.NEXT_PUBLIC_APP_NAME}</CardTitle>
          <CardDescription>Scan kode QR untuk check in</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Tabs defaultValue="scan" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="scan">Scan QR</TabsTrigger>
              <TabsTrigger value="location">Lokasi</TabsTrigger>
            </TabsList>
            <TabsContent value="scan" className="mt-4">
              <QrScanner />
            </TabsContent>
            <TabsContent value="location" className="mt-4">
              <section aria-labelledby="office-location-title" className="space-y-2">
                <div className="flex items-center gap-2">
                  <MapPin className="size-4 text-primary" />
                  <h2 id="office-location-title" className="text-sm font-medium">
                    Lokasi kantor dan Anda
                  </h2>
                </div>
                <OfficeMap
                  officeLocation={OFFICE_LOCATION}
                  officeRadiusMeters={OFFICE_RADIUS_METERS}
                />
              </section>
            </TabsContent>
          </Tabs>
          <form action={signOutAction}>
            <Button type="submit" variant="destructive" className="w-full">
              Keluar
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
