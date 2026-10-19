import { RawMaterial, ProductionOrder, StockMovement, BakerySettings } from '../types/erp';

export interface MaterialUsageAnalysis {
  materialId: string;
  code: string;
  name: string;
  category: string;
  unit: string;
  currentStock: number;
  minimumStockAlert: number;
  effectiveReorderThreshold: number;
  totalQuantityConsumed: number;
  todayQuantityConsumed: number;
  avgDailyBurnRate: number;
  daysOfSupplyRemaining: number;
  isBelowThreshold: boolean;
  urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY';
  shortfallUnits: number;
  suggestedReorderQuantity: number;
  supplierName: string;
}

export interface InventoryUsageReport {
  materialStats: MaterialUsageAnalysis[];
  criticalMaterials: MaterialUsageAnalysis[];
  warningMaterials: MaterialUsageAnalysis[];
  totalBelowThreshold: number;
  hasCriticalAlerts: boolean;
  summaryText: string;
}

/**
 * Calculates raw material usage from actual production orders and stock ledger,
 * and determines which ingredients have fallen below the configured reorder threshold.
 */
export function calculateRawMaterialUsage(
  rawMaterials: RawMaterial[],
  productionOrders: ProductionOrder[],
  stockLedger: StockMovement[],
  settings?: BakerySettings | null
): InventoryUsageReport {
  const todayStr = new Date().toISOString().slice(0, 10);
  const globalThresholdPercentage = settings?.autoReorderAlertThreshold || 15; // default 15% or 15 units

  const materialStats: MaterialUsageAnalysis[] = rawMaterials.map(mat => {
    // 1. Calculate consumption from Production Orders
    let totalFromBatches = 0;
    let todayFromBatches = 0;

    for (const batch of productionOrders) {
      if (batch.ingredientsIssued) {
        for (const ing of batch.ingredientsIssued) {
          if (ing.rawMaterialId === mat.id) {
            const qty = ing.actualQty || ing.plannedQty || 0;
            totalFromBatches += qty;
            if (batch.scheduledDate === todayStr || batch.createdAt.startsWith(todayStr)) {
              todayFromBatches += qty;
            }
          }
        }
      }
    }

    // 2. Cross-reference with Stock Ledger ISSUE_TO_PRODUCTION movements
    let totalFromLedger = 0;
    let todayFromLedger = 0;

    for (const mov of stockLedger) {
      if (mov.rawMaterialId === mat.id && mov.movementType === 'ISSUE_TO_PRODUCTION') {
        const consumed = Math.abs(mov.quantityDelta);
        totalFromLedger += consumed;
        if (mov.timestamp.startsWith(todayStr)) {
          todayFromLedger += consumed;
        }
      }
    }

    const totalConsumed = Math.max(totalFromBatches, totalFromLedger);
    const todayConsumed = Math.max(todayFromBatches, todayFromLedger);

    // Estimate daily burn rate (use today's usage if > 0, otherwise average based on historical consumption)
    const avgDailyBurnRate = todayConsumed > 0 ? todayConsumed : (totalConsumed > 0 ? Math.round((totalConsumed / 3) * 10) / 10 : 10);

    // Days of supply remaining before stockout
    const daysOfSupply = avgDailyBurnRate > 0 ? Math.round((mat.currentStock / avgDailyBurnRate) * 10) / 10 : 99;

    // Threshold calculation: configured settings threshold or material's minimum alert
    const configuredThreshold = mat.minimumStockAlert;
    const effectiveReorderThreshold = Math.max(configuredThreshold, Math.round(mat.minimumStockAlert * (1 + globalThresholdPercentage / 100)));

    const isBelowThreshold = mat.currentStock <= effectiveReorderThreshold;

    let urgency: 'CRITICAL' | 'WARNING' | 'HEALTHY' = 'HEALTHY';
    if (mat.currentStock <= effectiveReorderThreshold * 0.5 || daysOfSupply <= 2) {
      urgency = 'CRITICAL';
    } else if (isBelowThreshold) {
      urgency = 'WARNING';
    }

    const shortfall = Math.max(0, effectiveReorderThreshold - mat.currentStock);
    // Suggested reorder: bring stock to 3x reorder threshold
    const suggestedReorder = Math.max(shortfall, Math.round(effectiveReorderThreshold * 2));

    return {
      materialId: mat.id,
      code: mat.code,
      name: mat.name,
      category: mat.category,
      unit: mat.unitOfMeasure,
      currentStock: mat.currentStock,
      minimumStockAlert: mat.minimumStockAlert,
      effectiveReorderThreshold,
      totalQuantityConsumed: totalConsumed,
      todayQuantityConsumed: todayConsumed,
      avgDailyBurnRate,
      daysOfSupplyRemaining: daysOfSupply,
      isBelowThreshold,
      urgency,
      shortfallUnits: shortfall,
      suggestedReorderQuantity: suggestedReorder,
      supplierName: mat.supplierName,
    };
  });

  const criticalMaterials = materialStats.filter(m => m.urgency === 'CRITICAL');
  const warningMaterials = materialStats.filter(m => m.urgency === 'WARNING');
  const totalBelow = criticalMaterials.length + warningMaterials.length;

  let summaryText = 'All raw material ingredients are safely above reorder thresholds.';
  if (criticalMaterials.length > 0) {
    summaryText = `CRITICAL ALERT: ${criticalMaterials.map(m => `${m.name} (${m.currentStock} ${m.unit} left, ~${m.daysOfSupplyRemaining} days)`).join('; ')} require immediate procurement!`;
  } else if (warningMaterials.length > 0) {
    summaryText = `REORDER WARNING: ${warningMaterials.length} ingredient(s) are nearing reorder threshold.`;
  }

  return {
    materialStats,
    criticalMaterials,
    warningMaterials,
    totalBelowThreshold: totalBelow,
    hasCriticalAlerts: criticalMaterials.length > 0,
    summaryText,
  };
}
