import { supabaseAdmin, supabaseClient } from '@/lib/supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export class BaseRepository<T extends { id?: string }> {
  protected tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  /**
   * Helper to get the appropriate Supabase client.
   * By default, it uses the admin client (service role) to bypass RLS,
   * since our APIs currently handle authorization via JWT roles.
   */
  protected getClient(): SupabaseClient {
    return supabaseAdmin;
  }

  async findById(id: string): Promise<T | null> {
    const { data, error } = await this.getClient()
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "JSON object requested, multiple (or no) rows returned"
      throw error;
    }
    return data as T | null;
  }

  async findOne(query: Record<string, any>): Promise<T | null> {
    let queryBuilder = this.getClient().from(this.tableName).select('*');
    
    for (const [key, value] of Object.entries(query)) {
      queryBuilder = queryBuilder.eq(key, value);
    }
    
    const { data, error } = await queryBuilder.single();
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data as T | null;
  }

  async find(query: Record<string, any> = {}, options: { skip?: number; limit?: number; sort?: { field: string; ascending: boolean } } = {}): Promise<T[]> {
    let queryBuilder = this.getClient().from(this.tableName).select('*');
    
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null && '$in' in value) {
        queryBuilder = queryBuilder.in(key, value.$in);
      } else {
        queryBuilder = queryBuilder.eq(key, value);
      }
    }

    if (options.sort) {
      queryBuilder = queryBuilder.order(options.sort.field, { ascending: options.sort.ascending });
    }

    if (options.limit) {
      const skip = options.skip || 0;
      queryBuilder = queryBuilder.range(skip, skip + options.limit - 1);
    }

    const { data, error } = await queryBuilder;
    if (error) throw error;
    
    return data as T[];
  }
  
  async count(query: Record<string, any> = {}): Promise<number> {
    let queryBuilder = this.getClient().from(this.tableName).select('*', { count: 'exact', head: true });
    
    for (const [key, value] of Object.entries(query)) {
      if (typeof value === 'object' && value !== null && '$in' in value) {
        queryBuilder = queryBuilder.in(key, value.$in);
      } else {
        queryBuilder = queryBuilder.eq(key, value);
      }
    }

    const { count, error } = await queryBuilder;
    if (error) throw error;
    
    return count || 0;
  }

  async create(data: Partial<T>): Promise<T> {
    const { data: created, error } = await this.getClient()
      .from(this.tableName)
      .insert([data])
      .select()
      .single();

    if (error) throw error;
    return created as T;
  }

  async update(id: string, data: Partial<T>): Promise<T | null> {
    const { data: updated, error } = await this.getClient()
      .from(this.tableName)
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return updated as T | null;
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await this.getClient()
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) throw error;
    return true;
  }
}
