import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from './collapsible';

afterEach(() => {
  cleanup();
});

describe('Collapsible', () => {
  it('exports Collapsible, CollapsibleTrigger, and CollapsibleContent', () => {
    expect(Collapsible).toBeDefined();
    expect(CollapsibleTrigger).toBeDefined();
    expect(CollapsibleContent).toBeDefined();
  });

  it('renders collapsed by default with trigger and hidden content', () => {
    render(
      <Collapsible data-testid="collapsible-root">
        <CollapsibleTrigger>Chi tiết thao tác</CollapsibleTrigger>
        <CollapsibleContent data-testid="collapsible-content-default">
          Nội dung chi tiết
        </CollapsibleContent>
      </Collapsible>,
    );

    const root = screen.getByTestId('collapsible-root');
    const trigger = screen.getByRole('button', { name: 'Chi tiết thao tác' });
    const content = screen.getByTestId('collapsible-content-default');

    expect(root).toBeInTheDocument();
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('data-state', 'closed');
    expect(content).toHaveAttribute('data-state', 'closed');
    expect(content).toHaveAttribute('hidden');
    expect(content).not.toBeVisible();
  });

  it('toggles open and closed when trigger is clicked', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible>
        <CollapsibleTrigger>Toggle Details</CollapsibleTrigger>
        <CollapsibleContent data-testid="collapsible-content-toggle">
          Collapsible body content
        </CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole('button', { name: 'Toggle Details' });
    const content = screen.getByTestId('collapsible-content-toggle');

    // Click to open
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('data-state', 'open');
    expect(content).toHaveAttribute('data-state', 'open');
    expect(content).not.toHaveAttribute('hidden');
    expect(content).toBeVisible();
    expect(content).toHaveTextContent('Collapsible body content');

    // Click to close
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('data-state', 'closed');
    expect(content).toHaveAttribute('data-state', 'closed');
    expect(content).toHaveAttribute('hidden');
    expect(content).not.toBeVisible();
  });

  it('renders open initially when defaultOpen is true', async () => {
    const user = userEvent.setup();
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger>Close Panel</CollapsibleTrigger>
        <CollapsibleContent data-testid="collapsible-content-initial">
          Initially visible content
        </CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole('button', { name: 'Close Panel' });
    const content = screen.getByTestId('collapsible-content-initial');

    expect(trigger).toHaveAttribute('aria-expanded', 'true');
    expect(trigger).toHaveAttribute('data-state', 'open');
    expect(content).toBeVisible();
    expect(content).not.toHaveAttribute('hidden');
    expect(content).toHaveTextContent('Initially visible content');

    // User can collapse it
    await user.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(trigger).toHaveAttribute('data-state', 'closed');
    expect(content).not.toBeVisible();
    expect(content).toHaveAttribute('hidden');
  });

  it('calls onOpenChange with true when closed and clicked in controlled mode', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Collapsible open={false} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Controlled Trigger Closed</CollapsibleTrigger>
        <CollapsibleContent data-testid="collapsible-content-controlled-closed">
          Controlled content
        </CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole('button', {
      name: 'Controlled Trigger Closed',
    });
    await user.click(trigger);

    expect(handleOpenChange).toHaveBeenCalledTimes(1);
    expect(handleOpenChange).toHaveBeenCalledWith(true);
  });

  it('calls onOpenChange with false when open and clicked in controlled mode', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Collapsible open={true} onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Controlled Trigger Open</CollapsibleTrigger>
        <CollapsibleContent data-testid="collapsible-content-controlled-open">
          Controlled content
        </CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole('button', {
      name: 'Controlled Trigger Open',
    });
    await user.click(trigger);

    expect(handleOpenChange).toHaveBeenCalledTimes(1);
    expect(handleOpenChange).toHaveBeenCalledWith(false);
  });

  it('does not toggle when Collapsible is disabled', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Collapsible disabled onOpenChange={handleOpenChange}>
        <CollapsibleTrigger>Disabled Trigger</CollapsibleTrigger>
        <CollapsibleContent data-testid="collapsible-content-disabled">
          Disabled content
        </CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole('button', { name: 'Disabled Trigger' });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('does not toggle when CollapsibleTrigger is disabled directly', async () => {
    const user = userEvent.setup();
    const handleOpenChange = vi.fn();

    render(
      <Collapsible onOpenChange={handleOpenChange}>
        <CollapsibleTrigger disabled>
          Trigger Disabled Directly
        </CollapsibleTrigger>
        <CollapsibleContent data-testid="collapsible-content-trigger-disabled">
          Content
        </CollapsibleContent>
      </Collapsible>,
    );

    const trigger = screen.getByRole('button', {
      name: 'Trigger Disabled Directly',
    });
    expect(trigger).toBeDisabled();

    await user.click(trigger);
    expect(handleOpenChange).not.toHaveBeenCalled();
  });

  it('passes through custom className and attributes to components', () => {
    render(
      <Collapsible className="custom-root" data-testid="root" id="root-id">
        <CollapsibleTrigger className="custom-trigger" data-testid="trigger">
          Button
        </CollapsibleTrigger>
        <CollapsibleContent className="custom-content" data-testid="content">
          Text
        </CollapsibleContent>
      </Collapsible>,
    );

    expect(screen.getByTestId('root')).toHaveClass('custom-root');
    expect(screen.getByTestId('root')).toHaveAttribute('id', 'root-id');
    expect(screen.getByTestId('trigger')).toHaveClass('custom-trigger');
    expect(screen.getByTestId('content')).toHaveClass('custom-content');
  });

  it('renders custom underlying elements when asChild is used', () => {
    render(
      <Collapsible defaultOpen asChild>
        <section data-testid="custom-section">
          <CollapsibleTrigger asChild>
            <button type="button" data-testid="custom-button">
              Custom Button
            </button>
          </CollapsibleTrigger>
          <CollapsibleContent asChild>
            <div data-testid="custom-div">Custom Div Content</div>
          </CollapsibleContent>
        </section>
      </Collapsible>,
    );

    expect(screen.getByTestId('custom-section').tagName).toBe('SECTION');
    expect(screen.getByTestId('custom-button').tagName).toBe('BUTTON');
    expect(screen.getByTestId('custom-div')).toBeInTheDocument();
    expect(screen.getByTestId('custom-div').tagName).toBe('DIV');
    expect(screen.getByTestId('custom-div')).toHaveTextContent(
      'Custom Div Content',
    );
  });
});
