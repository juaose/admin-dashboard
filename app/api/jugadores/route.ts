export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { dalGet } from "../../../lib/dal-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    console.log("🔍 [Next.js /api/jugadores] Incoming request");
    console.log("  - Search param:", search);
    console.log("  - Full URL:", request.url);

    // Call DAL API
    console.log("  - Calling dalGet with:", { search });
    const result = await dalGet("/api/v1/players", {
      search,
    });

    console.log("  - DAL returned:");
    console.log("    - success:", result.success);
    console.log("    - data length:", result.data?.length);
    console.log("    - metadata:", JSON.stringify(result.metadata));
    if (result.data?.length > 0) {
      console.log("    - First result:", {
        premayor_acc: result.data[0].premayor_acc,
        nombre: result.data[0].nombre,
      });
    } else {
      console.log("    - ⚠️  DATA IS EMPTY!");
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching players:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar jugadores",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
