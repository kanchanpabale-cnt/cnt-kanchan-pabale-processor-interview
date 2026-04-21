import { render, screen } from '@testing-library/react';
import { TBody, TD, TH, THead, TR, Table } from '../Table';

describe('Table primitives', () => {
  it('renders table structure', () => {
    render(
      <Table>
        <THead>
          <TR>
            <TH>H1</TH>
          </TR>
        </THead>
        <TBody>
          <TR>
            <TD>cell</TD>
          </TR>
        </TBody>
      </Table>,
    );
    expect(screen.getByRole('columnheader', { name: 'H1' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'cell' })).toBeInTheDocument();
  });
});
