export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dalGet } from "../../../../lib/dal-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: "Se requieren fechas de inicio y fin" },
        { status: 400 }
      );
    }

    // Group by ORIGIN bank (where deposit came from)
    const result = await dalGet("/api/v1/credits/deposits/by-bank", {
      startDate,
      endDate,
      groupBy: "origin",
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating bank source report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
