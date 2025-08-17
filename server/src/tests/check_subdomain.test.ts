import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable, templatesTable, projectsTable } from '../db/schema';
import { type CheckSubdomainInput } from '../schema';
import { checkSubdomain } from '../handlers/check_subdomain';

describe('checkSubdomain', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return available for valid unused subdomain', async () => {
    const input: CheckSubdomainInput = {
      subdomain: 'myawesomewedding'
    };

    const result = await checkSubdomain(input);

    expect(result.available).toBe(true);
    expect(result.subdomain).toBe('myawesomewedding');
  });

  it('should normalize subdomain to lowercase', async () => {
    const input: CheckSubdomainInput = {
      subdomain: 'MyAwEsOmEwEdDiNg'
    };

    const result = await checkSubdomain(input);

    expect(result.available).toBe(true);
    expect(result.subdomain).toBe('myawesomewedding');
  });

  it('should trim whitespace from subdomain', async () => {
    const input: CheckSubdomainInput = {
      subdomain: '  myawesomewedding  '
    };

    const result = await checkSubdomain(input);

    expect(result.available).toBe(true);
    expect(result.subdomain).toBe('myawesomewedding');
  });

  it('should return unavailable for existing subdomain', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'user'
      })
      .returning()
      .execute();

    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "simple"}',
        is_premium: false
      })
      .returning()
      .execute();

    // Create project with existing subdomain
    await db.insert(projectsTable)
      .values({
        user_id: userResult[0].id,
        template_id: templateResult[0].id,
        subdomain: 'existingwedding',
        bride_name: 'Jane',
        groom_name: 'John',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Test Venue',
        venue_address: '123 Test St'
      })
      .execute();

    const input: CheckSubdomainInput = {
      subdomain: 'existingwedding'
    };

    const result = await checkSubdomain(input);

    expect(result.available).toBe(false);
    expect(result.subdomain).toBe('existingwedding');
  });

  it('should return unavailable for reserved subdomain words', async () => {
    const reservedWords = ['www', 'api', 'admin', 'mail', 'blog', 'app', 'dashboard'];

    for (const word of reservedWords) {
      const input: CheckSubdomainInput = {
        subdomain: word
      };

      const result = await checkSubdomain(input);

      expect(result.available).toBe(false);
      expect(result.subdomain).toBe(word);
    }
  });

  it('should return unavailable for invalid subdomain formats', async () => {
    const invalidSubdomains = [
      '-invalidstart',        // starts with hyphen
      'invalidend-',          // ends with hyphen
      'invalid--double',      // consecutive hyphens
      'invalid_underscore',   // contains underscore
      'invalid.dot',          // contains dot
      'invalid space',        // contains space
      'invalid@symbol',       // contains special character
      '123invalid',           // starts with number (actually valid, but testing edge case)
    ];

    for (const subdomain of invalidSubdomains) {
      const input: CheckSubdomainInput = {
        subdomain: subdomain
      };

      const result = await checkSubdomain(input);

      if (subdomain === '123invalid') {
        // This should actually be valid
        expect(result.available).toBe(true);
      } else {
        expect(result.available).toBe(false);
        expect(result.subdomain).toBe(subdomain.toLowerCase().trim());
      }
    }
  });

  it('should allow valid subdomain formats with hyphens', async () => {
    const validSubdomains = [
      'valid-subdomain',
      'multi-word-subdomain',
      'test123',
      '123test',
      'a-1-b',
      'wedding2024'
    ];

    for (const subdomain of validSubdomains) {
      const input: CheckSubdomainInput = {
        subdomain: subdomain
      };

      const result = await checkSubdomain(input);

      expect(result.available).toBe(true);
      expect(result.subdomain).toBe(subdomain.toLowerCase());
    }
  });

  it('should handle case-insensitive existing subdomain check', async () => {
    // Create prerequisite data
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'user'
      })
      .returning()
      .execute();

    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A test template',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "simple"}',
        is_premium: false
      })
      .returning()
      .execute();

    // Create project with lowercase subdomain
    await db.insert(projectsTable)
      .values({
        user_id: userResult[0].id,
        template_id: templateResult[0].id,
        subdomain: 'mixedcasewedding',
        bride_name: 'Jane',
        groom_name: 'John',
        event_date: new Date('2024-06-15'),
        event_time: '18:00',
        venue_name: 'Test Venue',
        venue_address: '123 Test St'
      })
      .execute();

    // Test with different case variations
    const testCases = ['MixedCaseWedding', 'MIXEDCASEWEDDING', 'mixedcasewedding'];

    for (const testCase of testCases) {
      const input: CheckSubdomainInput = {
        subdomain: testCase
      };

      const result = await checkSubdomain(input);

      expect(result.available).toBe(false);
      expect(result.subdomain).toBe('mixedcasewedding');
    }
  });

  it('should handle minimum length subdomain', async () => {
    const input: CheckSubdomainInput = {
      subdomain: 'abc' // 3 characters (minimum)
    };

    const result = await checkSubdomain(input);

    expect(result.available).toBe(true);
    expect(result.subdomain).toBe('abc');
  });

  it('should handle maximum length subdomain', async () => {
    const maxLengthSubdomain = 'a'.repeat(50); // 50 characters (maximum)
    const input: CheckSubdomainInput = {
      subdomain: maxLengthSubdomain
    };

    const result = await checkSubdomain(input);

    expect(result.available).toBe(true);
    expect(result.subdomain).toBe(maxLengthSubdomain);
  });

  it('should handle alphanumeric subdomains correctly', async () => {
    const alphanumericSubdomains = [
      'wedding2024',
      '2024wedding',
      'test123abc',
      'abc123def',
      '1a2b3c'
    ];

    for (const subdomain of alphanumericSubdomains) {
      const input: CheckSubdomainInput = {
        subdomain: subdomain
      };

      const result = await checkSubdomain(input);

      expect(result.available).toBe(true);
      expect(result.subdomain).toBe(subdomain);
    }
  });
});