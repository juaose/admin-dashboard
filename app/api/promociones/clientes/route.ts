import { NextRequest, NextResponse } from "next/server";

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

    // Import lotto-core DAL
    const { DAL } = await import("@juaose/lotto-core");

    const PromotionModel = await DAL.PromotionModel;

    // Fetch promotions within date range
    const promotions = await PromotionModel.find({
      createdAt: {
        $gte: startDate,
        $lte: endDate,
      },
    }).lean();

    // Aggregate by customer (using premayor_acc as unique identifier)
    const customerMap = new Map<
      string,
      {
        customerName: string;
        premayor_acc: number;
        totalBonus: number;
        bonusCount: number;
        avgBonus: number;
        lastBonus: Date;
      }
    >();

    promotions.forEach((promo: any) => {
      const customerAcc = promo.customer?.premayor_acc;
      if (!customerAcc) return;

      const customerId = customerAcc.toString();
      const customerName =
        promo.customer?.screenName || `Cliente ${customerAcc}`;

      if (!customerMap.has(customerId)) {
        customerMap.set(customerId, {
          customerName,
          premayor_acc: customerAcc,
          totalBonus: 0,
          bonusCount: 0,
          avgBonus: 0,
          lastBonus: new Date(promo.createdAt),
        });
      }

      const customerData = customerMap.get(customerId)!;
      customerData.totalBonus += promo.bonusPoints || 0;
      customerData.bonusCount++;

      const promoDate = new Date(promo.createdAt);
      if (promoDate > customerData.lastBonus) {
        customerData.lastBonus = promoDate;
      }
    });

    // Calculate averages
    customerMap.forEach((customer) => {
      customer.avgBonus =
        customer.bonusCount > 0 ? customer.totalBonus / customer.bonusCount : 0;
    });

    // Convert to array and sort by total bonus
    let customers = Array.from(customerMap.values()).sort(
      (a, b) => b.totalBonus - a.totalBonus
    );

    // Apply top 10 + "others" logic
    const topCustomers = customers.slice(0, 10);
    const otherCustomers = customers.slice(10);

    if (otherCustomers.length > 0) {
      const othersTotal = otherCustomers.reduce(
        (sum, c) => sum + c.totalBonus,
        0
      );
      const othersCount = otherCustomers.reduce(
        (sum, c) => sum + c.bonusCount,
        0
      );

      // Only add "Otros" if it's not too big (< 2x the #1 item)
      const topItem = topCustomers[0];
      if (!topItem || othersTotal < topItem.totalBonus * 2) {
        topCustomers.push({
          customerName: "Otros",
          premayor_acc: 0,
          totalBonus: othersTotal,
          bonusCount: othersCount,
          avgBonus: othersCount > 0 ? othersTotal / othersCount : 0,
          lastBonus: new Date(),
        });
      }
    }

    // Calculate summary cards
    const totalBonus = customers.reduce((sum, c) => sum + c.totalBonus, 0);
    const customerCount = customers.length;
    const avgPerCustomer = customerCount > 0 ? totalBonus / customerCount : 0;
    const topCustomer = customers[0];

    const summaryCards = [
      {
        title: "Total Bonificado",
        value: totalBonus.toLocaleString(),
        subtitle: "Puntos totales",
        icon: "🎁",
      },
      {
        title: "Clientes Activos",
        value: customerCount.toString(),
        subtitle: "Con bonificaciones",
        icon: "👥",
      },
      {
        title: "Promedio por Cliente",
        value: Math.round(avgPerCustomer).toLocaleString(),
        subtitle: "Puntos promedio",
        icon: "📊",
      },
      {
        title: "Cliente Principal",
        value: topCustomer?.customerName || "N/A",
        subtitle: `${topCustomer?.totalBonus.toLocaleString() || 0} puntos`,
        icon: "⭐",
      },
    ];

    // Chart data
    const chartData = topCustomers.map((customer) => ({
      name: customer.customerName,
      value: customer.totalBonus,
      label: `${customer.totalBonus.toLocaleString()} pts`,
    }));

    // Table data
    const tableData = topCustomers.map((customer) => ({
      customerName: customer.customerName,
      totalBonus: customer.totalBonus,
      bonusCount: customer.bonusCount,
      avgBonus: Math.round(customer.avgBonus),
      lastBonus: customer.lastBonus.toLocaleDateString("es-CR"),
    }));

    // Table columns configuration
    const tableColumns = [
      { key: "customerName", label: "Cliente", sortable: true },
      {
        key: "totalBonus",
        label: "Total Bonificado",
        sortable: true,
        format: "number",
      },
      {
        key: "bonusCount",
        label: "Cantidad",
        sortable: true,
        format: "number",
      },
      { key: "avgBonus", label: "Promedio", sortable: true, format: "number" },
      { key: "lastBonus", label: "Último Bonus", sortable: true },
    ];

    return NextResponse.json({
      success: true,
      data: {
        summaryCards,
        chartData,
        tableData,
        tableColumns,
      },
    });
  } catch (error) {
    console.error("Error generating customer bonus report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de bonificaciones por cliente",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
