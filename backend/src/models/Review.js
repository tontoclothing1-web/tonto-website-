import { requireSupabase } from '../config/supabase.js';

export const REVIEWS_TABLE = 'reviews';
export const REVIEW_TABLE = REVIEWS_TABLE;

export function mapReviewRowToCamel(row) {
  if (!row) return null;
  return {
    id: row.id,
    _id: row.id,
    uuid: row.id,
    productId: row.product_id,
    product_id: row.product_id,
    user: row.user_id,
    userId: row.user_id,
    user_id: row.user_id,
    userName: row.user_name ?? row.userName ?? '',
    rating: row.rating,
    comment: row.comment ?? '',
    approved: !!row.approved,
    createdAt: row.created_at,
    updatedAt: row.updated_at ?? row.created_at,
  };
}

export function mapReviewCamelToRow(input = {}) {
  const row = {};
  if (input.productId !== undefined) row.product_id = input.productId;
  else if (input.product_id !== undefined) row.product_id = input.product_id;
  if (input.user !== undefined && typeof input.user === 'string') row.user_id = input.user;
  else if (input.userId !== undefined) row.user_id = input.userId;
  else if (input.user_id !== undefined) row.user_id = input.user_id;
  if (input.rating !== undefined) row.rating = input.rating;
  if (input.comment !== undefined) row.comment = input.comment;
  if (input.approved !== undefined) row.approved = !!input.approved;
  return row;
}

export async function getReviewRowById(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(REVIEWS_TABLE).select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  return data;
}

export async function getReviewById(id) {
  return mapReviewRowToCamel(await getReviewRowById(id));
}

export async function getReviewRowByProductAndUser(productId, userId) {
  const sb = requireSupabase();
  const { data, error } = await sb
    .from(REVIEWS_TABLE)
    .select('*')
    .eq('product_id', productId)
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function listReviewRows({ productId, approved, limit = 200 } = {}) {
  const sb = requireSupabase();
  let q = sb.from(REVIEWS_TABLE).select('*').order('created_at', { ascending: false }).limit(limit);
  if (productId !== undefined) q = q.eq('product_id', productId);
  if (approved !== undefined) q = q.eq('approved', approved);
  const { data, error } = await q;
  if (error) throw error;
  return data || [];
}

export async function createReviewRow(payload) {
  const sb = requireSupabase();
  const row = mapReviewCamelToRow(payload);
  const { data, error } = await sb.from(REVIEWS_TABLE).insert(row).select().single();
  if (error) throw error;
  return data;
}

export async function createReview(payload) {
  return mapReviewRowToCamel(await createReviewRow(payload));
}

export async function updateReviewRowById(id, patch) {
  const sb = requireSupabase();
  const row = mapReviewCamelToRow(patch);
  delete row.product_id;
  delete row.user_id;
  const { data, error } = await sb
    .from(REVIEWS_TABLE)
    .update(row)
    .eq('id', id)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function deleteReviewRowById(id) {
  const sb = requireSupabase();
  const { data, error } = await sb.from(REVIEWS_TABLE).delete().eq('id', id).select().maybeSingle();
  if (error) throw error;
  return data;
}

export default {
  REVIEWS_TABLE,
  REVIEW_TABLE,
  mapReviewRowToCamel,
  mapReviewCamelToRow,
  getReviewRowById,
  getReviewById,
  getReviewRowByProductAndUser,
  listReviewRows,
  createReviewRow,
  createReview,
  updateReviewRowById,
  deleteReviewRowById,
};
