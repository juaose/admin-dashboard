import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    // Import lotto-core DAL to access host accounts
    const { DAL } = await import("@juaose/lotto-core");

    // Ensure DAL is ready
    await DAL.ensureReady();

    // Fetch all host accounts
    const hostAccountModel = await DAL.hostAccountModel;
    const hostAccounts = await hostAccountModel.find({}).lean();

    // Sort by accountID
    hostAccounts.sort((a: any, b: any) => a.accountID - b.accountID);

    return NextResponse.json({
      success: true,
      data: hostAccounts,
    });
  } catch (error) {
    console.error("Error fetching host accounts:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar cuentas bancarias",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
