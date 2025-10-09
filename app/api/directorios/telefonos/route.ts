import { NextResponse } from "next/server";
import { invokeLambda } from "../../../../lib/lambda-client";

export async function GET() {
  try {
    const result = await invokeLambda("getPhoneLines");
    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching phone lines:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar el directorio de teléfonos",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
