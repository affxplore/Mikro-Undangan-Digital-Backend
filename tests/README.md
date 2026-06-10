# Mikro Undangan - Testing Guide

## Running Tests

### Install Dependencies
```bash
npm install
```

### Run All Tests
```bash
npm test
```

### Run Tests in Watch Mode
```bash
npm run test:watch
```

### Run Tests with Coverage Report
```bash
npm run test:coverage
```

## Test Structure

```
tests/
├── unit/              # Unit tests (isolated component testing)
│   ├── models/        # Model tests
│   └── services/      # Service tests
├── integration/       # Integration tests (API endpoint testing)
├── fixtures/          # Test data
└── helpers.js         # Test utilities
```

## Writing Tests

### Unit Test Example

```javascript
import { describe, test, expect } from '@jest/globals';
import { createMockUser } from '../helpers.js';

describe('User Model', () => {
  test('should validate email correctly', () => {
    const user = createMockUser({ email: 'test@example.com' });
    expect(user.email).toBe('test@example.com');
  });
});
```

### Integration Test Example

```javascript
import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import app from '../../app.js';

describe('POST /api/v1/auth/login', () => {
  test('should return 200 on valid credentials', async () => {
    const response = await request(app)
      .post('/api/v1/auth/login')
      .send({ email: 'test@example.com', password: 'Test@1234' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Test Coverage Goals

- **Models**: 80%+ coverage
- **Controllers**: 70%+ coverage
- **Helpers**: 90%+ coverage
- **Middlewares**: 80%+ coverage

## Best Practices

1. **Isolation**: Each test should be independent
2. **Cleanup**: Always clean up test data after tests
3. **Descriptive Names**: Use clear test descriptions
4. **Arrange-Act-Assert**: Follow AAA pattern
5. **Mock External Services**: Don't make real API calls

## Running Specific Tests

```bash
# Run specific test file
npm test tests/unit/models/user.test.js

# Run tests matching pattern
npm test -- --testNamePattern="User Model"
```

## Debugging Tests

```bash
# Run with verbose output
npm test -- --verbose

# Run with detailed error messages
npm test -- --no-coverage
```

## CI/CD Integration

Tests will run automatically on:
- Push to main/develop branches
- Pull request creation
- Before deployment

## Resources

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
