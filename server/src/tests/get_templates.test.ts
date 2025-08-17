import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { templatesTable } from '../db/schema';
import { type Template } from '../schema';
import { getTemplates } from '../handlers/get_templates';
import { eq } from 'drizzle-orm';

describe('getTemplates', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no templates exist', async () => {
    const result = await getTemplates();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return only active templates', async () => {
    // Create active template
    await db.insert(templatesTable).values({
      name: 'Active Template',
      description: 'An active template',
      thumbnail_url: 'https://example.com/thumb1.jpg',
      template_data: '{"layout": "classic"}',
      is_active: true,
      is_premium: false
    }).execute();

    // Create inactive template
    await db.insert(templatesTable).values({
      name: 'Inactive Template',
      description: 'An inactive template',
      thumbnail_url: 'https://example.com/thumb2.jpg',
      template_data: '{"layout": "modern"}',
      is_active: false,
      is_premium: false
    }).execute();

    const result = await getTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Active Template');
    expect(result[0].is_active).toBe(true);
  });

  it('should return templates with all required fields', async () => {
    // Create test template with all fields
    await db.insert(templatesTable).values({
      name: 'Test Template',
      description: 'A test template with description',
      thumbnail_url: 'https://example.com/thumbnail.jpg',
      template_data: '{"layout": "elegant", "colors": ["#fff", "#000"]}',
      is_active: true,
      is_premium: true
    }).execute();

    const result = await getTemplates();

    expect(result).toHaveLength(1);
    const template = result[0];
    
    // Verify all required fields
    expect(template.id).toBeDefined();
    expect(template.name).toEqual('Test Template');
    expect(template.description).toEqual('A test template with description');
    expect(template.thumbnail_url).toEqual('https://example.com/thumbnail.jpg');
    expect(template.template_data).toEqual('{"layout": "elegant", "colors": ["#fff", "#000"]}');
    expect(template.is_active).toBe(true);
    expect(template.is_premium).toBe(true);
    expect(template.created_at).toBeInstanceOf(Date);
    expect(template.updated_at).toBeInstanceOf(Date);
  });

  it('should return multiple active templates', async () => {
    // Create multiple active templates
    const templates = [
      {
        name: 'Classic Template',
        description: 'Classic wedding template',
        thumbnail_url: 'https://example.com/classic.jpg',
        template_data: '{"layout": "classic"}',
        is_active: true,
        is_premium: false
      },
      {
        name: 'Modern Template',
        description: 'Modern wedding template',
        thumbnail_url: 'https://example.com/modern.jpg',
        template_data: '{"layout": "modern"}',
        is_active: true,
        is_premium: true
      },
      {
        name: 'Elegant Template',
        description: null, // Test nullable description
        thumbnail_url: 'https://example.com/elegant.jpg',
        template_data: '{"layout": "elegant"}',
        is_active: true,
        is_premium: false
      }
    ];

    for (const template of templates) {
      await db.insert(templatesTable).values(template).execute();
    }

    const result = await getTemplates();

    expect(result).toHaveLength(3);
    
    // Verify all templates are returned
    const names = result.map(t => t.name).sort();
    expect(names).toEqual(['Classic Template', 'Elegant Template', 'Modern Template']);
    
    // Verify all are active
    result.forEach(template => {
      expect(template.is_active).toBe(true);
    });
  });

  it('should handle templates with null description', async () => {
    await db.insert(templatesTable).values({
      name: 'Template Without Description',
      description: null,
      thumbnail_url: 'https://example.com/nodesc.jpg',
      template_data: '{"layout": "minimal"}',
      is_active: true,
      is_premium: false
    }).execute();

    const result = await getTemplates();

    expect(result).toHaveLength(1);
    expect(result[0].name).toEqual('Template Without Description');
    expect(result[0].description).toBe(null);
  });

  it('should return both free and premium templates', async () => {
    // Create free template
    await db.insert(templatesTable).values({
      name: 'Free Template',
      description: 'A free template',
      thumbnail_url: 'https://example.com/free.jpg',
      template_data: '{"layout": "basic"}',
      is_active: true,
      is_premium: false
    }).execute();

    // Create premium template
    await db.insert(templatesTable).values({
      name: 'Premium Template',
      description: 'A premium template',
      thumbnail_url: 'https://example.com/premium.jpg',
      template_data: '{"layout": "luxury"}',
      is_active: true,
      is_premium: true
    }).execute();

    const result = await getTemplates();

    expect(result).toHaveLength(2);
    
    const freeTemplate = result.find(t => t.name === 'Free Template');
    const premiumTemplate = result.find(t => t.name === 'Premium Template');
    
    expect(freeTemplate?.is_premium).toBe(false);
    expect(premiumTemplate?.is_premium).toBe(true);
  });

  it('should save templates correctly in database', async () => {
    await db.insert(templatesTable).values({
      name: 'Database Test Template',
      description: 'Testing database storage',
      thumbnail_url: 'https://example.com/dbtest.jpg',
      template_data: '{"test": true}',
      is_active: true,
      is_premium: false
    }).execute();

    // Verify the template was saved correctly by querying directly
    const dbTemplates = await db.select()
      .from(templatesTable)
      .where(eq(templatesTable.name, 'Database Test Template'))
      .execute();

    expect(dbTemplates).toHaveLength(1);
    expect(dbTemplates[0].name).toEqual('Database Test Template');
    expect(dbTemplates[0].description).toEqual('Testing database storage');
    expect(dbTemplates[0].is_active).toBe(true);

    // Verify handler returns the same data
    const handlerResult = await getTemplates();
    const handlerTemplate = handlerResult.find(t => t.name === 'Database Test Template');
    
    expect(handlerTemplate).toBeDefined();
    expect(handlerTemplate?.id).toEqual(dbTemplates[0].id);
    expect(handlerTemplate?.template_data).toEqual('{"test": true}');
  });
});