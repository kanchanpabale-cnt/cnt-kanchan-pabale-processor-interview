import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select } from '../Select';

describe('Select', () => {
  it('renders options, label, and supports change events', async () => {
    const user = userEvent.setup();
    const fn = jest.fn();
    render(
      <Select label="Type" defaultValue="" onChange={fn}>
        <option value="">All</option>
        <option value="VISA">Visa</option>
      </Select>,
    );
    expect(screen.getByLabelText('Type')).toBeInTheDocument();
    await user.selectOptions(screen.getByLabelText('Type'), 'VISA');
    expect(fn).toHaveBeenCalled();
  });

  it('renders error message', () => {
    render(
      <Select label="Type" error="required">
        <option value="">All</option>
      </Select>,
    );
    expect(screen.getByText('required')).toBeInTheDocument();
  });

  it('renders without a label', () => {
    render(
      <Select>
        <option value="">x</option>
      </Select>,
    );
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });
});
