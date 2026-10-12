import { instanceToPlain, plainToInstance } from 'class-transformer';
import { Transaction } from './entities/transaction.entity';

// Contract test: the JSON the API sends for a transaction must keep the field
// names existing clients read. The frontend's invoice download prints
// `tx.paystackReference`; renaming the entity property to `gatewayReference`
// must not silently turn that into "undefined".
describe('Transaction JSON contract', () => {
  const tx = Object.assign(new Transaction(), {
    id: 't1', reference: 'ref1', gateway: 'opay', gatewayReference: 'ORD_42', amountKobo: 500000,
  });

  it('still serializes the legacy paystackReference field, mirroring gatewayReference', () => {
    const json = instanceToPlain(tx);
    expect(json.paystackReference).toBe('ORD_42');
    expect(json.gatewayReference).toBe('ORD_42');
  });

  it('exposes the new gateway field so clients can show which rail was used', () => {
    expect(instanceToPlain(tx).gateway).toBe('opay');
  });

  it('is null (not undefined) when there is no provider reference yet', () => {
    const json = instanceToPlain(Object.assign(new Transaction(), { gatewayReference: null }));
    expect(json.paystackReference).toBeNull();
  });

  it('the alias is read-only: it cannot be written through, so it can never diverge from the real field', () => {
    const t = plainToInstance(Transaction, { gatewayReference: 'A', paystackReference: 'B' });
    expect(t.gatewayReference).toBe('A');
    expect(t.paystackReference).toBe('A');
  });
});
