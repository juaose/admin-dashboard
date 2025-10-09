export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { invokeLambdaWithQuery } from "../../../../lib/lambda-client";

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

    // For now, use the banks endpoint - can be enhanced later if needed
    const result = await invokeLambdaWithQuery("getDepositsByBank", {
      startDate,
      endDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating bank destination report:", error);
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
