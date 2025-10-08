import React from "react";

interface RedemptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  redemptions: any[];
  playerName?: string;
  limit?: number;
  formatCurrency: (amount: number) => string;
}

export default function RedemptionsModal({
  isOpen,
  onClose,
  redemptions,
  playerName,
  limit = 25,
  formatCurrency,
}: RedemptionsModalProps) {
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
            💰 Últimos {limit} Retiros - {playerName}
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {redemptions.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No hay retiros registrados
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {redemptions.map((redemption: any, idx: number) => (
              <div
                key={idx}
                className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Serial: #{redemption.serialNumber}
                    </div>
                    <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                      {formatCurrency(redemption.cash_amount)}
                    </div>
                    <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Código: {redemption.b36_id}
                    </div>
                  </div>
                  <div className="text-right">
                    {redemption.payment && (
                      <div
                        className={`px-2 py-1 rounded text-xs font-semibold mb-2 ${
                          redemption.payment.paymentStatus === 1
                            ? "bg-green-100 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-600 dark:border-green-400"
                            : "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400"
                        }`}
                      >
                        {redemption.payment.paymentStatus === 1
                          ? "✓ Pagado"
                          : "⏳ Pendiente"}
                      </div>
                    )}
                    {redemption.payment?.paymentMethod && (
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Método:{" "}
                        {redemption.payment.paymentMethod === 12
                          ? "SINPE Móvil"
                          : `Método ${redemption.payment.paymentMethod}`}
                      </div>
                    )}
                  </div>
                </div>

                {redemption.payment?.sinpeMobileDetails && (
                  <div className="text-sm text-gray-900 dark:text-gray-100 p-2 bg-gray-100 dark:bg-gray-800 rounded mb-2">
                    <div>
                      📱 SINPE:{" "}
                      {redemption.payment.sinpeMobileDetails.phoneNumber}
                    </div>
                    {redemption.payment.sinpeMobileDetails.recipientsName && (
                      <div>
                        👤{" "}
                        {redemption.payment.sinpeMobileDetails.recipientsName}
                      </div>
                    )}
                  </div>
                )}

                {redemption.payment?.recipientAccount && (
                  <div className="text-sm text-gray-900 dark:text-gray-100 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono">
                    <div>
                      Banco: {redemption.payment.recipientAccount.bank_name}
                    </div>
                    <div>
                      IBAN: {redemption.payment.recipientAccount.iban_num}
                    </div>
                    <div>
                      Titular: {redemption.payment.recipientAccount.name_on_acc}
                    </div>
                  </div>
                )}

                {redemption.redeemDetails && (
                  <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 italic">
                    📝 {redemption.redeemDetails}
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
