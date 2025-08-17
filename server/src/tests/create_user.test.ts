import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type CreateUserInput } from '../schema';
import { createUser, verifyPassword } from '../handlers/create_user';
import { eq } from 'drizzle-orm';

// Test input with all required fields
const testInput: CreateUserInput = {
  email: 'test@example.com',
  password: 'password123',
  full_name: 'Test User',
  role: 'user',
};

describe('createUser', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a user with hashed password', async () => {
    const result = await createUser(testInput);

    // Basic field validation
    expect(result.email).toEqual('test@example.com');
    expect(result.full_name).toEqual('Test User');
    expect(result.role).toEqual('user');
    expect(result.is_active).toBe(true);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Password should be hashed, not plain text
    expect(result.password_hash).not.toEqual('password123');
    expect(result.password_hash).toBeTruthy();
    expect(result.password_hash).toContain(':'); // Should contain salt:hash format

    // Verify password can be validated
    const isValidPassword = verifyPassword('password123', result.password_hash);
    expect(isValidPassword).toBe(true);

    // Verify wrong password fails
    const isInvalidPassword = verifyPassword('wrongpassword', result.password_hash);
    expect(isInvalidPassword).toBe(false);
  });

  it('should save user to database', async () => {
    const result = await createUser(testInput);

    // Query user from database
    const users = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();

    expect(users).toHaveLength(1);
    const savedUser = users[0];
    expect(savedUser.email).toEqual('test@example.com');
    expect(savedUser.full_name).toEqual('Test User');
    expect(savedUser.role).toEqual('user');
    expect(savedUser.is_active).toBe(true);
    expect(savedUser.created_at).toBeInstanceOf(Date);
    expect(savedUser.updated_at).toBeInstanceOf(Date);

    // Verify password hash is saved correctly
    const isValidPassword = verifyPassword('password123', savedUser.password_hash);
    expect(isValidPassword).toBe(true);
  });

  it('should create users with different roles', async () => {
    // Create admin user
    const adminInput: CreateUserInput = {
      email: 'admin@example.com',
      password: 'adminpass123',
      full_name: 'Admin User',
      role: 'admin',
    };

    const adminResult = await createUser(adminInput);
    expect(adminResult.role).toEqual('admin');

    // Create reseller user
    const resellerInput: CreateUserInput = {
      email: 'reseller@example.com',
      password: 'resellerpass123',
      full_name: 'Reseller User',
      role: 'reseller',
    };

    const resellerResult = await createUser(resellerInput);
    expect(resellerResult.role).toEqual('reseller');

    // Verify both users exist in database
    const allUsers = await db.select().from(usersTable).execute();
    expect(allUsers).toHaveLength(2);
  });

  it('should reject duplicate email addresses', async () => {
    // Create first user
    await createUser(testInput);

    // Try to create second user with same email
    const duplicateInput: CreateUserInput = {
      email: 'test@example.com', // Same email
      password: 'differentpass123',
      full_name: 'Different User',
      role: 'admin',
    };

    await expect(createUser(duplicateInput)).rejects.toThrow(/already exists/i);
  });

  it('should handle different password lengths and complexities', async () => {
    // Test with minimum length password
    const minPasswordInput: CreateUserInput = {
      email: 'minpass@example.com',
      password: '12345678', // 8 characters minimum
      full_name: 'Min Pass User',
      role: 'user',
    };

    const result1 = await createUser(minPasswordInput);
    const isValid1 = verifyPassword('12345678', result1.password_hash);
    expect(isValid1).toBe(true);

    // Test with complex password
    const complexPasswordInput: CreateUserInput = {
      email: 'complex@example.com',
      password: 'Complex@Password123!',
      full_name: 'Complex Pass User',
      role: 'user',
    };

    const result2 = await createUser(complexPasswordInput);
    const isValid2 = verifyPassword('Complex@Password123!', result2.password_hash);
    expect(isValid2).toBe(true);
  });

  it('should create users with proper timestamps', async () => {
    const beforeCreation = new Date();
    const result = await createUser(testInput);
    const afterCreation = new Date();

    // Timestamps should be within reasonable range
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
    expect(result.updated_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime() - 1000);
    expect(result.updated_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime() + 1000);
  });

  it('should set is_active to true by default', async () => {
    const result = await createUser(testInput);
    expect(result.is_active).toBe(true);

    // Verify in database as well
    const savedUser = await db.select()
      .from(usersTable)
      .where(eq(usersTable.id, result.id))
      .execute();
    
    expect(savedUser[0].is_active).toBe(true);
  });

  it('should generate unique salts for identical passwords', async () => {
    const input1: CreateUserInput = {
      email: 'user1@example.com',
      password: 'samepassword123',
      full_name: 'User One',
      role: 'user',
    };

    const input2: CreateUserInput = {
      email: 'user2@example.com',
      password: 'samepassword123', // Same password
      full_name: 'User Two',
      role: 'user',
    };

    const result1 = await createUser(input1);
    const result2 = await createUser(input2);

    // Hashes should be different due to different salts
    expect(result1.password_hash).not.toEqual(result2.password_hash);

    // But both should verify correctly
    expect(verifyPassword('samepassword123', result1.password_hash)).toBe(true);
    expect(verifyPassword('samepassword123', result2.password_hash)).toBe(true);
  });
});