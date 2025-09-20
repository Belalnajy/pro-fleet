"use client"

import Link from "next/link"
import { useState, use } from "react"
import { DashboardLayout } from "@/components/layout/dashboard-layout"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { Download, Upload } from "lucide-react"

export default function ImportsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = use(params)
  const [file, setFile] = useState<File | null>(null)
  const [dataset, setDataset] = useState<"vehicles" | "pricing">("vehicles")
  const [uploading, setUploading] = useState(false)

  const handleUpload = async () => {
    if (!file) return
    setUploading(true)
    try {
      const form = new FormData()
      form.append("file", file)
      const res = await fetch(`/api/imports/${dataset}` , { method: "POST", body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json?.error || "Upload failed")
      alert(`Imported ${json.count} record(s) successfully`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Data Imports</h1>
          <p className="text-muted-foreground">Download templates and upload Excel/CSV to import data in bulk.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Templates</CardTitle>
            <CardDescription>Download CSV templates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap gap-3">
              <Link href="/templates/trips.csv" className="inline-flex">
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2"/>Trips.csv</Button>
              </Link>
              <Link href="/templates/drivers.csv" className="inline-flex">
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2"/>Drivers.csv</Button>
              </Link>
              <Link href="/templates/vehicles.csv" className="inline-flex">
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2"/>Vehicles.csv</Button>
              </Link>
              <Link href="/templates/customers.csv" className="inline-flex">
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2"/>Customers.csv</Button>
              </Link>
              <Link href="/templates/pricing.csv" className="inline-flex">
                <Button variant="outline" size="sm"><Download className="h-4 w-4 mr-2"/>Pricing.csv</Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upload</CardTitle>
            <CardDescription>Upload Excel (.xlsx) or CSV</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label>Dataset</Label>
              <div className="flex gap-3 mt-1">
                <Button type="button" variant={dataset === "vehicles" ? "default" : "outline"} size="sm" onClick={() => setDataset("vehicles")}>Vehicles</Button>
                <Button type="button" variant={dataset === "pricing" ? "default" : "outline"} size="sm" onClick={() => setDataset("pricing")}>Pricing</Button>
              </div>
            </div>
            <div>
              <Label htmlFor="file">Choose file</Label>
              <Input id="file" type="file" accept=".csv,.xlsx" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <Button onClick={handleUpload} disabled={!file || uploading}>
              <Upload className="h-4 w-4 mr-2"/>
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </CardContent>
        </Card>

        <Separator />
        <p className="text-sm text-muted-foreground">Note: Full parsing, validation, and transactional import will be added next.</p>
      </div>
    </DashboardLayout>
  )
}
