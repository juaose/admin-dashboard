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

    // Aggregate withdrawals by recipient bank
    const bankSummaries = await RedemptionModel.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: "$payment.recipientAccount.bank_name",
          totalAmount: { $sum: "$cash_amount" },
          totalWithdrawals: { $sum: 1 },
          uniqueCustomers: { $addToSet: "$customer.premayor_acc" },
        },
      },
      {
        $project: {
          _id: 0,
          bankName: "$_id",
          totalAmount: 1,
          totalWithdrawals: 1,
          customerCount: { $size: "$uniqueCustomers" },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Calculate statistics
    const totalBanks = bankSummaries.length;
    const totalVolume = bankSummaries.reduce(
      (sum, bank) => sum + bank.totalAmount,
      0
    );
    const totalWithdrawals = bankSummaries.reduce(
      (sum, bank) => sum + bank.totalWithdrawals,
      0
    );

    const topBank = bankSummaries[0] || null;

    const statistics = {
      totalBanks,
      totalVolume,
      avgPerBank: totalBanks > 0 ? totalVolume / totalBanks : 0,
      totalWithdrawals,
      topBank: topBank?.bankName || "N/A",
      topBankAmount: topBank?.totalAmount || 0,
    };

    return NextResponse.json({
      success: true,
      data: {
        bankSummaries,
        statistics,
      },
    });
  } catch (error) {
    console.error("Error fetching bank withdrawals report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de retiros por banco receptor",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
