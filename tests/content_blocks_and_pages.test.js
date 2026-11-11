import test from 'node:test';
import assert from 'node:assert/strict';
import { formatContentBlocks, compileLessonContent, importService } from '../src/services/importService.js';

test('formatContentBlocks: compiles headings, paragraphs, images, and lists to formatted markdown', () => {
  const blocks = [
    { type: 'heading', level: 2, text: 'Colors and Shapes' },
    { type: 'paragraph', text: 'Let us learn about the color red and round circles.' },
    {
      type: 'image',
      url: 'https://example.com/red-apple.jpg',
      alt: 'A shiny red apple',
      caption: 'Apples are red and round',
    },
    {
      type: 'list',
      ordered: false,
      items: ['Red Apple', 'Red Strawberry', 'Red Rose'],
    },
  ];

  const markdown = formatContentBlocks(blocks);
  assert.ok(markdown.includes('## Colors and Shapes'));
  assert.ok(markdown.includes('Let us learn about the color red and round circles.'));
  assert.ok(markdown.includes('![A shiny red apple](https://example.com/red-apple.jpg "Apples are red and round")'));
  assert.ok(markdown.includes('- Red Apple'));
  assert.ok(markdown.includes('- Red Strawberry'));
});

test('compileLessonContent: processes multi-page lesson structures with page breaks', () => {
  const multiPageLesson = {
    title: 'Preschool Numbers: 1 to 5',
    pages: [
      {
        content_blocks: [
          { type: 'heading', level: 3, text: 'Number 1: The Sun' },
          { type: 'paragraph', text: 'There is only one sun in the daytime sky.' },
        ],
      },
      {
        content_blocks: [
          { type: 'heading', level: 3, text: 'Number 2: Eyes' },
          { type: 'paragraph', text: 'We have two eyes to see the world.' },
        ],
      },
    ],
  };

  const compiled = compileLessonContent(multiPageLesson);
  assert.ok(compiled.includes('<!-- pagebreak -->'));
  assert.ok(compiled.includes('Number 1: The Sun'));
  assert.ok(compiled.includes('Number 2: Eyes'));

  const pages = compiled.split('<!-- pagebreak -->').map((p) => p.trim());
  assert.equal(pages.length, 2);
});

test('importService: validates lesson series with content_blocks or pages', () => {
  const payloadWithBlocks = {
    format: 'learnhub-content',
    version: 1,
    type: 'lesson_series',
    course: {
      title: 'Preschool Discovery',
      description: 'Colors, animals, and numbers for early childhood',
    },
    lessons: [
      {
        title: 'Lesson 1: Primary Colors',
        description: 'Red, Blue, and Yellow',
        order: 1,
        content_blocks: [
          { type: 'heading', level: 2, text: 'The Primary Colors' },
          { type: 'paragraph', text: 'Red, blue, and yellow make all the other colors.' },
        ],
      },
    ],
  };

  const result = importService.validateLessonSeries(payloadWithBlocks);
  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});
