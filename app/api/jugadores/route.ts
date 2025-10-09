import { NextRequest, NextResponse } from "next/server";
import { invokeLambdaWithQuery } from "../../../lib/lambda-client";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get("search") || "";

    // Invoke Lambda function
    const result = await invokeLambdaWithQuery("getPlayers", {
      search,
    });

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
