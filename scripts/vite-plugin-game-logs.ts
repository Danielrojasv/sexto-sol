// Vite plugin: API local para guardar/consultar logs de partidas.
//
// Solo activo en `pnpm dev` — sirve endpoints REST que escriben/leen
// archivos JSON en `logs/games/` (gitignored). Cliente postea cada
// partida terminada y puede descargar el consolidado para análisis.
//
// Endpoints:
//   POST /api/log         body=JSON          escribe logs/games/{ts}-{seed}.json
//   GET  /api/logs/count  -                  → { count: number }
//   GET  /api/logs/all    -                  → array de partidas (JSON)
//   DELETE /api/logs      -                  borra todos los archivos

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

interface GameLog {
  ts: string
  seed: number
  [k: string]: unknown
}

export function gameLogsPlugin(): Plugin {
  const root = process.cwd()
  const dir = resolve(root, 'logs/games')
  mkdirSync(dir, { recursive: true })

  function listFiles(): string[] {
    try {
      return readdirSync(dir).filter((f) => f.endsWith('.json'))
    } catch {
      return []
    }
  }

  return {
    name: 'sexto-sol:game-logs',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/api/log', (req, res, next) => {
        if (req.method !== 'POST') return next()
        let body = ''
        req.on('data', (chunk) => (body += chunk))
        req.on('end', () => {
          try {
            const parsed = JSON.parse(body) as GameLog
            const ts = parsed.ts ?? new Date().toISOString().replace(/[:.]/g, '-')
            const seed = parsed.seed ?? 'unknown'
            const filename = `${ts}-${seed}.json`
            const filepath = resolve(dir, filename)
            writeFileSync(filepath, JSON.stringify(parsed, null, 2))
            res.statusCode = 201
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, filename }))
          } catch (err) {
            res.statusCode = 400
            res.end(JSON.stringify({ ok: false, error: (err as Error).message }))
          }
        })
      })

      server.middlewares.use('/api/logs/count', (req, res, next) => {
        if (req.method !== 'GET') return next()
        const count = listFiles().length
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ count }))
      })

      server.middlewares.use('/api/logs/all', (req, res, next) => {
        if (req.method !== 'GET') return next()
        const files = listFiles().sort()
        const games = files.map((f) => {
          try {
            return JSON.parse(readFileSync(resolve(dir, f), 'utf8'))
          } catch {
            return { error: `Failed to read ${f}` }
          }
        })
        res.setHeader('Content-Type', 'application/json')
        res.setHeader('Content-Disposition', 'attachment; filename="sexto-sol-logs.json"')
        res.end(JSON.stringify({ version: 'v4.2', count: games.length, games }, null, 2))
      })

      server.middlewares.use('/api/logs', (req, res, next) => {
        if (req.method !== 'DELETE') return next()
        const files = listFiles()
        for (const f of files) {
          try {
            rmSync(resolve(dir, f))
          } catch {
            // ignore
          }
        }
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({ ok: true, deleted: files.length }))
      })
    },
  }
}
