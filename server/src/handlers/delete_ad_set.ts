import { db } from '../db';
import { adSetsTable, adsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteAdSet = async (input: IdInput): Promise<boolean> => {
  try {
    // First, mark all associated ads as deleted
    await db.update(adsTable)
      .set({
        status: 'Deleted',
        updated_at: new Date()
      })
      .where(eq(adsTable.ad_set_id, input.id))
      .execute();

    // Then mark the ad set as deleted and return the updated record
    const result = await db.update(adSetsTable)
      .set({
        status: 'Deleted',
        updated_at: new Date()
      })
      .where(eq(adSetsTable.id, input.id))
      .returning()
      .execute();

    // Return true if the ad set was found and updated
    return result.length > 0;
  } catch (error) {
    console.error('Ad set deletion failed:', error);
    throw error;
  }
};