import { NextRequest, NextResponse } from "next/server";
import { dalGet } from "../../../../lib/dal-client";

export async function GET(request: NextRequest) {
  try {
    const result = await dalGet("/api/v1/host-accounts");
    return NextResponse.json(result);
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
