import { deleteDressEntry } from '../../utils/db'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Dress entry id is required.'
    })
  }

  await deleteDressEntry(id)

  return { ok: true }
})
