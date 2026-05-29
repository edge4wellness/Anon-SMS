/**
 * Core mathematical engine for CarpenterPro estimates.
 * Sums costs and enforces the client-facing 'Lump Sum by Section' view rule.
 */
export function calculateProjectTotal(project, sections, materials, laborTasks, defaultMarkup) {
    const markupMultiplier = 1 + (defaultMarkup / 100);
    let totalProjectMaterialsCost = 0;
    let totalProjectLaborCost = 0;
    const sectionBreakdowns = {};

    sections.forEach(section => {
        sectionBreakdowns[section.section_id] = {
            area_name: section.area_name,
            raw_materials_subtotal: 0,
            raw_labor_subtotal: 0
        };
    });

    materials.forEach(mat => {
        const cost = mat.qty * mat.unit_cost;
        totalProjectMaterialsCost += cost;
        if (sectionBreakdowns[mat.section_id]) {
            sectionBreakdowns[mat.section_id].raw_materials_subtotal += cost;
        }
    });

    laborTasks.forEach(task => {
        const cost = task.crew_size * task.hours_estimated * task.hourly_rate;
        totalProjectLaborCost += cost;
        if (sectionBreakdowns[task.section_id]) {
            sectionBreakdowns[task.section_id].raw_labor_subtotal += cost;
        }
    });

    const clientProposalSections = Object.keys(sectionBreakdowns).map(sectionId => {
        const sec = sectionBreakdowns[sectionId];
        const rawSectionTotal = sec.raw_materials_subtotal + sec.raw_labor_subtotal;
        return {
            section_id: sectionId,
            area_name: sec.area_name,
            lump_sum_price: Math.round((rawSectionTotal * markupMultiplier) * 100) / 100
        };
    });

    const totalRawCostBasis = totalProjectMaterialsCost + totalProjectLaborCost;
    const finalTotalBid = Math.round((totalRawCostBasis * markupMultiplier) * 100) / 100;

    return {
        database_update: {
            project_id: project.project_id,
            total_materials_cost: totalProjectMaterialsCost,
            total_labor_cost: totalProjectLaborCost,
            markup_percent: defaultMarkup,
            total_bid: finalTotalBid,
            last_modified_at: new Date().toISOString()
        },
        client_proposal_view: {
            sections: clientProposalSections,
            grand_total: finalTotalBid
        }
    };
}
