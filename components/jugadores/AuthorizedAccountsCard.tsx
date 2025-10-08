import type { PlayerDocument } from "@juaose/lotto-shared-types";
import { getAuthHeaders } from "@/lib/client-auth";
import { getBankColorBall } from "./utils/playerUtils";

interface AuthorizedAccountsCardProps {
  player: PlayerDocument;
  authorizedNumbers: string[];
  hostAccounts: any[];
  loadingHostAccounts: boolean;
  onUpdate: (updatedPlayer: PlayerDocument) => void;
  onOpenModal: () => void;
}

export default function AuthorizedAccountsCard({
  player,
  authorizedNumbers,
  hostAccounts,
  loadingHostAccounts,
  onUpdate,
  onOpenModal,
}: AuthorizedAccountsCardProps) {
  const handleDeleteAccount = async (iban: string) => {
    const account = hostAccounts.find((acc: any) => acc.iban_num === iban);
    const accountName = account?.codename || iban;
    const colorBall = account?.bank_id
      ? getBankColorBall(account.bank_id)
      : "🏦";

    const confirmed = window.confirm(
      `¿Eliminar la cuenta autorizada?\n\n${colorBall} ${accountName}\n\nEl jugador ya no podrá recibir recargas automáticas en esta cuenta.`
    );

    if (!confirmed) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/jugadores/${player.premayor_acc}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          updateType: "removeAuthorizedAccount",
          data: { iban },
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Refresh player data
        const refreshResponse = await fetch(
          `/api/jugadores?search=${player.premayor_acc}`
        );
        const refreshResult = await refreshResponse.json();

        if (refreshResult.success && refreshResult.data.length > 0) {
          onUpdate(refreshResult.data[0]);
        }

        alert("✅ Cuenta autorizada eliminada exitosamente");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error removing authorized account:", error);
      alert("Error al eliminar cuenta autorizada");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="mt-0 text-gray-900 dark:text-gray-100 text-lg font-semibold">
        🏦 Cuentas de Recepción Autorizadas
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Cuentas del negocio donde el cliente puede depositar
      </p>
      <div className="flex flex-col gap-2">
        {authorizedNumbers && authorizedNumbers.length > 0 ? (
          authorizedNumbers.map((iban: string, idx: number) => {
            const account = hostAccounts.find(
              (acc: any) => acc.iban_num === iban
            );
            const bankCode = account?.bank_id;
            const codename = account?.codename || iban;

            return (
              <div
                key={idx}
                className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
              >
                <div className="flex flex-col gap-1 flex-1">
                  <div className="flex items-center gap-2">
                    {bankCode ? (
                      <span>{getBankColorBall(bankCode)}</span>
                    ) : (
                      <span>🏦</span>
                    )}
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                      {loadingHostAccounts ? "Cargando..." : codename}
                    </span>
                  </div>
                  <span className="text-[0.7rem] text-gray-500 dark:text-gray-400 font-mono opacity-70">
                    {iban}
                  </span>
                </div>
                <button
                  onClick={() => handleDeleteAccount(iban)}
                  className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded cursor-pointer hover:opacity-80 transition-opacity"
                >
                  🗑️
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic text-sm">
            No hay cuentas autorizadas
          </p>
        )}
        <button
          className="mt-2 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          onClick={onOpenModal}
        >
          ➕ Agregar Cuenta Autorizada
        </button>
      </div>
    </div>
  );
}
