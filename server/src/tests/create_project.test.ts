import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { projectsTable, usersTable, templatesTable } from '../db/schema';
import { type CreateProjectInput } from '../schema';
import { createProject } from '../handlers/create_project';
import { eq } from 'drizzle-orm';

describe('createProject', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let testUser: any;
  let testTemplate: any;
  let testReseller: any;

  beforeEach(async () => {
    // Create test user
    const userResult = await db.insert(usersTable)
      .values({
        email: 'test@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test User',
        role: 'user',
      })
      .returning()
      .execute();
    testUser = userResult[0];

    // Create test template
    const templateResult = await db.insert(templatesTable)
      .values({
        name: 'Test Template',
        description: 'A template for testing',
        thumbnail_url: 'https://example.com/thumb.jpg',
        template_data: '{"layout": "modern"}',
        is_premium: false,
      })
      .returning()
      .execute();
    testTemplate = templateResult[0];

    // Create test reseller
    const resellerResult = await db.insert(usersTable)
      .values({
        email: 'reseller@example.com',
        password_hash: 'hashed_password',
        full_name: 'Test Reseller',
        role: 'reseller',
      })
      .returning()
      .execute();
    testReseller = resellerResult[0];
  });

  const createTestInput = (overrides: Partial<CreateProjectInput> = {}): CreateProjectInput => ({
    user_id: testUser.id,
    reseller_id: null,
    template_id: testTemplate.id,
    subdomain: 'unique-subdomain',
    bride_name: 'Jane Smith',
    groom_name: 'John Doe',
    event_date: new Date('2024-06-15'),
    event_time: '15:30',
    venue_name: 'Grand Ballroom',
    venue_address: '123 Main St, City, State',
    venue_latitude: 40.7128,
    venue_longitude: -74.0060,
    hero_photo_url: 'https://example.com/hero.jpg',
    additional_info: 'Special instructions here',
    custom_data: '{"theme": "romantic"}',
    ...overrides,
  });

  it('should create a project with all fields', async () => {
    const testInput = createTestInput();
    const result = await createProject(testInput);

    // Basic field validation
    expect(result.user_id).toEqual(testUser.id);
    expect(result.reseller_id).toBeNull();
    expect(result.template_id).toEqual(testTemplate.id);
    expect(result.subdomain).toEqual('unique-subdomain');
    expect(result.bride_name).toEqual('Jane Smith');
    expect(result.groom_name).toEqual('John Doe');
    expect(result.event_date).toEqual(new Date('2024-06-15'));
    expect(result.event_time).toEqual('15:30');
    expect(result.venue_name).toEqual('Grand Ballroom');
    expect(result.venue_address).toEqual('123 Main St, City, State');
    expect(result.venue_latitude).toEqual(40.7128);
    expect(result.venue_longitude).toEqual(-74.0060);
    expect(result.hero_photo_url).toEqual('https://example.com/hero.jpg');
    expect(result.additional_info).toEqual('Special instructions here');
    expect(result.custom_data).toEqual('{"theme": "romantic"}');

    // Default values
    expect(result.status).toEqual('draft');
    expect(result.is_paid).toEqual(false);
    expect(result.published_at).toBeNull();

    // Generated fields
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);

    // Verify numeric types
    expect(typeof result.venue_latitude).toBe('number');
    expect(typeof result.venue_longitude).toBe('number');
  });

  it('should create a project with reseller', async () => {
    const testInput = createTestInput({ reseller_id: testReseller.id });
    const result = await createProject(testInput);

    expect(result.reseller_id).toEqual(testReseller.id);
    expect(result.user_id).toEqual(testUser.id);
  });

  it('should create a project with null coordinates', async () => {
    const testInput = createTestInput({ 
      venue_latitude: null, 
      venue_longitude: null 
    });
    const result = await createProject(testInput);

    expect(result.venue_latitude).toBeNull();
    expect(result.venue_longitude).toBeNull();
  });

  it('should save project to database', async () => {
    const testInput = createTestInput();
    const result = await createProject(testInput);

    // Query database to verify insertion
    const projects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.id, result.id))
      .execute();

    expect(projects).toHaveLength(1);
    const savedProject = projects[0];
    
    expect(savedProject.subdomain).toEqual('unique-subdomain');
    expect(savedProject.bride_name).toEqual('Jane Smith');
    expect(savedProject.groom_name).toEqual('John Doe');
    expect(savedProject.venue_name).toEqual('Grand Ballroom');
    expect(savedProject.status).toEqual('draft');
    expect(savedProject.is_paid).toEqual(false);
    
    // Verify numeric fields are stored as strings in DB but converted back
    expect(parseFloat(savedProject.venue_latitude!)).toEqual(40.7128);
    expect(parseFloat(savedProject.venue_longitude!)).toEqual(-74.0060);
  });

  it('should reject invalid user_id', async () => {
    const testInput = createTestInput({ user_id: 99999 });

    await expect(createProject(testInput)).rejects.toThrow(/User with ID 99999 does not exist/i);
  });

  it('should reject invalid template_id', async () => {
    const testInput = createTestInput({ template_id: 99999 });

    await expect(createProject(testInput)).rejects.toThrow(/Template with ID 99999 does not exist/i);
  });

  it('should reject invalid reseller_id', async () => {
    const testInput = createTestInput({ reseller_id: 99999 });

    await expect(createProject(testInput)).rejects.toThrow(/Reseller with ID 99999 does not exist/i);
  });

  it('should reject non-reseller user as reseller', async () => {
    const testInput = createTestInput({ reseller_id: testUser.id }); // testUser has role 'user', not 'reseller'

    await expect(createProject(testInput)).rejects.toThrow(/User with ID .+ is not a reseller/i);
  });

  it('should reject duplicate subdomain', async () => {
    const testInput1 = createTestInput({ subdomain: 'duplicate-subdomain' });
    const testInput2 = createTestInput({ subdomain: 'duplicate-subdomain' });

    // First creation should succeed
    await createProject(testInput1);

    // Second creation with same subdomain should fail
    await expect(createProject(testInput2)).rejects.toThrow(/Subdomain 'duplicate-subdomain' is already taken/i);
  });

  it('should handle projects without optional fields', async () => {
    const testInput = createTestInput({
      reseller_id: null,
      venue_latitude: null,
      venue_longitude: null,
      hero_photo_url: null,
      additional_info: null,
      custom_data: null,
    });

    const result = await createProject(testInput);

    expect(result.reseller_id).toBeNull();
    expect(result.venue_latitude).toBeNull();
    expect(result.venue_longitude).toBeNull();
    expect(result.hero_photo_url).toBeNull();
    expect(result.additional_info).toBeNull();
    expect(result.custom_data).toBeNull();

    // Required fields should still be present
    expect(result.bride_name).toEqual('Jane Smith');
    expect(result.groom_name).toEqual('John Doe');
    expect(result.subdomain).toEqual('unique-subdomain');
  });

  it('should handle edge case coordinates', async () => {
    const testInput = createTestInput({
      venue_latitude: -90.0, // South pole
      venue_longitude: 180.0, // Dateline
    });

    const result = await createProject(testInput);

    expect(result.venue_latitude).toEqual(-90.0);
    expect(result.venue_longitude).toEqual(180.0);
    expect(typeof result.venue_latitude).toBe('number');
    expect(typeof result.venue_longitude).toBe('number');
  });
});