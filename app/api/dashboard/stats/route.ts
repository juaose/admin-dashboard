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
        `Missing environment variables during build: ${missingEnvVars.join(
          ", "
        )}`
      );
      // Return mock data during build time to allow build to complete
      const mockStats = {
        totalPlayers: 0,
        totalDeposits: 0,
        totalWithdrawals: 0,
        totalReloads: 0,
        activeShops: 0,
        pendingTransactions: 0,
      };
      return NextResponse.json(mockStats);
    }

    // Dynamically import DALService to avoid build-time initialization
    const { DALService } = await import("../../../../lib/dal");

    // Load data from multiple sources
    const [players, deposits, reloads, withdrawals] = await Promise.all([
      DALService.getPlayers({}, { premayor_acc: 1, screenName: 1 }),
      DALService.getBankDepositsByDateRange(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date()
      ),
      DALService.getReloadsByDateRange(
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        new Date()
      ),
      DALService.getRedemptions(),
    ]);

    // Calculate total deposits from greenTeam and purpleTeam arrays
    let totalDeposits = 0;
    if (deposits) {
      const greenTeamCount = deposits.greenTeam.reduce(
        (sum: number, item: any) => sum + item.transaction_count,
        0
      );
      const purpleTeamCount = deposits.purpleTeam.reduce(
        (sum: number, item: any) => sum + item.transaction_count,
        0
      );
      totalDeposits = greenTeamCount + purpleTeamCount;
    }

    // Calculate basic stats
    const stats = {
      totalPlayers: players.length,
      totalDeposits,
      totalWithdrawals: withdrawals.length,
      totalReloads: reloads?.success ? reloads.data.length : 0,
      activeShops: 5, // Todo: calculate from data
      pendingTransactions: 0, // Todo: add pending status in data model
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    return NextResponse.json(
      { error: "Error al cargar las estadísticas del dashboard" },
      { status: 500 }
    );
  }
}
