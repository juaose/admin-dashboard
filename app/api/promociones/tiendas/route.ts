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

    // Shop name mapping
    const shopNames: Record<number, string> = {
      1: "Tienda 1",
      2: "Tienda 2",
      3: "Tienda 3",
      4: "Tienda 4",
      5: "Tienda 5",
    };

    // Aggregate by shop
    const shopMap = new Map<
      number,
      {
        shopName: string;
        shopID: number;
        totalBonus: number;
        bonusCount: number;
        customerCount: number;
      }
    >();

    promotions.forEach((promo: any) => {
      const shopID = promo.customer?.shopID;
      if (!shopID) return;

      const shopName = shopNames[shopID] || `Tienda ${shopID}`;

      if (!shopMap.has(shopID)) {
        shopMap.set(shopID, {
          shopName,
          shopID,
          totalBonus: 0,
          bonusCount: 0,
          customerCount: 0,
        });
      }

      const shopData = shopMap.get(shopID)!;
      shopData.totalBonus += promo.bonusPoints || 0;
      shopData.bonusCount++;
    });

    // Count unique customers per shop
    const shopCustomers = new Map<number, Set<number>>();
    promotions.forEach((promo: any) => {
      const shopID = promo.customer?.shopID;
      const customerAcc = promo.customer?.premayor_acc;
      if (!shopID || !customerAcc) return;

      if (!shopCustomers.has(shopID)) {
        shopCustomers.set(shopID, new Set());
      }
      shopCustomers.get(shopID)!.add(customerAcc);
    });

    shopCustomers.forEach((customers, shopID) => {
      const shopData = shopMap.get(shopID);
      if (shopData) {
        shopData.customerCount = customers.size;
      }
    });

    // Convert to array and sort by total bonus
    const shops = Array.from(shopMap.values()).sort(
      (a, b) => b.totalBonus - a.totalBonus
    );

    // Calculate summary cards
    const totalBonus = shops.reduce((sum, s) => sum + s.totalBonus, 0);
    const shopCount = shops.length;
    const avgPerShop = shopCount > 0 ? totalBonus / shopCount : 0;
    const topShop = shops[0];

    const summaryCards = [
      {
        title: "Total Bonificado",
        value: totalBonus.toLocaleString(),
        subtitle: "Puntos totales",
        icon: "🎁",
      },
      {
        title: "Tiendas Activas",
        value: shopCount.toString(),
        subtitle: "Con bonificaciones",
        icon: "🏪",
      },
      {
        title: "Promedio por Tienda",
        value: Math.round(avgPerShop).toLocaleString(),
        subtitle: "Puntos promedio",
        icon: "📊",
      },
      {
        title: "Tienda Principal",
        value: topShop?.shopName || "N/A",
        subtitle: `${topShop?.totalBonus.toLocaleString() || 0} puntos`,
        icon: "⭐",
      },
    ];

    // Chart data
    const chartData = shops.map((shop) => ({
      name: shop.shopName,
      value: shop.totalBonus,
      label: `${shop.totalBonus.toLocaleString()} pts`,
    }));

    // Table data
    const tableData = shops.map((shop) => ({
      shopName: shop.shopName,
      totalBonus: shop.totalBonus,
      bonusCount: shop.bonusCount,
      customerCount: shop.customerCount,
    }));

    // Table columns configuration
    const tableColumns = [
      { key: "shopName", label: "Tienda", sortable: true },
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
      {
        key: "customerCount",
        label: "Clientes",
        sortable: true,
        format: "number",
      },
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
    console.error("Error generating shop bonus report:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al generar reporte de bonificaciones por tienda",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
