import { NextRequest, NextResponse } from "next/server";
import { PLAYER_UPDATE_IDS, playerUpdate } from "@juaose/lotto-shared-types";
import { normalizeStr } from "@juaose/lotto-utils";
import { checkUpdatePermission } from "@/lib/api-auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { DAL } = await import("@juaose/lotto-core");

    // Ensure DAL is ready
    await DAL.ensureReady();

    const premayor_acc = parseInt(params.id);
    if (isNaN(premayor_acc)) {
      return NextResponse.json(
        { success: false, error: "Invalid player ID" },
        { status: 400 }
      );
    }

    const PlayerModel = await DAL.PlayerModel;
    const player = await PlayerModel.findOne({ premayor_acc });

    if (!player) {
      return NextResponse.json(
        { success: false, error: "Player not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: player,
    });
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
    const {
      DAL,
      updatePlayer,
      findCustomerByNameTag,
      addPlayerHostAccount,
      removePlayerHostAccount,
      deleteBankAccount,
      toggleBankAccountStatus,
      toggleBankAccountFavorite,
    } = await import("@juaose/lotto-core");

    // Ensure DAL is ready
    await DAL.ensureReady();

    const premayor_acc = parseInt(params.id);
    if (isNaN(premayor_acc)) {
      return NextResponse.json(
        { success: false, error: "Invalid player ID" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { updateType, data } = body;

    // Check authorization before processing the update
    const authCheck = await checkUpdatePermission(request, updateType);
    if (!authCheck.allowed) {
      return NextResponse.json(
        { success: false, error: authCheck.error },
        { status: 403 }
      );
    }

    // Validate based on update type
    let update: playerUpdate;

    switch (updateType) {
      case "codename": {
        const codename = data.codename?.toString().trim();

        if (!codename || codename.length < 4) {
          return NextResponse.json(
            {
              success: false,
              error: "El codename debe tener al menos 4 caracteres",
            },
            { status: 400 }
          );
        }

        // Check uniqueness
        const PlayerModel = await DAL.PlayerModel;
        const existing = await PlayerModel.findOne({
          codename: codename.toUpperCase(),
          premayor_acc: { $ne: premayor_acc },
        });

        if (existing) {
          return NextResponse.json(
            { success: false, error: "Este codename ya está en uso" },
            { status: 400 }
          );
        }

        update = {
          updateId: PLAYER_UPDATE_IDS.updt_codename_updateId,
          premayor_acc,
          newStrVal: codename,
        };
        break;
      }

      case "shopID": {
        const shopID = parseInt(data.shopID);

        if (isNaN(shopID) || shopID <= 0) {
          return NextResponse.json(
            { success: false, error: "ID de tienda inválido" },
            { status: 400 }
          );
        }

        update = {
          updateId: PLAYER_UPDATE_IDS.changeShop_updateId,
          premayor_acc,
          newNumVal: shopID,
        };
        break;
      }

      case "sinpe_num": {
        const sinpe_num = parseInt(data.sinpe_num);

        if (isNaN(sinpe_num) || sinpe_num.toString().length !== 8) {
          return NextResponse.json(
            {
              success: false,
              error: "Número SINPE inválido (debe ser 8 dígitos)",
            },
            { status: 400 }
          );
        }

        update = {
          updateId: PLAYER_UPDATE_IDS.updt_sinpe_num_updateId,
          premayor_acc,
          newNumVal: sinpe_num,
        };
        break;
      }

      case "whatsapp_num": {
        const whatsapp_num = parseInt(data.whatsapp_num);

        if (isNaN(whatsapp_num) || whatsapp_num.toString().length !== 8) {
          return NextResponse.json(
            {
              success: false,
              error: "Número WhatsApp inválido (debe ser 8 dígitos)",
            },
            { status: 400 }
          );
        }

        update = {
          updateId: PLAYER_UPDATE_IDS.updt_whatsapp_num_updateId,
          premayor_acc,
          newNumVal: whatsapp_num,
        };
        break;
      }

      case "notes": {
        update = {
          updateId: PLAYER_UPDATE_IDS.add_CS_note_updateId,
          premayor_acc,
          newStrVal: data.notes || "",
        };
        break;
      }

      case "withdrawalInstructions": {
        update = {
          updateId: PLAYER_UPDATE_IDS.add_treasury_note_updateId,
          premayor_acc,
          newStrVal: data.withdrawalInstructions || "",
        };
        break;
      }

      case "addFootprint": {
        const footprint = data.footprint?.toString().trim();

        // Validate minimum length (19 chars as per backend logic)
        if (!footprint || footprint.length < 19) {
          return NextResponse.json(
            {
              success: false,
              error: "La huella debe tener al menos 19 caracteres",
            },
            { status: 400 }
          );
        }

        // Block "de los angeles" as it prevents lastname from showing
        if (footprint.toLowerCase().includes("de los angeles")) {
          return NextResponse.json(
            {
              success: false,
              error:
                'No se permite "de los angeles" en las huellas (causa errores en apellidos)',
            },
            { status: 400 }
          );
        }

        // Normalize and check uniqueness
        const normalizedFootprint = normalizeStr(footprint);
        const existingPlayer = await findCustomerByNameTag(normalizedFootprint);

        if (existingPlayer && existingPlayer.premayor_acc !== premayor_acc) {
          return NextResponse.json(
            {
              success: false,
              error: `Esta huella ya pertenece a: ${existingPlayer.screenName}`,
            },
            { status: 400 }
          );
        }

        update = {
          updateId: PLAYER_UPDATE_IDS.add_deposit_print_updateId,
          premayor_acc,
          newDepositPrint: footprint,
        };
        break;
      }

      case "removeFootprint": {
        const footprintToRemove = data.footprint;

        const PlayerModel = await DAL.PlayerModel;
        const player = await PlayerModel.findOne({ premayor_acc });

        if (!player) {
          return NextResponse.json(
            { success: false, error: "Jugador no encontrado" },
            { status: 404 }
          );
        }

        if (player.deposit_footprints) {
          player.deposit_footprints = player.deposit_footprints.filter(
            (fp: string) => fp !== footprintToRemove
          );
          const updatedPlayer = await player.save();

          return NextResponse.json({
            success: true,
            data: updatedPlayer,
          });
        }

        return NextResponse.json({
          success: true,
          data: player,
        });
      }

      case "setDepositFootprints": {
        const footprints = data.footprints;

        if (!Array.isArray(footprints)) {
          return NextResponse.json(
            { success: false, error: "footprints debe ser un array" },
            { status: 400 }
          );
        }

        const PlayerModel = await DAL.PlayerModel;
        const player = await PlayerModel.findOne({ premayor_acc });

        if (!player) {
          return NextResponse.json(
            { success: false, error: "Jugador no encontrado" },
            { status: 404 }
          );
        }

        player.deposit_footprints = footprints;
        const updatedPlayer = await player.save();

        return NextResponse.json({
          success: true,
          data: updatedPlayer,
        });
      }

      case "addAuthorizedAccount": {
        const iban = data.iban?.toString().trim();

        if (!iban) {
          return NextResponse.json(
            { success: false, error: "IBAN requerido" },
            { status: 400 }
          );
        }

        const PlayerModel = await DAL.PlayerModel;
        const player = await PlayerModel.findOne({ premayor_acc });

        if (!player) {
          return NextResponse.json(
            { success: false, error: "Jugador no encontrado" },
            { status: 404 }
          );
        }

        if (!player.authorizedNumbers) {
          player.authorizedNumbers = [];
        }

        // Check if already exists
        if (player.authorizedNumbers.includes(iban)) {
          return NextResponse.json(
            { success: false, error: "Esta cuenta ya está autorizada" },
            { status: 400 }
          );
        }

        player.authorizedNumbers.push(iban);
        const updatedPlayer = await player.save();

        return NextResponse.json({
          success: true,
          data: updatedPlayer,
        });
      }

      case "removeAuthorizedAccount": {
        const iban = data.iban;

        const PlayerModel = await DAL.PlayerModel;
        const player = await PlayerModel.findOne({ premayor_acc });

        if (!player) {
          return NextResponse.json(
            { success: false, error: "Jugador no encontrado" },
            { status: 404 }
          );
        }

        if (player.authorizedNumbers) {
          player.authorizedNumbers = player.authorizedNumbers.filter(
            (acc: string) => acc !== iban
          );
          const updatedPlayer = await player.save();

          return NextResponse.json({
            success: true,
            data: updatedPlayer,
          });
        }

        return NextResponse.json({
          success: true,
          data: player,
        });
      }

      case "setAuthorizedAccounts": {
        const authorizedNumbers = data.authorizedNumbers;

        if (!Array.isArray(authorizedNumbers)) {
          return NextResponse.json(
            { success: false, error: "authorizedNumbers debe ser un array" },
            { status: 400 }
          );
        }

        const PlayerModel = await DAL.PlayerModel;
        const player = await PlayerModel.findOne({ premayor_acc });

        if (!player) {
          return NextResponse.json(
            { success: false, error: "Jugador no encontrado" },
            { status: 404 }
          );
        }

        player.authorizedNumbers = authorizedNumbers;
        const updatedPlayer = await player.save();

        return NextResponse.json({
          success: true,
          data: updatedPlayer,
        });
      }

      case "autoRecarga": {
        update = {
          updateId: data.autoRecarga
            ? PLAYER_UPDATE_IDS.reloadBotON_updateId
            : PLAYER_UPDATE_IDS.reloadBotOFF_updateId,
          premayor_acc,
        };
        break;
      }

      case "addBankAccount": {
        const bankAccount = data.bankAccount;

        if (!bankAccount || !bankAccount.iban_num || !bankAccount.bank_id) {
          return NextResponse.json(
            { success: false, error: "Datos de cuenta bancaria incompletos" },
            { status: 400 }
          );
        }

        const PlayerModel = await DAL.PlayerModel;
        const player = await PlayerModel.findOne({ premayor_acc });

        if (!player) {
          return NextResponse.json(
            { success: false, error: "Jugador no encontrado" },
            { status: 404 }
          );
        }

        // Initialize bank_accounts array if it doesn't exist
        if (!player.bank_accounts) {
          player.bank_accounts = [];
        }

        // Check for duplicate IBAN
        const isDuplicate = player.bank_accounts.some(
          (acc: any) => acc.iban_num === bankAccount.iban_num
        );

        if (isDuplicate) {
          return NextResponse.json(
            {
              success: false,
              error: "Esta cuenta IBAN ya existe para este jugador",
            },
            { status: 400 }
          );
        }

        // Add the new bank account
        player.bank_accounts.push(bankAccount);
        const updatedPlayer = await player.save();

        return NextResponse.json({
          success: true,
          data: updatedPlayer,
        });
      }

      case "addHostAccount": {
        const { accountIban, hostAccount } = data;

        if (!accountIban || !hostAccount || !hostAccount.iban_num) {
          return NextResponse.json(
            { success: false, error: "Datos incompletos" },
            { status: 400 }
          );
        }

        const result = await addPlayerHostAccount(
          premayor_acc,
          accountIban,
          hostAccount
        );

        if (!result.success) {
          return NextResponse.json(
            {
              success: false,
              error:
                result.errorObject?.message ||
                "Error al agregar cuenta huésped",
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: result.data,
        });
      }

      case "removeHostAccount": {
        const { accountIban, hostAccount } = data;

        if (!accountIban || !hostAccount || !hostAccount.iban_num) {
          return NextResponse.json(
            { success: false, error: "Datos incompletos" },
            { status: 400 }
          );
        }

        const result = await removePlayerHostAccount(
          premayor_acc,
          accountIban,
          hostAccount.iban_num
        );

        if (!result.success) {
          return NextResponse.json(
            {
              success: false,
              error:
                result.errorObject?.message ||
                "Error al eliminar cuenta huésped",
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: result.data,
        });
      }

      case "deleteBankAccount": {
        const { accountIban } = data;

        if (!accountIban) {
          return NextResponse.json(
            { success: false, error: "IBAN de cuenta requerido" },
            { status: 400 }
          );
        }

        const result = await deleteBankAccount(premayor_acc, accountIban);

        if (!result.success) {
          return NextResponse.json(
            {
              success: false,
              error:
                result.errorObject?.message ||
                "Error al eliminar cuenta bancaria",
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: result.data,
        });
      }

      case "toggleBankAccountStatus": {
        const { accountIban, isActive } = data;

        if (!accountIban || typeof isActive !== "boolean") {
          return NextResponse.json(
            { success: false, error: "Datos incompletos" },
            { status: 400 }
          );
        }

        const result = await toggleBankAccountStatus(
          premayor_acc,
          accountIban,
          isActive
        );

        if (!result.success) {
          return NextResponse.json(
            {
              success: false,
              error:
                result.errorObject?.message ||
                "Error al cambiar estado de cuenta bancaria",
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: result.data,
        });
      }

      case "toggleBankAccountFavorite": {
        const { accountIban, isFavorite } = data;

        if (!accountIban || typeof isFavorite !== "boolean") {
          return NextResponse.json(
            { success: false, error: "Datos incompletos" },
            { status: 400 }
          );
        }

        const result = await toggleBankAccountFavorite(
          premayor_acc,
          accountIban,
          isFavorite
        );

        if (!result.success) {
          return NextResponse.json(
            {
              success: false,
              error:
                result.errorObject?.message ||
                "Error al cambiar cuenta favorita",
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          data: result.data,
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: "Tipo de actualización no soportado" },
          { status: 400 }
        );
    }

    // Execute update using lotto-core's updatePlayer
    const result = await updatePlayer(update);

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.errorObject?.message || "Error al actualizar jugador",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data,
    });
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
