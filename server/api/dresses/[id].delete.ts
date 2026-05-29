import { deleteDressEntry } from '../../utils/db'
import { requireUser } from '../../utils/auth'

export default defineEventHandler(async (event) => {
  const user = await requireUser(event)
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dress entry id is required.'
    })
  }

  const count = await deleteDressEntry(user.id, id)
  if (!count) {
    throw createError({ statusCode: 404, statusMessage: 'Dress entry not found.' })
  }

  return { ok: true }
})
