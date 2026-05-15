export const DICTIONARY_TYPES = [
  'dictionary',
  'glossary',
  'static_terms',
  'section_headings',
  'note_titles',
  'include_labels',
  'prompt',
] as const

export const DEFAULT_DICTIONARY_TYPE = 'dictionary'

export type DictionaryType = (typeof DICTIONARY_TYPES)[number]
export type DictionaryEntrySource = 'base' | 'user'

export interface DictionaryEntry {
  key: string
  value: string
  source: DictionaryEntrySource
  entry_id: string | null
  updated_by: string | null
  updated_at: string | null
}

export interface DictionaryResponse {
  dict_type: DictionaryType
  entries: DictionaryEntry[]
}

export interface DictionarySummaryItem {
  dict_type: DictionaryType
  entry_count: number
}

export interface DictionarySummaryResponse {
  items: DictionarySummaryItem[]
}

export function isDictionaryType(value: string | undefined): value is DictionaryType {
  if (!value) {
    return false
  }

  return DICTIONARY_TYPES.includes(value as DictionaryType)
}
