import React from "react";
import { BANKCODES } from "@juaose/lotto-shared-types";

interface DepositsModalProps {
  isOpen: boolean;
  onClose: () => void;
  deposits: any[];
  playerName?: string;
  limit?: number;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

// Bank color dots based on bank codes (matching deniro's color scheme)
const getBankColorBall = (bankCode: number): string => {
  switch (bankCode) {
    case BANKCODES.BAC: // 102
      return "🔴";
    case BANKCODES.POPULAR: // 161
      return "🟠";
    case BANKCODES.BNCR: // 151
      return "⚫️";
    case BANKCODES.BCR: // 152
      return "🔵";
    case BANKCODES.MUTUAL: // 803
      return "🟡";
    case BANKCODES.Promerica: // 116
      return "🟢";
    case BANKCODES.COOPENAE: // 814
      return "⚪️";
    default:
      return "❓"; // Unknown banks use question mark to avoid conflict
  }
};

export default function DepositsModal({
  isOpen,
  onClose,
  deposits,
  playerName,
  limit = 25,
  formatCurrency,
  formatDate,
}: DepositsModalProps) {
  if (!isOpen) return null;

  // Group deposits by bank
  const depositsByBank = deposits.reduce((acc, item) => {
    const bankName = item.bankName;
    if (!acc[bankName]) {
      acc[bankName] = [];
    }
    acc[bankName].push(item);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate totals per bank
  const bankSummaries = (Object.entries(depositsByBank) as [
    string,
    any[]
  ][]).map(([bankName, items]) => {
    const total = items.reduce(
      (sum: number, item: any) => sum + (item.deposit.credit || 0),
      0
    );
    return { bankName, count: items.length, total };
  });

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
            🏦 Últimos {limit} Depósitos por Banco - {playerName}
          </h2>
          <button
            onClick={onClose}
            className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            ✕
          </button>
        </div>

        {deposits.length === 0 ? (
          <p className="text-gray-600 dark:text-gray-400 text-center py-8">
            No hay depósitos registrados
          </p>
        ) : (
          <div className="flex flex-col gap-8">
            {bankSummaries.map((summary, bankIdx) => {
              const bankItems = depositsByBank[summary.bankName];
              return (
                <div key={bankIdx}>
                  {/* Bank Header */}
                  <div className="px-4 py-3 bg-gradient-to-r from-blue-100/50 to-blue-50/30 dark:from-blue-900/30 dark:to-blue-800/20 border-l-4 border-blue-500 dark:border-blue-400 rounded-md mb-4 flex justify-between items-center">
                    <div>
                      <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        🏦 {summary.bankName}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {summary.count}{" "}
                        {summary.count === 1 ? "depósito" : "depósitos"}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xl font-bold text-blue-600 dark:text-blue-400">
                        {formatCurrency(summary.total)}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400">
                        Total
                      </div>
                    </div>
                  </div>

                  {/* Bank Deposits */}
                  <div className="flex flex-col gap-4">
                    {bankItems.map((item: any, idx: number) => {
                      const deposit = item.deposit;
                      const bankName = item.bankName;
                      return (
                        <div
                          key={idx}
                          className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                        >
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <div className="text-sm text-gray-600 dark:text-gray-400">
                                {formatDate(
                                  deposit.createdAt || deposit.transactionDate
                                )}
                              </div>
                              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                                {formatCurrency(deposit.credit)}
                              </div>
                            </div>
                            <div className="text-right flex flex-col items-end gap-2">
                              <span className="px-2 py-1 rounded text-xs font-semibold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-600 dark:border-blue-400">
                                🏦 {bankName}
                              </span>
                              {deposit.referenceNumber && (
                                <div className="text-[0.7rem] text-gray-600 dark:text-gray-400 font-mono">
                                  Ref: {deposit.referenceNumber}
                                </div>
                              )}
                              {deposit.referenceString && (
                                <div className="text-[0.7rem] text-gray-600 dark:text-gray-400 font-mono">
                                  Ref: {deposit.referenceString}
                                </div>
                              )}
                              {deposit.ibanReferenceNum && (
                                <div className="text-[0.7rem] text-gray-600 dark:text-gray-400 font-mono">
                                  IBAN Ref: {deposit.ibanReferenceNum}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Destination Account Info */}
                          {deposit.bankAccount && (
                            <div className="text-sm text-gray-900 dark:text-gray-100 p-2 bg-gray-100 dark:bg-gray-800 rounded font-mono mb-2">
                              {deposit.bankAccount.iban_num && (
                                <div>IBAN: {deposit.bankAccount.iban_num}</div>
                              )}
                              {deposit.bankAccount.codename && (
                                <div>
                                  Cuenta: {deposit.bankAccount.codename}
                                </div>
                              )}
                            </div>
                          )}

                          {deposit.sendersComments && (
                            <div className="text-sm text-gray-900 dark:text-gray-100 p-2 bg-gray-100 dark:bg-gray-800 rounded mb-2">
                              💬 {deposit.sendersComments}
                            </div>
                          )}

                          {deposit.sendersNameTag && (
                            <div className="text-xs text-gray-600 dark:text-gray-400 mt-1 flex flex-col gap-1">
                              <div>👤 Remitente: {deposit.sendersNameTag}</div>
                              {deposit.sendersBankName &&
                                deposit.sendersBankCode && (
                                  <div className="font-semibold">
                                    {getBankColorBall(deposit.sendersBankCode)}{" "}
                                    Banco de Origen: {deposit.sendersBankName}
                                  </div>
                                )}
                            </div>
                          )}

                          {deposit.creditStatus &&
                            deposit.creditStatus.hasError && (
                              <div className="mt-2 p-2 bg-red-100 dark:bg-red-900/20 rounded border border-red-600 dark:border-red-400">
                                <div className="text-xs text-red-600 dark:text-red-400 font-semibold">
                                  ⚠️{" "}
                                  {deposit.creditStatus.errorDetails?.type ||
                                    "Error"}
                                </div>
                                {deposit.creditStatus.errorDetails?.message && (
                                  <div className="text-[0.7rem] text-gray-600 dark:text-gray-400 mt-1">
                                    {deposit.creditStatus.errorDetails.message}
                                  </div>
                                )}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
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
