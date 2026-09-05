declare module 'sql.js' {
  export interface SqlJsStatic {
    Database: new (data?: Uint8Array) => Database;
    locateFile?: (filename: string) => string;
  }

  export interface Database {
    run(sql: string, params?: any[]): void;
    exec(sql: string): any[];
    prepare(sql: string): Statement;
    export(): Uint8Array;
    close(): void;
  }

  export interface Statement {
    bind(params?: any[]): void;
    step(): boolean;
    getAsObject(): any;
    get(): any[];
    free(): void;
  }

  export default function initSqlJs(config?: { locateFile?: (filename: string) => string }): Promise<SqlJsStatic>;
}
