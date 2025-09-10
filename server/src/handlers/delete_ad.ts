import { db } from '../db';
import { adsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteAd = async (input: IdInput): Promise<boolean> => {
  try {
    // Soft delete by updating status to 'Deleted'
    const result = await db
      .update(adsTable)
      .set({ 
        status: 'Deleted',
        updated_at: new Date()
      })
      .where(eq(adsTable.id, input.id))
      .returning()
      .execute();

    // Return true if a record was updated
    return result.length > 0;
  } catch (error) {
    console.error('Ad deletion failed:', error);
    throw error;
  }
};