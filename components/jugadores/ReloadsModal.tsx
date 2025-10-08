import React from "react";

interface ReloadsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reloads: any[];
  playerName?: string;
  limit?: number;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
  getReloadTypeInfo: (
    type: number
  ) => {
    label: string;
    icon: string;
    color: string;
  };
}

export default function ReloadsModal({
  isOpen,
  onClose,
  reloads,
  playerName,
  limit = 25,
  formatCurrency,
  formatDate,
  getReloadTypeInfo,
}: ReloadsModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000] p-4 overflow-auto"
      onClick={onClose}
    >
      <div
        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-8 max-w-[900px] w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="m-0 text-gray-900 dark:text-gray-100 text-xl font-bold">
            🔄 Últimas {limit} Recargas - {playerName}
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {reloads.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No hay recargas registradas
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {reloads.map((reload: any, idx: number) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {formatDate(reload.transactionDate)}
                    </div>
                    <div className="text-2xl font-bold text-brand-primary dark:text-accent-mint mt-1">
                      {formatCurrency(reload.amount)}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    {reload.type !== undefined &&
                      (() => {
                        const typeInfo = getReloadTypeInfo(reload.type);
                        return (
                          <span
                            className="px-2 py-1 rounded text-xs font-semibold inline-flex items-center gap-1"
                            style={{
                              backgroundColor: `${typeInfo.color}15`,
                              color: typeInfo.color,
                              border: `1px solid ${typeInfo.color}`,
                            }}
                          >
                            <span>{typeInfo.icon}</span>
                            <span>{typeInfo.label}</span>
                          </span>
                        );
                      })()}
                    {reload.bankAccount && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        {reload.bankAccount.bank_name || "Banco"}
                      </div>
                    )}
                    {reload.referenceNumber && (
                      <div className="text-[0.7rem] text-gray-600 dark:text-gray-400 font-mono">
                        Ref: {reload.referenceNumber}
                      </div>
                    )}
                    {reload.ibanReferenceNum && (
                      <div className="text-[0.7rem] text-gray-600 dark:text-gray-400 font-mono">
                        Ref IBAN: {reload.ibanReferenceNum}
                      </div>
                    )}
                  </div>
                </div>

                {reload.bankAccount && (
                  <div className="text-sm text-gray-900 dark:text-gray-100 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono">
                    {reload.bankAccount.iban_num && (
                      <div>IBAN: {reload.bankAccount.iban_num}</div>
                    )}
                    {reload.bankAccount.codename && (
                      <div>Cuenta: {reload.bankAccount.codename}</div>
                    )}
                  </div>
                )}

                {reload.rewards && reload.rewards.bonusApplied && (
                  <div className="mt-3 p-2 bg-amber-100 dark:bg-amber-900/20 rounded border border-amber-300 dark:border-amber-700">
                    <div className="text-sm text-amber-700 dark:text-amber-400 font-semibold">
                      🎁 Bono: {formatCurrency(reload.rewards.bonusPoints)} (
                      {reload.rewards.bonusTier})
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {reload.rewards.bonusReason}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
