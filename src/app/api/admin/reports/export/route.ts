import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get("format") || "excel";
  const range = req.nextUrl.searchParams.get("range") || "last30days";

  if (format === "excel") {
    const headers = ["month","revenue","trips","expenses","profit"];
    const rows = [
      ["Jan","10000","200","6000","4000"],
      ["Feb","11500","210","6800","4700"],
      ["Mar","13000","220","7600","5400"],
    ];
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename=reports-${range}.csv`,
      },
    });
  }

  if (format === "pdf") {
    // Placeholder: return a simple text blob as a stub for PDF
    const content = `Reports (${range})\nTotal rows: 3\nGenerated: ${new Date().toISOString()}`;
    return new Response(content, {
      headers: {
        "Content-Type": "application/octet-stream",
        "Content-Disposition": `attachment; filename=reports-${range}.txt`,
      },
    });
  }

  return NextResponse.json({ error: "Unsupported format" }, { status: 400 });
}
