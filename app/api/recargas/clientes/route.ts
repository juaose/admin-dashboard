import { NextRequest, NextResponse } from "next/server";

interface CustomerReloadData {
  premayor_acc: number;
  shopID: number;
  codename: string;
  screenName: string;
  totalAmount: number;
  totalReloads: number;
  averageReload: number;
  firstDate: string;
  lastDate: string;
  daysBetween: number;
  avgReloadsPerDay: number;
  volumePercentile?: string;
  frequencyPercentile?: string;
  volumePercentileValue?: number;
  frequencyPercentileValue?: number;
}

interface ReportData {
  customers: CustomerReloadData[];
  statistics: {
    totalCustomers: number;
    totalVolume: number;
    avgReloadAmount: number;
    avgReloadsPerDay: number;
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

    const reloads = reloadsResult.data;

    // Aggregate data by customer
    const reportData = aggregateCustomerData(reloads, startDate, endDate);

    return NextResponse.json({
      success: true,
      data: reportData,
    });
  } catch (error) {
    console.error("Error generating customer reloads report:", error);
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
  reloads: any[],
  startDate: Date,
  endDate: Date
): ReportData {
  // Group reloads by customer
  const customerMap = new Map<number, CustomerReloadData>();

  reloads.forEach((reload) => {
    const reloadData = (reload as any)._doc || reload;

    if (!reloadData.customer?.premayor_acc || !reloadData.amount) {
      return;
    }

    const customerAcc = reloadData.customer.premayor_acc;
    const reloadDate = new Date(reloadData.createdAt || reloadData.date);

    if (!customerMap.has(customerAcc)) {
      customerMap.set(customerAcc, {
        premayor_acc: customerAcc,
        shopID: reloadData.customer.shopID || 0,
        codename: reloadData.customer.codename || `Customer ${customerAcc}`,
        screenName: reloadData.customer.screenName || `Customer ${customerAcc}`,
        totalAmount: 0,
        totalReloads: 0,
        averageReload: 0,
        firstDate: reloadDate.toISOString(),
        lastDate: reloadDate.toISOString(),
        daysBetween: 0,
        avgReloadsPerDay: 0,
      });
    }

    const customer = customerMap.get(customerAcc)!;
    customer.totalAmount += reloadData.amount;
    customer.totalReloads++;

    // Update first/last dates
    const currentFirst = new Date(customer.firstDate);
    const currentLast = new Date(customer.lastDate);

    if (reloadDate < currentFirst) {
      customer.firstDate = reloadDate.toISOString();
    }
    if (reloadDate > currentLast) {
      customer.lastDate = reloadDate.toISOString();
    }
  });

  // Calculate derived fields for each customer
  customerMap.forEach((customer) => {
    customer.averageReload =
      customer.totalReloads > 0
        ? customer.totalAmount / customer.totalReloads
        : 0;

    const firstDate = new Date(customer.firstDate);
    const lastDate = new Date(customer.lastDate);
    const daysDiff = Math.ceil(
      (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    customer.daysBetween = daysDiff || 1;
    customer.avgReloadsPerDay = customer.totalReloads / customer.daysBetween;
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

function calculatePercentileRankings(customers: CustomerReloadData[]) {
  const sortedByVolume = [...customers].sort(
    (a, b) => b.totalAmount - a.totalAmount
  );
  const sortedByFrequency = [...customers].sort(
    (a, b) => b.totalReloads - a.totalReloads
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
  if (percentile <= 5) return "05";
  if (percentile <= 10) return "10";
  if (percentile <= 20) return "20";
  if (percentile <= 50) return "50";
  if (percentile <= 80) return "80";
  return "95";
}

function calculateStatistics(customers: CustomerReloadData[]) {
  const totalCustomers = customers.length;
  const totalVolume = customers.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalReloads = customers.reduce((sum, c) => sum + c.totalReloads, 0);
  const avgReloadAmount = totalReloads > 0 ? totalVolume / totalReloads : 0;
  const avgReloadsPerDay = totalReloads / 30; // Approximate

  return {
    totalCustomers,
    totalVolume,
    avgReloadAmount,
    avgReloadsPerDay,
  };
}

function calculatePercentiles(customers: CustomerReloadData[]) {
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
  const sortedByReloads = [...customers].sort(
    (a, b) => b.totalReloads - a.totalReloads
  );

  const totalVolume = customers.reduce((sum, c) => sum + c.totalAmount, 0);
  const totalReloads = customers.reduce((sum, c) => sum + c.totalReloads, 0);

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

  const top5Reloads = sortedByReloads
    .slice(0, top5Count)
    .reduce((sum, c) => sum + c.totalReloads, 0);
  const top10Reloads = sortedByReloads
    .slice(0, top10Count)
    .reduce((sum, c) => sum + c.totalReloads, 0);
  const top20Reloads = sortedByReloads
    .slice(0, top20Count)
    .reduce((sum, c) => sum + c.totalReloads, 0);
  const top50Reloads = sortedByReloads
    .slice(0, top50Count)
    .reduce((sum, c) => sum + c.totalReloads, 0);

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
      totalReloads > 0 ? ((top5Reloads / totalReloads) * 100).toFixed(1) : "0"
    }%`,
    top10Frequency: `${
      totalReloads > 0 ? ((top10Reloads / totalReloads) * 100).toFixed(1) : "0"
    }%`,
    top20Frequency: `${
      totalReloads > 0 ? ((top20Reloads / totalReloads) * 100).toFixed(1) : "0"
    }%`,
    top50Frequency: `${
      totalReloads > 0 ? ((top50Reloads / totalReloads) * 100).toFixed(1) : "0"
    }%`,
  };
}

function calculateReportPeriod(
  customers: CustomerReloadData[],
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
