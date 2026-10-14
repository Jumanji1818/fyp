import type { Bid, EvaluationWeights, Tender, UserRole } from '../types';

export const BID_EVALUATOR_ROLES: UserRole[] = [
  'Procurement Officer',
  'Organization Admin',
  'Approving Authority',
];

export function canViewBid(
  bid: Pick<Bid, 'vendorId'>,
  tender: Pick<Tender, 'bidClosingDateTime'> | undefined,
  role: UserRole | 'Pending' | undefined,
  viewerVendorId: string | undefined,
  now = Date.now(),
): boolean {
  if (role === 'Vendor') return !!viewerVendorId && bid.vendorId === viewerVendorId;
  if (!tender || !BID_EVALUATOR_ROLES.includes(role as UserRole)) return false;
  const closesAt = new Date(tender.bidClosingDateTime).getTime();
  return Number.isFinite(closesAt) && now >= closesAt;
}

export function approvalRequiresAuthority(amount: number, threshold: number): boolean {
  return Number.isFinite(amount) && amount > Math.max(0, threshold);
}

export function canCommitBudget(
  annualBudget: number,
  spent: number,
  committed: number,
  amount: number,
  overrideApproved = false,
): boolean {
  if (![annualBudget, spent, committed, amount].every(Number.isFinite) || amount <= 0) return false;
  return overrideApproved || spent + committed + amount <= annualBudget;
}

export function getReceivedValue<T extends { quantity: number; unitPrice: number; receivedQuantity?: number }>(
  items: T[],
): number {
  return items.reduce((sum, item) => {
    const received = Math.max(0, Math.min(item.quantity, item.receivedQuantity || 0));
    return sum + received * item.unitPrice;
  }, 0);
}

export function canRecordPayment(
  po: { status: string; totalAmount: number; paidAmount: number; items: { quantity: number; unitPrice: number; receivedQuantity?: number }[] },
  amount: number,
): boolean {
  if (!['Delivered', 'Partially Delivered'].includes(po.status)) return false;
  if (!Number.isFinite(amount) || amount <= 0) return false;
  const receivedValue = getReceivedValue(po.items);
  const available = Math.min(po.totalAmount, receivedValue) - po.paidAmount;
  return available >= 0 && amount <= available + 0.005;
}

export function applyAcceptedDelivery(
  orderedItems: { quantity: number; receivedQuantity?: number }[],
  receivedItems: { received: number; status: 'Accepted' | 'Partially Accepted' | 'Rejected' }[],
): { receivedQuantities: number[]; acceptedQuantities: number[]; isFullyDelivered: boolean } {
  const acceptedQuantities = orderedItems.map((item, index) => {
    const receipt = receivedItems[index];
    if (!receipt || receipt.status === 'Rejected' || !Number.isFinite(receipt.received)) return 0;
    return Math.max(0, Math.min(receipt.received, item.quantity - (item.receivedQuantity || 0)));
  });
  const receivedQuantities = orderedItems.map((item, index) =>
    Math.max(0, Math.min(item.quantity, (item.receivedQuantity || 0) + acceptedQuantities[index])),
  );
  return {
    receivedQuantities,
    acceptedQuantities,
    isFullyDelivered: orderedItems.every((item, index) => receivedQuantities[index] >= item.quantity),
  };
}

export function calculateReliabilityScore(onTime: number, late: number, rejected: number): number {
  const total = Math.max(0, onTime) + Math.max(0, late) + Math.max(0, rejected);
  if (!total) return 60;
  return Math.round((Math.max(0, onTime) * 100 + Math.max(0, late) * 60) / total);
}

export function calculateWeightedScores<T extends {
  id: string;
  totalAmount: number;
  proposedDeliveryDate: string;
  technicalScore?: number;
}>(
  bids: T[],
  weights: EvaluationWeights,
  reliabilityByBidId: (bid: T) => number,
  now = Date.now(),
): (T & { computedScores: { priceScore: number; deliveryScore: number; reliabilityScore: number; technicalScore: number; totalWeightedScore: number; rank: number } })[] {
  if (!bids.length) return [];
  const minPrice = Math.min(...bids.map((bid) => bid.totalAmount).filter((price) => price > 0));
  const daysFor = (bid: T) => Math.max(1, Math.ceil((new Date(bid.proposedDeliveryDate).getTime() - now) / 86400000));
  const minDays = Math.min(...bids.map(daysFor));
  const scored = bids.map((bid) => {
    const priceScore = minPrice > 0 && bid.totalAmount > 0 ? minPrice / bid.totalAmount * 100 : 0;
    const deliveryScore = minDays > 0 ? minDays / daysFor(bid) * 100 : 100;
    const reliabilityScore = Math.max(0, Math.min(100, reliabilityByBidId(bid)));
    const technicalScore = Math.max(0, Math.min(100, bid.technicalScore ?? 75));
    const totalWeightedScore = (priceScore * weights.price + deliveryScore * weights.deliveryTime + reliabilityScore * weights.vendorReliability + technicalScore * weights.technicalScore) / 100;
    return { ...bid, computedScores: {
      priceScore: Number(priceScore.toFixed(1)),
      deliveryScore: Number(deliveryScore.toFixed(1)),
      reliabilityScore: Number(reliabilityScore.toFixed(1)),
      technicalScore: Number(technicalScore.toFixed(1)),
      totalWeightedScore: Number(totalWeightedScore.toFixed(2)),
      rank: 0,
    } };
  });
  scored.sort((a, b) => b.computedScores.totalWeightedScore - a.computedScores.totalWeightedScore);
  scored.forEach((bid, index) => { bid.computedScores.rank = index + 1; });
  return scored;
}

export function mergeAuditLogAppendOnly<T extends { id: string }>(existing: T[], imported: T[]): T[] {
  const seen = new Set(existing.map((entry) => entry.id));
  return [...existing, ...imported.filter((entry) => !seen.has(entry.id))];
}

export function resolveBudgetOverride(status: 'Pending' | 'Approved' | 'Rejected', approved: boolean): 'Approved' | 'Rejected' | null {
  return status === 'Pending' ? (approved ? 'Approved' : 'Rejected') : null;
}
