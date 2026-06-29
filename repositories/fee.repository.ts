import { BaseRepository } from './base.repository';

export interface FeeHead {
  id: string;
  school_id: string;
  name: string;
  type: string;
  default_amount: number;
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface FeeStructure {
  id: string;
  school_id: string;
  class_id: string;
  name: string;
  fine_per_day: number;
  description?: string;
  active: boolean;
  created_at: Date;
  updated_at: Date;
  // Relationships
  heads?: FeeStructureHead[];
  class?: any;
}

export interface FeeStructureHead {
  id: string;
  fee_structure_id: string;
  title: string;
  amount: number;
  frequency: string;
  due_date_day: number;
}

export interface FeeTransaction {
  id: string;
  school_id: string;
  student_id: string;
  parent_id?: string;
  structure_id?: string;
  amount_due: number;
  amount_paid: number;
  fine_amount: number;
  status: string;
  due_date?: Date;
  payment_method?: string;
  payment_meta?: any;
  note?: string;
  created_by?: string;
  created_at: Date;
  updated_at: Date;
  // Relationships
  student?: any;
  structure?: any;
  items?: FeeTransactionItem[];
  receipts?: any[];
}

export interface FeeTransactionItem {
  id: string;
  transaction_id: string;
  head: string;
  amount: number;
}

export class FeeHeadRepository extends BaseRepository<FeeHead> {
  constructor() {
    super('fee_heads');
  }
}

export class FeeStructureRepository extends BaseRepository<FeeStructure> {
  constructor() {
    super('fee_structures');
  }

  async findWithHeads(query: Record<string, any> = {}, options: any = {}): Promise<FeeStructure[]> {
    let queryBuilder = this.getClient()
      .from(this.tableName)
      .select('*, class:classes(*), heads:fee_structure_heads(*)');

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

    const { data, error } = await queryBuilder;
    if (error) throw error;
    return data as FeeStructure[];
  }
}

export class FeeStructureHeadRepository extends BaseRepository<FeeStructureHead> {
  constructor() {
    super('fee_structure_heads');
  }
}

export class FeeTransactionRepository extends BaseRepository<FeeTransaction> {
  constructor() {
    super('fee_transactions');
  }

  async findWithDetails(query: Record<string, any> = {}, options: any = {}): Promise<{ data: FeeTransaction[], total: number }> {
    let queryBuilder = this.getClient()
      .from(this.tableName)
      .select('*, student:students(*), structure:fee_structures(*), items:fee_transaction_items(*), receipts:fee_receipts(*)', { count: 'exact' });

    for (const [key, value] of Object.entries(query)) {
      if (key === 'month' || key === 'year') continue; // custom logic needed for dates if used
      
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

    const { data, error, count } = await queryBuilder;
    if (error) throw error;
    
    return { data: data as FeeTransaction[], total: count || 0 };
  }
}

export class FeeTransactionItemRepository extends BaseRepository<FeeTransactionItem> {
  constructor() {
    super('fee_transaction_items');
  }
}
