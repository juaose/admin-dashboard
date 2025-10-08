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
    const { DAL } = await import("@juaose/lotto-core");

    // Ensure DAL is ready
    await DAL.ensureReady();

    // Get query parameters
    const searchParams = request.nextUrl.searchParams;
    const limitParam = parseInt(searchParams.get("limitPerBank") || "25");
    const limitPerBank = Math.min(Math.max(limitParam, 1), 100); // Clamp between 1 and 100

    // Fetch deposits from all credit models
    const creditModels = {
      BNCR: await DAL.BNCRcreditModel,
      BCR: await DAL.BCRcreditModel,
      BAC: await DAL.BACcreditModel,
      Popular: await DAL.POPcreditModel,
      Promerica: await DAL.PROcreditModel,
      Mutual: await DAL.MUTcreditModel,
      Coopenae: await DAL.COOPcreditModel,
    };

    // Fetch deposits from each bank for this specific player
    const allDeposits: Array<{ bankName: string; deposit: any }> = [];

    for (const [bankName, model] of Object.entries(creditModels)) {
      try {
        const deposits = await model
          .find({
            "customer.premayor_acc": premayor_acc,
          })
          .sort({ createdAt: -1 })
          .limit(limitPerBank)
          .lean();

        // bankAccount data is already embedded in each document
        deposits.forEach((deposit: any) => {
          allDeposits.push({ bankName, deposit });
        });
      } catch (error) {
        console.warn(
          `Error fetching ${bankName} deposits for player ${premayor_acc}:`,
          error
        );
      }
    }

    // Sort all deposits by creation date (newest first)
    allDeposits.sort((a, b) => {
      const dateA = new Date(a.deposit.createdAt || a.deposit.transactionDate);
      const dateB = new Date(b.deposit.createdAt || b.deposit.transactionDate);
      return dateB.getTime() - dateA.getTime();
    });

    // Limit to maximum 50 total deposits
    const limitedDeposits = allDeposits.slice(0, 50);

    return NextResponse.json({
      success: true,
      data: limitedDeposits,
      count: limitedDeposits.length,
      totalFound: allDeposits.length,
    });
  } catch (error) {
    console.error("Error fetching player deposits:", error);
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
