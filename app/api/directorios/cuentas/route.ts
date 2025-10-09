import { NextRequest, NextResponse } from "next/server";
import { invokeLambda } from "../../../../lib/lambda-client";

export async function GET(request: NextRequest) {
  try {
    const result = await invokeLambda("getHostAccounts");
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
