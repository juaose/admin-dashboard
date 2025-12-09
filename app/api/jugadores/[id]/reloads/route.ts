export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dalGet } from "../../../../../lib/dal-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "25";
    const type = searchParams.get("type") || "0"; // 0 = ANY

    const result = await dalGet("/api/v1/reloads/recent", {
      premayor_acc: params.id,
      limit,
      reloadTypeFilter: type,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching player reloads:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar recargas del jugador",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
