import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: { bankId: string } }
) {
  try {
    const { hostAccountsGetter } = await import("@juaose/lotto-core");

    const bankId = parseInt(params.bankId);

    if (isNaN(bankId)) {
      return NextResponse.json(
        { success: false, error: "Invalid bank ID" },
        { status: 400 }
      );
    }

    // Use lotto-core's cached getter for host accounts by bank
    const hostAccounts = await hostAccountsGetter(bankId);

    return NextResponse.json({
      success: true,
      data: hostAccounts || [],
    });
  } catch (error) {
    console.error("Error fetching host accounts by bank:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar cuentas huésped",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
