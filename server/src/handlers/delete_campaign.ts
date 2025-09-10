import { db } from '../db';
import { campaignsTable } from '../db/schema';
import { type IdInput } from '../schema';
import { eq } from 'drizzle-orm';

export const deleteCampaign = async (input: IdInput): Promise<boolean> => {
  try {
    // Delete the campaign record
    const result = await db.delete(campaignsTable)
      .where(eq(campaignsTable.id, input.id))
      .returning()
      .execute();

    // Return true if a record was deleted, false otherwise
    return result.length > 0;
  } catch (error) {
    console.error('Campaign deletion failed:', error);
    throw error;
  }
};