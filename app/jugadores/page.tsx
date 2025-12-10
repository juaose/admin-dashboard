"use client";

import { useState } from "react";
import type { PlayerDocument } from "@juaose/lotto-shared-types";
import { getAuthHeaders } from "@/lib/client-auth";
import { dalGet } from "@/lib/dal-client";
import ReloadsModal from "@/components/jugadores/ReloadsModal";
import RedemptionsModal from "@/components/jugadores/RedemptionsModal";
import DepositsModal from "@/components/jugadores/DepositsModal";
import AccountSelectionModal from "@/components/jugadores/AccountSelectionModal";
import PlayerSearchResults from "@/components/jugadores/PlayerSearchResults";
import DepositFootprintsCard from "@/components/jugadores/DepositFootprintsCard";
import AuthorizedAccountsCard from "@/components/jugadores/AuthorizedAccountsCard";
import PlayerDataForm from "@/components/jugadores/PlayerDataForm";
import BankAccountsCard from "@/components/jugadores/BankAccountsCard";
import { getBankColorBall } from "@/components/jugadores/utils/playerUtils";

export default function JugadoresPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<PlayerDocument[]>([]);
  const [selectedPlayer, setSelectedPlayer] = useState<PlayerDocument | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalMatches, setTotalMatches] = useState(0);

  const [isEditing, setIsEditing] = useState(false);
  const [editedPlayer, setEditedPlayer] = useState<PlayerDocument | null>(null);

  // Reloads modal state
  const [showReloadsModal, setShowReloadsModal] = useState(false);
  const [reloads, setReloads] = useState<any[]>([]);
  const [loadingReloads, setLoadingReloads] = useState(false);

  // Redemptions modal state
  const [showRedemptionsModal, setShowRedemptionsModal] = useState(false);
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loadingRedemptions, setLoadingRedemptions] = useState(false);

  // Deposits modal state
  const [showDepositsModal, setShowDepositsModal] = useState(false);
  const [deposits, setDeposits] = useState<any[]>([]);
  const [loadingDeposits, setLoadingDeposits] = useState(false);

  // Host accounts for mapping IBANs to codenames
  const [hostAccounts, setHostAccounts] = useState<any[]>([]);
  const [loadingHostAccounts, setLoadingHostAccounts] = useState(false);

  // Active shops for shop selector
  const [activeShops, setActiveShops] = useState<any[]>([]);
  const [loadingShops, setLoadingShops] = useState(false);

  // Record limit for reports
  const [recordLimit, setRecordLimit] = useState(25);

  // Account selection modal state
  const [showAccountSelectionModal, setShowAccountSelectionModal] =
    useState(false);
  const [selectedAccountsForAuth, setSelectedAccountsForAuth] = useState<
    string[]
  >([]);

  const handleSearch = async () => {
    if (searchTerm.trim().length < 2) {
      setError("Ingrese al menos 2 caracteres para buscar");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await dalGet("/api/v1/players", {
        search: searchTerm,
      });

      if (!result.success) {
        throw new Error(result.error || "Error al buscar jugadores");
      }

      setSearchResults(result.data);
      setTotalMatches(result.totalMatches || result.count);

      // Auto-select if only one result
      if (result.data.length === 1) {
        handleSelectPlayer(result.data[0]);
      }
    } catch (err) {
      console.error("Error searching players:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchHostAccounts = async () => {
    try {
      setLoadingHostAccounts(true);
      const result = await dalGet("/api/v1/host-accounts");

      if (result.success) {
        setHostAccounts(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching host accounts:", err);
    } finally {
      setLoadingHostAccounts(false);
    }
  };

  const fetchActiveShops = async () => {
    try {
      setLoadingShops(true);
      const result = await dalGet("/api/v1/admins", {
        hasActiveShop: "true",
      });

      if (result.success) {
        // Apply client-side filter (defense in depth)
        const filtered = result.data.filter(
          (admin: any) => admin.hasActiveShop === true && admin.shopID
        );
        setActiveShops(filtered || []);
      }
    } catch (err) {
      console.error("Error fetching active shops:", err);
    } finally {
      setLoadingShops(false);
    }
  };

  const getCodenameFromIban = (iban: string): string => {
    const account = hostAccounts.find((acc: any) => acc.iban_num === iban);
    return account?.codename || iban.slice(0, 10) + "...";
  };

  const handleSelectPlayer = (player: PlayerDocument) => {
    setSelectedPlayer(player);
    setEditedPlayer(player);
    setIsEditing(false);

    // Fetch host accounts if not already loaded
    if (hostAccounts.length === 0) {
      fetchHostAccounts();
    }

    // Fetch active shops if not already loaded
    if (activeShops.length === 0) {
      fetchActiveShops();
    }
  };

  const [isSaving, setIsSaving] = useState(false);

  const handleEditToggle = async () => {
    if (isEditing) {
      // Save mode - send updates to API
      if (!editedPlayer || !selectedPlayer) return;

      setIsSaving(true);
      try {
        const updates: any[] = [];

        // Check what changed and prepare updates
        if (editedPlayer.codename !== selectedPlayer.codename) {
          updates.push({
            type: "codename",
            data: { codename: editedPlayer.codename },
          });
        }
        // screenName is immutable - created at account creation time
        if (editedPlayer.shopID !== selectedPlayer.shopID) {
          updates.push({
            type: "shopID",
            data: { shopID: editedPlayer.shopID },
          });
        }
        if (editedPlayer.sinpe_num !== selectedPlayer.sinpe_num) {
          updates.push({
            type: "sinpe_num",
            data: { sinpe_num: editedPlayer.sinpe_num },
          });
        }
        if (editedPlayer.whatsapp_num !== selectedPlayer.whatsapp_num) {
          updates.push({
            type: "whatsapp_num",
            data: { whatsapp_num: editedPlayer.whatsapp_num },
          });
        }
        if (editedPlayer.notes !== selectedPlayer.notes) {
          updates.push({ type: "notes", data: { notes: editedPlayer.notes } });
        }
        if (
          editedPlayer.withdrawalInstructions !==
          selectedPlayer.withdrawalInstructions
        ) {
          updates.push({
            type: "withdrawalInstructions",
            data: {
              withdrawalInstructions: editedPlayer.withdrawalInstructions,
            },
          });
        }

        // Execute all updates
        for (const update of updates) {
          const headers = await getAuthHeaders();
          const response = await fetch(
            `/api/jugadores/${selectedPlayer.premayor_acc}`,
            {
              method: "PUT",
              headers,
              body: JSON.stringify({
                updateType: update.type,
                data: update.data,
              }),
            }
          );

          const result = await response.json();
          if (!result.success) {
            alert(`Error al actualizar ${update.type}: ${result.error}`);
            return;
          }
        }

        // Refresh player data
        const refreshResult = await dalGet("/api/v1/players", {
          search: selectedPlayer.premayor_acc.toString(),
        });
        if (refreshResult.success && refreshResult.data.length > 0) {
          const updatedPlayer = refreshResult.data[0];
          setSelectedPlayer(updatedPlayer);
          setEditedPlayer(updatedPlayer);
        }

        alert("✅ Cambios guardados exitosamente");
        setIsEditing(false);
      } catch (error) {
        console.error("Error saving changes:", error);
        alert("Error al guardar cambios");
      } finally {
        setIsSaving(false);
      }
    } else {
      // Enter edit mode
      setEditedPlayer(selectedPlayer);
      setIsEditing(true);
    }
  };

  const handleFieldChange = (field: keyof PlayerDocument, value: any) => {
    if (editedPlayer) {
      setEditedPlayer({ ...editedPlayer, [field]: value });
    }
  };

  const getStatusBadge = (enabled?: boolean) => {
    if (enabled === undefined)
      return <span style={{ color: "var(--text-secondary)" }}>-</span>;
    return (
      <span
        style={{
          padding: "0.25rem 0.5rem",
          borderRadius: "4px",
          fontSize: "0.75rem",
          fontWeight: "500",
          backgroundColor: enabled
            ? "rgba(16, 185, 129, 0.1)"
            : "rgba(239, 68, 68, 0.1)",
          color: enabled ? "#10b981" : "#ef4444",
          border: `1px solid ${enabled ? "#10b981" : "#ef4444"}`,
        }}
      >
        {enabled ? "✓ Activo" : "✗ Inactivo"}
      </span>
    );
  };

  const handleVerRecargas = async () => {
    if (!selectedPlayer) return;

    try {
      setLoadingReloads(true);
      const result = await dalGet(
        `/api/v1/players/${selectedPlayer.premayor_acc}/reloads`,
        { limit: recordLimit.toString() }
      );

      if (!result.success) {
        throw new Error(result.error || "Error al cargar recargas");
      }

      setReloads(result.data || []);
      setShowReloadsModal(true);
    } catch (err) {
      console.error("Error loading reloads:", err);
      alert("Error al cargar recargas del jugador");
    } finally {
      setLoadingReloads(false);
    }
  };

  const handleVerRetiros = async () => {
    if (!selectedPlayer) return;

    try {
      setLoadingRedemptions(true);
      const result = await dalGet(
        `/api/v1/players/${selectedPlayer.premayor_acc}/redemptions`,
        { limit: recordLimit.toString() }
      );

      if (!result.success) {
        throw new Error(result.error || "Error al cargar retiros");
      }

      setRedemptions(result.data || []);
      setShowRedemptionsModal(true);
    } catch (err) {
      console.error("Error loading redemptions:", err);
      alert("Error al cargar retiros del jugador");
    } finally {
      setLoadingRedemptions(false);
    }
  };

  const handleVerDepositos = async () => {
    if (!selectedPlayer) return;

    try {
      setLoadingDeposits(true);
      const result = await dalGet(
        `/api/v1/players/${selectedPlayer.premayor_acc}/credits`,
        { limitPerBank: recordLimit.toString() }
      );

      if (!result.success) {
        throw new Error(result.error || "Error al cargar depósitos");
      }

      setDeposits(result.data || []);
      setShowDepositsModal(true);
    } catch (err) {
      console.error("Error loading deposits:", err);
      alert("Error al cargar depósitos del jugador");
    } finally {
      setLoadingDeposits(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-CR", {
      style: "currency",
      currency: "CRC",
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("es-CR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getReloadTypeInfo = (type: number) => {
    switch (type) {
      case 1: // DEPOSIT_AUTO
        return { label: "Automática", icon: "🤖", color: "#10b981" };
      case 2: // RELOAD_PRIZE
        return { label: "Premio", icon: "🎁", color: "#f59e0b" };
      case 3: // DEPOSIT_MANUAL
        return { label: "Manual", icon: "✋", color: "#6b7280" };
      default:
        return { label: "Desconocido", icon: "❓", color: "#6b7280" };
    }
  };

  return (
    <div className="p-4 md:p-6 bg-gray-50 dark:bg-gray-900 min-h-screen">
      {/* Search Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          🔍 Búsqueda de Jugadores
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Herramienta de búsqueda y gestión individual de jugadores
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Buscar por Nombre, Teléfono, Insignia o Cuenta:
            </label>
            <input
              type="text"
              placeholder="Ej: Juan, 88887777, CRUZ, 123456..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              autoFocus
              className="w-full px-4 py-3 text-base border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary"
            />
          </div>
          <button
            onClick={handleSearch}
            disabled={loading || searchTerm.trim().length < 2}
            className="self-end px-6 py-3 bg-brand-primary dark:bg-brand-secondary text-white rounded-lg hover:bg-brand-primary-alt dark:hover:bg-accent-mint hover:text-gray-900 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Buscando..." : "🔍 Buscar"}
          </button>
        </div>

        {error && (
          <div className="mt-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-600 dark:border-red-400 rounded-md text-red-600 dark:text-red-400">
            {error}
          </div>
        )}
      </div>

      {/* Search Results */}
      <PlayerSearchResults
        players={searchResults}
        totalMatches={totalMatches}
        selectedPlayer={selectedPlayer}
        onSelectPlayer={handleSelectPlayer}
      />

      {/* Selected Player Detail Panel */}
      {selectedPlayer && editedPlayer && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            👤 Detalles del Jugador: {selectedPlayer.screenName}
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Controls and Info */}
            <div className="flex flex-col gap-4">
              {/* Player Data Form */}
              <PlayerDataForm
                selectedPlayer={selectedPlayer}
                editedPlayer={editedPlayer}
                isEditing={isEditing}
                isSaving={isSaving}
                activeShops={activeShops}
                loadingShops={loadingShops}
                onEditToggle={handleEditToggle}
                onCancel={() => {
                  setIsEditing(false);
                  setEditedPlayer(selectedPlayer);
                }}
                onFieldChange={handleFieldChange}
              />

              {/* Bot Status */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="mt-0 text-gray-900 dark:text-gray-100 text-lg font-semibold mb-4">
                  🤖 Control de Bot de Recargas
                </h3>
                <div className="flex justify-between items-center">
                  <label className="font-semibold text-gray-900 dark:text-gray-100">
                    Bot de Recargas Automáticas:
                  </label>
                  <button
                    onClick={async () => {
                      if (!selectedPlayer) return;

                      const newStatus = !selectedPlayer.auto_recarga;
                      const action = newStatus ? "encenderán" : "apagarán";

                      const confirmed = window.confirm(
                        `¿Se ${action} las recargas automáticas para jugador ${selectedPlayer.screenName}?`
                      );

                      if (confirmed) {
                        try {
                          const headers = await getAuthHeaders();
                          const response = await fetch(
                            `/api/jugadores/${selectedPlayer.premayor_acc}`,
                            {
                              method: "PUT",
                              headers,
                              body: JSON.stringify({
                                updateType: "autoRecarga",
                                data: { autoRecarga: newStatus },
                              }),
                            }
                          );

                          const result = await response.json();

                          if (result.success) {
                            // Refresh player data
                            const refreshResult = await dalGet(
                              "/api/v1/players",
                              {
                                search: selectedPlayer.premayor_acc.toString(),
                              }
                            );

                            if (
                              refreshResult.success &&
                              refreshResult.data.length > 0
                            ) {
                              const updatedPlayer = refreshResult.data[0];
                              setSelectedPlayer(updatedPlayer);
                              setEditedPlayer(updatedPlayer);
                            }

                            alert(
                              `✅ Recargas automáticas ${newStatus ? "activadas" : "desactivadas"} exitosamente`
                            );
                          } else {
                            alert(`Error: ${result.error}`);
                          }
                        } catch (error) {
                          console.error("Error toggling auto-recarga:", error);
                          alert("Error al actualizar recargas automáticas");
                        }
                      }
                    }}
                    className={`px-4 py-2 rounded-md border-2 font-semibold cursor-pointer transition-all ${
                      selectedPlayer.auto_recarga
                        ? "border-green-600 dark:border-green-400 bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/30"
                        : "border-red-600 dark:border-red-400 bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/30"
                    }`}
                  >
                    {selectedPlayer.auto_recarga ? "✓ Activo" : "✗ Inactivo"}
                  </button>
                </div>
              </div>

              {/* Reports Section */}
              <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <div className="flex justify-between items-center mt-0 mb-4">
                  <h3 className="m-0 text-gray-900 dark:text-gray-100 text-lg font-semibold">
                    📊 Reportes
                  </h3>
                  <div className="flex items-center gap-2">
                    <label className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                      Registros:
                    </label>
                    <select
                      value={recordLimit}
                      onChange={(e) => setRecordLimit(parseInt(e.target.value))}
                      className="px-2 py-1 text-sm rounded border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary"
                    >
                      <option value="10">10</option>
                      <option value="25">25</option>
                      <option value="50">50</option>
                      <option value="100">100</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleVerRecargas}
                    disabled={loadingReloads}
                  >
                    {loadingReloads ? "Cargando..." : "🔄 Ver Recargas"}
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleVerRetiros}
                    disabled={loadingRedemptions}
                  >
                    {loadingRedemptions ? "Cargando..." : "💰 Ver Retiros"}
                  </button>
                  <button
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium col-span-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleVerDepositos}
                    disabled={loadingDeposits}
                  >
                    {loadingDeposits ? "Cargando..." : "🏦 Ver Depósitos"}
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column - Bank Accounts and Lists */}
            <div className="flex flex-col gap-4">
              {/* Deposit Footprints */}
              <DepositFootprintsCard
                player={selectedPlayer}
                footprints={editedPlayer.deposit_footprints || []}
                onUpdate={(updatedPlayer) => {
                  setSelectedPlayer(updatedPlayer);
                  setEditedPlayer(updatedPlayer);
                }}
              />

              {/* Authorized Reception Accounts */}
              <AuthorizedAccountsCard
                player={selectedPlayer}
                authorizedNumbers={editedPlayer.authorizedNumbers || []}
                hostAccounts={hostAccounts}
                loadingHostAccounts={loadingHostAccounts}
                onUpdate={(updatedPlayer) => {
                  setSelectedPlayer(updatedPlayer);
                  setEditedPlayer(updatedPlayer);
                }}
                onOpenModal={() => {
                  setSelectedAccountsForAuth(
                    editedPlayer.authorizedNumbers || []
                  );
                  setShowAccountSelectionModal(true);
                }}
              />

              {/* Bank Accounts */}
              <BankAccountsCard
                player={selectedPlayer}
                bankAccounts={editedPlayer.bank_accounts || []}
                onUpdate={(updatedPlayer) => {
                  setSelectedPlayer(updatedPlayer);
                  setEditedPlayer(updatedPlayer);
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!loading && searchResults.length === 0 && !selectedPlayer && (
        <div className="text-center py-16 px-8 text-gray-600 dark:text-gray-400">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-gray-900 dark:text-gray-100 text-2xl font-bold mb-3">
            Búsqueda de Jugadores
          </h2>
          <p className="text-base mb-2">
            Ingrese un nombre, teléfono, insignia o número de cuenta para buscar
            un jugador.
          </p>
          <p className="text-sm mt-4">
            La búsqueda inteligente encontrará coincidencias en todos los campos
            del jugador.
          </p>
        </div>
      )}

      {/* Modals */}
      <ReloadsModal
        isOpen={showReloadsModal}
        onClose={() => setShowReloadsModal(false)}
        reloads={reloads}
        playerName={selectedPlayer?.screenName}
        limit={recordLimit}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
        getReloadTypeInfo={getReloadTypeInfo}
      />

      <RedemptionsModal
        isOpen={showRedemptionsModal}
        onClose={() => setShowRedemptionsModal(false)}
        redemptions={redemptions}
        playerName={selectedPlayer?.screenName}
        limit={recordLimit}
        formatCurrency={formatCurrency}
      />

      <DepositsModal
        isOpen={showDepositsModal}
        onClose={() => setShowDepositsModal(false)}
        deposits={deposits}
        playerName={selectedPlayer?.screenName}
        limit={recordLimit}
        formatCurrency={formatCurrency}
        formatDate={formatDate}
      />

      {/* Account Selection Modal */}
      <AccountSelectionModal
        isOpen={showAccountSelectionModal}
        onClose={() => setShowAccountSelectionModal(false)}
        hostAccounts={hostAccounts}
        loadingHostAccounts={loadingHostAccounts}
        selectedAccounts={selectedAccountsForAuth}
        onSelectionChange={setSelectedAccountsForAuth}
        onConfirm={async () => {
          if (!selectedPlayer) return;

          // Build confirmation message with account names
          const selectedAccountNames = selectedAccountsForAuth
            .map((iban) => {
              const account = hostAccounts.find(
                (acc: any) => acc.iban_num === iban
              );
              if (account) {
                const colorBall = account.bank_id
                  ? getBankColorBall(account.bank_id)
                  : "🏦";
                return `${colorBall} ${account.codename}`;
              }
              return `🏦 ${iban}`;
            })
            .join("\n");

          const message =
            selectedAccountsForAuth.length > 0
              ? `El jugador sólo tendrá servicio de recargas automáticas en las siguientes cuentas:\n\n${selectedAccountNames}\n\n¿Confirmar cambios?`
              : `El jugador NO tendrá ninguna cuenta autorizada para recargas automáticas.\n\n¿Confirmar cambios?`;

          const confirmed = window.confirm(message);

          if (confirmed) {
            try {
              const headers = await getAuthHeaders();
              const response = await fetch(
                `/api/jugadores/${selectedPlayer.premayor_acc}`,
                {
                  method: "PUT",
                  headers,
                  body: JSON.stringify({
                    updateType: "setAuthorizedAccounts",
                    data: { authorizedNumbers: selectedAccountsForAuth },
                  }),
                }
              );

              const result = await response.json();

              if (result.success) {
                // Update local state
                handleFieldChange("authorizedNumbers", selectedAccountsForAuth);

                // Refresh player data
                const refreshResult = await dalGet("/api/v1/players", {
                  search: selectedPlayer.premayor_acc.toString(),
                });

                if (refreshResult.success && refreshResult.data.length > 0) {
                  const updatedPlayer = refreshResult.data[0];
                  setSelectedPlayer(updatedPlayer);
                  setEditedPlayer(updatedPlayer);
                }

                setShowAccountSelectionModal(false);
                alert("✅ Cuentas autorizadas actualizadas exitosamente");
              } else {
                alert(`Error: ${result.error}`);
              }
            } catch (error) {
              console.error("Error updating authorized accounts:", error);
              alert("Error al actualizar cuentas autorizadas");
            }
          }
        }}
        playerName={selectedPlayer?.screenName}
      />
    </div>
  );
}
