export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dalGet } from "../../../../../lib/dal-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limitPerBank = searchParams.get("limitPerBank") || "25";

    const result = await dalGet("/api/v1/credits/by-player", {
      playerId: params.id,
      limitPerBank,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching player credits:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar depósitos del jugador",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
