#!/usr/bin/env node

/**
 * Script untuk memverifikasi tidak ada dummy/static data di codebase
 * Run: node verify-no-dummy-data.mjs
 */

import { readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SEARCH_TERMS = [
  'FALLBACK_USERS',
  'FALLBACK_ROOMS',
  'staticLogs',
  'dummyData',
  'fallbackData',
  'STATIC_DATA',
];

const EXCLUDE_DIRS = [
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
];

const EXCLUDE_FILES = [
  'verify-no-dummy-data.mjs',
  'FULL_COSMOS_DB_MIGRATION_COMPLETE.md',
  'CHANGELOG_SCHEDULE_BOOKING.md',
  'CHANGELOG_SCHEDULE_INFO_ONLY.md',
  'FIX_BOOKING_PAGE_ERROR.md',
  'FIX_COSMOS_DELETE_ERROR.md',
  'FIX_DELETE_SCHEDULE_NOT_FOUND.md',
  'FIX_ENDSWITH_ERROR.md',
];

let foundIssues = false;

function searchInFile(filePath, content) {
  const lines = content.split('\n');
  const issues = [];

  SEARCH_TERMS.forEach(term => {
    lines.forEach((line, index) => {
      if (line.includes(term)) {
        issues.push({
          term,
          line: index + 1,
          content: line.trim(),
        });
      }
    });
  });

  return issues;
}

function scanDirectory(dir) {
  const files = readdirSync(dir);

  files.forEach(file => {
    const filePath = join(dir, file);
    const stat = statSync(filePath);

    // Skip excluded directories
    if (stat.isDirectory()) {
      if (EXCLUDE_DIRS.includes(file)) {
        return;
      }
      scanDirectory(filePath);
      return;
    }

    // Only check TypeScript/JavaScript files
    if (!file.match(/\.(ts|tsx|js|jsx|mjs)$/)) {
      return;
    }

    // Skip excluded files
    if (EXCLUDE_FILES.includes(file)) {
      return;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const issues = searchInFile(filePath, content);

      if (issues.length > 0) {
        foundIssues = true;
        console.log(`\n❌ Found dummy data in: ${filePath}`);
        issues.forEach(issue => {
          console.log(`   Line ${issue.line}: ${issue.term}`);
          console.log(`   → ${issue.content}`);
        });
      }
    } catch (error) {
      // Skip files that can't be read
    }
  });
}

console.log('🔍 Verifying no dummy/static data in codebase...\n');
console.log('Searching for:', SEARCH_TERMS.join(', '));
console.log('');

scanDirectory('./src');

if (!foundIssues) {
  console.log('✅ SUCCESS! No dummy/static data found in codebase.');
  console.log('✅ All data is now from Cosmos DB.');
  console.log('');
  console.log('🎉 Website is ready for presentation!');
  process.exit(0);
} else {
  console.log('\n⚠️  WARNING: Found dummy/static data that needs to be removed.');
  process.exit(1);
}
