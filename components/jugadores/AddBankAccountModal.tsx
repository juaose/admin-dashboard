import { useState, useEffect } from "react";
import type { BankAccountDocument } from "@juaose/lotto-shared-types";
import { BANKCODES } from "@juaose/lotto-shared-types";
import { getBankColorBall } from "./utils/playerUtils";
import {
  bacAccountToIBAN,
  IBANtoBACAccount,
  mutualShortToIBAN,
  IBANtoMutualShort,
  isValidIBAN,
  getBankFromIBAN,
} from "@juaose/lotto-utils";

interface AddBankAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newAccount: BankAccountDocument) => void;
  playerName?: string;
}

const BANK_OPTIONS = [
  { id: BANKCODES.BAC, name: "BAC San José" },
  { id: BANKCODES.BNCR, name: "Banco Nacional" },
  { id: BANKCODES.BCR, name: "Banco de Costa Rica" },
  { id: BANKCODES.POPULAR, name: "Banco Popular" },
  { id: BANKCODES.MUTUAL, name: "Banco Mutual" },
  { id: BANKCODES.PROMERICA, name: "Promerica" },
];

export default function AddBankAccountModal({
  isOpen,
  onClose,
  onSuccess,
  playerName,
}: AddBankAccountModalProps) {
  const [formData, setFormData] = useState({
    bank_id: "" as number | "",
    iban_num: "",
    name_on_acc: "",
    acc_num: "",
    isFavorite: false,
    isActive: true,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // IBAN is always required
    const hasIBAN = formData.iban_num.trim().length > 0;
    const hasNativeAccount = formData.acc_num.trim().length > 0;

    if (!hasIBAN) {
      newErrors.iban_num = "IBAN es requerido";
    } else if (!isValidIBAN(formData.iban_num)) {
      newErrors.iban_num = "IBAN inválido";
    } else {
      // Validate that we can detect the bank from IBAN
      const bankInfo = getBankFromIBAN(formData.iban_num);
      if (!bankInfo.bank_id) {
        newErrors.iban_num = "No se pudo detectar el banco de este IBAN";
      }
    }

    // For BAC and MUTUAL, validate native account format if provided
    const isBAC = formData.bank_id === BANKCODES.BAC;
    const isMUTUAL = formData.bank_id === BANKCODES.MUTUAL;

    if (hasNativeAccount) {
      if (isBAC && !/^\d{9,10}$/.test(formData.acc_num)) {
        newErrors.acc_num = "Cuenta BAC debe tener 9-10 dígitos";
      } else if (isMUTUAL && !/^1\d{2}-\d{3}-\d{7}$/.test(formData.acc_num)) {
        newErrors.acc_num = "Cuenta MUTUAL debe tener formato 1XX-XXX-XXXXXXX";
      }
    }

    if (!formData.name_on_acc.trim()) {
      newErrors.name_on_acc = "Nombre del titular es requerido";
    } else if (formData.name_on_acc.trim().length < 3) {
      newErrors.name_on_acc = "Nombre debe tener al menos 3 caracteres";
    }

    // Host accounts are now optional - no validation needed

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const newBankAccount: BankAccountDocument = {
        iban_num: formData.iban_num.trim(),
        bank_name:
          BANK_OPTIONS.find((b) => b.id === formData.bank_id)?.name || "",
        bank_id: formData.bank_id as number,
        name_on_acc: formData.name_on_acc.trim(),
        acc_num: formData.acc_num.trim() || undefined,
        isActive: formData.isActive,
        isFavorite: formData.isFavorite,
        includedIn: [], // Start with empty host accounts - use ManageHostAccountsModal to add them
      };

      // Call success callback with the new account
      onSuccess(newBankAccount);
      handleClose();
    } catch (error) {
      console.error("Error creating bank account:", error);
      alert("Error al crear cuenta bancaria");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset form
    setFormData({
      bank_id: "",
      iban_num: "",
      name_on_acc: "",
      acc_num: "",
      isFavorite: false,
      isActive: true,
    });
    setErrors({});
    onClose();
  };

  // Auto-complete IBAN → Native Account AND auto-detect bank
  const handleIBANChange = (value: string) => {
    setFormData({ ...formData, iban_num: value });
    setErrors({ ...errors, iban_num: "", acc_num: "" });

    // Trigger auto-completion when IBAN reaches 22 chars
    if (value.length === 22 && /^CR\d{20}$/.test(value)) {
      try {
        // Use getBankFromIBAN to detect which bank this IBAN belongs to
        const bankInfo = getBankFromIBAN(value);

        if (bankInfo.bank_id) {
          // Auto-detect and set the bank
          setFormData((prev) => ({ ...prev, bank_id: bankInfo.bank_id || "" }));

          // Try to extract native account number for BAC and MUTUAL
          if (bankInfo.bank_id === BANKCODES.BAC) {
            const nativeAccount = IBANtoBACAccount(value);
            if (nativeAccount) {
              setFormData((prev) => ({
                ...prev,
                iban_num: value,
                acc_num: nativeAccount,
                bank_id: bankInfo.bank_id || "",
              }));
            }
          } else if (bankInfo.bank_id === BANKCODES.MUTUAL) {
            const nativeAccount = IBANtoMutualShort(value);
            if (nativeAccount) {
              setFormData((prev) => ({
                ...prev,
                iban_num: value,
                acc_num: nativeAccount,
                bank_id: bankInfo.bank_id || "",
              }));
            }
          }
        }
      } catch (error) {
        console.error("Error converting IBAN to native:", error);
      }
    }
  };

  // Auto-complete Native Account → IBAN (only for BAC and MUTUAL)
  const handleNativeAccountChange = (value: string) => {
    setFormData({ ...formData, acc_num: value });
    setErrors({ ...errors, acc_num: "", iban_num: "" });

    try {
      // BAC: 9-10 straight digits
      if (/^\d{9,10}$/.test(value)) {
        const iban = bacAccountToIBAN(value);
        if (iban) {
          const bankInfo = getBankFromIBAN(iban);
          setFormData({
            ...formData,
            acc_num: value,
            iban_num: iban,
            bank_id: bankInfo.bank_id || "",
          });
        }
      }
      // MUTUAL: 1XX-XXX-XXXXXXX format
      else if (/^1\d{2}-\d{3}-\d{7}$/.test(value)) {
        const iban = mutualShortToIBAN(value);
        if (iban) {
          const bankInfo = getBankFromIBAN(iban);
          setFormData({
            ...formData,
            acc_num: value,
            iban_num: iban,
            bank_id: bankInfo.bank_id || "",
          });
        }
      }
    } catch (error) {
      console.error("Error converting native to IBAN:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1000] p-4"
      onClick={handleClose}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl max-w-[600px] w-full max-h-[90vh] overflow-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h2 className="m-0 text-gray-900 dark:text-gray-100 text-xl font-bold">
            ➕ Agregar Cuenta Bancaria
            {playerName && (
              <span className="text-base font-normal text-gray-600 dark:text-gray-400 ml-2">
                - {playerName}
              </span>
            )}
          </h2>
          <button
            onClick={handleClose}
            className="bg-transparent border-none text-2xl cursor-pointer text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 p-1 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Form Content */}
        <div className="p-6">
          {/* IBAN (with auto-detected bank display) */}
          <div className="mb-5">
            <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
              IBAN: <span className="text-red-600 dark:text-red-400">*</span>
              {formData.bank_id && (
                <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                  {" "}
                  ({getBankColorBall(formData.bank_id as number)}{" "}
                  {BANK_OPTIONS.find((b) => b.id === formData.bank_id)?.name})
                </span>
              )}
            </label>
            <input
              type="text"
              value={formData.iban_num}
              onChange={(e) => handleIBANChange(e.target.value)}
              placeholder="CR12345678901234567890"
              className={`w-full px-3 py-2 rounded-md border ${
                errors.iban_num
                  ? "border-red-600 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              } bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary`}
            />
            {errors.iban_num && (
              <div className="text-red-600 dark:text-red-400 text-sm mt-1">
                {errors.iban_num}
              </div>
            )}
          </div>

          {/* Account Holder Name */}
          <div className="mb-5">
            <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Nombre del Titular:{" "}
              <span className="text-red-600 dark:text-red-400">*</span>
            </label>
            <input
              type="text"
              value={formData.name_on_acc}
              onChange={(e) => {
                setFormData({ ...formData, name_on_acc: e.target.value });
                setErrors({ ...errors, name_on_acc: "" });
              }}
              placeholder="Juan Pérez Gómez"
              className={`w-full px-3 py-2 rounded-md border ${
                errors.name_on_acc
                  ? "border-red-600 dark:border-red-400"
                  : "border-gray-300 dark:border-gray-600"
              } bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary`}
            />
            {errors.name_on_acc && (
              <div className="text-red-600 dark:text-red-400 text-sm mt-1">
                {errors.name_on_acc}
              </div>
            )}
          </div>

          {/* Native Account Number (Optional) */}
          <div className="mb-5">
            <label className="block font-semibold mb-2 text-gray-900 dark:text-gray-100">
              Número de Cuenta Nativa:
              <span className="text-sm font-normal text-gray-600 dark:text-gray-400">
                {" "}
                (Opcional - solo BAC o Mutual)
              </span>
            </label>
            <input
              type="text"
              value={formData.acc_num}
              onChange={(e) => handleNativeAccountChange(e.target.value)}
              placeholder={
                formData.bank_id === BANKCODES.BAC
                  ? "123456789"
                  : formData.bank_id === BANKCODES.MUTUAL
                    ? "102-100-1234567"
                    : "123456789"
              }
              className="w-full px-3 py-2 rounded-md border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-brand-primary dark:focus:ring-brand-secondary"
            />
          </div>

          {/* Checkboxes */}
          <div className="mb-6 flex gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-gray-100">
              <input
                type="checkbox"
                checked={formData.isFavorite}
                onChange={(e) =>
                  setFormData({ ...formData, isFavorite: e.target.checked })
                }
                className="cursor-pointer w-4 h-4"
              />
              <span>⭐ Cuenta Favorita</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-gray-900 dark:text-gray-100">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) =>
                  setFormData({ ...formData, isActive: e.target.checked })
                }
                className="cursor-pointer w-4 h-4"
              />
              <span>✓ Cuenta Activa</span>
            </label>
          </div>

          {/* Note about host accounts */}
          <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-md border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              💡 <strong>Nota:</strong> Después de crear la cuenta, podrás
              gestionar las cuentas huésped matriculadas usando el botón
              "Gestionar Cuentas Huésped" en la tarjeta de la cuenta.
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex gap-3 justify-end">
          <button
            onClick={handleClose}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-brand-primary dark:bg-brand-secondary text-white rounded-lg hover:bg-brand-primary-alt dark:hover:bg-accent-mint hover:text-gray-900 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creando..." : "✓ Crear Cuenta"}
          </button>
        </div>
      </div>
    </div>
  );
}
