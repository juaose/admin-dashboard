import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    // Require search term - no prepopulation
    if (!search || search.trim().length < 2) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
        message: "Ingrese al menos 2 caracteres para buscar",
      });
    }

    // Import lotto-core DAL to access players
    const { playersClueHandler } = await import("@juaose/lotto-core");

    // Use the clue handler for smart search
    const searchResults = await playersClueHandler(search, true, true);
    const players = searchResults || [];

    // Sort by premayor_acc
    players.sort((a: any, b: any) => a.premayor_acc - b.premayor_acc);

    // Limit to 20 results for performance
    const limitedPlayers = players.slice(0, 20);

    return NextResponse.json({
      success: true,
      data: limitedPlayers,
      count: limitedPlayers.length,
      totalMatches: players.length,
    });
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar jugadores",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
