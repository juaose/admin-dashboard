import { NextResponse } from "next/server";

export async function GET() {
  try {
    const { adminsGetter } = await import("@juaose/lotto-core");

    // Get all admins from Redis cache (with DB fallback)
    const allAdmins = await adminsGetter();

    if (!allAdmins) {
      return NextResponse.json(
        { success: false, error: "No se pudieron obtener los administradores" },
        { status: 500 }
      );
    }

    // Filter admins with active shops (hasActiveShop: true AND shopID exists)
    const activeShops = allAdmins
      .filter((admin) => admin.hasActiveShop === true && admin.shopID)
      .map((admin) => ({
        shopID: admin.shopID,
        nickname: admin.nickname,
        premayor_acc: admin.premayor_acc,
      }))
      .sort((a, b) => (a.shopID || 0) - (b.shopID || 0)); // Sort by shop ID

    return NextResponse.json({
      success: true,
      data: activeShops,
      count: activeShops.length,
    });
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
