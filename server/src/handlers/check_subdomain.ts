import { db } from '../db';
import { projectsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CheckSubdomainInput, type SubdomainCheckResponse } from '../schema';

// Reserved subdomain words that cannot be used
const RESERVED_SUBDOMAINS = [
  'www', 'api', 'admin', 'mail', 'email', 'ftp', 'blog', 'forum',
  'shop', 'store', 'dashboard', 'app', 'mobile', 'web', 'site',
  'support', 'help', 'docs', 'dev', 'test', 'staging', 'prod',
  'production', 'demo', 'beta', 'alpha', 'preview', 'temp', 'tmp',
  'static', 'assets', 'cdn', 'media', 'images', 'files', 'upload',
  'download', 'secure', 'ssl', 'vpn', 'proxy', 'gateway', 'server',
  'host', 'cloud', 'service', 'platform', 'system', 'network',
  'login', 'signup', 'register', 'auth', 'oauth', 'sso', 'account',
  'profile', 'user', 'users', 'client', 'clients', 'guest', 'public',
  'private', 'protected', 'security', 'privacy', 'terms', 'policy',
  'about', 'contact', 'info', 'news', 'press', 'legal', 'careers',
  'jobs', 'team', 'company', 'corp', 'inc', 'ltd', 'llc', 'organization'
];

// Validate subdomain format (alphanumeric and hyphens, no consecutive hyphens)
const isValidSubdomainFormat = (subdomain: string): boolean => {
  // Check length (already validated by Zod, but double-check)
  if (subdomain.length < 3 || subdomain.length > 50) {
    return false;
  }

  // Check if it starts or ends with hyphen
  if (subdomain.startsWith('-') || subdomain.endsWith('-')) {
    return false;
  }

  // Check for valid characters (alphanumeric and hyphens only)
  if (!/^[a-zA-Z0-9-]+$/.test(subdomain)) {
    return false;
  }

  // Check for consecutive hyphens
  if (subdomain.includes('--')) {
    return false;
  }

  // Must start with alphanumeric character
  if (!/^[a-zA-Z0-9]/.test(subdomain)) {
    return false;
  }

  return true;
};

export const checkSubdomain = async (input: CheckSubdomainInput): Promise<SubdomainCheckResponse> => {
  try {
    const normalizedSubdomain = input.subdomain.toLowerCase().trim();
    
    // Check format validity
    if (!isValidSubdomainFormat(normalizedSubdomain)) {
      return {
        available: false,
        subdomain: normalizedSubdomain
      };
    }

    // Check if subdomain is reserved
    if (RESERVED_SUBDOMAINS.includes(normalizedSubdomain)) {
      return {
        available: false,
        subdomain: normalizedSubdomain
      };
    }

    // Check if subdomain already exists in database
    const existingProjects = await db.select()
      .from(projectsTable)
      .where(eq(projectsTable.subdomain, normalizedSubdomain))
      .execute();

    const isAvailable = existingProjects.length === 0;

    return {
      available: isAvailable,
      subdomain: normalizedSubdomain
    };
  } catch (error) {
    console.error('Subdomain check failed:', error);
    throw error;
  }
};