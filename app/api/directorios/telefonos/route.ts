import { NextResponse } from "next/server";

export async function GET() {
  try {
    // Check if required environment variables are available
    const requiredEnvVars = [
      "ENV",
      "CONNECTION_STRING",
      "REFRESH_TOKEN_POST_KEY",
      "REDIS_HOST",
      "P1_PM_NUMBER",
      "P2_PM_NUMBER",
      "P3_PM_NUMBER",
      "P4_PM_NUMBER",
    ];

    const missingEnvVars = requiredEnvVars.filter(
      (varName) => !process.env[varName]
    );

    if (missingEnvVars.length > 0) {
      console.warn(
        `Missing environment variables: ${missingEnvVars.join(", ")}`
      );
      return NextResponse.json(
        { error: "Configuración de base de datos no disponible" },
        { status: 503 }
      );
    }

    // Dynamically import DALService to avoid build-time initialization
    const { DALService } = await import("../../../../lib/dal");

    // Fetch phone lines from database
    const phoneLines = await DALService.getPhoneLines();

    return NextResponse.json({
      success: true,
      data: phoneLines,
      count: phoneLines.length,
    });
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
