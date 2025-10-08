import { NextRequest, NextResponse } from "next/server";

interface CustomerDepositData {
  premayor_acc: number;
  shopID: number;
  codename: string;
  screenName: string;
  totalAmount: number;
  totalDeposits: number;
  averageDeposit: number;
  firstDate: string;
  lastDate: string;
  daysBetween: number;
  avgDepositsPerDay: number;
  volumePercentile?: string;
  frequencyPercentile?: string;
  volumePercentileValue?: number;
  frequencyPercentileValue?: number;
}

interface ReportData {
  customers: CustomerDepositData[];
  statistics: {
    totalCustomers: number;
    totalVolume: number;
    avgDepositAmount: number;
    avgDepositsPerDay: number;
  };
  percentiles: {
    top5Volume: string;
    top10Volume: string;
    top20Volume: string;
    top50Volume: string;
    top5Frequency: string;
    top10Frequency: string;
    top20Frequency: string;
    top50Frequency: string;
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

        deposits.forEach((deposit: any) => {
          allDeposits.push({ bankName, deposit });
        });
      } catch (error) {
        console.warn(`Error fetching ${bankName} deposits:`, error);
      }
    }

    const deposits = allDeposits;

    // Aggregate data by customer
    const reportData = aggregateCustomerData(deposits, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating customer deposits report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de clientes",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

function aggregateCustomerData(
  deposits: Array<{ bankName: string; deposit: any }>,
  startDate: Date,
  endDate: Date
): ReportData {
  // Group deposits by customer
  const customerMap = new Map<number, CustomerDepositData>();

  deposits.forEach(({ bankName, deposit: depositData }) => {
    // Get amount from credit field
    const amount = depositData.credit || 0;
    if (!amount) return;

    // Get customer from embedded customer subdocument
    const customer = depositData.customer;
    if (!customer?.premayor_acc) return;

    const customerAcc = customer.premayor_acc;
    const depositDate = new Date(depositData.createdAt || depositData.date);

    if (!customerMap.has(customerAcc)) {
      customerMap.set(customerAcc, {
        premayor_acc: customerAcc,
        shopID: customer.shopID || 0,
        codename: customer.codename || `Customer ${customerAcc}`,
        screenName: customer.screenName || `Customer ${customerAcc}`,
        totalAmount: 0,
        totalDeposits: 0,
        averageDeposit: 0,
        firstDate: depositDate.toISOString(),
        lastDate: depositDate.toISOString(),
        daysBetween: 0,
        avgDepositsPerDay: 0,
      });
    }

    const customerData = customerMap.get(customerAcc)!;
    customerData.totalAmount += amount;
    customerData.totalDeposits++;

    // Update first/last dates
    const currentFirst = new Date(customerData.firstDate);
    const currentLast = new Date(customerData.lastDate);

    if (depositDate < currentFirst) {
      customerData.firstDate = depositDate.toISOString();
    }
    if (depositDate > currentLast) {
      customerData.lastDate = depositDate.toISOString();
    }
  });

  // Calculate derived fields for each customer
  customerMap.forEach((customer) => {
    customer.averageDeposit =
      customer.totalDeposits > 0
        ? customer.totalAmount / customer.totalDeposits
        : 0;

    const firstDate = new Date(customer.firstDate);
    const lastDate = new Date(customer.lastDate);
    const daysDiff = Math.ceil(
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    customer.daysBetween = daysDiff || 1;
    customer.avgDepositsPerDay = customer.totalDeposits / customer.daysBetween;
  });

  const customers = Array.from(customerMap.values());

  // Calculate percentile rankings
  calculatePercentileRankings(customers);

  // Calculate statistics
  const statistics = calculateStatistics(customers);

  // Calculate percentiles
  const percentiles = calculatePercentiles(customers);

  // Calculate report period
  const reportPeriod = calculateReportPeriod(customers, startDate, endDate);

  return {
    customers,
    statistics,
    percentiles,
    reportPeriod,
  };
}

function calculatePercentileRankings(customers: CustomerDepositData[]) {
  const sortedByVolume = [...customers].sort(
    (a, b) => b.totalAmount - a.totalAmount
  );
  const sortedByFrequency = [...customers].sort(
    (a, b) => b.totalDeposits - a.totalDeposits
  );

  customers.forEach((customer) => {
    const volumePosition = sortedByVolume.findIndex(
      (c) => c.premayor_acc === customer.premayor_acc
    );
    const volumePercentile = (volumePosition / (customers.length - 1)) * 100;

    const frequencyPosition = sortedByFrequency.findIndex(
      (c) => c.premayor_acc === customer.premayor_acc
    );
    const frequencyPercentile =
      (frequencyPosition / (customers.length - 1)) * 100;

    customer.volumePercentile = getPercentileTier(volumePercentile);
    customer.frequencyPercentile = getPercentileTier(frequencyPercentile);
    customer.volumePercentileValue = volumePercentile;
    customer.frequencyPercentileValue = frequencyPercentile;
  });
}

function getPercentileTier(percentile: number): string {
  if (percentile <= 5) return "Top 5%";
  if (percentile <= 10) return "Top 10%";
  if (percentile <= 20) return "Top 20%";
  if (percentile <= 50) return "Top 50%";
  if (percentile <= 80) return "Top 80%";
  return "Bottom 20%";
}

function calculateStatistics(customers: CustomerDepositData[]) {
  const totalCustomers = customers.length;
  const totalVolume = customers.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalDeposits = customers.reduce((sum, c) => sum + c.totalDeposits, 0);
  const avgDepositAmount = totalDeposits > 0 ? totalVolume / totalDeposits : 0;
  const avgDepositsPerDay = totalDeposits / 30; // Approximate

  return {
    totalCustomers,
    totalVolume,
    avgDepositAmount,
    avgDepositsPerDay,
  };
}

function calculatePercentiles(customers: CustomerDepositData[]) {
  if (customers.length === 0) {
    return {
      top5Volume: "0%",
      top10Volume: "0%",
      top20Volume: "0%",
      top50Volume: "0%",
      top5Frequency: "0%",
      top10Frequency: "0%",
      top20Frequency: "0%",
      top50Frequency: "0%",
    };
  }

  const sortedByAmount = [...customers].sort(
    (a, b) => b.totalAmount - a.totalAmount
  );
  const sortedByDeposits = [...customers].sort(
    (a, b) => b.totalDeposits - a.totalDeposits
  );

  const totalVolume = customers.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalDeposits = customers.reduce((sum, c) => sum + c.totalDeposits, 0);

  const top5Count = Math.max(1, Math.ceil(customers.length * 0.05));
  const top10Count = Math.max(1, Math.ceil(customers.length * 0.1));
  const top20Count = Math.max(1, Math.ceil(customers.length * 0.2));
  const top50Count = Math.max(1, Math.ceil(customers.length * 0.5));

  const top5Volume = sortedByAmount
    .slice(0, top5Count)
    .reduce((sum, c) => sum + c.totalAmount, 0);
  const top10Volume = sortedByAmount
    .slice(0, top10Count)
    .reduce((sum, c) => sum + c.totalAmount, 0);
  const top20Volume = sortedByAmount
    .slice(0, top20Count)
    .reduce((sum, c) => sum + c.totalAmount, 0);
  const top50Volume = sortedByAmount
    .slice(0, top50Count)
    .reduce((sum, c) => sum + c.totalAmount, 0);

  const top5Deposits = sortedByDeposits
    .slice(0, top5Count)
    .reduce((sum, c) => sum + c.totalDeposits, 0);
  const top10Deposits = sortedByDeposits
    .slice(0, top10Count)
    .reduce((sum, c) => sum + c.totalDeposits, 0);
  const top20Deposits = sortedByDeposits
    .slice(0, top20Count)
    .reduce((sum, c) => sum + c.totalDeposits, 0);
  const top50Deposits = sortedByDeposits
    .slice(0, top50Count)
    .reduce((sum, c) => sum + c.totalDeposits, 0);

  return {
    top5Volume: `${
      totalVolume > 0 ? ((top5Volume / totalVolume) * 100).toFixed(1) : "0"
    }%`,
    top10Volume: `${
      totalVolume > 0 ? ((top10Volume / totalVolume) * 100).toFixed(1) : "0"
    }%`,
    top20Volume: `${
      totalVolume > 0 ? ((top20Volume / totalVolume) * 100).toFixed(1) : "0"
    }%`,
    top50Volume: `${
      totalVolume > 0 ? ((top50Volume / totalVolume) * 100).toFixed(1) : "0"
    }%`,
    top5Frequency: `${
      totalDeposits > 0
        ? ((top5Deposits / totalDeposits) * 100).toFixed(1)
        : "0"
    }%`,
    top10Frequency: `${
      totalDeposits > 0
        ? ((top10Deposits / totalDeposits) * 100).toFixed(1)
        : "0"
    }%`,
    top20Frequency: `${
      totalDeposits > 0
        ? ((top20Deposits / totalDeposits) * 100).toFixed(1)
        : "0"
    }%`,
    top50Frequency: `${
      totalDeposits > 0
        ? ((top50Deposits / totalDeposits) * 100).toFixed(1)
        : "0"
    }%`,
  };
}

function calculateReportPeriod(
  customers: CustomerDepositData[],
  startDate: Date,
  endDate: Date
) {
  if (customers.length === 0) {
    return {
      periodDates: "Sin datos",
      durationValue: "0 días",
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
  }

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
