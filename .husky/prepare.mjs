import { access } from 'node:fs/promises'
import { constants } from 'node:fs'
import { URL } from 'node:url'

try {
  await access(new URL('../node_modules/husky/index.js', import.meta.url), constants.R_OK)
  const { default: husky } = await import('husky')
  husky()
} catch (error) {
  if (error?.code !== 'ERR_MODULE_NOT_FOUND' && error?.code !== 'ENOENT') {
    throw error
  }
}
