import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Import DAL
    const { DAL, connect } = await import("@juaose/lotto-core");

    // Get query parameters for date range
    const searchParams = request.nextUrl.searchParams;
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!startDate || !endDate) {
      return NextResponse.json(
        {
          success: false,
          error: "Se requieren parámetros startDate y endDate",
        },
        { status: 400 }
      );
    }

    // Connect to database
    await connect();

    // Build date filter
    const dateFilter: any = {
      createdAt: {
        $gte: new Date(startDate),
        $lt: new Date(endDate),
      },
    };

    // Get RedemptionModel
    const RedemptionModel = await DAL.RedemptionModel;

    // Aggregate withdrawals by shop
    const shopSummaries = await RedemptionModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$shopId",
          totalAmount: { $sum: "$cash_amount" },
          totalWithdrawals: { $sum: 1 },
          uniqueCustomers: { $addToSet: "$customer.premayor_acc" },
        },
      },
      {
        $project: {
          _id: 0,
          shopId: "$_id",
          totalAmount: 1,
          totalWithdrawals: 1,
          customerCount: { $size: "$uniqueCustomers" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Calculate statistics
    const totalShops = shopSummaries.length;
    const totalVolume = shopSummaries.reduce(
      (sum, shop) => sum + shop.totalAmount,
      0
    );
    const totalWithdrawals = shopSummaries.reduce(
      (sum, shop) => sum + shop.totalWithdrawals,
      0
    );

    const topShop = shopSummaries[0] || null;

    const statistics = {
      totalShops,
      totalVolume,
      avgPerShop: totalShops > 0 ? totalVolume / totalShops : 0,
      totalWithdrawals,
      topShop: topShop ? `Puesto ${topShop.shopId}` : "N/A",
      topShopAmount: topShop?.totalAmount || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        shopReports: shopSummaries,
        statistics,
      },
    });
  } catch (error) {
    console.error("Error fetching shop withdrawals report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de retiros por tienda",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
