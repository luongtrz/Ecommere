import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
  cleanup,
  render,
  screen,
  fireEvent,
  waitFor,
} from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { SearchBox } from './SearchBox';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual =
    await vi.importActual<typeof import('react-router-dom')>(
      'react-router-dom',
    );
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

let store: Record<string, string> = {};

function renderSearchBox() {
  return render(
    <MemoryRouter>
      <SearchBox />
    </MemoryRouter>,
  );
}

describe('SearchBox', () => {
  beforeEach(() => {
    cleanup();
    store = {};
    vi.clearAllMocks();

    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key: string) => {
      return store[key] ?? null;
    });
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(
      (key: string, value: string) => {
        store[key] = String(value);
      },
    );
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  describe('Rendering and Focus State', () => {
    it('renders input with placeholder and without clear button or suggestions initially', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue('');
      expect(screen.queryByText('Gợi ý phổ biến')).not.toBeInTheDocument();
      expect(
        screen.queryByText('Sản phẩm tìm kiếm nhiều'),
      ).not.toBeInTheDocument();
    });

    it('shows suggestions dropdown and applies active border style when focused', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      const wrapper = input.parentElement;
      expect(wrapper).toHaveClass('border-slate-200');

      fireEvent.focus(input);
      expect(wrapper).toHaveClass('border-teal-500');
      expect(screen.getByText('Gợi ý phổ biến')).toBeInTheDocument();
      expect(screen.getByText('Sản phẩm tìm kiếm nhiều')).toBeInTheDocument();
    });

    it('closes suggestions when clicking outside the container', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);
      expect(screen.getByText('Gợi ý phổ biến')).toBeInTheDocument();

      fireEvent.mouseDown(document.body);
      expect(screen.queryByText('Gợi ý phổ biến')).not.toBeInTheDocument();
    });

    it('does not close suggestions when clicking inside the container', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);
      expect(screen.getByText('Gợi ý phổ biến')).toBeInTheDocument();

      fireEvent.mouseDown(input);
      expect(screen.getByText('Gợi ý phổ biến')).toBeInTheDocument();
    });

    it('removes mousedown event listener on unmount', () => {
      const removeSpy = vi.spyOn(document, 'removeEventListener');
      const { unmount } = renderSearchBox();
      unmount();
      expect(removeSpy).toHaveBeenCalledWith('mousedown', expect.any(Function));
    });
  });

  describe('readRecentSearches error and fallback branches', () => {
    it('returns empty list when localStorage has no saved recent searches', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);
      expect(screen.queryByText('Tìm gần đây')).not.toBeInTheDocument();
    });

    it('catches error and returns empty list when localStorage.getItem throws', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementationOnce(() => {
        throw new Error('Access denied');
      });
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);
      expect(screen.queryByText('Tìm gần đây')).not.toBeInTheDocument();
    });

    it('catches error and returns empty list when saved JSON is invalid', () => {
      store['recentSearches'] = 'invalid-json-{';
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);
      expect(screen.queryByText('Tìm gần đây')).not.toBeInTheDocument();
    });
  });

  describe('Query input and clear button', () => {
    it('renders clear button when query is not empty and clears input on click', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      const form = input.closest('form')!;
      expect(form.querySelector('button[type="button"]')).toBeNull();

      fireEvent.change(input, { target: { value: 'xịt chuột' } });
      expect(input).toHaveValue('xịt chuột');

      const clearButton = form.querySelector('button[type="button"]')!;
      expect(clearButton).toBeInTheDocument();

      fireEvent.click(clearButton);
      expect(input).toHaveValue('');
      expect(form.querySelector('button[type="button"]')).toBeNull();
    });
  });

  describe('Form submission and handleSearch', () => {
    it('does not navigate or save recent search when submitted with empty or whitespace string', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      const form = input.closest('form')!;

      // Empty submission
      fireEvent.submit(form);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(Storage.prototype.setItem).not.toHaveBeenCalled();

      // Whitespace only submission
      fireEvent.change(input, { target: { value: '   ' } });
      fireEvent.submit(form);
      expect(mockNavigate).not.toHaveBeenCalled();
      expect(Storage.prototype.setItem).not.toHaveBeenCalled();
    });

    it('saves recent search, closes suggestions, updates query and navigates on valid submission', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      const form = input.closest('form')!;

      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '  nước giặt hygiene  ' } });
      fireEvent.submit(form);

      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'recentSearches',
        JSON.stringify(['nước giặt hygiene']),
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        '/search?q=n%C6%B0%E1%BB%9Bc%20gi%E1%BA%B7t%20hygiene',
      );
      expect(input).toHaveValue('nước giặt hygiene');
      expect(
        screen.queryByText('Sản phẩm tìm kiếm nhiều'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Search suggestions when deferredQuery is present', () => {
    it('shows search prompt button and hint when user types a query', async () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: 'chuột' } });

      await waitFor(() => {
        expect(screen.getByText('“chuột”')).toBeInTheDocument();
      });

      expect(
        screen.getByText(
          'Mẹo: Nhập tên sản phẩm, công dụng (đuổi chuột, diệt gián, tẩy bồn cầu) để xem nhanh.',
        ),
      ).toBeInTheDocument();
      expect(screen.queryByText('Gợi ý phổ biến')).not.toBeInTheDocument();

      const searchPromptBtn = screen.getByRole('button', {
        name: /Tìm kiếm cho/,
      });
      fireEvent.click(searchPromptBtn);

      expect(mockNavigate).toHaveBeenCalledWith('/search?q=chu%E1%BB%99t');
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'recentSearches',
        JSON.stringify(['chuột']),
      );
      expect(screen.queryByText(/Mẹo: Nhập tên/)).not.toBeInTheDocument();
    });

    it('shows popular keywords and popular searches instead if user only enters whitespace', async () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);
      fireEvent.change(input, { target: { value: '   ' } });

      await waitFor(() => {
        expect(screen.getByText('Gợi ý phổ biến')).toBeInTheDocument();
      });
      expect(screen.queryByText(/Tìm kiếm cho/)).not.toBeInTheDocument();
    });
  });

  describe('Popular keywords and popular products', () => {
    it('renders all popular keywords and handles clicking them', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);

      const popularKeywords = [
        'Đuổi chuột ARS',
        'Diệt gián kiến',
        'Xịt thằn lằn',
        'Tẩy bồn cầu',
        'Xịt thơm sả chanh',
        'Nước giặt Hygiene',
      ];

      for (const keyword of popularKeywords) {
        expect(
          screen.getByRole('button', { name: keyword }),
        ).toBeInTheDocument();
      }

      fireEvent.click(screen.getByRole('button', { name: 'Đuổi chuột ARS' }));
      expect(mockNavigate).toHaveBeenCalledWith(
        '/search?q=%C4%90u%E1%BB%95i%20chu%E1%BB%99t%20ARS',
      );
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'recentSearches',
        JSON.stringify(['Đuổi chuột ARS']),
      );
      expect(input).toHaveValue('Đuổi chuột ARS');
    });

    it('renders all 4 popular products', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);

      expect(screen.getByText('Sản phẩm tìm kiếm nhiều')).toBeInTheDocument();
      expect(screen.getAllByText('Chính hãng Thái Lan')).toHaveLength(4);
      expect(
        screen.getByText('Xịt đuổi chuột ARS Thái Lan'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Xịt diệt gián kiến & thằn lằn'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Tẩy rửa nhà bếp đa năng Magiclean'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Xịt thơm phòng sả chanh O-Zone'),
      ).toBeInTheDocument();
    });

    it('navigates with query "chuột" when clicking "Xịt đuổi chuột ARS Thái Lan"', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);

      fireEvent.click(screen.getByText('Xịt đuổi chuột ARS Thái Lan'));
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=chu%E1%BB%99t');
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'recentSearches',
        JSON.stringify(['chuột']),
      );
    });

    it('navigates with query "gián" when clicking "Xịt diệt gián kiến & thằn lằn"', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);

      fireEvent.click(screen.getByText('Xịt diệt gián kiến & thằn lằn'));
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=gi%C3%A1n');
    });

    it('navigates with query "tẩy" when clicking "Tẩy rửa nhà bếp đa năng Magiclean"', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);

      fireEvent.click(screen.getByText('Tẩy rửa nhà bếp đa năng Magiclean'));
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=t%E1%BA%A9y');
    });

    it('navigates with query "sả chanh" when clicking "Xịt thơm phòng sả chanh O-Zone"', () => {
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);

      fireEvent.click(screen.getByText('Xịt thơm phòng sả chanh O-Zone'));
      expect(mockNavigate).toHaveBeenCalledWith('/search?q=s%E1%BA%A3%20chanh');
    });
  });

  describe('Recent Searches interactions and deduplication', () => {
    it('displays loaded recent searches and searches when a term is clicked', () => {
      store['recentSearches'] = JSON.stringify(['đuổi chuột', 'nước lau sàn']);
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);

      expect(screen.getByText('Tìm gần đây')).toBeInTheDocument();
      expect(screen.getByText('đuổi chuột')).toBeInTheDocument();
      expect(screen.getByText('nước lau sàn')).toBeInTheDocument();

      fireEvent.click(screen.getByText('đuổi chuột'));
      expect(mockNavigate).toHaveBeenCalledWith(
        '/search?q=%C4%91u%E1%BB%95i%20chu%E1%BB%99t',
      );
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'recentSearches',
        JSON.stringify(['đuổi chuột', 'nước lau sàn']),
      );
    });

    it('navigates on Enter and Space keydown, and ignores other keys or child targets', async () => {
      store['recentSearches'] = JSON.stringify(['xịt gián']);
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);

      const recentItem = screen
        .getByText('xịt gián')
        .closest('[role="button"]')!;
      const childSpan = screen.getByText('xịt gián');

      // Other key like Escape should not search
      fireEvent.keyDown(recentItem, { key: 'Escape' });
      expect(mockNavigate).not.toHaveBeenCalled();

      // Keydown on child target (event.target !== event.currentTarget) should return early
      fireEvent.keyDown(childSpan, { key: 'Enter' });
      expect(mockNavigate).not.toHaveBeenCalled();

      // Enter keydown searches
      fireEvent.keyDown(recentItem, { key: 'Enter' });
      expect(mockNavigate).toHaveBeenCalledWith(
        '/search?q=x%E1%BB%8Bt%20gi%C3%A1n',
      );

      // Reset query and re-focus to open suggestions again for Space keydown
      fireEvent.change(input, { target: { value: '' } });
      fireEvent.focus(input);
      await waitFor(() => {
        expect(screen.getByText('xịt gián')).toBeInTheDocument();
      });

      const reOpenedItem = screen
        .getByText('xịt gián')
        .closest('[role="button"]')!;
      mockNavigate.mockClear();

      // Space keydown searches
      fireEvent.keyDown(reOpenedItem, { key: ' ' });
      expect(mockNavigate).toHaveBeenCalledWith(
        '/search?q=x%E1%BB%8Bt%20gi%C3%A1n',
      );
    });

    it('removes item from recent searches when remove button is clicked and stops propagation', () => {
      store['recentSearches'] = JSON.stringify(['term1', 'term2']);
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      fireEvent.focus(input);

      const term1Element = screen.getByText('term1');
      const term1Row = term1Element.closest('[role="button"]')!;
      const removeBtn = term1Row.querySelector('button')!;

      fireEvent.click(removeBtn);

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(screen.queryByText('term1')).not.toBeInTheDocument();
      expect(screen.getByText('term2')).toBeInTheDocument();
      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'recentSearches',
        JSON.stringify(['term2']),
      );
    });

    it('deduplicates and limits recent searches to 5 items', () => {
      store['recentSearches'] = JSON.stringify(['1', '2', '3', '4', '5']);
      renderSearchBox();
      const input = screen.getByPlaceholderText(
        'Tìm chai xịt chuột, kiến gián, tẩy rửa, nước giặt...',
      );
      const form = input.closest('form')!;

      // Adding 6th item drops the oldest (5)
      fireEvent.change(input, { target: { value: '6' } });
      fireEvent.submit(form);

      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'recentSearches',
        JSON.stringify(['6', '1', '2', '3', '4']),
      );

      // Re-searching existing item moves it to index 0 without duplicates
      fireEvent.change(input, { target: { value: '3' } });
      fireEvent.submit(form);

      expect(Storage.prototype.setItem).toHaveBeenCalledWith(
        'recentSearches',
        JSON.stringify(['3', '6', '1', '2', '4']),
      );
    });
  });
});
