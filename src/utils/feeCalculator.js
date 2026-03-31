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

  // Use simple threshold-based calculation matching the official BVI fee structure:
  // First $25,000 at 3%, next $25,000 at 5%, remainder at 7%
  const tiers = [
    { threshold: 25000, rate: 0.03, label: 'Up to $25,000' },
    { threshold: 50000, rate: 0.05, label: '$25,001 - $50,000' },
    { threshold: Infinity, rate: 0.07, label: 'Above $50,000' },
  ];

  let remainingSalary = salary;
  let prevThreshold = 0;
  let totalFee = 0;
  const breakdown = [];

  for (const tier of tiers) {
    if (remainingSalary <= 0) break;
    const tierSize = tier.threshold === Infinity ? remainingSalary : tier.threshold - prevThreshold;
    const taxable = Math.min(remainingSalary, tierSize);
    const amount = taxable * tier.rate;
    breakdown.push({ tier: tier.label, rate: `${tier.rate * 100}%`, taxable, amount: Math.round(amount * 100) / 100 });
    totalFee += amount;
    remainingSalary -= taxable;
    prevThreshold = tier.threshold;
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
  const num = Number(amount);
  if (!Number.isFinite(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(num);
}
