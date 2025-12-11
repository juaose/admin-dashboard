import { NextRequest, NextResponse } from "next/server";
import { checkUpdatePermission, getAuthTokenFromRequest } from "@/lib/api-auth";
import {
  dalPostServer,
  dalPatchServer,
  dalDeleteServer,
} from "../../../../lib/dal-server-client";

// These operations use DEDICATED ENDPOINTS:
// - addHostAccount → POST /api/v1/players/:id/host-accounts
// - removeHostAccount → DELETE /api/v1/players/:id/host-accounts/:accountId
// - toggleBankAccountStatus → PATCH /api/v1/players/:id/bank-accounts/:accountId/toggle-status
// - toggleBankAccountFavorite → PATCH /api/v1/players/:id/bank-accounts/:accountId/toggle-favorite
// - addFootprint → POST /api/v1/players/:id/footprints
// - addBankAccount → POST /api/v1/players/:id/bank-accounts
// - deleteBankAccount → DELETE /api/v1/players/:id/bank-accounts/:accountId

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

    // Extract JWT token to forward to API Gateway
    const authToken = getAuthTokenFromRequest(request);
    if (!authToken) {
      return NextResponse.json(
        { success: false, error: "No authentication token found" },
        { status: 401 }
      );
    }

    // Route to dedicated endpoints
    if (updateType === "addHostAccount") {
      const result = await dalPostServer(
        `/api/v1/players/${params.id}/host-accounts`,
        {
          accountIban: data.accountIban,
          hostAccount: data.hostAccount,
        },
        authToken
      );
      return NextResponse.json(result);
    }

    if (updateType === "removeHostAccount") {
      const result = await dalDeleteServer(
        `/api/v1/players/${params.id}/host-accounts/${data.hostAccount.iban_num}?bankAccountIban=${data.accountIban}`,
        authToken
      );
      return NextResponse.json(result);
    }

    if (updateType === "toggleBankAccountStatus") {
      const result = await dalPatchServer(
        `/api/v1/players/${params.id}/bank-accounts/${data.accountIban}/toggle-status`,
        { isActive: data.isActive },
        authToken
      );
      return NextResponse.json(result);
    }

    if (updateType === "toggleBankAccountFavorite") {
      const result = await dalPatchServer(
        `/api/v1/players/${params.id}/bank-accounts/${data.accountIban}/toggle-favorite`,
        { isFavorite: data.isFavorite },
        authToken
      );
      return NextResponse.json(result);
    }

    if (updateType === "addFootprint") {
      const result = await dalPostServer(
        `/api/v1/players/${params.id}/footprints`,
        { footprint: data.footprint },
        authToken
      );
      return NextResponse.json(result);
    }

    if (updateType === "removeFootprint") {
      const result = await dalDeleteServer(
        `/api/v1/players/${params.id}/footprints/${encodeURIComponent(data.footprint)}`,
        authToken
      );
      return NextResponse.json(result);
    }

    if (updateType === "removeAuthorizedAccount") {
      const result = await dalDeleteServer(
        `/api/v1/players/${params.id}/authorized-numbers/${encodeURIComponent(data.iban)}`,
        authToken
      );
      return NextResponse.json(result);
    }

    if (updateType === "addBankAccount") {
      const result = await dalPostServer(
        `/api/v1/players/${params.id}/bank-accounts`,
        { bankAccount: data.bank_accounts?.[0] || data.bankAccount },
        authToken
      );
      return NextResponse.json(result);
    }

    if (updateType === "deleteBankAccount") {
      const result = await dalDeleteServer(
        `/api/v1/players/${params.id}/bank-accounts/${data.accountIban}`,
        authToken
      );
      return NextResponse.json(result);
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
    const result = await dalPatchServer(
      `/api/v1/players/${params.id}`,
      patchData,
      authToken
    );

    return NextResponse.json(result);
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
