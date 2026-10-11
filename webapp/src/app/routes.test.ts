import { describe, expect, it } from 'vitest';
import { APP_ROUTES, withTimelineAddAction } from './routes';

describe('trip navigation', () => {
  it('places Add between Todo and Costs in the mobile navigation', () => {
    const labels = withTimelineAddAction(APP_ROUTES.filter((route) => route.primary))
      .map((item) => item.label);

    expect(labels).toEqual(['Timeline', 'Map', 'Todo', 'Add', 'Costs']);
  });

  it('places Add between Todo and Costs in the desktop navigation', () => {
    const labels = withTimelineAddAction(APP_ROUTES).map((item) => item.label);
    const todoIndex = labels.indexOf('Todo');

    expect(labels.slice(todoIndex, todoIndex + 3)).toEqual(['Todo', 'Add', 'Costs']);
  });
});
