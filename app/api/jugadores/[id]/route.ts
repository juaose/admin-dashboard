import { NextRequest, NextResponse } from "next/server";
import { checkUpdatePermission } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { invokeLambdaWithPath } = await import(
      "../../../../lib/lambda-client"
    );

    const premayor_acc = parseInt(params.id);
    if (isNaN(premayor_acc)) {
      return NextResponse.json(
        { success: false, error: "Invalid player ID" },
        { status: 400 }
      );
    }

    // Invoke Lambda function
    const result = await invokeLambdaWithPath("getPlayerById", {
      id: params.id,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error fetching player",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const premayor_acc = parseInt(params.id);
    if (isNaN(premayor_acc)) {
      return NextResponse.json(
        { success: false, error: "Invalid player ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { updateType, data } = body;

    // Check authorization before processing the update
    const authCheck = await checkUpdatePermission(request, updateType);
    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 }
      );
    }

    // Import Lambda client
    const { invokeLambdaWithBody } = await import(
      "../../../../lib/lambda-client"
    );

    // Invoke Lambda function with all update data
    const result = await invokeLambdaWithBody("updatePlayer", {
      updateType,
      data,
      premayor_acc,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar jugador",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
