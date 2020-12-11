import React from 'react';
import { render } from '@testing-library/react-native';
import App from '../App';

describe('App', () => {
  it('has default text', () => {
    const { getByText } = render(<App />);
    expect(getByText(/your app root/i)).toBeTruthy();
  });
});
