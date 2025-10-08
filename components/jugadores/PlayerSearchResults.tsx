import type { PlayerDocument } from "@juaose/lotto-shared-types";

interface PlayerSearchResultsProps {
  players: PlayerDocument[];
  totalMatches: number;
  selectedPlayer: PlayerDocument | null;
  onSelectPlayer: (player: PlayerDocument) => void;
}

export default function PlayerSearchResults({
  players,
  totalMatches,
  selectedPlayer,
  onSelectPlayer,
}: PlayerSearchResultsProps) {
  if (players.length === 0) return null;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 mb-6 border border-gray-200 dark:border-gray-700">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
        📋 Resultados de Búsqueda
        {totalMatches > players.length && (
          <span className="text-base font-normal ml-2 text-gray-600 dark:text-gray-400">
            (Mostrando {players.length} de {totalMatches} resultados)
          </span>
        )}
      </h2>

      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-brand-primary dark:bg-brand-secondary text-white">
              <th className="px-4 py-3 text-left font-semibold">Cuenta PM</th>
              <th className="px-4 py-3 text-left font-semibold">Insignia</th>
              <th className="px-4 py-3 text-left font-semibold">Nombre</th>
              <th className="px-4 py-3 text-left font-semibold">Puesto</th>
              <th className="px-4 py-3 text-left font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {players.map((player) => (
              <tr
                key={player.premayor_acc}
                className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors ${
                  selectedPlayer?.premayor_acc === player.premayor_acc
                    ? "bg-brand-primary/10 dark:bg-brand-secondary/20"
                    : ""
                }`}
              >
                <td className="px-4 py-3 font-mono text-gray-900 dark:text-gray-100">
                  {player.premayor_acc}
                </td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                  {player.codename}
                </td>
                <td className="px-4 py-3 font-semibold text-gray-900 dark:text-gray-100">
                  {player.screenName}
                </td>
                <td className="px-4 py-3 text-gray-900 dark:text-gray-100">
                  {player.shopID}
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => onSelectPlayer(player)}
                    className="px-3 py-1.5 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
                  >
                    {selectedPlayer?.premayor_acc === player.premayor_acc
                      ? "✓ Seleccionado"
                      : "Ver Detalles"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="flex md:hidden flex-col gap-3">
        {players.map((player) => (
          <div
            key={player.premayor_acc}
            onClick={() => onSelectPlayer(player)}
            className={`p-4 rounded-lg cursor-pointer transition-all ${
              selectedPlayer?.premayor_acc === player.premayor_acc
                ? "bg-brand-primary/10 dark:bg-brand-secondary/20 border-2 border-brand-primary dark:border-brand-secondary"
                : "bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 hover:border-brand-primary dark:hover:border-brand-secondary"
            }`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex-1">
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {player.screenName}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {player.codename}
                </div>
              </div>
              {selectedPlayer?.premayor_acc === player.premayor_acc && (
                <span className="text-2xl text-brand-primary dark:text-brand-secondary">
                  ✓
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-400 font-semibold block">
                  Cuenta:
                </span>
                <div className="text-gray-900 dark:text-gray-100 font-mono">
                  {player.premayor_acc}
                </div>
              </div>
              <div>
                <span className="text-gray-600 dark:text-gray-400 font-semibold block">
                  Puesto:
                </span>
                <div className="text-gray-900 dark:text-gray-100">
                  {player.shopID}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
