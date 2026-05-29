/**
 * calcSectionTotal
 * Returns the total cost for one section: (material + labor) × qty.
 * qty defaults to 1 so a zero qty doesn't zero out the line.
 */
export function calcSectionTotal(section) {
  const { material_cost = 0, labor_cost = 0, qty = 1 } = section;
  const effectiveQty = qty > 0 ? qty : 1;
  return (material_cost + labor_cost) * effectiveQty;
}

/**
 * calcLumpSum
 * Sums all section totals into the project's single lump-sum estimate.
 */
export function calcLumpSum(sections = []) {
  return sections.reduce((acc, s) => acc + calcSectionTotal(s), 0);
}

/**
 * calcMaterialSubtotal / calcLaborSubtotal
 * Convenience breakdowns used in print/export views.
 */
export function calcMaterialSubtotal(sections = []) {
  return sections.reduce((acc, s) => {
    const qty = s.qty > 0 ? s.qty : 1;
    return acc + (s.material_cost ?? 0) * qty;
  }, 0);
}

export function calcLaborSubtotal(sections = []) {
  return sections.reduce((acc, s) => {
    const qty = s.qty > 0 ? s.qty : 1;
    return acc + (s.labor_cost ?? 0) * qty;
  }, 0);
}

/**
 * applyMarkup
 * Applies a percentage markup to a base cost. markup = 0.15 → +15%.
 */
export function applyMarkup(baseCost, markup = 0) {
  return baseCost * (1 + markup);
}

/**
 * applyTax
 * Applies a sales tax rate to material costs only.
 * taxRate = 0.08 → 8% tax.
 */
export function applyTax(sections = [], taxRate = 0) {
  const materialBase = calcMaterialSubtotal(sections);
  return materialBase * taxRate;
}
