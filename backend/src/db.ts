import 'dotenv/config'
import { PrismaMariaDb } from '@prisma/adapter-mariadb'
import { PrismaClient } from './generated/prisma/client.js'

const url = process.env.DATABASE_URL
if (!url) throw new Error('DATABASE_URL belum diisi')

// Prisma 7: koneksi lewat driver adapter. URL juga dibaca prisma.config.ts untuk CLI.
export const prisma = new PrismaClient({ adapter: new PrismaMariaDb(url) })
