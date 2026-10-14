import { describe, expect, it } from 'vitest';
import { createPasswordRecord, verifyPassword, validatePassword, LoginLockout } from './password';
import {
  approvalRequiresAuthority, applyAcceptedDelivery, canCommitBudget, canRecordPayment, canVendorBid, remainingCommitmentAfterCancellation, isSoloOwnerFlow, appendAuditEntry,
  canViewBid, calculateReliabilityScore, calculateWeightedScores, resolveBudgetOverride,
} from './procurementRules';
import type { Bid, EvaluationWeights, Tender } from '../types';

const weights: EvaluationWeights = { price: 40, deliveryTime: 20, vendorReliability: 25, technicalScore: 15 };
const tender = { bidClosingDateTime: '2026-10-14T12:00:00.000Z' } as Tender;
const bid = { id: 'b1', vendorId: 'vendor-1', totalAmount: 100, proposedDeliveryDate: '2026-10-20', technicalScore: 80 } as Bid;

describe('password hashing and policy', () => {
  it('salts passwords and verifies only the correct password', () => {
    const one = createPasswordRecord('Procura@2026');
    const two = createPasswordRecord('Procura@2026');
    expect(one.passwordSalt).not.toBe(two.passwordSalt);
    expect(one.passwordHash).not.toBe('Procura@2026');
    expect(verifyPassword('Procura@2026', one)).toBe(true);
    expect(verifyPassword('wrong', one)).toBe(false);
  });
  it('keeps the existing password rules', () => {
    expect(validatePassword('abc123')).toContain('at least 8');
    expect(validatePassword('abcdefgh')).toContain('letters and at least one number');
    expect(validatePassword('Procura123')).toBeNull();
  });
});

describe('procurement controls', () => {
  it('hides bid values from a procurement officer before close and reveals them after close', () => {
    expect(canViewBid(bid, tender, 'Procurement Officer', undefined, Date.parse('2026-10-14T11:59:59Z'))).toBe(false);
    expect(canViewBid(bid, tender, 'Procurement Officer', undefined, Date.parse('2026-10-14T12:00:00Z'))).toBe(true);
    expect(canViewBid(bid, tender, 'Finance Officer', undefined, Date.parse('2026-10-14T13:00:00Z'))).toBe(false);
    expect(canViewBid(bid, tender, 'Vendor', 'vendor-2', Date.parse('2026-10-14T11:00:00Z'))).toBe(false);
    expect(canViewBid(bid, tender, 'Vendor', 'vendor-1', Date.parse('2026-10-14T11:00:00Z'))).toBe(true);
  });
  it('routes only awards strictly above the approval threshold to Authority', () => {
    expect(approvalRequiresAuthority(5000000, 5000000)).toBe(false);
    expect(approvalRequiresAuthority(5000001, 5000000)).toBe(true);
  });
  it('blocks budget commitments beyond allocation unless override is approved', () => {
    expect(canCommitBudget(100, 40, 40, 20)).toBe(true);
    expect(canCommitBudget(100, 40, 40, 21)).toBe(false);
    expect(canCommitBudget(100, 40, 40, 21, true)).toBe(true);
  });
  it('walks Finance override request through approval and rejection states', () => {
    const pending = 'Pending' as const;
    const approved = resolveBudgetOverride(pending, true);
    expect(approved).toBe('Approved');
    expect(canCommitBudget(100, 40, 40, 21, approved === 'Approved')).toBe(true);
    const rejected = resolveBudgetOverride(pending, false);
    expect(rejected).toBe('Rejected');
    expect(canCommitBudget(100, 40, 40, 21, rejected === 'Approved')).toBe(false);
    expect(resolveBudgetOverride('Approved', false)).toBeNull();
  });
  it('counts partial accepted deliveries cumulatively and ignores rejected quantities', () => {
    const result = applyAcceptedDelivery(
      [{ quantity: 5, receivedQuantity: 2 }, { quantity: 2, receivedQuantity: 0 }],
      [{ received: 4, status: 'Partially Accepted' }, { received: 2, status: 'Rejected' }],
    );
    expect(result.acceptedQuantities).toEqual([3, 0]);
    expect(result.receivedQuantities).toEqual([5, 0]);
    expect(result.isFullyDelivered).toBe(false);
  });
  it('prevents payment before delivery and limits payment to accepted goods value', () => {
    const po = { status: 'Partially Delivered', totalAmount: 1000, paidAmount: 200, items: [{ quantity: 10, unitPrice: 100, receivedQuantity: 3 }] };
    expect(canRecordPayment({ ...po, status: 'Issued' }, 1)).toBe(false);
    expect(canRecordPayment(po, 100)).toBe(true);
    expect(canRecordPayment(po, 101)).toBe(false);
  });
  it('scores vendors using weighted price, delivery, reliability and technical scores', () => {
    const scored = calculateWeightedScores(
      [{ ...bid, id: 'low', totalAmount: 100, technicalScore: 80 }, { ...bid, id: 'high', totalAmount: 200, technicalScore: 80 }],
      weights, (b) => b.id === 'low' ? 90 : 50, Date.parse('2026-10-14T00:00:00Z'),
    );
    expect(scored[0].computedScores.rank).toBe(1);
    expect(scored[0].computedScores.totalWeightedScore).toBeGreaterThan(scored[1].computedScores.totalWeightedScore);
    expect(scored[0].computedScores.reliabilityScore).toBe(90);
  });
  it('updates reliability for late and rejected deliveries', () => {
    expect(calculateReliabilityScore(1, 1, 1)).toBe(53);
    expect(calculateReliabilityScore(0, 0, 0)).toBe(60);
  });
  it('allows bidding only after procurement approval and blocks suspended vendors', () => {
    expect(canVendorBid('Registered')).toBe(false);
    expect(canVendorBid('Suspended')).toBe(false);
    expect(canVendorBid('Blacklisted')).toBe(false);
    expect(canVendorBid('Approved')).toBe(true);
  });
  it('releases only the unpaid commitment on cancellation', () => {
    expect(remainingCommitmentAfterCancellation(1000, 250)).toBe(750);
    expect(remainingCommitmentAfterCancellation(1000, 1200)).toBe(0);
  });
  it('supports the single-user sole-proprietor flow without granting it to another organization', () => {
    expect(isSoloOwnerFlow('sole_proprietorship', 'org-husab', 'org-husab')).toBe(true);
    expect(isSoloOwnerFlow('enterprise', 'org-emerald', 'org-emerald')).toBe(false);
    expect(isSoloOwnerFlow('sole_proprietorship', 'org-husab', 'org-emerald')).toBe(false);
  });
  it('keeps audit history append-only and ignores duplicate event ids', () => {
    const original = [{ id: 'audit-1', action: 'Created' }];
    expect(appendAuditEntry(original, { id: 'audit-2', action: 'Approved' })).toEqual([
      { id: 'audit-2', action: 'Approved' }, { id: 'audit-1', action: 'Created' },
    ]);
    expect(appendAuditEntry(original, { id: 'audit-1', action: 'Tampered' })).toEqual(original);
  });
  it('locks after five failed attempts and unlocks after five minutes', () => {
    const lockout = new LoginLockout();
    const start = 1_000_000;
    for (let i = 0; i < 4; i++) lockout.fail('person@example.com', start + i);
    expect(lockout.message('person@example.com', start + 5)).toBeNull();
    lockout.fail('person@example.com', start + 5);
    expect(lockout.message('person@example.com', start + 6)).toContain('Too many failed attempts');
    expect(lockout.message('person@example.com', start + 5 * 60 * 1000 + 10)).toBeNull();
  });
});
