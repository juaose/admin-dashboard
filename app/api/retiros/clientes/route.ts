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

    // Aggregate withdrawals by customer
    const customerSummaries = await RedemptionModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$customer.premayor_acc",
          screenName: { $first: "$customer.screenName" },
          codename: { $first: "$customer.codename" },
          shopID: { $first: "$customer.shopID" },
          totalAmount: { $sum: "$cash_amount" },
          totalWithdrawals: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          premayor_acc: "$_id",
          screenName: 1,
          codename: 1,
          shopID: 1,
          totalAmount: 1,
          totalWithdrawals: 1,
          averageWithdrawal: {
            $cond: [
              { $gt: ["$totalWithdrawals", 0] },
              { $divide: ["$totalAmount", "$totalWithdrawals"] },
              0,
            ],
          },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Calculate statistics
    const totalCustomers = customerSummaries.length;
    const totalVolume = customerSummaries.reduce(
      (sum, customer) => sum + customer.totalAmount,
      0
    );
    const totalWithdrawals = customerSummaries.reduce(
      (sum, customer) => sum + customer.totalWithdrawals,
      0
    );

    const topCustomer = customerSummaries[0] || null;

    const statistics = {
      totalCustomers,
      totalVolume,
      avgWithdrawalAmount:
        totalWithdrawals > 0 ? totalVolume / totalWithdrawals : 0,
      avgWithdrawalsPerDay:
        totalWithdrawals /
        Math.max(
          1,
          Math.ceil(
            (new Date(endDate).getTime() - new Date(startDate).getTime()) /
              (1000 * 60 * 60 * 24)
          )
        ),
      topCustomer: topCustomer?.screenName || "N/A",
      topCustomerAmount: topCustomer?.totalAmount || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        customers: customerSummaries,
        statistics,
      },
    });
  } catch (error) {
    console.error("Error fetching customer withdrawals report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de retiros por cliente",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
