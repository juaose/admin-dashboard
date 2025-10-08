import { getBankColorBall } from "./utils/playerUtils";

interface AccountSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  hostAccounts: any[];
  loadingHostAccounts: boolean;
  selectedAccounts: string[];
  onSelectionChange: (accounts: string[]) => void;
  onConfirm: () => Promise<void>;
  playerName?: string;
}

export default function AccountSelectionModal({
  isOpen,
  onClose,
  hostAccounts,
  loadingHostAccounts,
  selectedAccounts,
  onSelectionChange,
  onConfirm,
  playerName,
}: AccountSelectionModalProps) {
  if (!isOpen) return null;

  const handleSelectAll = () => {
    const allIbans = hostAccounts.map((acc: any) => acc.iban_num);
    onSelectionChange(allIbans);
  };

  const handleDeselectAll = () => {
    onSelectionChange([]);
  };

  const handleToggleAccount = (iban: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedAccounts, iban]);
    } else {
      onSelectionChange(selectedAccounts.filter((i) => i !== iban));
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
      onClick={onClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-[600px] w-full max-h-[80vh] flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="m-0 text-gray-900 dark:text-gray-100 text-xl font-bold">
            Seleccionar Cuentas Autorizadas
          </h3>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Seleccione las cuentas del negocio donde este cliente puede depositar
        </p>

        {/* Select All / Deselect All */}
        <div className="flex gap-2 mb-4">
          <button
            className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            onClick={handleSelectAll}
          >
            ☑ Seleccionar Todas
          </button>
          <button
            className="flex-1 px-3 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            onClick={handleDeselectAll}
          >
            ☐ Deseleccionar Todas
          </button>
        </div>

        {/* Account List */}
        <div className="flex-1 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-lg p-2 mb-6">
          {loadingHostAccounts ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              Cargando cuentas...
            </div>
          ) : hostAccounts.length === 0 ? (
            <div className="text-center py-8 text-gray-600 dark:text-gray-400 italic">
              No hay cuentas disponibles
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {hostAccounts.map((account: any) => {
                const isSelected = selectedAccounts.includes(account.iban_num);
                return (
                  <label
                    key={account.iban_num}
                    className={`flex items-center gap-3 p-3 rounded-md cursor-pointer transition-all ${
                      isSelected
                        ? "bg-brand-primary/10 dark:bg-brand-secondary/20 border-2 border-brand-primary dark:border-brand-secondary"
                        : "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-secondary hover:bg-white dark:hover:bg-gray-800"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={(e) =>
                        handleToggleAccount(account.iban_num, e.target.checked)
                      }
                      className="w-[18px] h-[18px] cursor-pointer"
                    />
                    <div className="flex-1 flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        {account.bank_id && (
                          <span>{getBankColorBall(account.bank_id)}</span>
                        )}
                        <span className="font-semibold text-gray-900 dark:text-gray-100 text-[0.95rem]">
                          {account.codename}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                        {account.iban_num}
                      </span>
                    </div>
                  </label>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 justify-end">
          <button
            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            onClick={onClose}
          >
            Cancelar
          </button>
          <button
            className="px-6 py-3 bg-brand-primary dark:bg-brand-secondary text-white rounded-lg hover:bg-brand-primary-alt dark:hover:bg-accent-mint hover:text-gray-900 transition-colors font-medium"
            onClick={onConfirm}
          >
            Confirmar Selección ({selectedAccounts.length})
          </button>
        </div>
      </div>
    </div>
  );
}
