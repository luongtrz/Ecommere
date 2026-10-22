import * as React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

afterEach(() => {
  cleanup();
});

describe('Tabs components', () => {
  it('renders tabs with defaultValue and displays corresponding content', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab Một</TabsTrigger>
          <TabsTrigger value="tab2">Tab Hai</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Nội dung tab một</TabsContent>
        <TabsContent value="tab2">Nội dung tab hai</TabsContent>
      </Tabs>,
    );

    const trigger1 = screen.getByRole('tab', { name: 'Tab Một' });
    const trigger2 = screen.getByRole('tab', { name: 'Tab Hai' });

    expect(trigger1).toHaveAttribute('data-state', 'active');
    expect(trigger2).toHaveAttribute('data-state', 'inactive');

    expect(screen.getByText('Nội dung tab một')).toBeVisible();
    expect(screen.queryByText('Nội dung tab hai')).not.toBeInTheDocument();
  });

  it('switches active tab and content upon clicking a tab trigger', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab Một</TabsTrigger>
          <TabsTrigger value="tab2">Tab Hai</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Nội dung tab một</TabsContent>
        <TabsContent value="tab2">Nội dung tab hai</TabsContent>
      </Tabs>,
    );

    const trigger1 = screen.getByRole('tab', { name: 'Tab Một' });
    const trigger2 = screen.getByRole('tab', { name: 'Tab Hai' });

    await user.click(trigger2);

    expect(trigger1).toHaveAttribute('data-state', 'inactive');
    expect(trigger2).toHaveAttribute('data-state', 'active');

    expect(screen.queryByText('Nội dung tab một')).not.toBeInTheDocument();
    expect(screen.getByText('Nội dung tab hai')).toBeVisible();
  });

  it('supports controlled value and calls onValueChange with exact tab value', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <Tabs value="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab Một</TabsTrigger>
          <TabsTrigger value="tab2">Tab Hai</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Nội dung tab một</TabsContent>
        <TabsContent value="tab2">Nội dung tab hai</TabsContent>
      </Tabs>,
    );

    const trigger2 = screen.getByRole('tab', { name: 'Tab Hai' });
    await user.click(trigger2);

    expect(handleValueChange).toHaveBeenCalledWith('tab2');
  });

  it('merges custom classNames into TabsList, TabsTrigger, and TabsContent', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList className="custom-list-class">
          <TabsTrigger value="tab1" className="custom-trigger-class">
            Tab Một
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" className="custom-content-class">
          Nội dung tùy chỉnh
        </TabsContent>
      </Tabs>,
    );

    const list = screen.getByRole('tablist');
    expect(list).toHaveClass('custom-list-class');
    expect(list).toHaveClass('inline-flex');
    expect(list).toHaveClass('h-10');
    expect(list).toHaveClass('bg-slate-100');

    const trigger = screen.getByRole('tab', { name: 'Tab Một' });
    expect(trigger).toHaveClass('custom-trigger-class');
    expect(trigger).toHaveClass('whitespace-nowrap');
    expect(trigger).toHaveClass('px-3');

    const content = screen.getByRole('tabpanel');
    expect(content).toHaveClass('custom-content-class');
    expect(content).toHaveClass('mt-3');
    expect(content).toHaveClass('ring-offset-white');
  });

  it('does not switch tabs or call onValueChange when trigger is disabled', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <Tabs defaultValue="tab1" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="tab1">Tab Một</TabsTrigger>
          <TabsTrigger value="tab2" disabled>
            Tab Hai Khóa
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Nội dung tab một</TabsContent>
        <TabsContent value="tab2">Nội dung tab hai</TabsContent>
      </Tabs>,
    );

    const disabledTrigger = screen.getByRole('tab', { name: 'Tab Hai Khóa' });
    expect(disabledTrigger).toBeDisabled();
    expect(disabledTrigger).toHaveClass('disabled:pointer-events-none');
    expect(disabledTrigger).toHaveClass('disabled:opacity-50');

    await user.click(disabledTrigger);

    expect(handleValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'Tab Một' })).toHaveAttribute(
      'data-state',
      'active',
    );
  });

  it('renders TabsContent with forceMount when inactive', () => {
    render(
      <Tabs defaultValue="tab1">
        <TabsList>
          <TabsTrigger value="tab1">Tab Một</TabsTrigger>
          <TabsTrigger value="tab2">Tab Hai</TabsTrigger>
        </TabsList>
        <TabsContent value="tab1">Nội dung 1</TabsContent>
        <TabsContent value="tab2" forceMount data-testid="forced-panel">
          Nội dung gắn kết cố định
        </TabsContent>
      </Tabs>,
    );

    const forcedPanel = screen.getByTestId('forced-panel');
    expect(forcedPanel).toBeInTheDocument();
    expect(forcedPanel).toHaveAttribute('data-state', 'inactive');
    expect(forcedPanel).toHaveClass('mt-3');
  });

  it('forwards refs correctly to DOM elements', () => {
    const listRef = React.createRef<HTMLDivElement>();
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();

    render(
      <Tabs defaultValue="tab1">
        <TabsList ref={listRef}>
          <TabsTrigger value="tab1" ref={triggerRef}>
            Tab Một
          </TabsTrigger>
        </TabsList>
        <TabsContent value="tab1" ref={contentRef}>
          Nội dung tham chiếu
        </TabsContent>
      </Tabs>,
    );

    expect(listRef.current).toBeInstanceOf(HTMLDivElement);
    expect(triggerRef.current).toBeInstanceOf(HTMLButtonElement);
    expect(contentRef.current).toBeInstanceOf(HTMLDivElement);
  });

  it('has correct display names set on components', () => {
    expect(TabsList.displayName).toBe(TabsPrimitive.List.displayName);
    expect(TabsTrigger.displayName).toBe(TabsPrimitive.Trigger.displayName);
    expect(TabsContent.displayName).toBe(TabsPrimitive.Content.displayName);
  });
});
