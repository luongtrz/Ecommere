import * as React from 'react';
import { cn } from '@/lib/utils';

interface CardContextValue {
  compact?: boolean;
}

const CardContext = React.createContext<CardContextValue>({ compact: false });

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, compact = false, ...props }, ref) => (
    <CardContext.Provider value={{ compact }}>
      <div
        ref={ref}
        className={cn(
          'rounded-xl border border-slate-200 bg-white text-slate-900 shadow-sm transition-all duration-200',
          className,
        )}
        {...props}
      />
    </CardContext.Provider>
  ),
);
Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, compact: compactProp, ...props }, ref) => {
    const { compact: contextCompact } = React.useContext(CardContext);
    const isCompact = compactProp ?? contextCompact;
    return (
      <div
        ref={ref}
        className={cn(
          'flex flex-col space-y-1.5',
          isCompact ? 'p-4 md:p-5 pb-2' : 'p-6',
          className,
        )}
        {...props}
      />
    );
  },
);
CardHeader.displayName = 'CardHeader';

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn(
      'text-lg font-semibold leading-snug tracking-tight text-slate-900',
      className,
    )}
    {...props}
  >
    {children}
  </h3>
));
CardTitle.displayName = 'CardTitle';

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p ref={ref} className={cn('text-sm text-slate-500', className)} {...props} />
));
CardDescription.displayName = 'CardDescription';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

const CardContent = React.forwardRef<HTMLDivElement, CardContentProps>(
  ({ className, compact: compactProp, ...props }, ref) => {
    const { compact: contextCompact } = React.useContext(CardContext);
    const isCompact = compactProp ?? contextCompact;
    return (
      <div
        ref={ref}
        className={cn(isCompact ? 'p-4 md:p-5 pt-0' : 'p-6 pt-0', className)}
        {...props}
      />
    );
  },
);
CardContent.displayName = 'CardContent';

export interface CardFooterProps extends React.HTMLAttributes<HTMLDivElement> {
  compact?: boolean;
}

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, compact: compactProp, ...props }, ref) => {
    const { compact: contextCompact } = React.useContext(CardContext);
    const isCompact = compactProp ?? contextCompact;
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center',
          isCompact ? 'p-4 md:p-5 pt-0' : 'p-6 pt-0',
          className,
        )}
        {...props}
      />
    );
  },
);
CardFooter.displayName = 'CardFooter';

export {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
};
