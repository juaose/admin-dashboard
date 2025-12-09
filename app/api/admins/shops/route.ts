import { NextResponse } from "next/server";
import { dalGet } from "../../../../lib/dal-client";

export async function GET() {
  try {
    // Fetch only admins with active shops using query parameter
    const result = await dalGet("/api/v1/admins?hasActiveShop=true");

    // Extra safety: filter on frontend too (defense in depth)
    if (result.success && result.data) {
      result.data = result.data.filter(
        (admin: any) => admin.hasActiveShop === true && admin.shopID
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching active shops:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al obtener las tiendas activas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
