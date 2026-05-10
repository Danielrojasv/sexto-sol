import { describe, it, expect } from 'vitest'
import { findBlocklistedTerm } from '../blocklist'

describe('findBlocklistedTerm — word boundary matching', () => {
  it('matches a blocked term as full word', () => {
    expect(findBlocklistedTerm('Inti del Sol')).toBe('inti')
  })

  it('matches case-insensitively', () => {
    expect(findBlocklistedTerm('INTI del Cosmos')).toBe('inti')
  })

  it('matches across hyphens (treated as boundary)', () => {
    expect(findBlocklistedTerm('mit\'a-wasi Coordinador')).toBe("mit'a")
  })

  it('matches across spaces', () => {
    expect(findBlocklistedTerm('Guerrero Mapuche')).toBe('mapuche')
  })

  it('does NOT match "mita" inside "ermita"', () => {
    expect(findBlocklistedTerm('Ermita Solar')).toBeNull()
  })

  it('does NOT match "mita" inside "vomita"', () => {
    expect(findBlocklistedTerm('Vomita Estelar')).toBeNull()
  })

  it('does NOT match "machi" inside "machismo"', () => {
    expect(findBlocklistedTerm('Machismo Profundo')).toBeNull()
  })

  it('does NOT match "inca" inside "incandescente"', () => {
    expect(findBlocklistedTerm('Brasa Incandescente')).toBeNull()
  })

  it('does NOT match "maya" inside "amayar"', () => {
    expect(findBlocklistedTerm('Amayar Cósmico')).toBeNull()
  })

  it('matches "Inka" as standalone word', () => {
    expect(findBlocklistedTerm('Inka del Sol')).toBe('inka')
  })

  it('matches "cuauhtli" but not when used in invented "kwauhtli"', () => {
    expect(findBlocklistedTerm('Ofrenda del Cuauhtli')).toBe('cuauhtli')
    expect(findBlocklistedTerm('Ofrenda del Kwauhtli')).toBeNull()
  })

  it('does NOT match valid invented Q\'ralan names', () => {
    expect(findBlocklistedTerm('Sumaq-untay Tutelar')).toBeNull()
    expect(findBlocklistedTerm("T'awa-wasi Coordinador")).toBeNull()
    expect(findBlocklistedTerm("Q'aphaq del Cristal Orbital")).toBeNull()
  })

  it('does NOT match valid invented Würon names', () => {
    expect(findBlocklistedTerm('Lhüpang del Río')).toBeNull()
    expect(findBlocklistedTerm('Lhüñke Cazador')).toBeNull()
    expect(findBlocklistedTerm('Wütrüpang Resistente')).toBeNull()
  })

  it('does NOT match valid invented Tezhal names', () => {
    expect(findBlocklistedTerm('Xolot Quetlani Ardiente')).toBeNull()
    expect(findBlocklistedTerm('Iniciado Xocotzin')).toBeNull()
    expect(findBlocklistedTerm('Espejo-Pirámide Tzactli')).toBeNull()
  })

  it('does NOT match valid invented Zaqe names', () => {
    expect(findBlocklistedTerm('Bohzhica del Lago de Luz')).toBeNull()
    expect(findBlocklistedTerm('Sumzhua del Sexto Sol')).toBeNull()
  })

  it('matches new ritual-term entries (tonalli, tezontli)', () => {
    expect(findBlocklistedTerm('Sangre Tonalli')).toBe('tonalli')
    expect(findBlocklistedTerm('Pirámide Tezontli')).toBe('tezontli')
  })

  it('matches "mañke" (mapudungun for cóndor)', () => {
    expect(findBlocklistedTerm('Mañke Cazador')).toBe('mañke')
  })
})
