import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { GoalEditModal } from './GoalEditModal';
import { YearlyGoalWidget } from './YearlyGoalWidget';

vi.mock('./StorageBadge', () => ({ StorageBadge: () => null }));
afterEach(() => { cleanup(); localStorage.clear(); });

function renderMonthly(targetType: 'books' | 'pages' | 'both' = 'books') {
  const onSave = vi.fn();
  render(<GoalEditModal goal={{ monthKey: '2026-11', targetType, targetBooks: 1, targetPages: 1000, intention: '' }} monthKey="2026-11" onSave={onSave} onClose={() => {}} />);
  return onSave;
}

describe('goal entry', () => {
  it('allows deleting 1 and replacing it with 20 books', () => {
    const save = renderMonthly();
    const input = screen.getByRole('spinbutton', { name: 'Target finished books' });
    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue(null);
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Goal' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ targetBooks: 20 }));
  });

  it.each(['', '0'])('does not save a %j monthly book goal', (value) => {
    const save = renderMonthly();
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Target finished books' }), { target: { value } });
    fireEvent.submit(screen.getByRole('button', { name: 'Save Goal' }).closest('form') as HTMLFormElement);
    expect(save).not.toHaveBeenCalled();
  });

  it.each(['', '0'])('does not save a %j monthly page goal', (value) => {
    const save = renderMonthly('pages');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Target pages read' }), { target: { value } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Goal' }));
    expect(save).not.toHaveBeenCalled();
  });

  it('allows clearing and replacing a page target', () => {
    const save = renderMonthly('pages');
    const input = screen.getByRole('spinbutton', { name: 'Target pages read' });
    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue(null);
    fireEvent.change(input, { target: { value: '2000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Goal' }));
    expect(save).toHaveBeenCalledWith(expect.objectContaining({ targetPages: 2000 }));
  });

  it('requires positive targets for both monthly metrics', () => {
    const save = renderMonthly('both');
    fireEvent.change(screen.getByRole('spinbutton', { name: 'Target pages read' }), { target: { value: '0' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save Goal' }));
    expect(save).not.toHaveBeenCalled();
  });

  it('allows clearing the yearly book target, rejects zero and saves 20', () => {
    render(<YearlyGoalWidget books={[]} />);
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    const input = screen.getByRole('spinbutton', { name: 'Books' });
    fireEvent.change(input, { target: { value: '' } });
    expect(input).toHaveValue(null);
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.change(input, { target: { value: '0' } });
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    fireEvent.change(input, { target: { value: '20' } });
    fireEvent.click(screen.getByRole('button', { name: 'Save' }));
    fireEvent.click(screen.getByRole('button', { name: 'Edit' }));
    expect(screen.getByRole('spinbutton', { name: 'Books' })).toHaveValue(20);
  });
});