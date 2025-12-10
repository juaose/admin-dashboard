"use client";

import { useEffect, useState } from "react";
import { dalGet } from "@/lib/dal-client";

interface PhoneLine {
  number: number;
  iban_num: string;
  teamID: number;
  accountID: number;
  holders_id: number;
  name_on_acc: string;
  bank_id: number;
  codename: string;
}

interface ApiResponse {
  success: boolean;
  data?: PhoneLine[];
  count?: number;
  error?: string;
  details?: string;
}

export default function TelefonosPage() {
  const [phoneLines, setPhoneLines] = useState<PhoneLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    console.log("📱 TelefonosPage component mounted");
    loadPhoneLines();
  }, []);

  const loadPhoneLines = async () => {
    console.log("🔄 Starting to load phone lines...");
    try {
      setLoading(true);
      setError(null);

      console.log("📡 Fetching from DAL API...");
      const result: ApiResponse = await dalGet("/api/v1/phone-lines");
      console.log("📦 Data received:", result);

      if (!result.success) {
        throw new Error(result.error || "Error al cargar teléfonos");
      }

      console.log("✅ Setting phone lines:", result.data?.length || 0, "lines");
      setPhoneLines(result.data || []);
    } catch (err) {
      console.error("❌ Error loading phone lines:", err);
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      console.log("🏁 Loading complete, setting loading to false");
      setLoading(false);
    }
  };

  const filteredPhoneLines = phoneLines.filter((line) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      line.number.toString().includes(term) ||
      line.iban_num.toLowerCase().includes(term) ||
      line.name_on_acc.toLowerCase().includes(term) ||
      line.codename.toLowerCase().includes(term) ||
      line.teamID.toString().includes(term) ||
      line.accountID.toString().includes(term)
    );
  });

  console.log(
    "🎨 Rendering TelefonosPage - loading:",
    loading,
    "error:",
    error,
    "lines:",
    phoneLines.length
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-900 dark:text-gray-100 text-lg">
          Cargando directorio de teléfonos...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto mt-8 p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-center">
        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-2">
          Error
        </h2>
        <p className="text-gray-900 dark:text-gray-100 mb-4">{error}</p>
        <button
          onClick={loadPhoneLines}
          className="px-6 py-2 bg-brand-primary dark:bg-brand-secondary text-white rounded-lg hover:bg-brand-primary-alt dark:hover:bg-accent-mint hover:text-gray-900 transition-colors font-medium"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          📞 Directorio de Teléfonos
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Líneas telefónicas asociadas a cuentas bancarias del sistema
        </p>
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              Buscar:
            </label>
            <input
              type="text"
              placeholder="Teléfono, IBAN, nombre, codename..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary"
            />
          </div>
          <button
            onClick={loadPhoneLines}
            className="px-6 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium whitespace-nowrap"
          >
            🔄 Recargar
          </button>
        </div>
        <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
          Total de líneas:{" "}
          <span className="font-semibold text-gray-900 dark:text-gray-100">
            {phoneLines.length}
          </span>
          {searchTerm && (
            <>
              {" "}
              | Resultados filtrados:{" "}
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {filteredPhoneLines.length}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Phone Lines Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
        <div className="bg-brand-primary dark:bg-brand-secondary px-6 py-4">
          <h2 className="text-xl font-semibold text-white m-0">
            📋 Listado de Líneas
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 sticky top-0">
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Teléfono
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  IBAN
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Nombre en Cuenta
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Codename
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Team ID
                </th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Account ID
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPhoneLines.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-4 py-8 text-center text-gray-500 dark:text-gray-400"
                  >
                    {searchTerm
                      ? "No se encontraron líneas que coincidan con la búsqueda"
                      : "No hay líneas telefónicas registradas"}
                  </td>
                </tr>
              ) : (
                filteredPhoneLines.map((line, index) => (
                  <tr
                    key={index}
                    className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-brand-primary dark:text-brand-secondary font-mono">
                      {line.number}
                    </td>
                    <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-gray-100">
                      {line.iban_num}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {line.name_on_acc}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-brand-primary/10 dark:bg-brand-secondary/20 text-brand-primary dark:text-brand-secondary border border-brand-primary/20 dark:border-brand-secondary/30">
                        {line.codename}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {line.teamID}
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                      {line.accountID}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
