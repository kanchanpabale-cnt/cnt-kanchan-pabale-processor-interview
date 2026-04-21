import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { LoginPage } from '../LoginPage';
import { useAuthStore } from '../../store/auth.store';

jest.mock('../../actions/auth.actions', () => ({
  login: jest.fn(),
}));
import { login } from '../../actions/auth.actions';

const loginMock = login as jest.Mock;

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState({ token: null, user: null });
    loginMock.mockReset();
  });

  it('renders heading and form fields', () => {
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/work email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument();
  });

  it('on submit, calls login + sets session', async () => {
    const user = userEvent.setup();
    loginMock.mockResolvedValue({
      token: 't',
      user: { id: '1', email: 'admin@signapay.local', name: 'A', role: 'ADMIN' },
    });
    render(
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>,
    );
    await user.click(screen.getByRole('button', { name: /sign in/i }));
    await waitFor(() =>
      expect(loginMock).toHaveBeenCalledWith('admin@signapay.local', 'Admin123!'),
    );
    await waitFor(() => expect(useAuthStore.getState().token).toBe('t'));
  });
});
