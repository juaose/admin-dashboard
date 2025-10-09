export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { invokeLambdaWithPath } from "../../../../../lib/lambda-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = searchParams.get("limit") || "25";
    const type = searchParams.get("type") || "ANY";

    const result = await invokeLambdaWithPath(
      "getPlayerReloads",
      { id: params.id },
      { limit, type }
    );

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
