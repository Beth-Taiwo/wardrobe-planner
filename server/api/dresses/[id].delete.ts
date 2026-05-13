import { db } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dress entry id is required.'
    })
  }

  db.prepare('DELETE FROM dress_entries WHERE id = ?').run(id)

  return { ok: true }
})
