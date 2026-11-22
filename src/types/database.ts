/**
 * Database types for the Supabase client.
 *
 * Mirrors supabase/migrations. Written by hand for now; once the Supabase CLI is
 * linked it can be regenerated with:
 *   bun x supabase gen types typescript --linked > src/types/database.ts
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      books: {
        Row: {
          id: string
          user_id: string
          title: string
          author: string | null
          description: string | null
          language: string | null
          cover_path: string | null
          words_per_page: number
          total_words: number
          total_pages: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          title: string
          author?: string | null
          description?: string | null
          language?: string | null
          cover_path?: string | null
          words_per_page: number
          total_words?: number
          total_pages?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          title?: string
          author?: string | null
          description?: string | null
          language?: string | null
          cover_path?: string | null
        }
        Relationships: []
      }
      pages: {
        Row: {
          id: string
          book_id: string
          page_number: number
          paragraphs: string[]
          word_count: number
        }
        Insert: {
          id?: string
          book_id: string
          page_number: number
          paragraphs: string[]
          word_count: number
        }
        Update: never
        Relationships: [
          {
            foreignKeyName: 'pages_book_id_fkey'
            columns: ['book_id']
            isOneToOne: false
            referencedRelation: 'books'
            referencedColumns: ['id']
          },
        ]
      }
      reading_progress: {
        Row: {
          user_id: string
          book_id: string
          page_number: number
          updated_at: string
        }
        Insert: {
          user_id?: string
          book_id: string
          page_number: number
          updated_at?: string
        }
        Update: {
          page_number?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'reading_progress_book_id_fkey'
            columns: ['book_id']
            isOneToOne: false
            referencedRelation: 'books'
            referencedColumns: ['id']
          },
        ]
      }
      user_words: {
        Row: {
          user_id: string
          language: string
          word: string
          status: 'new' | 'familiar' | 'learned' | 'ignored'
          meaning: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          user_id?: string
          language: string
          word: string
          status?: 'new' | 'familiar' | 'learned' | 'ignored'
          meaning?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          status?: 'new' | 'familiar' | 'learned' | 'ignored'
          meaning?: string | null
        }
        Relationships: []
      }
      /** [dictionary branch only] Imported dictionary data (see supabase/dictionary/). */
      dictionary_entries: {
        Row: {
          dictionary: string
          key: string
          entries: Json
        }
        Insert: never
        Update: never
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      import_book: {
        Args: { p_book: Json; p_pages: Json }
        Returns: string
      }
      count_words: {
        Args: { p_paragraphs: string[] }
        Returns: number
      }
    }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export type TableRow<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
