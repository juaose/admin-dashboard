import { NextRequest, NextResponse } from "next/server";
import { dalGet } from "../../../../../lib/dal-client";

export async function GET(
  request: NextRequest,
  { params }: { params: { bankId: string } }
) {
  try {
    const bankId = parseInt(params.bankId);

    if (isNaN(bankId)) {
      return NextResponse.json(
        { success: false, error: "Invalid bank ID" },
        { status: 400 }
      );
    }

    const result = await dalGet("/api/v1/host-accounts", {
      bankId: params.bankId,
    });

    return NextResponse.json(result);
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
