import { randomUUID } from 'node:crypto'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { config } from '../config.js'
import { AppError } from '../utils/errors.js'
import { detectImage } from '../utils/image.js'

const root = () => path.resolve(config.photoDir)

/** Simpan foto; kembalikan path relatif di bawah PHOTO_STORAGE_DIR (yyyy/mm/uuid.ext). */
export async function savePhoto(buf: Buffer, now = new Date()): Promise<string> {
  const kind = detectImage(buf)
  if (!kind) throw new AppError('VALIDATION', 'Foto harus berupa gambar JPEG, PNG, atau WebP.')
  const rel = `${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}/${randomUUID()}.${kind.ext}`
  await mkdir(path.dirname(path.join(root(), rel)), { recursive: true })
  await writeFile(path.join(root(), rel), buf, { flag: 'wx' })
  return rel
}

/** Path absolut yang dijamin berada di dalam folder foto (cegah path traversal). */
export function photoAbsolutePath(rel: string): string {
  const abs = path.resolve(root(), rel)
  if (!abs.startsWith(root() + path.sep)) throw new AppError('NOT_FOUND', 'Foto tidak ditemukan.')
  return abs
}

export async function deletePhoto(rel: string): Promise<void> {
  await unlink(photoAbsolutePath(rel)).catch(() => undefined)
}
