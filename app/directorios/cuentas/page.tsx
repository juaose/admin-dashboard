"use client";

import { useState, useEffect } from "react";

interface HostAccount {
  accountID: number;
  codename: string;
  bank_id: number;
  bank_name: string;
  name_on_acc: string;
  holders_id: string;
  iban_num: string;
  userName?: string;
  pw?: string;
  card_pin?: number;
  card_number?: string;
  card_cvv?: string;
  card_exp?: string;
  secretQuestion?: string;
  processingEmail?: string;
  email_username?: string;
  email_pw?: string;
  notificationsEmail?: string;
  ext_email_pw?: string;
  transactionDataOrigin?: number;
}

export default function CuentasDirectoryPage() {
  const [accounts, setAccounts] = useState<HostAccount[]>([]);
  const [filteredAccounts, setFilteredAccounts] = useState<HostAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [bankFilter, setBankFilter] = useState("");
  const [selectedAccount, setSelectedAccount] = useState<HostAccount | null>(
    null
  );
  const [showSensitiveData, setShowSensitiveData] = useState<{
    [key: string]: boolean;
  }>({});

  const bankNames: { [key: number]: string } = {
    1: "BNCR",
    2: "BCR",
    3: "BAC",
    4: "Popular",
    5: "Promerica",
    6: "Scotiabank",
    7: "Davivienda",
    8: "Mutual",
    9: "Coopealianza",
  };

  const bankColors: { [key: number]: string } = {
    1: "#1e40af", // BNCR - blue
    2: "#dc2626", // BCR - red
    3: "#ca8a04", // BAC - yellow
    4: "#059669", // Popular - green
    5: "#7c3aed", // Promerica - purple
    6: "#ea580c", // Scotiabank - orange
    7: "#0891b2", // Davivienda - cyan
    8: "#64748b", // Mutual - slate
    9: "#10b981", // Coopealianza - emerald
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchTerm, bankFilter, accounts]);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/directorios/cuentas");
      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Error al cargar cuentas");
      }

      setAccounts(result.data);
      setFilteredAccounts(result.data);
    } catch (err) {
      console.error("Error loading accounts:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...accounts];

    if (bankFilter) {
      filtered = filtered.filter(
        (acc) => acc.bank_id.toString() === bankFilter
      );
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (acc) =>
          acc.codename.toLowerCase().includes(term) ||
          acc.name_on_acc.toLowerCase().includes(term) ||
          acc.holders_id.includes(term) ||
          acc.iban_num.toLowerCase().includes(term)
      );
    }

    setFilteredAccounts(filtered);
  };

  const getBankName = (bankId: number): string => {
    return bankNames[bankId] || "Desconocido";
  };

  const getBankColor = (bankId: number): string => {
    return bankColors[bankId] || "#64748b";
  };

  const toggleSensitiveData = (key: string) => {
    setShowSensitiveData((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const maskData = (data: string, key: string): string => {
    if (showSensitiveData[key]) return data;
    return "•".repeat(Math.min(data.length, 12));
  };

  const uniqueBanks = Array.from(
    new Set(accounts.map((acc) => acc.bank_id))
  ).sort();

  const getTransactionOrigin = (origin?: number): string => {
    switch (origin) {
      case 2:
        return "📧 Email";
      case 3:
        return "✉️ SMS";
      default:
        return "🌐 Web";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-900 dark:text-gray-100 text-lg">
          Cargando directorio de cuentas...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
        <h3 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
          Error
        </h3>
        <p className="text-gray-900 dark:text-gray-100 mb-4">{error}</p>
        <button
          onClick={loadAccounts}
          className="px-6 py-2 bg-brand-primary dark:bg-brand-secondary text-white rounded-lg hover:bg-brand-primary-alt dark:hover:bg-accent-mint hover:text-gray-900 transition-colors font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header & Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          🏦 Directorio de Cuentas Bancarias
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Gestión y consulta de cuentas bancarias del sistema
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Filtrar por Banco:
            </label>
            <select
              value={bankFilter}
              onChange={(e) => setBankFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary"
            >
              <option value="">Todos los Bancos</option>
              {uniqueBanks.map((bankId) => (
                <option key={bankId} value={bankId.toString()}>
                  {getBankName(bankId)}
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Buscar:
            </label>
            <input
              type="text"
              placeholder="Codename, titular, cédula, IBAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={loadAccounts}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium whitespace-nowrap"
            >
              🔄 Recargar
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border border-gray-200 dark:border-gray-700">
          <h3 className="text-brand-primary dark:text-brand-secondary font-semibold mb-2">
            Total de Cuentas
          </h3>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {accounts.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border border-gray-200 dark:border-gray-700">
          <h3 className="text-brand-primary dark:text-brand-secondary font-semibold mb-2">
            Resultados Filtrados
          </h3>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {filteredAccounts.length}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center border border-gray-200 dark:border-gray-700">
          <h3 className="text-brand-primary dark:text-brand-secondary font-semibold mb-2">
            Bancos Activos
          </h3>
          <div className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            {uniqueBanks.length}
          </div>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="bg-brand-primary dark:bg-brand-secondary px-6 py-4">
          <h2 className="text-xl font-semibold text-white m-0">
            📋 Listado de Cuentas
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Banco
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Codename
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Titular
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Cédula
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  IBAN
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredAccounts.map((account) => (
                <tr
                  key={account.accountID}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <td className="px-4 py-3 font-bold text-brand-primary dark:text-brand-secondary">
                    {account.accountID}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2 h-2 rounded-full"
                        style={{
                          backgroundColor: getBankColor(account.bank_id),
                        }}
                      />
                      {getBankName(account.bank_id)}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">
                    {account.codename}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {account.name_on_acc}
                  </td>
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {account.holders_id}
                  </td>
                  <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">
                    {account.iban_num}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedAccount(account)}
                      className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                    >
                      Ver Detalles
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Account Detail Modal */}
      {selectedAccount && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-auto"
          onClick={() => setSelectedAccount(null)}
        >
          <div
            className="bg-white dark:bg-gray-800 rounded-xl p-6 md:p-8 max-w-4xl w-full max-h-[90vh] overflow-auto border border-gray-200 dark:border-gray-700"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <span
                  className="w-3 h-3 rounded-full"
                  style={{
                    backgroundColor: getBankColor(selectedAccount.bank_id),
                  }}
                />
                Cuenta {selectedAccount.accountID} - {selectedAccount.codename}
              </h2>
              <button
                onClick={() => setSelectedAccount(null)}
                className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-3xl leading-none"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-col gap-4">
              {/* Basic Info */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                <h3 className="mt-0 mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                  🏦 Información Bancaria
                </h3>
                <div className="space-y-2 text-gray-900 dark:text-gray-100">
                  <p>
                    <strong className="font-semibold">Banco:</strong>{" "}
                    {getBankName(selectedAccount.bank_id)}
                  </p>
                  <p>
                    <strong className="font-semibold">Titular:</strong>{" "}
                    {selectedAccount.name_on_acc}
                  </p>
                  <p>
                    <strong className="font-semibold">Cédula:</strong>{" "}
                    {selectedAccount.holders_id}
                  </p>
                  <p className="font-mono">
                    <strong className="font-semibold">IBAN:</strong>{" "}
                    {selectedAccount.iban_num}
                  </p>
                </div>
              </div>

              {/* Login Credentials */}
              {selectedAccount.userName && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="mt-0 mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    🔐 Credenciales de Acceso
                  </h3>
                  <div className="space-y-2 text-gray-900 dark:text-gray-100">
                    <p className="font-mono">
                      <strong className="font-semibold">Usuario:</strong>{" "}
                      {selectedAccount.userName}
                    </p>
                    <p className="font-mono flex items-center gap-2">
                      <strong className="font-semibold">Contraseña:</strong>
                      <span>{maskData(selectedAccount.pw || "", "pw")}</span>
                      <button
                        onClick={() => toggleSensitiveData("pw")}
                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        {showSensitiveData["pw"] ? "👁️ Ocultar" : "👁️ Ver"}
                      </button>
                    </p>
                    {selectedAccount.secretQuestion && (
                      <p className="font-mono">
                        <strong className="font-semibold">
                          Pregunta Secreta:
                        </strong>{" "}
                        {selectedAccount.secretQuestion}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Email Configuration */}
              {selectedAccount.processingEmail && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="mt-0 mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    📧 Configuración de Email
                  </h3>
                  <div className="space-y-2 text-gray-900 dark:text-gray-100">
                    <p>
                      <strong className="font-semibold">
                        Origen de Datos:
                      </strong>{" "}
                      {getTransactionOrigin(
                        selectedAccount.transactionDataOrigin
                      )}
                    </p>
                    {selectedAccount.notificationsEmail &&
                      selectedAccount.notificationsEmail !==
                        selectedAccount.processingEmail && (
                        <>
                          <p className="font-mono">
                            <strong className="font-semibold">
                              Email Externo:
                            </strong>{" "}
                            {selectedAccount.notificationsEmail}
                          </p>
                          {selectedAccount.ext_email_pw && (
                            <p className="font-mono flex items-center gap-2">
                              <strong className="font-semibold">
                                Clave Email Ext:
                              </strong>
                              <span>
                                {maskData(
                                  selectedAccount.ext_email_pw,
                                  "ext_email"
                                )}
                              </span>
                              <button
                                onClick={() => toggleSensitiveData("ext_email")}
                                className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                              >
                                {showSensitiveData["ext_email"]
                                  ? "👁️ Ocultar"
                                  : "👁️ Ver"}
                              </button>
                            </p>
                          )}
                        </>
                      )}
                    <p className="font-mono">
                      <strong className="font-semibold">Email Interno:</strong>{" "}
                      {selectedAccount.processingEmail}
                    </p>
                    {selectedAccount.email_username && (
                      <p className="font-mono">
                        <strong className="font-semibold">
                          Usuario Email:
                        </strong>{" "}
                        {selectedAccount.email_username}
                      </p>
                    )}
                    {selectedAccount.email_pw && (
                      <p className="font-mono flex items-center gap-2">
                        <strong className="font-semibold">Clave Email:</strong>
                        <span>
                          {maskData(selectedAccount.email_pw, "email_pw")}
                        </span>
                        <button
                          onClick={() => toggleSensitiveData("email_pw")}
                          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          {showSensitiveData["email_pw"]
                            ? "👁️ Ocultar"
                            : "👁️ Ver"}
                        </button>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Card Info */}
              {selectedAccount.card_number && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
                  <h3 className="mt-0 mb-4 text-lg font-semibold text-gray-900 dark:text-gray-100">
                    💳 Información de Tarjeta
                  </h3>
                  <div className="space-y-2 text-gray-900 dark:text-gray-100">
                    <p className="font-mono flex items-center gap-2">
                      <strong className="font-semibold">Número:</strong>
                      <span>
                        {maskData(selectedAccount.card_number, "card")}
                      </span>
                      <button
                        onClick={() => toggleSensitiveData("card")}
                        className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                      >
                        {showSensitiveData["card"] ? "👁️ Ocultar" : "👁️ Ver"}
                      </button>
                    </p>
                    {selectedAccount.card_pin && (
                      <p className="font-mono flex items-center gap-2">
                        <strong className="font-semibold">PIN:</strong>
                        <span>
                          {maskData(
                            String(selectedAccount.card_pin).padStart(4, "0"),
                            "pin"
                          )}
                        </span>
                        <button
                          onClick={() => toggleSensitiveData("pin")}
                          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          {showSensitiveData["pin"] ? "👁️ Ocultar" : "👁️ Ver"}
                        </button>
                      </p>
                    )}
                    {selectedAccount.card_cvv && (
                      <p className="font-mono flex items-center gap-2">
                        <strong className="font-semibold">CVV:</strong>
                        <span>{maskData(selectedAccount.card_cvv, "cvv")}</span>
                        <button
                          onClick={() => toggleSensitiveData("cvv")}
                          className="px-2 py-1 text-xs bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                        >
                          {showSensitiveData["cvv"] ? "👁️ Ocultar" : "👁️ Ver"}
                        </button>
                      </p>
                    )}
                    {selectedAccount.card_exp && (
                      <p>
                        <strong className="font-semibold">Expiración:</strong>{" "}
                        {selectedAccount.card_exp}
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="mt-6 text-right">
              <button
                onClick={() => setSelectedAccount(null)}
                className="px-6 py-2 bg-brand-primary dark:bg-brand-secondary text-white rounded-lg hover:bg-brand-primary-alt dark:hover:bg-accent-mint hover:text-gray-900 transition-colors font-medium"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
