import { describe, it, expect } from 'vitest'
import { toCsv } from '../csv'

describe('toCsv', () => {
  it('converts headers and rows to CSV string', () => {
    const result = toCsv(['name', 'age'], [['Alice', '30'], ['Bob', '25']])
    expect(result).toContain('"name","age"')
    expect(result).toContain('"Alice","30"')
    expect(result).toContain('"Bob","25"')
  })

  it('escapes double quotes in values', () => {
    const result = toCsv(['text'], [['He said "hello"']])
    expect(result).toContain('He said ""hello""')
  })

  it('produces header-only output for empty rows', () => {
    const result = toCsv(['a', 'b'], [])
    expect(result).toBe('"a","b"')
  })
})
