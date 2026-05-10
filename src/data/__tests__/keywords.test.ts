import { describe, expect, it } from 'vitest'
import { formatKeyword, getKeywordInfo } from '../keywords'

describe('getKeywordInfo', () => {
  it('returns canonical info for known keywords', () => {
    expect(getKeywordInfo('bastion').label).toBe('Bastión')
    expect(getKeywordInfo('kulen').label).toBe('Külen')
    expect(getKeywordInfo('formacion_solar').label).toBe('Formación Solar')
    expect(getKeywordInfo('ignicion').label).toBe('Ignición')
    expect(getKeywordInfo('refluencia').label).toBe('Refluencia')
  })

  it('returns reminder text for the firma keywords', () => {
    expect(getKeywordInfo('kulen').reminder).toContain('+1 fuerza')
    expect(getKeywordInfo('refluencia').reminder).toContain('Pozo Astral')
    expect(getKeywordInfo('ignicion').reminder).toContain('sacrificar')
    expect(getKeywordInfo('formacion_solar').reminder).toContain('cada otra nave')
  })

  it('returns base/canonical keywords too', () => {
    expect(getKeywordInfo('embate').label).toBe('Embate')
    expect(getKeywordInfo('desgarro').label).toBe('Desgarro')
    expect(getKeywordInfo('vuelo').label).toBe('Vuelo')
    expect(getKeywordInfo('premonition').label).toBe('Premonición')
  })

  it('falls back to id for unknown keywords (no crash)', () => {
    const info = getKeywordInfo('xyzunknown')
    expect(info.id).toBe('xyzunknown')
    expect(info.label).toBe('xyzunknown')
    expect(info.reminder).toBe('')
  })
})

describe('formatKeyword', () => {
  it('formats a keyword with its reminder in parentheses', () => {
    const txt = formatKeyword('bastion')
    expect(txt).toMatch(/^Bastión \(/)
    expect(txt).toContain('debe ser atacada')
  })

  it('returns just the label when there is no reminder', () => {
    expect(formatKeyword('xyzunknown')).toBe('xyzunknown')
  })
})
