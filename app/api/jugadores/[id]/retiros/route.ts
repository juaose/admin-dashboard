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

    // Import DAL
    const { DAL, connect } = await import("@juaose/lotto-core");

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limitParam = parseInt(searchParams.get("limit") || "25");
    const limit = Math.min(Math.max(limitParam, 1), 100); // Clamp between 1 and 100

    // Connect to database
    await connect();

    // Query redemptions for this player
    const RedemptionModel = await DAL.RedemptionModel;
    const redemptions = await RedemptionModel.find({
      "customer.premayor_acc": premayor_acc,
    })
      .sort({ createdAt: -1 })
      .limit(limit);

    return NextResponse.json({
      success: true,
      data: redemptions,
      count: redemptions.length,
    });
  } catch (error) {
    console.error("Error fetching player redemptions:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar retiros del jugador",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
