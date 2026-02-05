// Unit Tests - PageHeader Component
// Comprehensive tests for the page header component

import React from 'react';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '../PageHeader';

describe('PageHeader', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      render(<PageHeader title="Test Title" />);
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });

    it('should render the title', () => {
      render(<PageHeader title="Dashboard" />);
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
    });

    it('should render as a div container', () => {
      const { container } = render(<PageHeader title="Test" />);
      expect(container.firstChild).toBeInstanceOf(HTMLDivElement);
    });
  });

  describe('Title Prop', () => {
    it('should display the title text', () => {
      render(<PageHeader title="Members Management" />);
      expect(screen.getByText('Members Management')).toBeInTheDocument();
    });

    it('should render title in h1 element', () => {
      render(<PageHeader title="Page Title" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should handle long title', () => {
      const longTitle = 'This is a very long page title that might need special handling in the layout';
      render(<PageHeader title={longTitle} />);
      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    it('should handle empty title', () => {
      render(<PageHeader title="" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
      expect(heading.textContent).toBe('');
    });

    it('should handle title with special characters', () => {
      const specialTitle = 'Members & Events <Overview>';
      render(<PageHeader title={specialTitle} />);
      expect(screen.getByText(specialTitle)).toBeInTheDocument();
    });
  });

  describe('Subtitle Prop', () => {
    it('should not render subtitle when not provided', () => {
      const { container } = render(<PageHeader title="Title" />);
      const subtitle = container.querySelector('.text-lg.text-gray-600');
      expect(subtitle).not.toBeInTheDocument();
    });

    it('should render subtitle when provided', () => {
      render(<PageHeader title="Title" subtitle="This is a subtitle" />);
      expect(screen.getByText('This is a subtitle')).toBeInTheDocument();
    });

    it('should render subtitle in p element', () => {
      render(<PageHeader title="Title" subtitle="Subtitle text" />);
      const subtitle = screen.getByText('Subtitle text');
      expect(subtitle.tagName).toBe('P');
    });

    it('should handle long subtitle', () => {
      const longSubtitle = 'This is a very long subtitle that provides additional context about the page and its contents.';
      render(<PageHeader title="Title" subtitle={longSubtitle} />);
      expect(screen.getByText(longSubtitle)).toBeInTheDocument();
    });

    it('should handle empty subtitle', () => {
      const { container } = render(<PageHeader title="Title" subtitle="" />);
      // Empty subtitle should not render the p element due to conditional rendering
      const subtitle = container.querySelector('p.text-lg.text-gray-600');
      // If subtitle is empty string, it's falsy and won't render
      expect(subtitle).not.toBeInTheDocument();
    });
  });

  describe('Action Prop', () => {
    it('should not render action area when not provided', () => {
      const { container } = render(<PageHeader title="Title" />);
      const actionArea = container.querySelector('.flex-shrink-0');
      expect(actionArea).not.toBeInTheDocument();
    });

    it('should render action when provided', () => {
      render(
        <PageHeader
          title="Title"
          action={<button data-testid="action-button">Add New</button>}
        />
      );
      expect(screen.getByTestId('action-button')).toBeInTheDocument();
    });

    it('should render button as action', () => {
      render(
        <PageHeader
          title="Title"
          action={<button>Create</button>}
        />
      );
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });

    it('should render multiple buttons as action', () => {
      render(
        <PageHeader
          title="Title"
          action={
            <div>
              <button>Edit</button>
              <button>Delete</button>
            </div>
          }
        />
      );
      expect(screen.getByRole('button', { name: 'Edit' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
    });

    it('should render link as action', () => {
      render(
        <PageHeader
          title="Title"
          action={<a href="/create">Create New</a>}
        />
      );
      expect(screen.getByRole('link', { name: 'Create New' })).toBeInTheDocument();
    });

    it('should render complex action component', () => {
      render(
        <PageHeader
          title="Title"
          action={
            <div data-testid="complex-action">
              <span>Status: Active</span>
              <button>Edit</button>
            </div>
          }
        />
      );
      expect(screen.getByTestId('complex-action')).toBeInTheDocument();
      expect(screen.getByText('Status: Active')).toBeInTheDocument();
    });
  });

  describe('Breadcrumbs Prop', () => {
    it('should not render breadcrumbs when not provided', () => {
      const { container } = render(<PageHeader title="Title" />);
      const nav = container.querySelector('nav');
      expect(nav).not.toBeInTheDocument();
    });

    it('should not render breadcrumbs when empty array', () => {
      const { container } = render(<PageHeader title="Title" breadcrumbs={[]} />);
      const nav = container.querySelector('nav');
      expect(nav).not.toBeInTheDocument();
    });

    it('should render single breadcrumb', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[{ label: 'Home' }]}
        />
      );
      expect(screen.getByText('Home')).toBeInTheDocument();
    });

    it('should render multiple breadcrumbs', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Home' },
            { label: 'Members' },
            { label: 'Details' }
          ]}
        />
      );
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Members')).toBeInTheDocument();
      expect(screen.getByText('Details')).toBeInTheDocument();
    });

    it('should render breadcrumb with link when href is provided', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Members', href: '/members' }
          ]}
        />
      );
      const homeLink = screen.getByRole('link', { name: 'Home' });
      const membersLink = screen.getByRole('link', { name: 'Members' });

      expect(homeLink).toHaveAttribute('href', '/');
      expect(membersLink).toHaveAttribute('href', '/members');
    });

    it('should render breadcrumb without link when href is not provided', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Current Page' }
          ]}
        />
      );
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.queryByRole('link', { name: 'Current Page' })).not.toBeInTheDocument();
      expect(screen.getByText('Current Page')).toBeInTheDocument();
    });

    it('should render separator between breadcrumbs', () => {
      const { container } = render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Home' },
            { label: 'Members' },
            { label: 'Details' }
          ]}
        />
      );
      // Separators should be between items (n-1 separators for n items)
      const separators = container.querySelectorAll('svg.w-4.h-4');
      expect(separators.length).toBe(2);
    });

    it('should render breadcrumbs in a nav element', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[{ label: 'Home' }]}
        />
      );
      const nav = screen.getByRole('navigation');
      expect(nav).toBeInTheDocument();
    });

    it('should render breadcrumbs in an ordered list', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Home' },
            { label: 'Members' }
          ]}
        />
      );
      const list = screen.getByRole('list');
      expect(list).toBeInTheDocument();
      expect(list.tagName).toBe('OL');
    });

    it('should style last breadcrumb differently', () => {
      const { container } = render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Home' },
            { label: 'Current Page' }
          ]}
        />
      );
      const lastBreadcrumb = screen.getByText('Current Page');
      expect(lastBreadcrumb).toHaveClass('text-gray-900');
      expect(lastBreadcrumb).toHaveClass('font-medium');
    });
  });

  describe('Styling', () => {
    it('should have margin bottom on container', () => {
      const { container } = render(<PageHeader title="Title" />);
      expect(container.firstChild).toHaveClass('mb-8');
    });

    it('should have proper title styling', () => {
      render(<PageHeader title="Title" />);
      const title = screen.getByRole('heading', { level: 1 });
      expect(title).toHaveClass('text-3xl');
      expect(title).toHaveClass('font-bold');
      expect(title).toHaveClass('text-gray-900');
    });

    it('should have proper subtitle styling', () => {
      render(<PageHeader title="Title" subtitle="Subtitle" />);
      const subtitle = screen.getByText('Subtitle');
      expect(subtitle).toHaveClass('text-lg');
      expect(subtitle).toHaveClass('text-gray-600');
      expect(subtitle).toHaveClass('mt-2');
    });

    it('should have flexbox layout for header content', () => {
      const { container } = render(
        <PageHeader title="Title" action={<button>Action</button>} />
      );
      const headerContent = container.querySelector('.flex.items-center.justify-between');
      expect(headerContent).toBeInTheDocument();
    });

    it('should have proper breadcrumb styling', () => {
      const { container } = render(
        <PageHeader
          title="Title"
          breadcrumbs={[{ label: 'Home' }]}
        />
      );
      const nav = container.querySelector('nav');
      expect(nav).toHaveClass('mb-4');
    });

    it('should have proper breadcrumb list styling', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[{ label: 'Home' }]}
        />
      );
      const list = screen.getByRole('list');
      expect(list).toHaveClass('flex');
      expect(list).toHaveClass('items-center');
      expect(list).toHaveClass('space-x-2');
      expect(list).toHaveClass('text-sm');
      expect(list).toHaveClass('text-gray-500');
    });

    it('should have hover styling on breadcrumb links', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[{ label: 'Home', href: '/' }]}
        />
      );
      const link = screen.getByRole('link', { name: 'Home' });
      expect(link).toHaveClass('hover:text-gray-700');
      expect(link).toHaveClass('transition-colors');
    });
  });

  describe('Combined Props', () => {
    it('should render all props together', () => {
      render(
        <PageHeader
          title="Members"
          subtitle="Manage church members"
          action={<button>Add Member</button>}
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Members' }
          ]}
        />
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Members');
      expect(screen.getByText('Manage church members')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add Member' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Home' })).toBeInTheDocument();
      expect(screen.getByText('Members')).toBeInTheDocument();
    });

    it('should layout correctly with all props', () => {
      const { container } = render(
        <PageHeader
          title="Page Title"
          subtitle="Page description"
          action={<button>Action</button>}
          breadcrumbs={[{ label: 'Home', href: '/' }]}
        />
      );

      // Breadcrumbs should be at top
      const nav = container.querySelector('nav');
      expect(nav).toBeInTheDocument();

      // Header content should be below breadcrumbs
      const headerContent = container.querySelector('.flex.items-center.justify-between');
      expect(headerContent).toBeInTheDocument();
    });
  });

  describe('Breadcrumb Navigation', () => {
    it('should render list items for each breadcrumb', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'First' },
            { label: 'Second' },
            { label: 'Third' }
          ]}
        />
      );
      const listItems = screen.getAllByRole('listitem');
      expect(listItems).toHaveLength(3);
    });

    it('should have proper flex layout on list items', () => {
      const { container } = render(
        <PageHeader
          title="Title"
          breadcrumbs={[{ label: 'Home' }]}
        />
      );
      const listItem = container.querySelector('li');
      expect(listItem).toHaveClass('flex');
      expect(listItem).toHaveClass('items-center');
    });

    it('should not render separator before first breadcrumb', () => {
      const { container } = render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Home' },
            { label: 'Members' }
          ]}
        />
      );
      const listItems = container.querySelectorAll('li');
      // First list item should not have separator SVG as first child
      const firstItemSvg = listItems[0].querySelector('svg.mx-2');
      expect(firstItemSvg).not.toBeInTheDocument();
    });

    it('should render separator with proper styling', () => {
      const { container } = render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Home' },
            { label: 'Members' }
          ]}
        />
      );
      const separator = container.querySelector('svg.w-4.h-4.mx-2');
      expect(separator).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle re-renders correctly', () => {
      const { rerender } = render(<PageHeader title="Initial" />);
      expect(screen.getByText('Initial')).toBeInTheDocument();

      rerender(<PageHeader title="Updated" />);
      expect(screen.getByText('Updated')).toBeInTheDocument();
      expect(screen.queryByText('Initial')).not.toBeInTheDocument();
    });

    it('should handle adding breadcrumbs after initial render', () => {
      const { container, rerender } = render(<PageHeader title="Title" />);
      expect(container.querySelector('nav')).not.toBeInTheDocument();

      rerender(
        <PageHeader
          title="Title"
          breadcrumbs={[{ label: 'Home' }]}
        />
      );
      expect(container.querySelector('nav')).toBeInTheDocument();
    });

    it('should handle removing breadcrumbs after initial render', () => {
      const { container, rerender } = render(
        <PageHeader
          title="Title"
          breadcrumbs={[{ label: 'Home' }]}
        />
      );
      expect(container.querySelector('nav')).toBeInTheDocument();

      rerender(<PageHeader title="Title" />);
      expect(container.querySelector('nav')).not.toBeInTheDocument();
    });

    it('should handle changing action after initial render', () => {
      const { rerender } = render(
        <PageHeader
          title="Title"
          action={<button>Old Action</button>}
        />
      );
      expect(screen.getByRole('button', { name: 'Old Action' })).toBeInTheDocument();

      rerender(
        <PageHeader
          title="Title"
          action={<button>New Action</button>}
        />
      );
      expect(screen.getByRole('button', { name: 'New Action' })).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Old Action' })).not.toBeInTheDocument();
    });

    it('should handle multiple page headers on same page', () => {
      render(
        <div>
          <PageHeader title="Header 1" />
          <PageHeader title="Header 2" />
        </div>
      );

      const headings = screen.getAllByRole('heading', { level: 1 });
      expect(headings).toHaveLength(2);
      expect(headings[0]).toHaveTextContent('Header 1');
      expect(headings[1]).toHaveTextContent('Header 2');
    });

    it('should handle undefined breadcrumbs', () => {
      const { container } = render(
        <PageHeader title="Title" breadcrumbs={undefined} />
      );
      expect(container.querySelector('nav')).not.toBeInTheDocument();
    });

    it('should handle null action', () => {
      const { container } = render(
        <PageHeader title="Title" action={null} />
      );
      expect(container.querySelector('.flex-shrink-0')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should use semantic heading for title', () => {
      render(<PageHeader title="Accessible Title" />);
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toBeInTheDocument();
    });

    it('should have navigation landmark for breadcrumbs', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[{ label: 'Home' }]}
        />
      );
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });

    it('should have list structure for breadcrumbs', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Home' },
            { label: 'Members' }
          ]}
        />
      );
      expect(screen.getByRole('list')).toBeInTheDocument();
      expect(screen.getAllByRole('listitem')).toHaveLength(2);
    });

    it('should have accessible links in breadcrumbs', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Home', href: '/' },
            { label: 'Members', href: '/members' }
          ]}
        />
      );
      const links = screen.getAllByRole('link');
      expect(links).toHaveLength(2);
      links.forEach(link => {
        expect(link).toHaveAttribute('href');
      });
    });
  });

  describe('Content Types', () => {
    it('should handle title with numbers', () => {
      render(<PageHeader title="Member #1234" />);
      expect(screen.getByText('Member #1234')).toBeInTheDocument();
    });

    it('should handle title in Portuguese', () => {
      render(<PageHeader title="Gerenciamento de Membros" />);
      expect(screen.getByText('Gerenciamento de Membros')).toBeInTheDocument();
    });

    it('should handle breadcrumb labels in Portuguese', () => {
      render(
        <PageHeader
          title="Title"
          breadcrumbs={[
            { label: 'Inicio', href: '/' },
            { label: 'Membros' }
          ]}
        />
      );
      expect(screen.getByText('Inicio')).toBeInTheDocument();
      expect(screen.getByText('Membros')).toBeInTheDocument();
    });

    it('should handle action with icon and text', () => {
      render(
        <PageHeader
          title="Title"
          action={
            <button>
              <span>+</span>
              <span>Add New</span>
            </button>
          }
        />
      );
      expect(screen.getByText('+')).toBeInTheDocument();
      expect(screen.getByText('Add New')).toBeInTheDocument();
    });
  });
});
