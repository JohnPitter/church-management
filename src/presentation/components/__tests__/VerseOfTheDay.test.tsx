import { render, screen } from '@testing-library/react';
import VerseOfTheDay from '../VerseOfTheDay';

const mockGetTodaysVerse = jest.fn();

jest.mock('../../../services/SimpleVerseService', () => ({
  simpleVerseService: {
    getTodaysVerse: () => mockGetTodaysVerse(),
  },
}));

describe('VerseOfTheDay', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renderiza estado de carregamento e depois o versiculo', async () => {
    mockGetTodaysVerse.mockReturnValue({
      text: 'Texto do versiculo',
      reference: 'João 3:16',
      version: 'NTLH',
    });

    render(<VerseOfTheDay />);

    expect(await screen.findByText('"Texto do versiculo"')).toBeInTheDocument();
    expect(screen.getByText('João 3:16 (NTLH)')).toBeInTheDocument();
  });

  it('usa fallback quando o carregamento falha', async () => {
    mockGetTodaysVerse.mockImplementationOnce(() => {
      throw new Error('boom');
    });

    render(<VerseOfTheDay />);

    expect(await screen.findByText(/João 3:16/)).toBeInTheDocument();
    expect(mockGetTodaysVerse).toHaveBeenCalledTimes(1);
  });
});
