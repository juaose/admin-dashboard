import { useState, useEffect } from "react";
import type { BankAccountDocument, hostAccountDoc } from "@juaose/lotto-shared-types";
import { getAuthHeaders } from "@/lib/client-auth";
import { getBankColorBall } from "./utils/playerUtils";

interface ManageHostAccountsModalProps {
  isOpen: boolean;
  onClose: () => void;
  account: BankAccountDocument;
  playerAccNumber: number;
  onUpdate: () => void;
}

export default function ManageHostAccountsModal({
  isOpen,
  onClose,
  account,
  playerAccNumber,
  onUpdate,
}: ManageHostAccountsModalProps) {
  const [hostAccounts, setHostAccounts] = useState<hostAccountDoc[]>([]);
  const [loadingHostAccounts, setLoadingHostAccounts] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Local state for matriculated accounts - updates immediately for hot-updates
  const [localMatriculatedAccounts, setLocalMatriculatedAccounts] = useState<any[]>(
    account.includedIn || []
  );

  // Reset local state when account changes or modal opens
  useEffect(() => {
    setLocalMatriculatedAccounts(account.includedIn || []);
  }, [account.includedIn, isOpen]);

  useEffect(() => {
    if (isOpen && account.bank_id) {
      fetchHostAccounts(account.bank_id);
    }
  }, [isOpen, account.bank_id]);

  const fetchHostAccounts = async (bankId: number) => {
    try {
      setLoadingHostAccounts(true);
      const response = await fetch(`/api/directorios/cuentas/${bankId}`);
      const result = await response.json();

      if (response.ok && result.success) {
        setHostAccounts(result.data || []);
      } else {
        console.error("Error fetching host accounts:", result.error);
        setHostAccounts([]);
      }
    } catch (error) {
      console.error("Error fetching host accounts:", error);
      setHostAccounts([]);
    } finally {
      setLoadingHostAccounts(false);
    }
  };

  const isHostMatriculated = (hostIban: string): boolean => {
    return localMatriculatedAccounts.some((h) => h.iban_num === hostIban);
  };

  const handleToggleHost = async (host: hostAccountDoc) => {
    const isCurrentlyMatriculated = isHostMatriculated(host.iban_num);
    setIsSubmitting(true);

    try {
      const hostAccountData = {
        iban_num: host.iban_num,
        bank_name: host.bank_name,
        bank_id: host.bank_id,
        codename: host.codename,
        accountID: host.accountID,
        teamID: host.teamID,
        holders_id: host.holders_id,
        telegramChatName: host.telegramChatName,
        autoReload: host.autoReload,
      };

      const headers = await getAuthHeaders();
      const response = await fetch(`/api/jugadores/${playerAccNumber}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          updateType: isCurrentlyMatriculated ? "removeHostAccount" : "addHostAccount",
          data: {
            accountIban: account.iban_num,
            hostAccount: hostAccountData,
          },
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update local state immediately for hot-updates
        if (isCurrentlyMatriculated) {
          // Remove from local state
          setLocalMatriculatedAccounts((prev) =>
            prev.filter((h) => h.iban_num !== host.iban_num)
          );
        } else {
          // Add to local state
          setLocalMatriculatedAccounts((prev) => [...prev, hostAccountData]);
        }

        // Refresh parent component to update main panel
        onUpdate();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error updating host account:", error);
      alert("Error al actualizar cuenta huésped");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const matriculatedHosts = hostAccounts.filter((h) => isHostMatriculated(h.iban_num));
  const availableHosts = hostAccounts.filter((h) => !isHostMatriculated(h.iban_num));

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-[700px] w-full max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <div>
            <h2 className="m-0 text-gray-900 dark:text-gray-100 text-xl font-bold">
              🔗 Gestionar Cuentas Huésped
            </h2>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              {getBankColorBall(account.bank_id)} {account.bank_name} -{" "}
              {account.iban_num}
            </div>
          </div>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loadingHostAccounts ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Cargando cuentas huésped...
            </div>
          ) : hostAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400 italic">
              No hay cuentas huésped disponibles para este banco
            </div>
          ) : (
            <>
              {/* Matriculated Accounts Section */}
              {matriculatedHosts.length > 0 && (
                <div className="mb-8">
                  <h3 className="m-0 mb-4 text-base text-gray-900 dark:text-gray-100 font-semibold">
                    ✅ Matriculadas ({matriculatedHosts.length})
                  </h3>
                  <div className="flex flex-col gap-3">
                    {matriculatedHosts.map((host) => (
                      <div
                        key={host.iban_num}
                        className="flex items-center p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-500 dark:border-green-600"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {getBankColorBall(host.bank_id)} {host.codename}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {host.iban_num}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleHost(host)}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-red-600 dark:bg-red-700 text-white border-none rounded-md cursor-pointer text-sm font-semibold hover:bg-red-700 dark:hover:bg-red-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? "..." : "Eliminar"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Available Accounts Section */}
              {availableHosts.length > 0 && (
                <div>
                  <h3 className="m-0 mb-4 text-base text-gray-900 dark:text-gray-100 font-semibold">
                    ➕ Disponibles para agregar ({availableHosts.length})
                  </h3>
                  <div className="flex flex-col gap-3 max-h-[400px] overflow-auto">
                    {availableHosts.map((host) => (
                      <div
                        key={host.iban_num}
                        className="flex items-center p-4 rounded-lg bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700"
                      >
                        <div className="flex-1">
                          <div className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
                            {getBankColorBall(host.bank_id)} {host.codename}
                          </div>
                          <div className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                            {host.iban_num}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleHost(host)}
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-brand-primary dark:bg-brand-secondary text-white border-none rounded-md cursor-pointer text-sm font-semibold hover:bg-brand-primary-alt dark:hover:bg-accent-mint hover:text-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {isSubmitting ? "..." : "Agregar"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {matriculatedHosts.length === 0 && availableHosts.length === 0 && (
                <div className="text-center py-8 text-gray-600 dark:text-gray-400">
                  No hay cuentas disponibles
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
