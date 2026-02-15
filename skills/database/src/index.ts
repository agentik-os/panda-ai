/**
 * Database Skill (SQL)
 */

import pg from "pg";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";
import { SkillBase } from "@agentik-os/sdk";

const { Pool: PgPool } = pg;

export interface DatabaseConfig extends Record<string, unknown> {
  postgres?: {
    host: string;
    port?: number;
    database: string;
    user: string;
    password: string;
    ssl?: boolean;
  };
  mysql?: {
    host: string;
    port?: number;
    database: string;
    user: string;
    password: string;
  };
  sqlite?: {
    filename: string;
  };
}

export interface DatabaseInput {
  action: "query" | "execute" | "transaction";
  params: {
    provider: "postgres" | "mysql" | "sqlite";
    sql?: string;
    params?: any[];
    commands?: Array<{ sql: string; params?: any[] }>;
  };
  [key: string]: unknown;
}

export interface DatabaseOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class DatabaseSkill extends SkillBase<DatabaseInput, DatabaseOutput> {
  readonly id = "database";
  readonly name = "Database (SQL)";
  readonly version = "1.0.0";
  readonly description =
    "Execute SQL queries against PostgreSQL, MySQL, and SQLite databases";

  protected config: DatabaseConfig;
  private pgPool?: pg.Pool;
  private mysqlConnection?: mysql.Connection;
  private sqliteDb?: Database.Database;

  constructor(config: DatabaseConfig) {
    super();
    this.config = config;
  }

  private async getPostgresPool(): Promise<pg.Pool> {
    if (!this.config.postgres) {
      throw new Error("PostgreSQL configuration not provided");
    }

    if (!this.pgPool) {
      this.pgPool = new PgPool({
        host: this.config.postgres.host,
        port: this.config.postgres.port || 5432,
        database: this.config.postgres.database,
        user: this.config.postgres.user,
        password: this.config.postgres.password,
        ssl: this.config.postgres.ssl ? { rejectUnauthorized: false } : false,
      });
    }

    return this.pgPool;
  }

  private async getMysqlConnection(): Promise<mysql.Connection> {
    if (!this.config.mysql) {
      throw new Error("MySQL configuration not provided");
    }

    if (!this.mysqlConnection) {
      this.mysqlConnection = await mysql.createConnection({
        host: this.config.mysql.host,
        port: this.config.mysql.port || 3306,
        database: this.config.mysql.database,
        user: this.config.mysql.user,
        password: this.config.mysql.password,
      });
    }

    return this.mysqlConnection;
  }

  private getSqliteDb(): Database.Database {
    if (!this.config.sqlite) {
      throw new Error("SQLite configuration not provided");
    }

    if (!this.sqliteDb) {
      this.sqliteDb = new Database(this.config.sqlite.filename);
    }

    return this.sqliteDb;
  }

