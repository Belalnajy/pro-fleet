"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function SeedDataPage() {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const seedTemperatures = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/seed-temperatures", {
        method: "POST",
      })
      const data = await response.json()
      setMessage(JSON.stringify(data, null, 2))
    } catch (error) {
      setMessage("Error: " + error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Seed Database</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={seedTemperatures} disabled={loading}>
            {loading ? "Creating..." : "Create Temperature Settings"}
          </Button>
          
          {message && (
            <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
              {message}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
