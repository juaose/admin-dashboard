export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { dalGet } from "../../../../lib/dal-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get("period") || "today";
    const shopId = searchParams.get("shopId");

    console.log("🔀 Calling DAL API: /api/v1/stats", { period, shopId });

    // Call DAL API with query parameters
    const queryParams: Record<string, string> = { period };
    if (shopId) {
      queryParams.shopId = shopId;
    }

    const result = await dalGet("/api/v1/stats", queryParams);

    return NextResponse.json(result, {
      headers: {
        "Cache-Control":
          "no-store, no-cache, must-revalidate, proxy-revalidate",
        Pragma: "no-cache",
        Expires: "0",
      },
    });
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
