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

    // Payment method mapping
    const paymentMethodNames: Record<string, string> = {
      "12": "Transferencia Intrabancaria",
      "13": "Transferencia Interbancaria",
      "14": "SINPE Móvil",
      "15": "Bitcoin/Lightning",
    };

    // Aggregate by payment method
    const methodMap = new Map<
      string,
      {
        methodName: string;
        totalBonus: number;
        bonusCount: number;
        avgBonus: number;
      }
    >();

    promotions.forEach((promo: any) => {
      const methodCode = promo.paymentMethod || "unknown";
      const methodName =
        paymentMethodNames[methodCode] || `Método ${methodCode}`;

      if (!methodMap.has(methodCode)) {
        methodMap.set(methodCode, {
          methodName,
          totalBonus: 0,
          bonusCount: 0,
          avgBonus: 0,
        });
      }

      const methodData = methodMap.get(methodCode)!;
      methodData.totalBonus += promo.bonusPoints || 0;
      methodData.bonusCount++;
    });

    // Calculate averages
    methodMap.forEach((method) => {
      method.avgBonus =
        method.bonusCount > 0 ? method.totalBonus / method.bonusCount : 0;
    });

    // Convert to array and sort by total bonus
    const methods = Array.from(methodMap.values()).sort(
      (a, b) => b.totalBonus - a.totalBonus
    );

    // Calculate summary cards
    const totalBonus = methods.reduce((sum, m) => sum + m.totalBonus, 0);
    const methodCount = methods.length;
    const avgPerMethod = methodCount > 0 ? totalBonus / methodCount : 0;
    const topMethod = methods[0];

    const summaryCards = [
      {
        title: "Total Bonificado",
        value: totalBonus.toLocaleString(),
        subtitle: "Puntos totales",
        icon: "🎁",
      },
      {
        title: "Métodos Activos",
        value: methodCount.toString(),
        subtitle: "Diferentes métodos",
        icon: "💳",
      },
      {
        title: "Promedio por Método",
        value: Math.round(avgPerMethod).toLocaleString(),
        subtitle: "Puntos promedio",
        icon: "📊",
      },
      {
        title: "Método Principal",
        value: topMethod?.methodName || "N/A",
        subtitle: `${topMethod?.totalBonus.toLocaleString() || 0} puntos`,
        icon: "⭐",
      },
    ];

    // Chart data
    const chartData = methods.map((method) => ({
      name: method.methodName,
      value: method.totalBonus,
      label: `${method.totalBonus.toLocaleString()} pts`,
    }));

    // Table data
    const tableData = methods.map((method) => ({
      methodName: method.methodName,
      totalBonus: method.totalBonus,
      bonusCount: method.bonusCount,
      avgBonus: Math.round(method.avgBonus),
    }));

    // Table columns configuration
    const tableColumns = [
      { key: "methodName", label: "Método de Pago", sortable: true },
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
    console.error("Error generating payment method bonus report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de bonificaciones por método de pago",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
