import { FEE_TIERS, DOMESTIC_RATE, APPLICATION_FEE, FEE_CAP } from '../data/constants';

export function calculateWorkPermitFee(annualSalary, isDomestic = false) {
  const salary = parseFloat(annualSalary) || 0;
  if (salary <= 0) return { permitFee: 0, applicationFee: APPLICATION_FEE, total: APPLICATION_FEE, breakdown: [] };

  if (isDomestic) {
    const permitFee = Math.min(salary * DOMESTIC_RATE, FEE_CAP);
    return {
      permitFee: Math.round(permitFee * 100) / 100,
      applicationFee: APPLICATION_FEE,
      total: Math.round((permitFee + APPLICATION_FEE) * 100) / 100,
      breakdown: [{ tier: 'Domestic Worker (1%)', amount: permitFee, salary }],
    };
  }

  let remainingSalary = salary;
  let totalFee = 0;
  const breakdown = [];

  for (const tier of FEE_TIERS) {
    if (remainingSalary <= 0) break;
    const taxable = Math.min(remainingSalary, tier.max - tier.min + 1);
    const amount = taxable * tier.rate;
    breakdown.push({ tier: tier.label, rate: `${tier.rate * 100}%`, taxable, amount: Math.round(amount * 100) / 100 });
    totalFee += amount;
    remainingSalary -= taxable;
  }

  const cappedFee = Math.min(totalFee, FEE_CAP);
  return {
    permitFee: Math.round(cappedFee * 100) / 100,
    applicationFee: APPLICATION_FEE,
    total: Math.round((cappedFee + APPLICATION_FEE) * 100) / 100,
    breakdown,
    capped: totalFee > FEE_CAP,
  };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
}
