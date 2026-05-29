/**
 * calcMaterialLineCost — qty × unit_cost for one materials row
 */
export function calcMaterialLineCost(material) {
  return (material.qty ?? 0) * (material.unit_cost ?? 0);
}

/**
 * calcLaborLineCost — crew_size × hours_estimated × hourly_rate for one labor row
 */
export function calcLaborLineCost(labor) {
  return (labor.crew_size ?? 1) * (labor.hours_estimated ?? 0) * (labor.hourly_rate ?? 65);
}

/**
 * calcSectionTotals — returns { materialCost, laborCost, subtotal } for a section
 */
export function calcSectionTotals(materials = [], laborRows = []) {
  const materialCost = materials.reduce((sum, m) => sum + calcMaterialLineCost(m), 0);
  const laborCost = laborRows.reduce((sum, l) => sum + calcLaborLineCost(l), 0);
  return { materialCost, laborCost, subtotal: materialCost + laborCost };
}

/**
 * calcProjectTotals — rolls up all sections, applies markup, returns total_bid
 */
export function calcProjectTotals(materials = [], laborRows = [], markupPercent = 20) {
  const totalMaterials = materials.reduce((sum, m) => sum + calcMaterialLineCost(m), 0);
  const totalLabor = laborRows.reduce((sum, l) => sum + calcLaborLineCost(l), 0);
  const base = totalMaterials + totalLabor;
  const totalBid = base * (1 + markupPercent / 100);
  return {
    total_materials_cost: totalMaterials,
    total_labor_cost: totalLabor,
    total_bid: totalBid,
  };
}
