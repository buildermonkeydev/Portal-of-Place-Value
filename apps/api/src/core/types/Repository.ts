// Repository types
export interface BaseRepository<T> {
    create(data: Partial<T>): Promise<T>;
    findById(id: string): Promise<T | null>;
    findOne(filter: any): Promise<T | null>;
    findMany(filter?: any, options?: QueryOptions): Promise<T[]>;
    update(id: string, data: Partial<T>): Promise<T | null>;
    delete(id: string): Promise<boolean>;
    count(filter?: any): Promise<number>;
}

export interface QueryOptions {
    page?: number;
    limit?: number;
    sort?: { [key: string]: 1 | -1 };
    select?: string;
    search?: string;
    populate?: string | string[];
} 