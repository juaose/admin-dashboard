import { NextRequest, NextResponse } from "next/server";
import { checkUpdatePermission } from "@/lib/api-auth";
import { dalGet } from "../../../../lib/dal-client";

// Simple field mapping - maps frontend field names to API field names
const SIMPLE_FIELDS = [
  "auto_recarga",
  "shopID",
  "codename",
  "sinpe_num",
  "whatsapp_num",
  "notes",
  "withdrawalInstructions",
];

// These operations use DEDICATED ENDPOINTS:
// - addHostAccount → POST /api/v1/players/:id/host-accounts
// - removeHostAccount → DELETE /api/v1/players/:id/host-accounts/:accountId
// - toggleBankAccountStatus → PATCH /api/v1/players/:id/bank-accounts/:accountId/toggle-status
// - toggleBankAccountFavorite → PATCH /api/v1/players/:id/bank-accounts/:accountId/toggle-favorite
// - addFootprint → POST /api/v1/players/:id/footprints
// - addBankAccount → POST /api/v1/players/:id/bank-accounts
// - deleteBankAccount → DELETE /api/v1/players/:id/bank-accounts/:accountId

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const premayor_acc = parseInt(params.id);
    if (isNaN(premayor_acc)) {
      return NextResponse.json(
        { success: false, error: "Invalid player ID" },
        { status: 400 }
      );
    }

    // Call DAL API
    const result = await dalGet(`/api/v1/players/${params.id}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching player:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error fetching player",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const premayor_acc = parseInt(params.id);
    if (isNaN(premayor_acc)) {
      return NextResponse.json(
        { success: false, error: "Invalid player ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { updateType, data } = body;

    if (!updateType) {
      return NextResponse.json(
        { success: false, error: "updateType is required" },
        { status: 400 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { success: false, error: "data is required" },
        { status: 400 }
      );
    }

    // Check authorization before processing the update
    const authCheck = await checkUpdatePermission(request, updateType);
    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 }
      );
    }

    // Route to dedicated endpoints
    if (updateType === "addHostAccount") {
      const result = await fetch(
        `${process.env.DAL_API_URL}/api/v1/players/${params.id}/host-accounts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            accountIban: data.accountIban,
            hostAccount: data.hostAccount,
          }),
        }
      );
      return NextResponse.json(await result.json());
    }

    if (updateType === "removeHostAccount") {
      const result = await fetch(
        `${process.env.DAL_API_URL}/api/v1/players/${params.id}/host-accounts/${data.hostAccount.iban_num}?bankAccountIban=${data.accountIban}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      return NextResponse.json(await result.json());
    }

    if (updateType === "toggleBankAccountStatus") {
      const result = await fetch(
        `${process.env.DAL_API_URL}/api/v1/players/${params.id}/bank-accounts/${data.accountIban}/toggle-status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isActive: data.isActive }),
        }
      );
      return NextResponse.json(await result.json());
    }

    if (updateType === "toggleBankAccountFavorite") {
      const result = await fetch(
        `${process.env.DAL_API_URL}/api/v1/players/${params.id}/bank-accounts/${data.accountIban}/toggle-favorite`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isFavorite: data.isFavorite }),
        }
      );
      return NextResponse.json(await result.json());
    }

    if (updateType === "addFootprint") {
      const result = await fetch(
        `${process.env.DAL_API_URL}/api/v1/players/${params.id}/footprints`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ footprint: data.footprint }),
        }
      );
      return NextResponse.json(await result.json());
    }

    if (updateType === "removeFootprint") {
      const result = await fetch(
        `${process.env.DAL_API_URL}/api/v1/players/${params.id}/footprints/${encodeURIComponent(data.footprint)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      return NextResponse.json(await result.json());
    }

    if (updateType === "removeAuthorizedAccount") {
      const result = await fetch(
        `${process.env.DAL_API_URL}/api/v1/players/${params.id}/authorized-numbers/${encodeURIComponent(data.iban)}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      return NextResponse.json(await result.json());
    }

    if (updateType === "addBankAccount") {
      const result = await fetch(
        `${process.env.DAL_API_URL}/api/v1/players/${params.id}/bank-accounts`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bankAccount: data.bank_accounts?.[0] || data.bankAccount,
          }),
        }
      );
      return NextResponse.json(await result.json());
    }

    if (updateType === "deleteBankAccount") {
      const result = await fetch(
        `${process.env.DAL_API_URL}/api/v1/players/${params.id}/bank-accounts/${data.accountIban}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
        }
      );
      return NextResponse.json(await result.json());
    }

    // For simple field updates, use the new clean PATCH endpoint
    // Just send the field value directly!
    const patchData: any = {};

    // Map updateType to field name and prepare value
    if (updateType === "autoRecarga") {
      patchData.auto_recarga = data.autoRecarga;
    } else if (updateType === "shopID") {
      patchData.shopID = data.shopID;
    } else if (updateType === "codename") {
      patchData.codename = data.codename;
    } else if (updateType === "sinpe_num") {
      patchData.sinpe_num = data.sinpe_num;
    } else if (updateType === "whatsapp_num") {
      patchData.whatsapp_num = data.whatsapp_num;
    } else if (updateType === "notes") {
      patchData.notes = data.notes;
    } else if (updateType === "withdrawalInstructions") {
      patchData.withdrawalInstructions = data.withdrawalInstructions;
    } else if (updateType === "setAuthorizedAccounts") {
      patchData.authorizedNumbers = data.authorizedNumbers;
    } else {
      return NextResponse.json(
        { success: false, error: `Unknown updateType: ${updateType}` },
        { status: 400 }
      );
    }

    // Call DAL API with clean field-based PATCH
    const result = await fetch(
      `${process.env.DAL_API_URL}/api/v1/players/${params.id}`,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchData),
      }
    );

    return NextResponse.json(await result.json());
  } catch (error) {
    console.error("Error updating player:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Error al actualizar jugador",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
