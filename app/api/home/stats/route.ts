export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { invokeLambdaWithQuery } from "../../../../lib/lambda-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "today";
    const shopId = searchParams.get("shopId");

    console.log("🔀 Invoking Lambda: getHomeStats", { period, shopId });

    // Invoke Lambda function with query parameters
    const queryParams: Record<string, string> = { period };
    if (shopId) {
      queryParams.shopId = shopId;
    }

    const result = await invokeLambdaWithQuery("getHomeStats", queryParams);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching home stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar las estadísticas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
