import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type LoginInput } from '../schema';
import { login } from '../handlers/login';
import { password } from 'bun';

// Test user data
const testUserData = {
  email: 'test@example.com',
  password: 'testpassword123',
  full_name: 'Test User',
  role: 'user' as const,
  is_active: true,
};

const inactiveUserData = {
  email: 'inactive@example.com',
  password: 'testpassword123',
  full_name: 'Inactive User',
  role: 'user' as const,
  is_active: false,
};

const adminUserData = {
  email: 'admin@example.com',
  password: 'adminpassword123',
  full_name: 'Admin User',
  role: 'admin' as const,
  is_active: true,
};

describe('login', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should successfully login with valid credentials', async () => {
    // Create test user with hashed password
    const passwordHash = await password.hash(testUserData.password);
    
    const insertedUsers = await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: passwordHash,
        full_name: testUserData.full_name,
        role: testUserData.role,
        is_active: testUserData.is_active,
      })
      .returning()
      .execute();

    const loginInput: LoginInput = {
      email: testUserData.email,
      password: testUserData.password,
    };

    const result = await login(loginInput);

    // Verify user data
    expect(result.id).toBeDefined();
    expect(result.email).toEqual(testUserData.email);
    expect(result.full_name).toEqual(testUserData.full_name);
    expect(result.role).toEqual(testUserData.role);
    expect(result.is_active).toEqual(testUserData.is_active);
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify password_hash is not returned
    expect(result).not.toHaveProperty('password_hash');
  });

  it('should login admin user successfully', async () => {
    // Create admin user
    const passwordHash = await password.hash(adminUserData.password);
    
    await db.insert(usersTable)
      .values({
        email: adminUserData.email,
        password_hash: passwordHash,
        full_name: adminUserData.full_name,
        role: adminUserData.role,
        is_active: adminUserData.is_active,
      })
      .execute();

    const loginInput: LoginInput = {
      email: adminUserData.email,
      password: adminUserData.password,
    };

    const result = await login(loginInput);

    expect(result.role).toEqual('admin');
    expect(result.email).toEqual(adminUserData.email);
    expect(result.full_name).toEqual(adminUserData.full_name);
  });

  it('should throw error for non-existent email', async () => {
    const loginInput: LoginInput = {
      email: 'nonexistent@example.com',
      password: 'anypassword',
    };

    await expect(login(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for invalid password', async () => {
    // Create test user
    const passwordHash = await password.hash(testUserData.password);
    
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: passwordHash,
        full_name: testUserData.full_name,
        role: testUserData.role,
        is_active: testUserData.is_active,
      })
      .execute();

    const loginInput: LoginInput = {
      email: testUserData.email,
      password: 'wrongpassword',
    };

    await expect(login(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should throw error for inactive user', async () => {
    // Create inactive user
    const passwordHash = await password.hash(inactiveUserData.password);
    
    await db.insert(usersTable)
      .values({
        email: inactiveUserData.email,
        password_hash: passwordHash,
        full_name: inactiveUserData.full_name,
        role: inactiveUserData.role,
        is_active: inactiveUserData.is_active,
      })
      .execute();

    const loginInput: LoginInput = {
      email: inactiveUserData.email,
      password: inactiveUserData.password,
    };

    await expect(login(loginInput)).rejects.toThrow(/account is inactive/i);
  });

  it('should handle case-sensitive email correctly', async () => {
    // Create user with lowercase email
    const passwordHash = await password.hash(testUserData.password);
    
    await db.insert(usersTable)
      .values({
        email: testUserData.email.toLowerCase(),
        password_hash: passwordHash,
        full_name: testUserData.full_name,
        role: testUserData.role,
        is_active: testUserData.is_active,
      })
      .execute();

    // Try to login with uppercase email
    const loginInput: LoginInput = {
      email: testUserData.email.toUpperCase(),
      password: testUserData.password,
    };

    // This should fail because email is case-sensitive
    await expect(login(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should handle empty password', async () => {
    // Create test user
    const passwordHash = await password.hash(testUserData.password);
    
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: passwordHash,
        full_name: testUserData.full_name,
        role: testUserData.role,
        is_active: testUserData.is_active,
      })
      .execute();

    const loginInput: LoginInput = {
      email: testUserData.email,
      password: '',
    };

    await expect(login(loginInput)).rejects.toThrow(/invalid email or password/i);
  });

  it('should verify returned user has all required fields', async () => {
    // Create test user
    const passwordHash = await password.hash(testUserData.password);
    
    await db.insert(usersTable)
      .values({
        email: testUserData.email,
        password_hash: passwordHash,
        full_name: testUserData.full_name,
        role: testUserData.role,
        is_active: testUserData.is_active,
      })
      .execute();

    const loginInput: LoginInput = {
      email: testUserData.email,
      password: testUserData.password,
    };

    const result = await login(loginInput);

    // Verify all required User schema fields are present
    expect(typeof result.id).toBe('number');
    expect(typeof result.email).toBe('string');
    expect(typeof result.full_name).toBe('string');
    expect(['admin', 'reseller', 'user']).toContain(result.role);
    expect(typeof result.is_active).toBe('boolean');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
    
    // Ensure password_hash is not included
    expect(result).not.toHaveProperty('password_hash');
  });
});