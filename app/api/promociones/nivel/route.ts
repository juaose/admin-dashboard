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

    const result = await invokeLambdaWithQuery("getPromotionsByTier", {
      startDate,
      endDate,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error generating bonus tier report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de niveles de bonificación",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
