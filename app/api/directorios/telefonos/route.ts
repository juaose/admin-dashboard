import { NextResponse } from "next/server";
import { dalGet } from "../../../../lib/dal-client";

export async function GET() {
  try {
    const result = await dalGet("/api/v1/phone-lines");
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
