import type { PlayerDocument } from "@juaose/lotto-shared-types";

interface PlayerDataFormProps {
  selectedPlayer: PlayerDocument;
  editedPlayer: PlayerDocument;
  isEditing: boolean;
  isSaving: boolean;
  activeShops: any[];
  loadingShops: boolean;
  onEditToggle: () => void;
  onCancel: () => void;
  onFieldChange: (field: keyof PlayerDocument, value: any) => void;
}

export default function PlayerDataForm({
  selectedPlayer,
  editedPlayer,
  isEditing,
  isSaving,
  activeShops,
  loadingShops,
  onEditToggle,
  onCancel,
  onFieldChange,
}: PlayerDataFormProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-4">
        <h3 className="m-0 text-gray-900 dark:text-gray-100 text-lg font-semibold">
          📊 Datos del Jugador
        </h3>
        <div className="flex gap-2">
          <button
            onClick={onEditToggle}
            disabled={isSaving}
            className={`px-4 py-2 text-sm rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
              isEditing
                ? "bg-brand-primary dark:bg-brand-secondary text-white hover:bg-brand-primary-alt dark:hover:bg-accent-mint hover:text-gray-900"
                : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          >
            {isSaving ? "💾 Guardando..." : isEditing ? "💾 Guardar" : "✏️ Editar"}
          </button>
          {isEditing && (
            <button
              onClick={onCancel}
              disabled={isSaving}
              className="px-4 py-2 text-sm bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Basic Info Fields */}
      <div className="flex flex-col gap-3">
        <div>
          <label className="block font-semibold mb-1 text-gray-600 dark:text-gray-400 opacity-70 text-sm">
            🔒 Cuenta PM:
          </label>
          <input
            type="text"
            value={editedPlayer.premayor_acc}
            disabled
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed text-gray-600 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1 text-gray-600 dark:text-gray-400 opacity-70 text-sm">
            🔒 Usuario PM:
          </label>
          <input
            type="text"
            value={editedPlayer.screenName}
            disabled
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed text-gray-600 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-600"
          />
        </div>
        <div>
          <label className="block font-semibold mb-1 text-gray-900 dark:text-gray-100 text-sm">
            Insignia:
          </label>
          <input
            type="text"
            value={editedPlayer.codename}
            onChange={(e) => onFieldChange("codename", e.target.value)}
            disabled={!isEditing}
            className={`w-full px-3 py-2 rounded border ${
              isEditing
                ? "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                : "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
            } focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary`}
          />
        </div>
        <div>
          <label className="block font-semibold mb-1 text-gray-900 dark:text-gray-100 text-sm">
            Puesto:
          </label>
          {isEditing ? (
            <select
              value={editedPlayer.shopID || ""}
              onChange={(e) => {
                const newShopID = parseInt(e.target.value);
                const shop = activeShops.find((s) => s.shopID === newShopID);

                if (shop && selectedPlayer) {
                  const confirmed = window.confirm(
                    `¿Mover cliente ${selectedPlayer.screenName} al Puesto ${shop.shopID} con gerente ${shop.nickname}?\n\nTodas las comisiones de depósito contarán para ${shop.nickname}.`
                  );

                  if (confirmed) {
                    onFieldChange("shopID", newShopID);
                  }
                } else if (!shop && newShopID) {
                  alert(`Puesto ${newShopID} no existe`);
                }
              }}
              className="w-full px-3 py-2 bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary cursor-pointer"
            >
              <option value="">-- Seleccionar Puesto --</option>
              {loadingShops ? (
                <option disabled>Cargando Puestos...</option>
              ) : (
                activeShops.map((shop) => (
                  <option key={shop.shopID} value={shop.shopID}>
                    Puesto {shop.shopID} - {shop.nickname}
                  </option>
                ))
              )}
            </select>
          ) : (
            <input
              type="text"
              value={`Puesto ${editedPlayer.shopID}`}
              disabled
              className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 rounded"
            />
          )}
        </div>
        <div>
          <label className="block font-semibold mb-1 text-gray-600 dark:text-gray-400 opacity-70 text-sm">
            🔒 Admin Asignado:
          </label>
          <input
            type="text"
            value={editedPlayer.admin_nickname}
            disabled
            className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-900 opacity-60 cursor-not-allowed text-gray-600 dark:text-gray-400 rounded border border-gray-300 dark:border-gray-600"
          />
        </div>

        {/* Contact Info */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            📱 Contacto
          </h4>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-900 dark:text-gray-100 text-sm">
                Número SINPE:
              </label>
              <input
                type="text"
                value={editedPlayer.sinpe_num || ""}
                onChange={(e) =>
                  onFieldChange(
                    "sinpe_num",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                disabled={!isEditing}
                placeholder="88887777"
                className={`w-full px-3 py-2 rounded border font-mono ${
                  isEditing
                    ? "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    : "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                } focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-900 dark:text-gray-100 text-sm">
                Número WhatsApp:
              </label>
              <input
                type="text"
                value={editedPlayer.whatsapp_num || ""}
                onChange={(e) =>
                  onFieldChange(
                    "whatsapp_num",
                    e.target.value ? parseInt(e.target.value) : undefined
                  )
                }
                disabled={!isEditing}
                placeholder="88887777"
                className={`w-full px-3 py-2 rounded border font-mono ${
                  isEditing
                    ? "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    : "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                } focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary`}
              />
            </div>
          </div>
        </div>

        {/* Notes Section */}
        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 mt-3">
          <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-3">
            📝 Notas
          </h4>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block font-semibold mb-1 text-gray-900 dark:text-gray-100 text-sm">
                Servicio al Cliente:
              </label>
              <textarea
                value={editedPlayer.notes || ""}
                onChange={(e) => onFieldChange("notes", e.target.value)}
                disabled={!isEditing}
                placeholder="Notas de servicio..."
                className={`w-full min-h-[60px] px-2 py-2 rounded border text-sm resize-y ${
                  isEditing
                    ? "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    : "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                } focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary`}
              />
            </div>
            <div>
              <label className="block font-semibold mb-1 text-gray-900 dark:text-gray-100 text-sm">
                Tesorería:
              </label>
              <textarea
                value={editedPlayer.withdrawalInstructions || ""}
                onChange={(e) =>
                  onFieldChange("withdrawalInstructions", e.target.value)
                }
                disabled={!isEditing}
                placeholder="Notas de tesorería..."
                className={`w-full min-h-[60px] px-2 py-2 rounded border text-sm resize-y ${
                  isEditing
                    ? "bg-white dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                    : "bg-gray-100 dark:bg-gray-900 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                } focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
