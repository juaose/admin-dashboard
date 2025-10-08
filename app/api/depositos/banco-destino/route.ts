import { NextRequest, NextResponse } from "next/server";

interface BankCustomerData {
  bankName: string;
  premayor_acc: number;
  shopID: number;
  codename: string;
  screenName: string;
  totalAmount: number;
  totalReloads: number;
  averageReload: number;
}

interface BankSummary {
  bankName: string;
  totalAmount: number;
  totalReloads: number;
  customerCount: number;
  averagePerCustomer: number;
  averagePerReload: number;
}

interface ReportData {
  bankSummaries: BankSummary[];
  customersByBank: BankCustomerData[];
  statistics: {
    totalBanks: number;
    topVolumeBank: string;
    topVolumeBankAmount: number;
    topCustomerBank: string;
    topCustomerBankCount: number;
    avgVolumePerBank: number;
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
    const allDeposits: Array<{ bankName: string; deposit: any }> = [];

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

        console.log(`${bankName}: Found ${deposits.length} deposits`);

        deposits.forEach((deposit: any) => {
          allDeposits.push({ bankName, deposit });
        });
      } catch (error) {
        console.warn(`Error fetching ${bankName} deposits:`, error);
      }
    }

    console.log(`Total deposits found: ${allDeposits.length}`);

    // Aggregate data by bank
    const reportData = aggregateBankData(allDeposits, startDate, endDate);

    console.log(`Bank summaries: ${reportData.bankSummaries.length}`);

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating banking report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte bancario",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function aggregateBankData(
  deposits: Array<{ bankName: string; deposit: any }>,
  startDate: Date,
  endDate: Date
): ReportData {
  // Maps to track bank and customer data
  const bankMap = new Map<
    string,
    {
      totalAmount: number;
      totalReloads: number;
      customers: Set<number>;
    }
  >();

  const customersByBank: BankCustomerData[] = [];
  const customerBankMap = new Map<string, BankCustomerData>();

  deposits.forEach(({ bankName, deposit }) => {
    // Get amount from credit field (processedCreditIF has credit: number)
    const amount = deposit.credit || 0;
    if (!amount) return;

    // Get customer from embedded customer subdocument
    const customer = deposit.customer;
    if (!customer?.premayor_acc) return;

    const customerAcc = customer.premayor_acc;

    // Initialize bank data if not exists
    if (!bankMap.has(bankName)) {
      bankMap.set(bankName, {
        totalAmount: 0,
        totalReloads: 0,
        customers: new Set(),
      });
    }

    const bankData = bankMap.get(bankName)!;
    bankData.totalAmount += amount;
    bankData.totalReloads++;
    bankData.customers.add(customerAcc);

    // Track customer data by bank
    const customerKey = `${bankName}_${customerAcc}`;
    if (!customerBankMap.has(customerKey)) {
      customerBankMap.set(customerKey, {
        bankName,
        premayor_acc: customerAcc,
        shopID: customer.shopID || 0,
        codename: customer.codename || `Customer ${customerAcc}`,
        screenName: customer.screenName || `Customer ${customerAcc}`,
        totalAmount: 0,
        totalReloads: 0,
        averageReload: 0,
      });
    }

    const customerData = customerBankMap.get(customerKey)!;
    customerData.totalAmount += amount;
    customerData.totalReloads++;
  });

  // Calculate averages for customers
  customerBankMap.forEach((customer) => {
    customer.averageReload =
      customer.totalReloads > 0
        ? customer.totalAmount / customer.totalReloads
        : 0;
  });

  // Create bank summaries
  const bankSummaries: BankSummary[] = [];
  bankMap.forEach((data, bankName) => {
    bankSummaries.push({
      bankName,
      totalAmount: data.totalAmount,
      totalReloads: data.totalReloads,
      customerCount: data.customers.size,
      averagePerCustomer: data.totalAmount / data.customers.size,
      averagePerReload: data.totalAmount / data.totalReloads,
    });
  });

  // Sort by total amount descending
  bankSummaries.sort((a, b) => b.totalAmount - a.totalAmount);

  // Calculate statistics
  const totalBanks = bankSummaries.length;
  const topVolumeBank = bankSummaries[0] || {
    bankName: "N/A",
    totalAmount: 0,
  };
  const topCustomerBank = [...bankSummaries].sort(
    (a, b) => b.customerCount - a.customerCount
  )[0] || { bankName: "N/A", customerCount: 0 };
  const avgVolumePerBank =
    totalBanks > 0
      ? bankSummaries.reduce((sum, b) => sum + b.totalAmount, 0) / totalBanks
      : 0;

  const statistics = {
    totalBanks,
    topVolumeBank: topVolumeBank.bankName,
    topVolumeBankAmount: topVolumeBank.totalAmount,
    topCustomerBank: topCustomerBank.bankName,
    topCustomerBankCount: topCustomerBank.customerCount,
    avgVolumePerBank,
  };

  // Calculate report period
  const reportPeriod = calculateReportPeriod(startDate, endDate);

  return {
    bankSummaries,
    customersByBank: Array.from(customerBankMap.values()).sort(
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
