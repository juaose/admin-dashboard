import { NextRequest, NextResponse } from "next/server";

interface AccountCustomerData {
  accountID: number;
  accountCodename: string;
  bankName: string;
  ibanNum: string;
  premayor_acc: number;
  shopID: number;
  codename: string;
  screenName: string;
  totalAmount: number;
  totalReloads: number;
  averageReload: number;
}

interface AccountSummary {
  accountID: number;
  accountCodename: string;
  bankName: string;
  ibanNum: string;
  totalAmount: number;
  totalReloads: number;
  customerCount: number;
  averagePerCustomer: number;
  averagePerReload: number;
}

interface ReportData {
  accountSummaries: AccountSummary[];
  customersByAccount: AccountCustomerData[];
  statistics: {
    totalAccounts: number;
    topVolumeAccount: string;
    topVolumeAccountAmount: number;
    topCustomerAccount: string;
    topCustomerAccountCount: number;
    avgVolumePerAccount: number;
  };
  reportPeriod: {
    periodDates: string;
    durationValue: string;
    startDate: string;
    endDate: string;
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

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json({ error: "Fechas inválidas" }, { status: 400 });
    }

    // Import lotto-core DAL directly to access credit models
    const { DAL } = await import("@juaose/lotto-core");

    // Ensure DAL is ready
    await DAL.ensureReady();

    // Fetch deposits from all credit models
    const creditModels = {
      BNCR: await DAL.BNCRcreditModel,
      BCR: await DAL.BCRcreditModel,
      BAC: await DAL.BACcreditModel,
      Popular: await DAL.POPcreditModel,
      Promerica: await DAL.PROcreditModel,
      Mutual: await DAL.MUTcreditModel,
      Coopealianza: await DAL.COOPcreditModel,
    };

    // Fetch deposits from each bank within date range
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

    // Aggregate data by host account (destination account)
    const reportData = aggregateByHostAccount(allDeposits, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating account report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de cuentas destino",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function aggregateByHostAccount(
  deposits: any[],
  startDate: Date,
  endDate: Date
): ReportData {
  // Maps to track account and customer data
  const accountMap = new Map<
    number,
    {
      accountCodename: string;
      bankName: string;
      ibanNum: string;
      totalAmount: number;
      totalReloads: number;
      customers: Set<number>;
    }
  >();

  const customerAccountMap = new Map<string, AccountCustomerData>();

  deposits.forEach((deposit) => {
    // Get amount from credit field
    const amount = deposit.credit || 0;
    if (!amount) return;

    // Get customer from embedded customer subdocument
    const customer = deposit.customer;
    if (!customer?.premayor_acc) return;

    // Get host account information (destination account)
    const bankAccount = deposit.bankAccount;
    if (!bankAccount?.accountID) return;

    const accountID = bankAccount.accountID;
    const accountCodename = bankAccount.codename || `Account ${accountID}`;
    const bankName = bankAccount.bank_name || "Desconocido";
    const ibanNum = bankAccount.iban_num || "";

    const customerAcc = customer.premayor_acc;

    // Initialize account data if not exists
    if (!accountMap.has(accountID)) {
      accountMap.set(accountID, {
        accountCodename,
        bankName,
        ibanNum,
        totalAmount: 0,
        totalReloads: 0,
        customers: new Set(),
      });
    }

    const accountData = accountMap.get(accountID)!;
    accountData.totalAmount += amount;
    accountData.totalReloads++;
    accountData.customers.add(customerAcc);

    // Track customer data by host account
    const customerKey = `${accountID}_${customerAcc}`;
    if (!customerAccountMap.has(customerKey)) {
      customerAccountMap.set(customerKey, {
        accountID,
        accountCodename,
        bankName,
        ibanNum,
        premayor_acc: customerAcc,
        shopID: customer.shopID || 0,
        codename: customer.codename || `Customer ${customerAcc}`,
        screenName: customer.screenName || `Customer ${customerAcc}`,
        totalAmount: 0,
        totalReloads: 0,
        averageReload: 0,
      });
    }

    const customerData = customerAccountMap.get(customerKey)!;
    customerData.totalAmount += amount;
    customerData.totalReloads++;
  });

  // Calculate averages for customers
  customerAccountMap.forEach((customer) => {
    customer.averageReload =
      customer.totalReloads > 0
        ? customer.totalAmount / customer.totalReloads
        : 0;
  });

  // Create account summaries
  const accountSummaries: AccountSummary[] = [];
  accountMap.forEach((data, accountID) => {
    accountSummaries.push({
      accountID,
      accountCodename: data.accountCodename,
      bankName: data.bankName,
      ibanNum: data.ibanNum,
      totalAmount: data.totalAmount,
      totalReloads: data.totalReloads,
      customerCount: data.customers.size,
      averagePerCustomer: data.totalAmount / data.customers.size,
      averagePerReload: data.totalAmount / data.totalReloads,
    });
  });

  // Sort by total amount descending
  accountSummaries.sort((a, b) => b.totalAmount - a.totalAmount);

  // Calculate statistics
  const totalAccounts = accountSummaries.length;
  const topVolumeAccount = accountSummaries[0] || {
    accountCodename: "N/A",
    totalAmount: 0,
  };
  const topCustomerAccount = [...accountSummaries].sort(
    (a, b) => b.customerCount - a.customerCount
  )[0] || { accountCodename: "N/A", customerCount: 0 };
  const avgVolumePerAccount =
    totalAccounts > 0
      ? accountSummaries.reduce((sum, a) => sum + a.totalAmount, 0) /
        totalAccounts
      : 0;

  const statistics = {
    totalAccounts,
    topVolumeAccount: topVolumeAccount.accountCodename,
    topVolumeAccountAmount: topVolumeAccount.totalAmount,
    topCustomerAccount: topCustomerAccount.accountCodename,
    topCustomerAccountCount: topCustomerAccount.customerCount,
    avgVolumePerAccount,
  };

  // Calculate report period
  const reportPeriod = calculateReportPeriod(startDate, endDate);

  return {
    accountSummaries,
    customersByAccount: Array.from(customerAccountMap.values()).sort(
      (a, b) => b.totalAmount - a.totalAmount
    ),
    statistics,
    reportPeriod,
  };
}

function calculateReportPeriod(startDate: Date, endDate: Date) {
  const dateFormatter = new Intl.DateTimeFormat("es-CR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "America/Costa_Rica",
  });

  const startDateStr = dateFormatter.format(startDate);
  const endDateStr = dateFormatter.format(endDate);

  const totalMilliseconds = endDate.getTime() - startDate.getTime();
  const totalDays = Math.floor(totalMilliseconds / (1000 * 60 * 60 * 24));
  const remainingHours = Math.floor(
    (totalMilliseconds % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
  );
  const remainingMinutes = Math.floor(
    (totalMilliseconds % (1000 * 60 * 60)) / (1000 * 60)
  );

  let durationText = "";
  if (totalDays > 0) {
    durationText += `${totalDays} día${totalDays !== 1 ? "s" : ""}`;
  }
  if (remainingHours > 0) {
    if (durationText) durationText += ", ";
    durationText += `${remainingHours} hora${remainingHours !== 1 ? "s" : ""}`;
  }
  if (remainingMinutes > 0) {
    if (durationText) durationText += ", ";
    durationText += `${remainingMinutes} minuto${
      remainingMinutes !== 1 ? "s" : ""
    }`;
  }

  if (!durationText) {
    durationText = "Menos de 1 minuto";
  }

  return {
    periodDates: `${startDateStr} - ${endDateStr}`,
    durationValue: durationText,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  };
}
