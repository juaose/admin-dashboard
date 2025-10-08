import { useState } from "react";
import type { PlayerDocument, BankAccountDocument } from "@juaose/lotto-shared-types";
import { getAuthHeaders } from "@/lib/client-auth";
import { getBankColorBall } from "./utils/playerUtils";
import AddBankAccountModal from "./AddBankAccountModal";
import ManageHostAccountsModal from "./ManageHostAccountsModal";

interface BankAccountsCardProps {
  player: PlayerDocument;
  bankAccounts: BankAccountDocument[];
  onUpdate: (updatedPlayer: PlayerDocument) => void;
}

export default function BankAccountsCard({
  player,
  bankAccounts,
  onUpdate,
}: BankAccountsCardProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageHostModal, setShowManageHostModal] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<BankAccountDocument | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState<string | null>(null);
  const [togglingStatus, setTogglingStatus] = useState<string | null>(null);
  const [togglingFavorite, setTogglingFavorite] = useState<string | null>(null);

  const handleAddBankAccount = async (newAccount: BankAccountDocument) => {
    setIsAdding(true);
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/jugadores/${player.premayor_acc}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          updateType: "addBankAccount",
          data: { bankAccount: newAccount },
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update parent with new player data
        onUpdate(result.data);
        alert("✅ Cuenta bancaria agregada exitosamente");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error adding bank account:", error);
      alert("Error al agregar cuenta bancaria");
    } finally {
      setIsAdding(false);
    }
  };

  const handleOpenManageHosts = (account: BankAccountDocument) => {
    setSelectedAccount(account);
    setShowManageHostModal(true);
  };

  const handleHostAccountsUpdate = async () => {
    // Refresh player data after host account changes
    try {
      const response = await fetch(`/api/jugadores/${player.premayor_acc}`);
      const result = await response.json();
      if (result.success) {
        onUpdate(result.data);
        
        // Update selectedAccount with the refreshed data
        if (selectedAccount) {
          const updatedAccount = result.data.bank_accounts?.find(
            (acc: BankAccountDocument) => acc.iban_num === selectedAccount.iban_num
          );
          if (updatedAccount) {
            setSelectedAccount(updatedAccount);
          }
        }
      }
    } catch (error) {
      console.error("Error refreshing player data:", error);
    }
  };

  const handleToggleBankAccountStatus = async (account: BankAccountDocument) => {
    const newStatus = !account.isActive;
    setTogglingStatus(account.iban_num);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/jugadores/${player.premayor_acc}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          updateType: "toggleBankAccountStatus",
          data: { accountIban: account.iban_num, isActive: newStatus },
        }),
      });

      const result = await response.json();

      if (result.success) {
        onUpdate(result.data);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error toggling bank account status:", error);
      alert("Error al cambiar estado de cuenta bancaria");
    } finally {
      setTogglingStatus(null);
    }
  };

  const handleToggleBankAccountFavorite = async (account: BankAccountDocument) => {
    const newFavoriteStatus = !account.isFavorite;

    // Show confirmation dialog when setting as favorite
    if (newFavoriteStatus) {
      const confirmed = confirm(
        `¿Está seguro que desea que la cuenta ${account.bank_name} sea la cuenta por defecto para pagos?`
      );
      if (!confirmed) return;
    }

    setTogglingFavorite(account.iban_num);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/jugadores/${player.premayor_acc}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          updateType: "toggleBankAccountFavorite",
          data: { accountIban: account.iban_num, isFavorite: newFavoriteStatus },
        }),
      });

      const result = await response.json();

      if (result.success) {
        onUpdate(result.data);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error toggling bank account favorite:", error);
      alert("Error al cambiar cuenta favorita");
    } finally {
      setTogglingFavorite(null);
    }
  };

  const handleDeleteBankAccount = async (account: BankAccountDocument) => {
    // Build confirmation message
    let confirmMessage = `¿Está seguro que desea eliminar esta cuenta?\n\n`;
    confirmMessage += `${account.bank_name}\n`;
    confirmMessage += `${account.iban_num}\n`;
    confirmMessage += `Titular: ${account.name_on_acc}`;

    // Add warning if account has host accounts matriculated
    if (account.includedIn && account.includedIn.length > 0) {
      confirmMessage += `\n\n⚠️ ADVERTENCIA: Esta cuenta está matriculada en ${account.includedIn.length} cuenta(s) del negocio, recuerde eliminarlas.`;
    }

    if (!confirm(confirmMessage)) {
      return;
    }

    setDeletingAccount(account.iban_num);

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/jugadores/${player.premayor_acc}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          updateType: "deleteBankAccount",
          data: { accountIban: account.iban_num },
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Update parent with new player data
        onUpdate(result.data);
        alert("✅ Cuenta bancaria eliminada exitosamente");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error deleting bank account:", error);
      alert("Error al eliminar cuenta bancaria");
    } finally {
      setDeletingAccount(null);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="mt-0 text-gray-900 dark:text-gray-100 text-lg font-semibold mb-4">
        🏦 Cuentas Bancarias
      </h3>
      {bankAccounts && bankAccounts.length > 0 ? (
        <div className="flex flex-col gap-4">
          {bankAccounts.map((account: BankAccountDocument, idx: number) => (
            <div
              key={idx}
              className={`p-4 bg-gray-50 dark:bg-gray-900 rounded-lg ${
                account.isFavorite
                  ? "border-2 border-brand-primary dark:border-brand-secondary shadow-lg shadow-brand-primary/20 dark:shadow-brand-secondary/20"
                  : "border border-gray-200 dark:border-gray-700"
              }`}
            >
              {/* Bank Header */}
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                    {account.bank_id && getBankColorBall(account.bank_id)}{" "}
                    {account.bank_name}
                    {account.isFavorite && (
                      <span className="text-base text-brand-primary dark:text-accent-mint ml-2">
                        ⭐
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    <strong>Titular:</strong> {account.name_on_acc}
                  </div>
                </div>
                <div className="flex gap-2 items-center">
                  {/* Active Status Badge - Clickable Toggle */}
                  <button
                    onClick={() => handleToggleBankAccountStatus(account)}
                    disabled={togglingStatus === account.iban_num}
                    className={`px-2 py-1 rounded text-[0.7rem] font-semibold border transition-opacity ${
                      account.isActive !== false
                        ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border-green-600 dark:border-green-400"
                        : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border-red-600 dark:border-red-400"
                    } ${
                      togglingStatus === account.iban_num
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer hover:opacity-80"
                    }`}
                  >
                    {togglingStatus === account.iban_num
                      ? "..."
                      : account.isActive !== false
                      ? "✓ Activa"
                      : "✗ Inactiva"}
                  </button>
                  {/* Delete Button */}
                  <button
                    onClick={() => handleDeleteBankAccount(account)}
                    disabled={deletingAccount === account.iban_num}
                    className={`px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded transition-opacity ${
                      deletingAccount === account.iban_num
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer hover:opacity-80"
                    }`}
                  >
                    {deletingAccount === account.iban_num ? "..." : "🗑️"}
                  </button>
                  {/* Favorite Badge - Clickable */}
                  <button
                    onClick={() => handleToggleBankAccountFavorite(account)}
                    disabled={togglingFavorite === account.iban_num}
                    className={`px-2 py-1 rounded text-[0.7rem] font-semibold border transition-opacity ${
                      account.isFavorite
                        ? "bg-brand-primary/10 dark:bg-brand-secondary/10 text-brand-primary dark:text-brand-secondary border-brand-primary dark:border-brand-secondary"
                        : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600"
                    } ${
                      togglingFavorite === account.iban_num
                        ? "opacity-60 cursor-not-allowed"
                        : "cursor-pointer hover:opacity-80"
                    }`}
                  >
                    {togglingFavorite === account.iban_num
                      ? "..."
                      : account.isFavorite
                      ? "⭐ Favorita"
                      : "☆ Favorita"}
                  </button>
                </div>
              </div>

              {/* Account Number */}
              <div className="mb-3">
                <div className="text-xs text-gray-600 dark:text-gray-400 mb-1 font-semibold">
                  Cuenta:
                </div>
                <div className="font-mono text-sm text-gray-900 dark:text-gray-100 bg-gray-100 dark:bg-gray-800 p-2 rounded break-all">
                  {account.iban_num || account.acc_num || "N/A"}
                </div>
              </div>

              {/* Host Accounts Registration */}
              <div className="mt-3">
                <div className="flex justify-between items-center mb-2">
                  <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold">
                    Cuentas huésped matriculadas:
                  </div>
                  <button
                    onClick={() => handleOpenManageHosts(account)}
                    className="px-2 py-1 text-[0.7rem] bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                  >
                    🔗 Gestionar
                  </button>
                </div>
                {account.includedIn && account.includedIn.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {account.includedIn.map((host: any, hostIdx: number) => (
                      <span
                        key={hostIdx}
                        className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700 font-medium"
                      >
                        {host.codename}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                    Ninguna
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 italic">
          No hay cuentas bancarias registradas
        </p>
      )}
      <button
        className="mt-3 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={() => setShowAddModal(true)}
        disabled={isAdding}
      >
        {isAdding ? "Agregando..." : "➕ Agregar Cuenta Bancaria"}
      </button>

      {/* Add Bank Account Modal */}
      <AddBankAccountModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleAddBankAccount}
        playerName={player.screenName}
      />

      {/* Manage Host Accounts Modal */}
      {selectedAccount && (
        <ManageHostAccountsModal
          isOpen={showManageHostModal}
          onClose={() => {
            setShowManageHostModal(false);
            setSelectedAccount(null);
          }}
          account={selectedAccount}
          playerAccNumber={player.premayor_acc}
          onUpdate={handleHostAccountsUpdate}
        />
      )}
    </div>
  );
}
