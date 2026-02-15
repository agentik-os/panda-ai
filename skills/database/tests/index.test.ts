/**
 * Database Skill Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { DatabaseSkill } from "../src/index.js";
import pg from "pg";
import mysql from "mysql2/promise";
import Database from "better-sqlite3";

// Mock pg
vi.mock("pg", () => ({
  Pool: vi.fn(),
}));

// Mock mysql2/promise
vi.mock("mysql2/promise", () => ({
  default: {
    createConnection: vi.fn(),
  },
}));

// Mock better-sqlite3
vi.mock("better-sqlite3", () => ({
  default: vi.fn(),
}));

describe("DatabaseSkill", () => {
  let skill: DatabaseSkill;
  const mockConfig = {
    postgres: {
      host: "localhost",
      port: 5432,
      database: "testdb",
      user: "testuser",
      password: "testpass",
      ssl: false,
    },
    mysql: {
      host: "localhost",
      port: 3306,
      database: "testdb",
      user: "testuser",
      password: "testpass",
    },
    sqlite: {
      filename: ":memory:",
    },
  };

  beforeEach(() => {
    skill = new DatabaseSkill(mockConfig);
    vi.clearAllMocks();
  });

  afterEach(async () => {
    await skill.cleanup();
  });

  describe("Metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("database");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("Database (SQL)");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should have description", () => {
      expect(skill.description).toContain("SQL");
    });
  });

  describe("validate()", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "query" } as any)).toBe(false);
    });

    it("should reject missing provider", async () => {
      expect(
        await skill.validate({
          action: "query",
          params: {},
        } as any)
      ).toBe(false);
    });

    it("should reject invalid provider", async () => {
      expect(
        await skill.validate({
          action: "query",
          params: { provider: "invalid" as any },
        })
      ).toBe(false);
    });

    it("should accept valid query input with postgres", async () => {
      expect(
        await skill.validate({
          action: "query",
          params: {
            provider: "postgres",
            sql: "SELECT * FROM users",
          },
        })
      ).toBe(true);
    });

    it("should accept valid query input with mysql", async () => {
      expect(
        await skill.validate({
          action: "query",
          params: {
            provider: "mysql",
            sql: "SELECT * FROM users",
          },
        })
      ).toBe(true);
    });

    it("should accept valid query input with sqlite", async () => {
      expect(
        await skill.validate({
          action: "query",
          params: {
            provider: "sqlite",
            sql: "SELECT * FROM users",
          },
        })
      ).toBe(true);
    });

    it("should reject query without sql", async () => {
      expect(
        await skill.validate({
          action: "query",
          params: {
            provider: "postgres",
          },
        } as any)
      ).toBe(false);
    });

    it("should accept valid execute input", async () => {
      expect(
        await skill.validate({
          action: "execute",
          params: {
            provider: "postgres",
            sql: "INSERT INTO users (name) VALUES ('John')",
          },
        })
      ).toBe(true);
    });

    it("should reject execute without sql", async () => {
      expect(
        await skill.validate({
          action: "execute",
          params: {
            provider: "postgres",
          },
        } as any)
      ).toBe(false);
    });

    it("should accept valid transaction input", async () => {
      expect(
        await skill.validate({
          action: "transaction",
          params: {
            provider: "postgres",
            commands: [{ sql: "INSERT INTO users (name) VALUES ('John')" }],
          },
        })
      ).toBe(true);
    });

    it("should reject transaction without commands", async () => {
      expect(
        await skill.validate({
          action: "transaction",
          params: {
            provider: "postgres",
          },
        } as any)
      ).toBe(false);
    });

    it("should reject transaction with empty commands", async () => {
      expect(
        await skill.validate({
          action: "transaction",
          params: {
            provider: "postgres",
            commands: [],
          },
        })
      ).toBe(false);
    });
  });

  describe("execute() - PostgreSQL query", () => {
    it("should execute SELECT query successfully", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [{ id: 1, name: "John" }, { id: 2, name: "Jane" }],
        rowCount: 2,
        fields: [
          { name: "id", dataTypeID: 23 },
          { name: "name", dataTypeID: 25 },
        ],
      });

      const mockPool = {
        query: mockQuery,
        end: vi.fn(),
      };

      (pg.Pool as any).mockImplementation(() => mockPool);

      const result = await skill.execute({
        action: "query",
        params: {
          provider: "postgres",
          sql: "SELECT * FROM users",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.rows).toHaveLength(2);
      expect(result.data.rowCount).toBe(2);
      expect(result.data.fields).toHaveLength(2);

      expect(mockQuery).toHaveBeenCalledWith("SELECT * FROM users", []);
    });

    it("should execute parameterized query", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        rows: [{ id: 1, name: "John" }],
        rowCount: 1,
        fields: [],
      });

      const mockPool = {
        query: mockQuery,
        end: vi.fn(),
      };

      (pg.Pool as any).mockImplementation(() => mockPool);

      await skill.execute({
        action: "query",
        params: {
          provider: "postgres",
          sql: "SELECT * FROM users WHERE id = $1",
          params: [1],
        },
      });

      expect(mockQuery).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = $1",
        [1]
      );
    });

    it("should handle PostgreSQL query errors", async () => {
      const mockQuery = vi.fn().mockRejectedValue(new Error("Query failed"));

      const mockPool = {
        query: mockQuery,
        end: vi.fn(),
      };

      (pg.Pool as any).mockImplementation(() => mockPool);

      const result = await skill.execute({
        action: "query",
        params: {
          provider: "postgres",
          sql: "INVALID SQL",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Query failed");
    });
  });

  describe("execute() - PostgreSQL execute", () => {
    it("should execute INSERT command successfully", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        rowCount: 1,
        command: "INSERT",
      });

      const mockPool = {
        query: mockQuery,
        end: vi.fn(),
      };

      (pg.Pool as any).mockImplementation(() => mockPool);

      const result = await skill.execute({
        action: "execute",
        params: {
          provider: "postgres",
          sql: "INSERT INTO users (name) VALUES ($1)",
          params: ["John"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.rowCount).toBe(1);
      expect(result.data.command).toBe("INSERT");
    });

    it("should execute UPDATE command", async () => {
      const mockQuery = vi.fn().mockResolvedValue({
        rowCount: 3,
        command: "UPDATE",
      });

      const mockPool = {
        query: mockQuery,
        end: vi.fn(),
      };

      (pg.Pool as any).mockImplementation(() => mockPool);

      const result = await skill.execute({
        action: "execute",
        params: {
          provider: "postgres",
          sql: "UPDATE users SET name = $1 WHERE active = true",
          params: ["Updated"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.rowCount).toBe(3);
    });
  });

  describe("execute() - PostgreSQL transaction", () => {
    it("should execute transaction successfully", async () => {
      const mockQuery = vi.fn()
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, command: "INSERT" }) // First insert
        .mockResolvedValueOnce({ rowCount: 1, command: "INSERT" }) // Second insert
        .mockResolvedValueOnce(undefined); // COMMIT

      const mockClient = {
        query: mockQuery,
        release: vi.fn(),
      };

      const mockPool = {
        connect: vi.fn().mockResolvedValue(mockClient),
        end: vi.fn(),
      };

      (pg.Pool as any).mockImplementation(() => mockPool);

      const result = await skill.execute({
        action: "transaction",
        params: {
          provider: "postgres",
          commands: [
            { sql: "INSERT INTO users (name) VALUES ($1)", params: ["John"] },
            { sql: "INSERT INTO users (name) VALUES ($1)", params: ["Jane"] },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.transactionComplete).toBe(true);
      expect(result.data.results).toHaveLength(2);

      expect(mockQuery).toHaveBeenCalledWith("BEGIN");
      expect(mockQuery).toHaveBeenCalledWith("COMMIT");
      expect(mockClient.release).toHaveBeenCalled();
    });

    it("should rollback transaction on error", async () => {
      const mockQuery = vi.fn()
        .mockResolvedValueOnce(undefined) // BEGIN
        .mockResolvedValueOnce({ rowCount: 1, command: "INSERT" }) // First insert
        .mockRejectedValueOnce(new Error("Constraint violation")) // Second insert fails
        .mockResolvedValueOnce(undefined); // ROLLBACK

      const mockClient = {
        query: mockQuery,
        release: vi.fn(),
      };

      const mockPool = {
        connect: vi.fn().mockResolvedValue(mockClient),
        end: vi.fn(),
      };

      (pg.Pool as any).mockImplementation(() => mockPool);

      const result = await skill.execute({
        action: "transaction",
        params: {
          provider: "postgres",
          commands: [
            { sql: "INSERT INTO users (name) VALUES ($1)", params: ["John"] },
            { sql: "INSERT INTO users (id, name) VALUES ($1, $2)", params: [1, "Jane"] },
          ],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Constraint violation");

      expect(mockQuery).toHaveBeenCalledWith("BEGIN");
      expect(mockQuery).toHaveBeenCalledWith("ROLLBACK");
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe("execute() - MySQL query", () => {
    it("should execute SELECT query successfully", async () => {
      const mockExecute = vi.fn().mockResolvedValue([
        [{ id: 1, name: "John" }, { id: 2, name: "Jane" }],
        [{ name: "id", type: 3 }, { name: "name", type: 253 }],
      ]);

      const mockConnection = {
        execute: mockExecute,
        end: vi.fn(),
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
      };

      (mysql.createConnection as any).mockResolvedValue(mockConnection);

      const result = await skill.execute({
        action: "query",
        params: {
          provider: "mysql",
          sql: "SELECT * FROM users",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.rows).toHaveLength(2);
      expect(result.data.rowCount).toBe(2);
      expect(result.data.fields).toHaveLength(2);
    });

    it("should execute parameterized query", async () => {
      const mockExecute = vi.fn().mockResolvedValue([
        [{ id: 1, name: "John" }],
        [],
      ]);

      const mockConnection = {
        execute: mockExecute,
        end: vi.fn(),
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
      };

      (mysql.createConnection as any).mockResolvedValue(mockConnection);

      await skill.execute({
        action: "query",
        params: {
          provider: "mysql",
          sql: "SELECT * FROM users WHERE id = ?",
          params: [1],
        },
      });

      expect(mockExecute).toHaveBeenCalledWith(
        "SELECT * FROM users WHERE id = ?",
        [1]
      );
    });
  });

  describe("execute() - MySQL execute", () => {
    it("should execute INSERT command successfully", async () => {
      const mockExecute = vi.fn().mockResolvedValue([
        { affectedRows: 1, insertId: 5 },
      ]);

      const mockConnection = {
        execute: mockExecute,
        end: vi.fn(),
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
      };

      (mysql.createConnection as any).mockResolvedValue(mockConnection);

      const result = await skill.execute({
        action: "execute",
        params: {
          provider: "mysql",
          sql: "INSERT INTO users (name) VALUES (?)",
          params: ["John"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.affectedRows).toBe(1);
      expect(result.data.insertId).toBe(5);
    });
  });

  describe("execute() - MySQL transaction", () => {
    it("should execute transaction successfully", async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce([{ affectedRows: 1, insertId: 1 }])
        .mockResolvedValueOnce([{ affectedRows: 1, insertId: 2 }]);

      const mockConnection = {
        execute: mockExecute,
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn().mockResolvedValue(undefined),
        rollback: vi.fn().mockResolvedValue(undefined),
        end: vi.fn(),
      };

      (mysql.createConnection as any).mockResolvedValue(mockConnection);

      const result = await skill.execute({
        action: "transaction",
        params: {
          provider: "mysql",
          commands: [
            { sql: "INSERT INTO users (name) VALUES (?)", params: ["John"] },
            { sql: "INSERT INTO users (name) VALUES (?)", params: ["Jane"] },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.transactionComplete).toBe(true);
      expect(result.data.results).toHaveLength(2);

      expect(mockConnection.beginTransaction).toHaveBeenCalled();
      expect(mockConnection.commit).toHaveBeenCalled();
    });

    it("should rollback MySQL transaction on error", async () => {
      const mockExecute = vi.fn()
        .mockResolvedValueOnce([{ affectedRows: 1, insertId: 1 }])
        .mockRejectedValueOnce(new Error("Duplicate entry"));

      const mockConnection = {
        execute: mockExecute,
        beginTransaction: vi.fn().mockResolvedValue(undefined),
        commit: vi.fn(),
        rollback: vi.fn().mockResolvedValue(undefined),
        end: vi.fn(),
      };

      (mysql.createConnection as any).mockResolvedValue(mockConnection);

      const result = await skill.execute({
        action: "transaction",
        params: {
          provider: "mysql",
          commands: [
            { sql: "INSERT INTO users (name) VALUES (?)", params: ["John"] },
            { sql: "INSERT INTO users (id, name) VALUES (?, ?)", params: [1, "Jane"] },
          ],
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Duplicate entry");

      expect(mockConnection.rollback).toHaveBeenCalled();
    });
  });

  describe("execute() - SQLite query", () => {
    it("should execute SELECT query successfully", async () => {
      const mockAll = vi.fn().mockReturnValue([
        { id: 1, name: "John" },
        { id: 2, name: "Jane" },
      ]);

      const mockPrepare = vi.fn().mockReturnValue({
        all: mockAll,
      });

      const mockDb = {
        prepare: mockPrepare,
        close: vi.fn(),
        transaction: vi.fn(),
      };

      (Database as any).mockImplementation(() => mockDb);

      const result = await skill.execute({
        action: "query",
        params: {
          provider: "sqlite",
          sql: "SELECT * FROM users",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.rows).toHaveLength(2);
      expect(result.data.rowCount).toBe(2);

      expect(mockPrepare).toHaveBeenCalledWith("SELECT * FROM users");
      expect(mockAll).toHaveBeenCalled();
    });

    it("should execute parameterized query", async () => {
      const mockAll = vi.fn().mockReturnValue([{ id: 1, name: "John" }]);

      const mockPrepare = vi.fn().mockReturnValue({
        all: mockAll,
      });

      const mockDb = {
        prepare: mockPrepare,
        close: vi.fn(),
        transaction: vi.fn(),
      };

      (Database as any).mockImplementation(() => mockDb);

      await skill.execute({
        action: "query",
        params: {
          provider: "sqlite",
          sql: "SELECT * FROM users WHERE id = ?",
          params: [1],
        },
      });

      expect(mockAll).toHaveBeenCalledWith(1);
    });
  });

  describe("execute() - SQLite execute", () => {
    it("should execute INSERT command successfully", async () => {
      const mockRun = vi.fn().mockReturnValue({
        changes: 1,
        lastInsertRowid: 5,
      });

      const mockPrepare = vi.fn().mockReturnValue({
        run: mockRun,
      });

      const mockDb = {
        prepare: mockPrepare,
        close: vi.fn(),
        transaction: vi.fn(),
      };

      (Database as any).mockImplementation(() => mockDb);

      const result = await skill.execute({
        action: "execute",
        params: {
          provider: "sqlite",
          sql: "INSERT INTO users (name) VALUES (?)",
          params: ["John"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.changes).toBe(1);
      expect(result.data.lastInsertRowid).toBe(5);
    });
  });

  describe("execute() - SQLite transaction", () => {
    it("should execute transaction successfully", async () => {
      const mockRun = vi.fn()
        .mockReturnValueOnce({ changes: 1, lastInsertRowid: 1 })
        .mockReturnValueOnce({ changes: 1, lastInsertRowid: 2 });

      const mockPrepare = vi.fn().mockReturnValue({
        run: mockRun,
      });

      const mockTransaction = vi.fn((callback) => {
        return callback;
      });

      const mockDb = {
        prepare: mockPrepare,
        transaction: mockTransaction,
        close: vi.fn(),
      };

      (Database as any).mockImplementation(() => mockDb);

      const result = await skill.execute({
        action: "transaction",
        params: {
          provider: "sqlite",
          commands: [
            { sql: "INSERT INTO users (name) VALUES (?)", params: ["John"] },
            { sql: "INSERT INTO users (name) VALUES (?)", params: ["Jane"] },
          ],
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.transactionComplete).toBe(true);
      expect(result.data.results).toHaveLength(2);
    });
  });

  describe("Error Handling", () => {
    it("should return error for unknown action", async () => {
      const result = await skill.execute({
        action: "invalidAction" as any,
        params: { provider: "postgres", sql: "SELECT 1" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown action");
    });

    it("should return error for invalid provider", async () => {
      const result = await skill.execute({
        action: "query",
        params: {
          provider: "invalid" as any,
          sql: "SELECT 1",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid provider");
    });

    it("should handle non-Error exceptions", async () => {
      const mockQuery = vi.fn().mockRejectedValue("String error");

      const mockPool = {
        query: mockQuery,
        end: vi.fn(),
      };

      (pg.Pool as any).mockImplementation(() => mockPool);

      const result = await skill.execute({
        action: "query",
        params: {
          provider: "postgres",
          sql: "SELECT 1",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("should reject query without SQL", async () => {
      const result = await skill.execute({
        action: "query",
        params: {
          provider: "postgres",
        } as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("SQL query is required");
    });

    it("should reject transaction without commands", async () => {
      const result = await skill.execute({
        action: "transaction",
        params: {
          provider: "postgres",
        } as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Transaction commands are required");
    });
  });

  describe("Configuration", () => {
    it("should throw error if PostgreSQL config missing", () => {
      const skillWithoutPg = new DatabaseSkill({ mysql: mockConfig.mysql });

      expect(async () => {
        await skillWithoutPg.execute({
          action: "query",
          params: { provider: "postgres", sql: "SELECT 1" },
        });
      }).rejects.toThrow("PostgreSQL configuration not provided");
    });

    it("should throw error if MySQL config missing", () => {
      const skillWithoutMysql = new DatabaseSkill({ postgres: mockConfig.postgres });

      expect(async () => {
        await skillWithoutMysql.execute({
          action: "query",
          params: { provider: "mysql", sql: "SELECT 1" },
        });
      }).rejects.toThrow("MySQL configuration not provided");
    });

    it("should throw error if SQLite config missing", () => {
      const skillWithoutSqlite = new DatabaseSkill({ postgres: mockConfig.postgres });

      expect(async () => {
        await skillWithoutSqlite.execute({
          action: "query",
          params: { provider: "sqlite", sql: "SELECT 1" },
        });
      }).rejects.toThrow("SQLite configuration not provided");
    });
  });

  describe("Cleanup", () => {
    it("should cleanup connections", async () => {
      const mockPoolEnd = vi.fn();
      const mockMysqlEnd = vi.fn();
      const mockSqliteClose = vi.fn();

      const mockPool = {
        query: vi.fn(),
        end: mockPoolEnd,
      };

      const mockConnection = {
        execute: vi.fn(),
        end: mockMysqlEnd,
        beginTransaction: vi.fn(),
        commit: vi.fn(),
        rollback: vi.fn(),
      };

      const mockDb = {
        prepare: vi.fn(),
        close: mockSqliteClose,
        transaction: vi.fn(),
      };

      (pg.Pool as any).mockImplementation(() => mockPool);
      (mysql.createConnection as any).mockResolvedValue(mockConnection);
      (Database as any).mockImplementation(() => mockDb);

      // Initialize connections
      await skill.execute({
        action: "query",
        params: { provider: "postgres", sql: "SELECT 1" },
      });

      await skill.execute({
        action: "query",
        params: { provider: "mysql", sql: "SELECT 1" },
      });

      await skill.execute({
        action: "query",
        params: { provider: "sqlite", sql: "SELECT 1" },
      });

      // Cleanup
      await skill.cleanup();

      expect(mockPoolEnd).toHaveBeenCalled();
      expect(mockMysqlEnd).toHaveBeenCalled();
      expect(mockSqliteClose).toHaveBeenCalled();
    });
  });

  describe("Factory Function", () => {
    it("should create skill instance via factory", async () => {
      const { createDatabaseSkill } = await import("../src/index.js");
      const factorySkill = createDatabaseSkill(mockConfig);

      expect(factorySkill).toBeInstanceOf(DatabaseSkill);
      expect(factorySkill.id).toBe("database");
    });
  });
});
