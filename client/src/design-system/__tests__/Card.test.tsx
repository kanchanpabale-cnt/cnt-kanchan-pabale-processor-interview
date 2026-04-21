import { render, screen } from '@testing-library/react';
import { Card, CardBody, CardHeader } from '../Card';

describe('Card primitives', () => {
  it('renders Card, CardHeader, CardBody with children', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
        <CardBody>Body</CardBody>
      </Card>,
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('passes className through', () => {
    const { container } = render(<Card className="my-card">hi</Card>);
    expect(container.firstChild).toHaveClass('my-card');
  });
});