  async execute(input: DatabaseInput): Promise<DatabaseOutput> {
    try {
      switch (input.action) {
        case "query": {
          if (input.params.provider === "postgres") {
            return await this.queryPostgres(input.params);
          } else if (input.params.provider === "mysql") {
            return await this.queryMysql(input.params);
          } else if (input.params.provider === "sqlite") {
            return this.querySqlite(input.params);
          } else {
            throw new Error(
              "Invalid provider. Use 'postgres', 'mysql', or 'sqlite'"
            );
          }
        }

        case "execute": {
          if (input.params.provider === "postgres") {
            return await this.executePostgres(input.params);
          } else if (input.params.provider === "mysql") {
            return await this.executeMysql(input.params);
          } else if (input.params.provider === "sqlite") {
            return this.executeSqlite(input.params);
          } else {
            throw new Error(
              "Invalid provider. Use 'postgres', 'mysql', or 'sqlite'"
            );
          }
        }

        case "transaction": {
          if (input.params.provider === "postgres") {
            return await this.transactionPostgres(input.params);
          } else if (input.params.provider === "mysql") {
            return await this.transactionMysql(input.params);
          } else if (input.params.provider === "sqlite") {
            return this.transactionSqlite(input.params);
          } else {
            throw new Error(
              "Invalid provider. Use 'postgres', 'mysql', or 'sqlite'"
            );
          }
        }

        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  // PostgreSQL methods
  private async queryPostgres(
    params: DatabaseInput["params"]
  ): Promise<DatabaseOutput> {
    if (!params.sql) {
      throw new Error("SQL query is required");
    }

    const pool = await this.getPostgresPool();
    const result = await pool.query(params.sql, params.params || []);

    return {
      success: true,
      data: {
        rows: result.rows,
        rowCount: result.rowCount,
        fields: result.fields.map((f) => ({
          name: f.name,
          dataType: f.dataTypeID,
        })),
      },
    };
  }

  private async executePostgres(
    params: DatabaseInput["params"]
  ): Promise<DatabaseOutput> {
    if (!params.sql) {
      throw new Error("SQL command is required");
    }

    const pool = await this.getPostgresPool();
    const result = await pool.query(params.sql, params.params || []);

    return {
      success: true,
      data: {
        rowCount: result.rowCount,
        command: result.command,
      },
    };
  }

  private async transactionPostgres(
    params: DatabaseInput["params"]
  ): Promise<DatabaseOutput> {
    if (!params.commands || params.commands.length === 0) {
      throw new Error("Transaction commands are required");
    }

    const pool = await this.getPostgresPool();
    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const results = [];
      for (const cmd of params.commands) {
        const result = await client.query(cmd.sql, cmd.params || []);
        results.push({
          rowCount: result.rowCount,
          command: result.command,
        });
      }

      await client.query("COMMIT");

      return {
        success: true,
        data: {
          results,
          transactionComplete: true,
        },
      };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  // MySQL methods
  private async queryMysql(
    params: DatabaseInput["params"]
  ): Promise<DatabaseOutput> {
    if (!params.sql) {
      throw new Error("SQL query is required");
    }

    const connection = await this.getMysqlConnection();
    const [rows, fields] = await connection.execute(
      params.sql,
      params.params || []
    );

    return {
      success: true,
      data: {
        rows,
        rowCount: Array.isArray(rows) ? rows.length : 0,
        fields: fields.map((f) => ({
          name: f.name,
          type: f.type,
        })),
      },
    };
  }

  private async executeMysql(
    params: DatabaseInput["params"]
  ): Promise<DatabaseOutput> {
    if (!params.sql) {
      throw new Error("SQL command is required");
    }

    const connection = await this.getMysqlConnection();
    const [result] = await connection.execute(params.sql, params.params || []);

    return {
      success: true,
      data: {
        affectedRows: (result as any).affectedRows,
        insertId: (result as any).insertId,
      },
    };
  }

  private async transactionMysql(
    params: DatabaseInput["params"]
  ): Promise<DatabaseOutput> {
    if (!params.commands || params.commands.length === 0) {
      throw new Error("Transaction commands are required");
    }

    const connection = await this.getMysqlConnection();

    try {
      await connection.beginTransaction();

      const results = [];
      for (const cmd of params.commands) {
        const [result] = await connection.execute(cmd.sql, cmd.params || []);
        results.push({
          affectedRows: (result as any).affectedRows,
          insertId: (result as any).insertId,
        });
      }

      await connection.commit();

      return {
        success: true,
        data: {
          results,
          transactionComplete: true,
        },
      };
    } catch (error) {
      await connection.rollback();
      throw error;
    }
  }

  // SQLite methods
  private querySqlite(params: DatabaseInput["params"]): DatabaseOutput {
    if (!params.sql) {
      throw new Error("SQL query is required");
    }

    const db = this.getSqliteDb();
    const stmt = db.prepare(params.sql);
    const rows = params.params
      ? stmt.all(...params.params)
      : stmt.all();

    return {
      success: true,
      data: {
        rows,
        rowCount: rows.length,
      },
    };
  }

  private executeSqlite(params: DatabaseInput["params"]): DatabaseOutput {
    if (!params.sql) {
      throw new Error("SQL command is required");
    }

    const db = this.getSqliteDb();
    const stmt = db.prepare(params.sql);
    const info = params.params
      ? stmt.run(...params.params)
      : stmt.run();

    return {
      success: true,
      data: {
        changes: info.changes,
        lastInsertRowid: info.lastInsertRowid,
      },
    };
  }

  private transactionSqlite(params: DatabaseInput["params"]): DatabaseOutput {
    if (!params.commands || params.commands.length === 0) {
      throw new Error("Transaction commands are required");
    }

    const db = this.getSqliteDb();

    const transaction = db.transaction(() => {
      const results = [];
      for (const cmd of params.commands!) {
        const stmt = db.prepare(cmd.sql);
        const info = cmd.params ? stmt.run(...cmd.params) : stmt.run();
        results.push({
          changes: info.changes,
          lastInsertRowid: info.lastInsertRowid,
        });
      }
      return results;
    });

    const results = transaction();

    return {
      success: true,
      data: {
        results,
        transactionComplete: true,
      },
    };
  }

  async validate(input: DatabaseInput): Promise<boolean> {
    if (!input?.action || !input?.params) {
      return false;
    }

    if (!input.params.provider) {
      return false;
    }

    if (
      input.params.provider !== "postgres" &&
      input.params.provider !== "mysql" &&
      input.params.provider !== "sqlite"
    ) {
      return false;
    }

    // Validate action-specific requirements
    if (input.action === "query" || input.action === "execute") {
      return !!input.params.sql;
    }

    if (input.action === "transaction") {
      return !!(input.params.commands && input.params.commands.length > 0);
    }

    return true;
  }

  async cleanup(): Promise<void> {
    // Close all database connections
    if (this.pgPool) {
      await this.pgPool.end();
      this.pgPool = undefined;
    }

    if (this.mysqlConnection) {
      await this.mysqlConnection.end();
      this.mysqlConnection = undefined;
    }

    if (this.sqliteDb) {
      this.sqliteDb.close();
      this.sqliteDb = undefined;
    }
  }
}

export function createDatabaseSkill(config: DatabaseConfig): DatabaseSkill {
  return new DatabaseSkill(config);
}
