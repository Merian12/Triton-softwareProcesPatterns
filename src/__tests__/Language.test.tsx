import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { LanguageProvider, LanguageSwitcher } from '@/components/LanguageProvider';
import InformationPage from '@/components/InformationPage';
import SiteFooter from '@/components/SiteFooter';
import LoginForm from '@/components/LoginForm';
import OrganizerDashboard from '@/components/organizer/OrganizerDashboard';
import { translate } from '@/lib/translations';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn(), replace: vi.fn() }) }));
vi.mock('@/lib/supabaseClient', () => ({ supabase: {} }));

describe('Site language and information', () => {
  it('switches login text and validation without losing form input and remembers the choice', async () => {
    const view = render(<LanguageProvider><LanguageSwitcher /><LoginForm /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Dansk' }));
    fireEvent.change(screen.getByLabelText('E-mail'), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: 'Log ind' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('Adgangskoden skal være på mindst 6 tegn.');
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByLabelText('Email')).toHaveValue('test@example.com');
    expect(screen.getByRole('alert')).toHaveTextContent('Password must be at least 6 characters.');
    expect(localStorage.getItem('triton-language')).toBe('en');
    expect(document.documentElement.lang).toBe('en');
    view.unmount();
    render(<LanguageProvider><LoginForm /></LanguageProvider>);
    expect(screen.getByRole('button', { name: 'Log In' })).toBeInTheDocument();
  });

  it('translates organizer navigation and event forms while retaining a draft and calendar locale', () => {
    vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    render(<LanguageProvider><LanguageSwitcher /><OrganizerDashboard profile={{ id: 'o1', email: 'organizer@example.com', role: 'organizer' }} onLogout={vi.fn()} /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Dansk' }));
    expect(screen.getByRole('button', { name: 'Mine vagter' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Forrige måned' })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: '+ Opret event' }));
    fireEvent.change(screen.getByLabelText('Navn'), { target: { value: 'Mit event' } });
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByLabelText('Name')).toHaveValue('Mit event');
    expect(screen.getByRole('button', { name: 'Save draft' })).toBeInTheDocument();
  });

  it('shows the parental permission requirement in both languages without a rule for older children', () => {
    render(<LanguageProvider><LanguageSwitcher /><InformationPage topic="faq" /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Dansk' }));
    expect(screen.getByText(/Børn under 15 år skal registreres af en forælder/)).toHaveTextContent('give barnet rettigheder til selv at tilmelde sig events');
    expect(screen.queryByText(/over 15 år/)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'English' }));
    expect(screen.getByText(/Children under 15 must be registered by a parent/)).toHaveTextContent('permission to sign up for events');
  });

  it('links to public information pages from the footer', () => {
    render(<LanguageProvider><SiteFooter /></LanguageProvider>);
    fireEvent.click(screen.getByRole('button', { name: 'Dansk' }));
    for (const [name, href] of [['Ofte stillede spørgsmål', '/faq'], ['Om Triton', '/about'], ['Kontakt', '/contact'], ['Hjælp og vejledning', '/help']]) {
      expect(screen.getByRole('link', { name })).toHaveAttribute('href', href);
    }
  });

  it('translates interpolation and stored errors without translating inserted user content', () => {
    expect(translate('da', 'Edit {value0}', { value0: 'My event' })).toBe('Rediger My event');
    expect(translate('da', 'There are already 3 volunteers signed up. Capacity cannot be lower.')).toBe('Der er allerede 3 frivillige tilmeldt. Antallet af pladser kan ikke være lavere.');
    expect(translate('en', '{value0} places available', { value0: 2 })).toBe('2 places available');
  });
});
