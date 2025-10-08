import { NextRequest, NextResponse } from "next/server";
import { RELOAD_TYPE } from "@juaose/lotto-shared-types";

interface PlayerReloadData {
  premayor_acc: number;
  codename: string;
  screenName: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

interface BankAccountReloadData {
  accountID: number;
  codename: string;
  iban_num: string;
  bank_name: string;
  totalAmount: number;
  transactionCount: number;
  percentage: number;
}

interface ShopReportData {
  shopID: number;
  shopName: string;
  totalAmount: number;
  transactionCount: number;
  typeBreakdown: {
    [key in RELOAD_TYPE]: {
      count: number;
      amount: number;
      percentage: number;
    };
  };
  topPlayers: PlayerReloadData[];
  otherPlayersAggregate: {
    count: number;
    totalAmount: number;
    percentage: number;
  };
  topBankAccounts: BankAccountReloadData[];
  otherBankAccountsAggregate: {
    count: number;
    totalAmount: number;
    percentage: number;
  };
}

interface ReportData {
  startDate: string;
  endDate: string;
  totalAmount: number;
  totalTransactions: number;
  shopReports: ShopReportData[];
  globalTypeBreakdown: {
    [key in RELOAD_TYPE]: {
      count: number;
      amount: number;
      percentage: number;
    };
  };
  globalBankBreakdown: {
    banks: {
      bank_name: string;
      count: number;
      amount: number;
      percentage: number;
    }[];
    totalAutoReloadAmount: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const startDateStr = searchParams.get("startDate");
    const endDateStr = searchParams.get("endDate");

    if (!startDateStr || !endDateStr) {
      return NextResponse.json(
        { error: "Se requieren fechas de inicio y fin" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
    }

    // Dynamically import DALService
    const { DALService } = await import("../../../../lib/dal");

    // Fetch reloads data
    const reloadsResult = await DALService.getReloadsByDateRange(
      startDate,
      endDate
    );

    if (!reloadsResult.success) {
      throw new Error(
        reloadsResult.errorObject?.message || "Error fetching reloads"
      );
    }

    const reloadsData = reloadsResult.data;

    // Process data similar to Deniro's processReloadsData
    const reportData = processReloadsData(reloadsData, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating reloads report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de recargas",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

// Process reloads data into report structure (adapted from Deniro)
function processReloadsData(
  reloads: any[],
  startDate: Date,
  endDate: Date
): ReportData {
  const shopMap = new Map<number, ShopReportData>();
  let totalAmount = 0;
  let totalTransactions = reloads.length;

  // Initialize global type breakdown
  const globalTypeBreakdown = {
    [RELOAD_TYPE.ANY]: { count: 0, amount: 0, percentage: 0 },
    [RELOAD_TYPE.DEPOSIT_AUTO]: { count: 0, amount: 0, percentage: 0 },
    [RELOAD_TYPE.RELOAD_PRIZE]: { count: 0, amount: 0, percentage: 0 },
    [RELOAD_TYPE.DEPOSIT_MANUAL]: { count: 0, amount: 0, percentage: 0 },
  };

  // Initialize global bank breakdown
  const globalBankMap = new Map<
    string,
    {
      bank_name: string;
      count: number;
      amount: number;
      percentage: number;
    }
  >();

  let totalAutoReloadAmount = 0;

  // Process each reload
  reloads.forEach((reload) => {
    const reloadData = (reload as any)._doc || reload;

    if (!reloadData.customer?.shopID || !reloadData.amount) {
      return;
    }

    const shopID = reloadData.customer.shopID;
    totalAmount += reloadData.amount;

    const reloadType = Number(reloadData.type);
    const validType = Object.values(RELOAD_TYPE).includes(reloadType)
      ? (reloadType as RELOAD_TYPE)
      : RELOAD_TYPE.ANY;

    globalTypeBreakdown[validType].count++;
    globalTypeBreakdown[validType].amount += reloadData.amount;

    // Track bank accounts for automatic reloads
    if (
      validType === RELOAD_TYPE.DEPOSIT_AUTO &&
      reloadData.bankAccount?.bank_name
    ) {
      totalAutoReloadAmount += reloadData.amount;
      const bankName = reloadData.bankAccount.bank_name;

      if (!globalBankMap.has(bankName)) {
        globalBankMap.set(bankName, {
          bank_name: bankName,
          count: 0,
          amount: 0,
          percentage: 0,
        });
      }

      const bankData = globalBankMap.get(bankName)!;
      bankData.count++;
      bankData.amount += reloadData.amount;
    }

    // Initialize shop data if not exists
    if (!shopMap.has(shopID)) {
      shopMap.set(shopID, {
        shopID,
        shopName: reloadData.shopName || `Shop ID: ${shopID}`,
        totalAmount: 0,
        transactionCount: 0,
        typeBreakdown: {
          [RELOAD_TYPE.ANY]: { count: 0, amount: 0, percentage: 0 },
          [RELOAD_TYPE.DEPOSIT_AUTO]: { count: 0, amount: 0, percentage: 0 },
          [RELOAD_TYPE.RELOAD_PRIZE]: { count: 0, amount: 0, percentage: 0 },
          [RELOAD_TYPE.DEPOSIT_MANUAL]: { count: 0, amount: 0, percentage: 0 },
        },
        topPlayers: [],
        otherPlayersAggregate: { count: 0, totalAmount: 0, percentage: 0 },
        topBankAccounts: [],
        otherBankAccountsAggregate: { count: 0, totalAmount: 0, percentage: 0 },
      });
    }

    const shopData = shopMap.get(shopID)!;
    shopData.totalAmount += reloadData.amount;
    shopData.transactionCount++;
    shopData.typeBreakdown[validType].count++;
    shopData.typeBreakdown[validType].amount += reloadData.amount;
  });

  // Calculate percentages
  Object.values(globalTypeBreakdown).forEach((breakdown) => {
    breakdown.percentage =
      totalAmount > 0 ? (breakdown.amount / totalAmount) * 100 : 0;
  });

  globalBankMap.forEach((bank) => {
    bank.percentage =
      totalAutoReloadAmount > 0
        ? (bank.amount / totalAutoReloadAmount) * 100
        : 0;
  });

  const sortedBanks = Array.from(globalBankMap.values()).sort(
    (a, b) => b.amount - a.amount
  );

  // Process shop data
  shopMap.forEach((shopData) => {
    Object.values(shopData.typeBreakdown).forEach((breakdown) => {
      breakdown.percentage =
        shopData.totalAmount > 0
          ? (breakdown.amount / shopData.totalAmount) * 100
          : 0;
    });

    // Process players for this shop
    const playerMap = new Map<number, PlayerReloadData>();
    const shopReloads = reloads.filter(
      (r) => ((r as any)._doc || r).customer?.shopID === shopData.shopID
    );

    shopReloads.forEach((reload) => {
      const reloadData = (reload as any)._doc || reload;
      if (!reloadData.customer?.premayor_acc) return;

      const playerAcc = reloadData.customer.premayor_acc;
      if (!playerMap.has(playerAcc)) {
        playerMap.set(playerAcc, {
          premayor_acc: playerAcc,
          codename: reloadData.customer.codename || `Player ${playerAcc}`,
          screenName: reloadData.customer.screenName || `Player ${playerAcc}`,
          totalAmount: 0,
          transactionCount: 0,
          percentage: 0,
        });
      }

      const playerData = playerMap.get(playerAcc)!;
      playerData.totalAmount += reloadData.amount;
      playerData.transactionCount++;
    });

    const allPlayers = Array.from(playerMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    shopData.topPlayers = allPlayers.slice(0, 10);
    shopData.topPlayers.forEach((player) => {
      player.percentage =
        shopData.totalAmount > 0
          ? (player.totalAmount / shopData.totalAmount) * 100
          : 0;
    });

    const remainingPlayers = allPlayers.slice(10);
    shopData.otherPlayersAggregate = {
      count: remainingPlayers.length,
      totalAmount: remainingPlayers.reduce((sum, p) => sum + p.totalAmount, 0),
      percentage: 0,
    };
    shopData.otherPlayersAggregate.percentage =
      shopData.totalAmount > 0
        ? (shopData.otherPlayersAggregate.totalAmount / shopData.totalAmount) *
          100
        : 0;

    // Process bank accounts for auto reloads
    const bankAccountMap = new Map<number, BankAccountReloadData>();
    const autoReloads = shopReloads.filter(
      (r) => Number(((r as any)._doc || r).type) === RELOAD_TYPE.DEPOSIT_AUTO
    );

    autoReloads.forEach((reload) => {
      const reloadData = (reload as any)._doc || reload;
      if (!reloadData.bankAccount?.accountID) return;

      const accountID = reloadData.bankAccount.accountID;
      if (!bankAccountMap.has(accountID)) {
        bankAccountMap.set(accountID, {
          accountID,
          codename: reloadData.bankAccount.codename || `Account ${accountID}`,
          iban_num: reloadData.bankAccount.iban_num || "",
          bank_name: reloadData.bankAccount.bank_name || "",
          totalAmount: 0,
          transactionCount: 0,
          percentage: 0,
        });
      }

      const bankAccountData = bankAccountMap.get(accountID)!;
      bankAccountData.totalAmount += reloadData.amount;
      bankAccountData.transactionCount++;
    });

    const shopAutoReloadAmount = autoReloads.reduce(
      (sum, r) => sum + (((r as any)._doc || r).amount || 0),
      0
    );

    const allBankAccounts = Array.from(bankAccountMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    );

    shopData.topBankAccounts = allBankAccounts.slice(0, 10);
    shopData.topBankAccounts.forEach((account) => {
      account.percentage =
        shopAutoReloadAmount > 0
          ? (account.totalAmount / shopAutoReloadAmount) * 100
          : 0;
    });

    const remainingAccounts = allBankAccounts.slice(10);
    shopData.otherBankAccountsAggregate = {
      count: remainingAccounts.length,
      totalAmount: remainingAccounts.reduce((sum, a) => sum + a.totalAmount, 0),
      percentage: 0,
    };
    shopData.otherBankAccountsAggregate.percentage =
      shopAutoReloadAmount > 0
        ? (shopData.otherBankAccountsAggregate.totalAmount /
            shopAutoReloadAmount) *
          100
        : 0;
  });

  return {
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
    totalAmount,
    totalTransactions,
    shopReports: Array.from(shopMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    ),
    globalTypeBreakdown,
    globalBankBreakdown: {
      banks: sortedBanks,
      totalAutoReloadAmount,
    },
  };
}
