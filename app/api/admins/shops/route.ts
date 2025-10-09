import { NextResponse } from "next/server";
import { invokeLambda } from "../../../../lib/lambda-client";

export async function GET() {
  try {
    const result = await invokeLambda("getAdminShops");
    return NextResponse.json(result);
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
