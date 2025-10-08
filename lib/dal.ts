/**
 * Data Access Layer Integration
 * Provides centralized access to lotto-core MongoDB operations
 */

import { DAL as LottoDAL } from '@juaose/lotto-core';
import type {
  ReloadDocument,
  PlayerDocument,
  AdminDocument,
  processedCreditIF,
  hostAccountDoc,
  RedemptionDocument
} from '@juaose/lotto-shared-types';

/**
 * DAL Service for Admin Dashboard
 * Auto-bootstraps on first access and provides type-safe database operations
 */
export class DALService {
  private static initialized = false;

  /**
   * Initialize DAL connection (called automatically on first access)
   */
  private static async ensureReady(): Promise<void> {
    if (!this.initialized) {
      console.log('🔄 Initializing admin dashboard DAL...');
      await LottoDAL.ensureReady();
      this.initialized = true;
      console.log('✅ Admin dashboard DAL ready');
    }
  }

  // Player operations
  static async getPlayers(filter?: any, projection?: any): Promise<PlayerDocument[]> {
    await this.ensureReady();
    const PlayerModel = await LottoDAL.PlayerModel;
    const players = await PlayerModel.find(filter || {}, projection);
    return players;
  }

  static async getPlayerById(premayor_acc: number): Promise<PlayerDocument | null> {
    await this.ensureReady();
    const PlayerModel = await LottoDAL.PlayerModel;
    return await PlayerModel.findOne({ premayor_acc });
  }

  static async getPlayerByPhone(phone: string): Promise<PlayerDocument | null> {
    await this.ensureReady();
    const PlayerModel = await LottoDAL.PlayerModel;
    return await PlayerModel.findOne({
      $or: [
        { premayor_acc: phone },
        { sinpe_number: phone },
        { whatsapp_number: phone }
      ]
    });
  }

  // Reload/Recargas operations
  static async getReloadsByDateRange(startDate: Date, endDate: Date, shopId?: number) {
    return import('@juaose/lotto-core').then(({ getReloadsPerDates }) =>
      getReloadsPerDates(startDate, endDate, shopId)
    );
  }

  // Bank deposit operations
  static async getBankDepositsByDateRange(startDate: Date, endDate: Date) {
    return import('@juaose/lotto-core').then(({ getPerBankDeposits }) =>
      getPerBankDeposits(startDate, endDate)
    );
  }

  // Host account operations
  static async getHostAccounts(bankId?: string): Promise<hostAccountDoc[]> {
    await this.ensureReady();
    const hostAccountModel = await LottoDAL.hostAccountModel;
    const filter = bankId && bankId !== '999' ? { bank_id: bankId } : {};
    return await hostAccountModel.find(filter);
  }

  // Phone lines operations
  static async getPhoneLines(): Promise<any[]> {
    await this.ensureReady();
    const phoneLineModel = await LottoDAL.phoneLineModel;
    return await phoneLineModel.find({});
  }

  // Admin operations
  static async getAdmins(): Promise<AdminDocument[]> {
    await this.ensureReady();
    const AdminModel = await LottoDAL.AdminModel;
    return await AdminModel.find({});
  }

  static async getAdminById(id: string): Promise<AdminDocument | null> {
    await this.ensureReady();
    const AdminModel = await LottoDAL.AdminModel;
    return await AdminModel.findById(id);
  }

  // Transaction operations for credit/debit analysis
  static async getTransactionsByType(type: number, limit = 100) {
    await this.ensureReady();
    // This could access different credit transaction models based on type
    const TransactionModels = {
      bncr: LottoDAL.BNCRcreditModel,
      bcr: LottoDAL.BCRcreditModel,
      pop: LottoDAL.POPcreditModel,
      mut: LottoDAL.MUTcreditModel,
      bac: LottoDAL.BACcreditModel,
      pro: LottoDAL.PROcreditModel,
      coop: LottoDAL.COOPcreditModel
    };

    // Return recent transactions across all banks
    const results = [];
    for (const [bank, modelPromise] of Object.entries(TransactionModels)) {
      try {
        const model = await modelPromise;
        const transactions = await model.find({}).sort({ createdAt: -1 }).limit(limit);
        results.push(...transactions);
      } catch (error) {
        console.warn(`Error fetching ${bank} transactions:`, error);
      }
    }

    return results.sort((a, b) => {
      const aTime = a.createdAt?.getTime() || 0;
      const bTime = b.createdAt?.getTime() || 0;
      return bTime - aTime;
    }).slice(0, limit);
  }

  // Redemption operations
  static async getRedemptions(limit = 100): Promise<RedemptionDocument[]> {
    await this.ensureReady();
    const RedemptionModel = await LottoDAL.RedemptionModel;
    return await RedemptionModel.find({}).sort({ createdAt: -1 }).limit(limit);
  }

  /**
   * Check if DAL is initialized and ready
   */
  static isReady(): boolean {
    return this.initialized;
  }

  /**
   * Get connection status for monitoring
   */
  static async getStatus() {
    return {
      initialized: this.initialized,
      mongoReady: LottoDAL.isInitialized()
    };
  }
}
