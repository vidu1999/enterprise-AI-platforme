import { BadRequestException } from '@nestjs/common';
import { InventoryService } from './inventory.service';

describe('InventoryService', () => {
  it('blocks outbound stock adjustments that would make quantity negative', async () => {
    const tx: any = {
      one: jest.fn().mockResolvedValueOnce({
        id: 'item-1',
        sku: 'BRG-6205',
        name: 'Ball Bearing',
        unit: 'pcs',
        quantity: 2,
        reorderLevel: 10,
        unitCost: 4850,
      }),
    };
    const db: any = {
      withTransaction: (fn: any) => fn(tx),
    };
    const notifications: any = { notifyRoles: jest.fn() };
    const svc = new InventoryService(db, notifications);

    await expect(
      svc.adjust('company-1', 'user-1', 'item-1', { type: 'OUT', quantity: 5 }),
    ).rejects.toThrow(BadRequestException);
  });

  it('automatically generates a Purchase Order and Approval when stock drops below reorder level', async () => {
    const tx: any = {
      one: jest
        .fn()
        // 1. select item
        .mockResolvedValueOnce({
          id: 'item-1',
          sku: 'BRG-6205',
          name: 'SKF Ball Bearing',
          unit: 'pcs',
          quantity: 12,
          reorderLevel: 10,
          unitCost: 5000,
          supplierId: 'sup-1',
        })
        // 2. update item
        .mockResolvedValueOnce({
          id: 'item-1',
          companyId: 'company-1',
          sku: 'BRG-6205',
          name: 'SKF Ball Bearing',
          unit: 'pcs',
          quantity: 8,
          reorderLevel: 10,
          unitCost: 5000,
          supplierId: 'sup-1',
        })
        // 3. check existing pending PO
        .mockResolvedValueOnce(null)
        // 4. insert PO
        .mockResolvedValueOnce({ id: 'po-99', number: 'PO-AUTO-TEST' })
        // 5. insert Approval
        .mockResolvedValueOnce({ id: 'app-99' }),
      query: jest.fn().mockResolvedValue({ rows: [], rowCount: 1 }),
    };
    const db: any = { withTransaction: (fn: any) => fn(tx) };
    const notifications: any = { notifyRoles: jest.fn().mockResolvedValue([]) };
    const svc = new InventoryService(db, notifications);

    const res = await svc.adjust('company-1', 'user-1', 'item-1', {
      type: 'OUT',
      quantity: 4,
      note: 'Used on CNC-104',
    });

    expect(res.quantity).toBe(8);
    expect(res.isLowStock).toBe(true);
    expect(res.autoPurchaseOrder).toBeDefined();
    expect(res.autoPurchaseOrder.number).toBe('PO-AUTO-TEST');
    expect(notifications.notifyRoles).toHaveBeenCalledTimes(2);
  });
});
