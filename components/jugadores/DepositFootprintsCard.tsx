import type { PlayerDocument } from "@juaose/lotto-shared-types";
import { getAuthHeaders } from "@/lib/client-auth";
import { dalGet } from "@/lib/dal-client";

interface DepositFootprintsCardProps {
  player: PlayerDocument;
  footprints: string[];
  onUpdate: (updatedPlayer: PlayerDocument) => void;
}

export default function DepositFootprintsCard({
  player,
  footprints,
  onUpdate,
}: DepositFootprintsCardProps) {
  const handleDeleteFootprint = async (footprint: string, index: number) => {
    const confirmed = window.confirm(
      `¿Eliminar la huella de depósito?\n\n${footprint}\n\nEsta acción no se puede deshacer.`
    );

    if (!confirmed) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/jugadores/${player.premayor_acc}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          updateType: "removeFootprint",
          data: { footprint },
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Use the updated player from mutation response
        onUpdate(result.data);
        alert("✅ Huella eliminada exitosamente");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error removing footprint:", error);
      alert("Error al eliminar huella");
    }
  };

  const handleAddFootprint = async () => {
    const newFootprint = prompt(
      "Ingrese el nombre como aparece en el banco (mínimo 19 caracteres):"
    );

    if (!newFootprint || !newFootprint.trim()) return;

    const footprint = newFootprint.trim();

    // Validate length
    if (footprint.length < 19) {
      alert("La huella debe tener al menos 19 caracteres");
      return;
    }

    // Check for "de los angeles"
    if (footprint.toLowerCase().includes("de los angeles")) {
      alert(
        'No se permite "de los angeles" en las huellas (causa errores en apellidos)'
      );
      return;
    }

    const confirmed = window.confirm(
      `¿Agregar la siguiente huella de depósito?\n\n${footprint}\n\nEsta huella se usará para identificar depósitos de este jugador.`
    );

    if (!confirmed) return;

    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`/api/jugadores/${player.premayor_acc}`, {
        method: "PUT",
        headers,
        body: JSON.stringify({
          updateType: "addFootprint",
          data: { footprint },
        }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        // Use the updated player from mutation response
        onUpdate(result.data);
        alert("✅ Huella agregada exitosamente");
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("Error adding footprint:", error);
      alert("Error al agregar huella");
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <h3 className="mt-0 text-gray-900 dark:text-gray-100 text-lg font-semibold">
        👣 Huellas de Depósito
      </h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
        Variaciones del nombre como aparecen en los bancos
      </p>
      <div className="flex flex-col gap-2">
        {footprints && footprints.length > 0 ? (
          footprints.map((footprint: string, idx: number) => (
            <div
              key={idx}
              className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700"
            >
              <span className="font-mono text-gray-900 dark:text-gray-100">
                {footprint}
              </span>
              <button
                onClick={() => handleDeleteFootprint(footprint, idx)}
                className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-600 dark:border-red-400 rounded cursor-pointer hover:opacity-80 transition-opacity"
              >
                🗑️
              </button>
            </div>
          ))
        ) : (
          <p className="text-gray-500 dark:text-gray-400 italic text-sm">
            No hay huellas registradas
          </p>
        )}
        <button
          className="mt-2 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
          onClick={handleAddFootprint}
        >
          ➕ Agregar Huella
        </button>
      </div>
    </div>
  );
}
