import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const premayor_acc = parseInt(params.id);

    if (isNaN(premayor_acc)) {
      return NextResponse.json(
        {
          success: false,
          error: "ID de jugador inválido",
        },
        { status: 400 }
      );
    }

    // Import lotto-core functions
    const { getRecentReloads } = await import("@juaose/lotto-core");
    const { RELOAD_TYPE } = await import("@juaose/lotto-shared-types");

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limitParam = parseInt(searchParams.get("limit") || "25");
    const limit = Math.min(Math.max(limitParam, 1), 100); // Clamp between 1 and 100
    const reloadType = searchParams.get("type") || "ANY";

    // Fetch recent reloads
    const recentReloadsResults = await getRecentReloads({
      premayor_acc: premayor_acc,
      limit: limit,
      reloadTypeFilter:
        RELOAD_TYPE[reloadType as keyof typeof RELOAD_TYPE] || RELOAD_TYPE.ANY,
    });

    if (!recentReloadsResults.success || !recentReloadsResults.data) {
      return NextResponse.json({
        success: true,
        data: [],
        count: 0,
      });
    }

    return NextResponse.json({
      success: true,
      data: recentReloadsResults.data,
      count: recentReloadsResults.data.length,
    });
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
