import type { SupabaseClient } from '@supabase/supabase-js'

const PAGE_SIZE = 1000

/**
 * Count profiles per exam center. Aligns with admin /admin/users (all roles with a center)
 * except admin and super_admin.
 */
export async function countProfilesByCenterId(
  supabase: SupabaseClient,
  centerIds: string[]
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (centerIds.length === 0) return counts

  const ids = [...new Set(centerIds)]
  let from = 0

  for (;;) {
    const { data, error } = await supabase
      .from('profiles')
      .select('center_id')
      .in('center_id', ids)
      .not('user_type', 'eq', 'admin')
      .not('user_type', 'eq', 'super_admin')
      .range(from, from + PAGE_SIZE - 1)

    if (error) {
      console.error('countProfilesByCenterId:', error)
      break
    }
    if (!data?.length) break

    for (const row of data) {
      if (!row.center_id) continue
      counts.set(row.center_id, (counts.get(row.center_id) || 0) + 1)
    }

    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  return counts
}
