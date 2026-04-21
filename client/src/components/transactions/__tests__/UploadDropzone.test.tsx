import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadDropzone } from '../UploadDropzone';

describe('UploadDropzone', () => {
  it('triggers onFile with a CSV file', async () => {
    const user = userEvent.setup();
    const onFile = jest.fn();
    render(<UploadDropzone uploading={false} onFile={onFile} />);
    const input = document.querySelector('input[type="file"]') as HTMLInputElement;
    const file = new File(['hi'], 'data.csv', { type: 'text/csv' });
    await user.upload(input, file);
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('shows an error for unsupported extensions', () => {
    const onFile = jest.fn();
    const { container } = render(<UploadDropzone uploading={false} onFile={onFile} />);
    // Drop bypasses the <input accept="..."> filter, exercising our code path.
    const dropzone = container.firstChild as HTMLElement;
    const file = new File(['hi'], 'data.txt', { type: 'text/plain' });
    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(onFile).not.toHaveBeenCalled();
    expect(screen.getByText(/only \.csv, \.json, or \.xml/i)).toBeInTheDocument();
  });

  it('accepts a dropped JSON file', () => {
    const onFile = jest.fn();
    const { container } = render(<UploadDropzone uploading={false} onFile={onFile} />);
    const dropzone = container.firstChild as HTMLElement;
    const file = new File(['{}'], 'x.json', { type: 'application/json' });
    fireEvent.dragOver(dropzone);
    fireEvent.drop(dropzone, { dataTransfer: { files: [file] } });
    expect(onFile).toHaveBeenCalledWith(file);
  });

  it('shows "Processing…" when uploading', () => {
    render(<UploadDropzone uploading onFile={() => {}} />);
    expect(screen.getByRole('button', { name: /processing/i })).toBeInTheDocument();
  });
});
