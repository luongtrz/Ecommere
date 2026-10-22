import { describe, expect, it } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

describe('Footer', () => {
  const renderFooter = () =>
    render(
      <MemoryRouter>
        <Footer />
      </MemoryRouter>,
    );

  it('renders shop brand title and description', () => {
    renderFooter();

    expect(screen.getByText('Thai Spray Shop')).toBeInTheDocument();
    expect(
      screen.getByText(
        'Cung cấp chai xịt Thái Lan chính hãng với đa dạng mùi hương và dung tích.',
      ),
    ).toBeInTheDocument();
  });

  it('renders quick navigation links under Liên kết', () => {
    renderFooter();

    expect(screen.getByText('Liên kết')).toBeInTheDocument();

    const quickLinks = [
      { text: 'Sản phẩm', href: '/catalog' },
      { text: 'Giới thiệu', href: '/about' },
      { text: 'Liên hệ', href: '/contact' },
    ];

    quickLinks.forEach(({ text, href }) => {
      const link = screen.getByRole('link', { name: text });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('renders policy links under Chính sách', () => {
    renderFooter();

    expect(screen.getByText('Chính sách')).toBeInTheDocument();

    const policyLinks = [
      { text: 'Vận chuyển', href: '/policy/shipping' },
      { text: 'Đổi trả', href: '/policy/return' },
      { text: 'Bảo mật', href: '/policy/privacy' },
    ];

    policyLinks.forEach(({ text, href }) => {
      const link = screen.getByRole('link', { name: text });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', href);
    });
  });

  it('renders contact information and handles social media buttons', () => {
    renderFooter();

    expect(screen.getByText('0123 456 789')).toBeInTheDocument();
    expect(screen.getByText('contact@thaispray.com')).toBeInTheDocument();

    const facebookButton = screen.getByRole('button', { name: 'Facebook' });
    const instagramButton = screen.getByRole('button', { name: 'Instagram' });

    expect(facebookButton).toBeInTheDocument();
    expect(instagramButton).toBeInTheDocument();

    // Verify interaction
    fireEvent.click(facebookButton);
    fireEvent.click(instagramButton);
  });

  it('renders copyright statement', () => {
    renderFooter();

    expect(
      screen.getByText('© 2025 Thai Spray Shop. All rights reserved.'),
    ).toBeInTheDocument();
  });
});
