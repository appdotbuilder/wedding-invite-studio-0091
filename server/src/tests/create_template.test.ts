import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { templatesTable } from '../db/schema';
import { type CreateTemplateInput } from '../schema';
import { createTemplate } from '../handlers/create_template';
import { eq } from 'drizzle-orm';

// Valid test template data
const validTemplateData = JSON.stringify({
  sections: ['header', 'story', 'gallery', 'rsvp'],
  colors: { primary: '#ff6b6b', secondary: '#4ecdc4' },
  fonts: { heading: 'Playfair Display', body: 'Source Sans Pro' }
});

// Simple test input
const testInput: CreateTemplateInput = {
  name: 'Test Template',
  description: 'A template for testing purposes',
  thumbnail_url: 'https://example.com/thumbnail.jpg',
  template_data: validTemplateData,
  is_premium: false
};

describe('createTemplate', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a template with all fields', async () => {
    const result = await createTemplate(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test Template');
    expect(result.description).toEqual('A template for testing purposes');
    expect(result.thumbnail_url).toEqual('https://example.com/thumbnail.jpg');
    expect(result.template_data).toEqual(validTemplateData);
    expect(result.is_premium).toEqual(false);
    expect(result.is_active).toEqual(true);
    expect(result.id).toBeDefined();
    expect(typeof result.id).toEqual('number');
    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.updated_at).toBeInstanceOf(Date);
  });

  it('should save template to database', async () => {
    const result = await createTemplate(testInput);

    // Query using proper drizzle syntax
    const templates = await db.select()
      .from(templatesTable)
      .where(eq(templatesTable.id, result.id))
      .execute();

    expect(templates).toHaveLength(1);
    expect(templates[0].name).toEqual('Test Template');
    expect(templates[0].description).toEqual('A template for testing purposes');
    expect(templates[0].thumbnail_url).toEqual('https://example.com/thumbnail.jpg');
    expect(templates[0].template_data).toEqual(validTemplateData);
    expect(templates[0].is_premium).toEqual(false);
    expect(templates[0].is_active).toEqual(true);
    expect(templates[0].created_at).toBeInstanceOf(Date);
    expect(templates[0].updated_at).toBeInstanceOf(Date);
  });

  it('should create premium template', async () => {
    const premiumInput: CreateTemplateInput = {
      ...testInput,
      name: 'Premium Template',
      is_premium: true
    };

    const result = await createTemplate(premiumInput);

    expect(result.name).toEqual('Premium Template');
    expect(result.is_premium).toEqual(true);
    expect(result.is_active).toEqual(true);
  });

  it('should handle null description', async () => {
    const inputWithNullDescription: CreateTemplateInput = {
      ...testInput,
      description: null
    };

    const result = await createTemplate(inputWithNullDescription);

    expect(result.description).toBeNull();
    expect(result.name).toEqual('Test Template');
    expect(result.is_active).toEqual(true);
  });

  it('should create template with complex template data', async () => {
    const complexTemplateData = JSON.stringify({
      layout: 'modern',
      sections: [
        {
          id: 'hero',
          type: 'hero',
          settings: { backgroundType: 'image', overlay: 0.5 }
        },
        {
          id: 'story',
          type: 'story',
          settings: { columns: 2, showTimeline: true }
        }
      ],
      animations: { entrance: 'fadeIn', scroll: 'parallax' },
      responsive: { breakpoints: { mobile: 768, tablet: 1024 } }
    });

    const complexInput: CreateTemplateInput = {
      ...testInput,
      name: 'Complex Template',
      template_data: complexTemplateData
    };

    const result = await createTemplate(complexInput);

    expect(result.name).toEqual('Complex Template');
    expect(result.template_data).toEqual(complexTemplateData);
    
    // Verify the template_data is valid JSON
    const parsedData = JSON.parse(result.template_data);
    expect(parsedData.layout).toEqual('modern');
    expect(parsedData.sections).toHaveLength(2);
    expect(parsedData.animations.entrance).toEqual('fadeIn');
  });

  it('should reject invalid JSON in template_data', async () => {
    const invalidInput: CreateTemplateInput = {
      ...testInput,
      template_data: '{ invalid json structure'
    };

    await expect(createTemplate(invalidInput)).rejects.toThrow(/JSON Parse error|Unexpected token/i);
  });

  it('should create multiple templates with unique IDs', async () => {
    const input1: CreateTemplateInput = {
      ...testInput,
      name: 'Template 1'
    };

    const input2: CreateTemplateInput = {
      ...testInput,
      name: 'Template 2'
    };

    const result1 = await createTemplate(input1);
    const result2 = await createTemplate(input2);

    expect(result1.id).not.toEqual(result2.id);
    expect(result1.name).toEqual('Template 1');
    expect(result2.name).toEqual('Template 2');
    
    // Verify both exist in database
    const templates = await db.select()
      .from(templatesTable)
      .execute();

    expect(templates).toHaveLength(2);
  });
});