import * as React from 'react';
import { describe, expect, it, vi, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import * as TabsPrimitive from '@radix-ui/react-tabs';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './tabs';

afterEach(() => {
  cleanup();
});

describe('Tabs components', () => {
  it('renders tabs with defaultValue and displays corresponding content', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Nội dung tổng quan quản trị</TabsContent>
        <TabsContent value="settings">Nội dung cài đặt hệ thống</TabsContent>
      </Tabs>,
    );

    const triggerOverview = screen.getByRole('tab', { name: 'Tổng quan' });
    const triggerSettings = screen.getByRole('tab', { name: 'Cài đặt' });

    expect(triggerOverview).toHaveAttribute('data-state', 'active');
    expect(triggerSettings).toHaveAttribute('data-state', 'inactive');

    expect(screen.getByText('Nội dung tổng quan quản trị')).toBeVisible();
    expect(
      screen.queryByText('Nội dung cài đặt hệ thống'),
    ).not.toBeInTheDocument();
  });

  it('switches active tab and content upon clicking a tab trigger', async () => {
    const user = userEvent.setup();
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Nội dung tổng quan quản trị</TabsContent>
        <TabsContent value="settings">Nội dung cài đặt hệ thống</TabsContent>
      </Tabs>,
    );

    const triggerOverview = screen.getByRole('tab', { name: 'Tổng quan' });
    const triggerSettings = screen.getByRole('tab', { name: 'Cài đặt' });

    await user.click(triggerSettings);

    expect(triggerOverview).toHaveAttribute('data-state', 'inactive');
    expect(triggerSettings).toHaveAttribute('data-state', 'active');

    expect(
      screen.queryByText('Nội dung tổng quan quản trị'),
    ).not.toBeInTheDocument();
    expect(screen.getByText('Nội dung cài đặt hệ thống')).toBeVisible();
  });

  it('supports controlled value and calls onValueChange with exact tab value', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <Tabs value="overview" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Nội dung tổng quan</TabsContent>
        <TabsContent value="settings">Nội dung cài đặt</TabsContent>
      </Tabs>,
    );

    const triggerSettings = screen.getByRole('tab', { name: 'Cài đặt' });
    await user.click(triggerSettings);

    expect(handleValueChange).toHaveBeenCalledWith('settings');
  });

  it('merges custom classNames into TabsList, TabsTrigger, and TabsContent', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList className="custom-list-class">
          <TabsTrigger value="overview" className="custom-trigger-class">
            Tổng quan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="custom-content-class">
          Nội dung tùy chỉnh
        </TabsContent>
      </Tabs>,
    );

    const list = screen.getByRole('tablist');
    expect(list).toHaveClass('custom-list-class');
    expect(list).toHaveClass('inline-flex');
    expect(list).toHaveClass('h-10');
    expect(list).toHaveClass('bg-muted');

    const trigger = screen.getByRole('tab', { name: 'Tổng quan' });
    expect(trigger).toHaveClass('custom-trigger-class');
    expect(trigger).toHaveClass('whitespace-nowrap');
    expect(trigger).toHaveClass('px-3');

    const content = screen.getByRole('tabpanel');
    expect(content).toHaveClass('custom-content-class');
    expect(content).toHaveClass('mt-2');
    expect(content).toHaveClass('ring-offset-background');
  });

  it('does not switch tabs or call onValueChange when trigger is disabled', async () => {
    const user = userEvent.setup();
    const handleValueChange = vi.fn();

    render(
      <Tabs defaultValue="overview" onValueChange={handleValueChange}>
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="settings" disabled>
            Cài đặt khóa
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Nội dung tổng quan</TabsContent>
        <TabsContent value="settings">Nội dung cài đặt</TabsContent>
      </Tabs>,
    );

    const disabledTrigger = screen.getByRole('tab', { name: 'Cài đặt khóa' });
    expect(disabledTrigger).toBeDisabled();
    expect(disabledTrigger).toHaveClass('disabled:pointer-events-none');
    expect(disabledTrigger).toHaveClass('disabled:opacity-50');

    await user.click(disabledTrigger);

    expect(handleValueChange).not.toHaveBeenCalled();
    expect(screen.getByRole('tab', { name: 'Tổng quan' })).toHaveAttribute(
      'data-state',
      'active',
    );
  });

  it('renders TabsContent with forceMount when inactive', () => {
    render(
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Tổng quan</TabsTrigger>
          <TabsTrigger value="settings">Cài đặt</TabsTrigger>
        </TabsList>
        <TabsContent value="overview">Nội dung 1</TabsContent>
        <TabsContent value="settings" forceMount data-testid="forced-panel">
          Nội dung gắn kết cố định
        </TabsContent>
      </Tabs>,
    );

    const forcedPanel = screen.getByTestId('forced-panel');
    expect(forcedPanel).toBeInTheDocument();
    expect(forcedPanel).toHaveAttribute('data-state', 'inactive');
    expect(forcedPanel).toHaveClass('mt-2');
  });

  it('forwards refs correctly to DOM elements', () => {
    const listRef = React.createRef<HTMLDivElement>();
    const triggerRef = React.createRef<HTMLButtonElement>();
    const contentRef = React.createRef<HTMLDivElement>();

    render(
      <Tabs defaultValue="overview">
        <TabsList ref={listRef}>
          <TabsTrigger value="overview" ref={triggerRef}>
            Tổng quan
          </TabsTrigger>
        </TabsList>
        <TabsContent value="overview" ref={contentRef}>
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
