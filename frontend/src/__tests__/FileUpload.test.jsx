import { render, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import FileUpload from '../components/FileUpload';

test('calls onFileSelect when file chosen', () => {
  const handleSelect = jest.fn();
  const { getByLabelText } = render(<FileUpload onFileSelect={handleSelect} />);
  const input = getByLabelText(/upload a file/i);
  const file = new File(['data'], 'test.xlsx', { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  fireEvent.change(input, { target: { files: [file] } });
  expect(handleSelect).toHaveBeenCalledTimes(1);
});
