// Jest DOM extended matchers
// Adds custom jest matchers for asserting on DOM nodes.
// Learn more: https://github.com/testing-library/jest-dom

import '@testing-library/jest-dom';

// Mock window.alert to prevent "Not implemented: window.alert" errors in tests
global.alert = jest.fn();

// Mock window.confirm if needed
global.confirm = jest.fn(() => true);

// Mock window.prompt if needed
global.prompt = jest.fn();
