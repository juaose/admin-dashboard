import { NextRequest, NextResponse } from "next/server";
import { RELOAD_TYPE } from "@juaose/lotto-shared-types";

interface DashboardStats {
  // Deposits
  deposits: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    activeCustomers: number;
    avgDepositsPerCustomer: number;
    avgAmountPerCustomer: number;
  };

  // Deposit Reloads (DEPOSIT_AUTO + DEPOSIT_MANUAL)
  depositReloads: {
    auto: {
      totalAmount: number;
      totalCount: number;
      averageAmount: number;
    };
    manual: {
      totalAmount: number;
      totalCount: number;
      averageAmount: number;
    };
    combined: {
      totalAmount: number;
      totalCount: number;
      averageAmount: number;
      activeCustomers: number;
      avgReloadsPerCustomer: number;
      avgAmountPerCustomer: number;
    };
  };

  // Prize Reloads (RELOAD_PRIZE)
  prizeReloads: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    activeCustomers: number;
    avgReloadsPerCustomer: number;
    avgAmountPerCustomer: number;
  };

  // Redemptions/Withdrawals
  redemptions: {
    totalAmount: number;
    totalCount: number;
    averageAmount: number;
    activeCustomers: number;
    avgRedemptionsPerCustomer: number;
  };

  // Players
  players: {
    newRegistrations: number;
  };

  // Period info
  period: {
    type: "today" | "week" | "month";
    startDate: string;
    endDate: string;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const periodType = searchParams.get("period") || "today";
    const shopId = searchParams.get("shopId");

    // Calculate date range based on period
    const { startDate, endDate } = calculateDateRange(
      periodType as "today" | "week" | "month"
    );

    // Import necessary services
    const { DALService } = await import("../../../../lib/dal");
    const { DAL } = await import("@juaose/lotto-core");
    await DAL.ensureReady();

    // Fetch data in parallel
    const [reloadsResult, deposits, players, redemptions] = await Promise.all([
      DALService.getReloadsByDateRange(
        startDate,
        endDate,
        shopId ? parseInt(shopId) : undefined
      ),
      fetchDeposits(startDate, endDate),
      DALService.getPlayers(
        {},
        { premayor_acc: 1, screenName: 1, createdAt: 1 }
      ),
      DALService.getRedemptions(),
    ]);

    if (!reloadsResult.success) {
      throw new Error(
        reloadsResult.errorObject?.message || "Error fetching reloads"
      );
    }

    const reloads = reloadsResult.data;

    // Process the data
    const stats = processStats(
      reloads,
      deposits,
      players,
      redemptions,
      startDate,
      endDate,
      periodType as "today" | "week" | "month",
      shopId
    );

    return NextResponse.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Error fetching home stats:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al cargar las estadísticas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function calculateDateRange(periodType: "today" | "week" | "month") {
  const now = new Date();
  const endDate = new Date(now);
  let startDate = new Date(now);

  if (periodType === "today") {
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
  } else if (periodType === "week") {
    // Start from Monday of current week
    const dayOfWeek = now.getDay();
    const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    startDate.setDate(now.getDate() + diff);
    startDate.setHours(0, 0, 0, 0);
  } else if (periodType === "month") {
    startDate.setDate(1);
    startDate.setHours(0, 0, 0, 0);
  }

  return { startDate, endDate };
}

async function fetchDeposits(startDate: Date, endDate: Date) {
  const { DAL } = await import("@juaose/lotto-core");

  const creditModels = {
    BNCR: await DAL.BNCRcreditModel,
    BCR: await DAL.BCRcreditModel,
    BAC: await DAL.BACcreditModel,
    Popular: await DAL.POPcreditModel,
    Promerica: await DAL.PROcreditModel,
    Mutual: await DAL.MUTcreditModel,
    Coopealianza: await DAL.COOPcreditModel,
  };

  const allDeposits: any[] = [];

  for (const [bankName, model] of Object.entries(creditModels)) {
    try {
      const deposits = await model
        .find({
          createdAt: {
            $gte: startDate,
            $lte: endDate,
          },
        })
        .lean();

      allDeposits.push(...deposits);
    } catch (error) {
      console.warn(`Error fetching ${bankName} deposits:`, error);
    }
  }

  return allDeposits;
}

function processStats(
  reloads: any[],
  deposits: any[],
  players: any[],
  redemptions: any[],
  startDate: Date,
  endDate: Date,
  periodType: "today" | "week" | "month",
  shopId: string | null
): DashboardStats {
  // Process Deposits
  const depositStats = processDeposits(deposits, shopId);

  // Process Reloads by type
  const reloadStats = processReloads(reloads, shopId);

  // Process Redemptions
  const redemptionStats = processRedemptions(
    redemptions,
    startDate,
    endDate,
    shopId
  );

  // Process new player registrations
  const newRegistrations = players.filter((p: any) => {
    const createdAt = new Date(p.createdAt || p.created_at);
    return createdAt >= startDate && createdAt <= endDate;
  }).length;

  return {
    deposits: depositStats,
    depositReloads: reloadStats.depositReloads,
    prizeReloads: reloadStats.prizeReloads,
    redemptions: redemptionStats,
    players: {
      newRegistrations,
    },
    period: {
      type: periodType,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    },
  };
}

function processDeposits(deposits: any[], shopId: string | null) {
  let filteredDeposits = deposits;

  if (shopId) {
    filteredDeposits = deposits.filter(
      (d) => d.customer?.shopID === parseInt(shopId)
    );
  }

  const totalAmount = filteredDeposits.reduce(
    (sum, d) => sum + (d.credit || 0),
    0
  );
  const totalCount = filteredDeposits.length;

  // Get unique customers
  const uniqueCustomers = new Set(
    filteredDeposits
      .filter((d) => d.customer?.premayor_acc)
      .map((d) => d.customer.premayor_acc)
  );

  const activeCustomers = uniqueCustomers.size;

  return {
    totalAmount,
    totalCount,
    averageAmount: totalCount > 0 ? totalAmount / totalCount : 0,
    activeCustomers,
    avgDepositsPerCustomer:
      activeCustomers > 0 ? totalCount / activeCustomers : 0,
    avgAmountPerCustomer:
      activeCustomers > 0 ? totalAmount / activeCustomers : 0,
  };
}

function processReloads(reloads: any[], shopId: string | null) {
  let filteredReloads = reloads;

  if (shopId) {
    filteredReloads = reloads.filter((r) => {
      const reloadData = (r as any)._doc || r;
      return reloadData.customer?.shopID === parseInt(shopId);
    });
  }

  // Separate by type
  const autoReloads = filteredReloads.filter((r) => {
    const reloadData = (r as any)._doc || r;
    return Number(reloadData.type) === RELOAD_TYPE.DEPOSIT_AUTO;
  });

  const manualReloads = filteredReloads.filter((r) => {
    const reloadData = (r as any)._doc || r;
    return Number(reloadData.type) === RELOAD_TYPE.DEPOSIT_MANUAL;
  });

  const prizeReloads = filteredReloads.filter((r) => {
    const reloadData = (r as any)._doc || r;
    return Number(reloadData.type) === RELOAD_TYPE.RELOAD_PRIZE;
  });

  // Process auto deposits
  const autoAmount = autoReloads.reduce(
    (sum, r) => sum + ((r._doc || r).amount || 0),
    0
  );
  const autoCount = autoReloads.length;

  // Process manual deposits
  const manualAmount = manualReloads.reduce(
    (sum, r) => sum + ((r._doc || r).amount || 0),
    0
  );
  const manualCount = manualReloads.length;

  // Combined deposit reloads
  const depositReloads = [...autoReloads, ...manualReloads];
  const combinedAmount = autoAmount + manualAmount;
  const combinedCount = autoCount + manualCount;

  const depositCustomers = new Set(
    depositReloads
      .filter((r) => (r._doc || r).customer?.premayor_acc)
      .map((r) => (r._doc || r).customer.premayor_acc)
  );

  const depositActiveCustomers = depositCustomers.size;

  // Process prize reloads
  const prizeAmount = prizeReloads.reduce(
    (sum, r) => sum + ((r._doc || r).amount || 0),
    0
  );
  const prizeCount = prizeReloads.length;

  const prizeCustomers = new Set(
    prizeReloads
      .filter((r) => (r._doc || r).customer?.premayor_acc)
      .map((r) => (r._doc || r).customer.premayor_acc)
  );

  const prizeActiveCustomers = prizeCustomers.size;

  return {
    depositReloads: {
      auto: {
        totalAmount: autoAmount,
        totalCount: autoCount,
        averageAmount: autoCount > 0 ? autoAmount / autoCount : 0,
      },
      manual: {
        totalAmount: manualAmount,
        totalCount: manualCount,
        averageAmount: manualCount > 0 ? manualAmount / manualCount : 0,
      },
      combined: {
        totalAmount: combinedAmount,
        totalCount: combinedCount,
        averageAmount: combinedCount > 0 ? combinedAmount / combinedCount : 0,
        activeCustomers: depositActiveCustomers,
        avgReloadsPerCustomer:
          depositActiveCustomers > 0
            ? combinedCount / depositActiveCustomers
            : 0,
        avgAmountPerCustomer:
          depositActiveCustomers > 0
            ? combinedAmount / depositActiveCustomers
            : 0,
      },
    },
    prizeReloads: {
      totalAmount: prizeAmount,
      totalCount: prizeCount,
      averageAmount: prizeCount > 0 ? prizeAmount / prizeCount : 0,
      activeCustomers: prizeActiveCustomers,
      avgReloadsPerCustomer:
        prizeActiveCustomers > 0 ? prizeCount / prizeActiveCustomers : 0,
      avgAmountPerCustomer:
        prizeActiveCustomers > 0 ? prizeAmount / prizeActiveCustomers : 0,
    },
  };
}

function processRedemptions(
  redemptions: any[],
  startDate: Date,
  endDate: Date,
  shopId: string | null
) {
  let filteredRedemptions = redemptions.filter((r: any) => {
    const createdAt = new Date(r.createdAt || r.created_at || r.date);
    return createdAt >= startDate && createdAt <= endDate;
  });

  if (shopId) {
    filteredRedemptions = filteredRedemptions.filter(
      (r) => r.customer?.shopID === parseInt(shopId)
    );
  }

  const totalAmount = filteredRedemptions.reduce(
    (sum, r) => sum + (r.cash_amount || 0),
    0
  );
  const totalCount = filteredRedemptions.length;

  const uniqueCustomers = new Set(
    filteredRedemptions
      .filter((r) => r.customer?.premayor_acc)
      .map((r) => r.customer.premayor_acc)
  );

  const activeCustomers = uniqueCustomers.size;

  return {
    totalAmount,
    totalCount,
    averageAmount: totalCount > 0 ? totalAmount / totalCount : 0,
    activeCustomers,
    avgRedemptionsPerCustomer:
      activeCustomers > 0 ? totalCount / activeCustomers : 0,
  };
}
