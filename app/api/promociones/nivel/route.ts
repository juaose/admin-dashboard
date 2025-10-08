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

    // Aggregate by bonus tier
    const tierMap = new Map<
      string,
      {
        tierName: string;
        totalBonus: number;
        bonusCount: number;
        avgBonus: number;
      }
    >();

    promotions.forEach((promo: any) => {
      const tier = promo.bonusTier || "Sin Nivel";

      if (!tierMap.has(tier)) {
        tierMap.set(tier, {
          tierName: tier,
          totalBonus: 0,
          bonusCount: 0,
          avgBonus: 0,
        });
      }

      const tierData = tierMap.get(tier)!;
      tierData.totalBonus += promo.bonusPoints || 0;
      tierData.bonusCount++;
    });

    // Calculate averages
    tierMap.forEach((tier) => {
      tier.avgBonus =
        tier.bonusCount > 0 ? tier.totalBonus / tier.bonusCount : 0;
    });

    // Convert to array and sort by total bonus
    let tiers = Array.from(tierMap.values()).sort(
      (a, b) => b.totalBonus - a.totalBonus
    );

    // Apply top 10 + "others" logic
    const topTiers = tiers.slice(0, 10);
    const otherTiers = tiers.slice(10);

    if (otherTiers.length > 0) {
      const othersTotal = otherTiers.reduce((sum, t) => sum + t.totalBonus, 0);
      const othersCount = otherTiers.reduce((sum, t) => sum + t.bonusCount, 0);

      // Only add "Otros" if it's not too big (< 2x the #1 item)
      const topItem = topTiers[0];
      if (!topItem || othersTotal < topItem.totalBonus * 2) {
        topTiers.push({
          tierName: "Otros",
          totalBonus: othersTotal,
          bonusCount: othersCount,
          avgBonus: othersCount > 0 ? othersTotal / othersCount : 0,
        });
      }
    }

    // Calculate summary cards
    const totalBonus = tiers.reduce((sum, t) => sum + t.totalBonus, 0);
    const tierCount = tiers.length;
    const avgPerTier = tierCount > 0 ? totalBonus / tierCount : 0;
    const topTier = tiers[0];

    const summaryCards = [
      {
        title: "Total Bonificado",
        value: totalBonus.toLocaleString(),
        subtitle: "Puntos totales",
        icon: "🎁",
      },
      {
        title: "Niveles Activos",
        value: tierCount.toString(),
        subtitle: "Diferentes niveles",
        icon: "🏆",
      },
      {
        title: "Promedio por Nivel",
        value: Math.round(avgPerTier).toLocaleString(),
        subtitle: "Puntos promedio",
        icon: "📊",
      },
      {
        title: "Nivel Principal",
        value: topTier?.tierName || "N/A",
        subtitle: `${topTier?.totalBonus.toLocaleString() || 0} puntos`,
        icon: "⭐",
      },
    ];

    // Chart data
    const chartData = topTiers.map((tier) => ({
      name: tier.tierName,
      value: tier.totalBonus,
      label: `${tier.totalBonus.toLocaleString()} pts`,
    }));

    // Table data
    const tableData = topTiers.map((tier) => ({
      tierName: tier.tierName,
      totalBonus: tier.totalBonus,
      bonusCount: tier.bonusCount,
      avgBonus: Math.round(tier.avgBonus),
    }));

    // Table columns configuration
    const tableColumns = [
      { key: "tierName", label: "Nivel", sortable: true },
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
    console.error("Error generating bonus tier report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de niveles de bonificación",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
