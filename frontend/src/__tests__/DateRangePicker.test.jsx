import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import DateRangePicker from '../components/DateRangePicker';

test('notifies when dates change', () => {
  const startSpy = jest.fn();
  const endSpy = jest.fn();
  const { getByLabelText } = render(<DateRangePicker startDate={null} endDate={null} onStartDateChange={startSpy} onEndDateChange={endSpy} />);
  fireEvent.change(getByLabelText(/start date/i), { target: { value: '2024-01-01' }});
  fireEvent.change(getByLabelText(/end date/i), { target: { value: '2024-01-02' }});
  expect(startSpy).toHaveBeenCalled();
  expect(endSpy).toHaveBeenCalled();
});
