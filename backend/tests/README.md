# Test Suite Documentation

This directory contains comprehensive test suites for the Vibes in Threads backend API.

## Test Structure

```
tests/
├── setup.ts                    # Global test configuration and database setup
├── helpers/
│   └── testData.ts             # Test data generators and utilities
├── unit/
│   ├── services/               # Service layer unit tests
│   │   ├── categoryService.test.ts
│   │   └── productService.test.ts
│   └── middleware/             # Middleware unit tests
│       ├── auth.test.ts
│       ├── validation.test.ts
│       └── errorHandler.test.ts
├── integration/                # API endpoint integration tests
│   ├── products.test.ts
│   └── categories.test.ts
└── simple.test.ts             # Basic functionality test
```

## Running Tests

### Available Scripts

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run with verbose output
npm run test:verbose

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration
```

### Manual Jest Commands

```bash
# Run specific test file
npx jest tests/unit/services/productService.test.ts

# Run tests matching pattern
npx jest --testNamePattern="should create product"

# Run with coverage for specific directory
npx jest tests/unit --coverage
```

## Test Environment

### Database
- Uses SQLite test database (`tests/test.db`)
- Database is reset between each test
- Schema is automatically applied from Prisma

### Authentication
- JWT tokens generated with test secret
- Mock users created for different roles (admin, staff, customer)

### Environment Variables
- `NODE_ENV=test`
- `JWT_SECRET=test-jwt-secret-key-for-testing`
- `DATABASE_URL=file:./tests/test.db`

## Test Categories

### Unit Tests
- **Services**: Test business logic in isolation
- **Middleware**: Test authentication, validation, and error handling
- **Utilities**: Test helper functions and utilities

### Integration Tests
- **API Endpoints**: Test complete request/response cycles
- **Authentication**: Test protected routes and authorization
- **Validation**: Test input validation and error responses

## Test Data

### Sample Data
- `sampleProducts`: Array of test product data
- `sampleCategories`: Array of test category data
- Test users with different roles

### Helper Functions
- `createTestCategory()`: Create test category in database
- `createTestProduct()`: Create test product in database
- `createTestUser()`: Create test user in database
- `generateJWTToken()`: Generate test JWT tokens

## Coverage

The test suite covers:
- ✅ **Service Layer**: All CRUD operations and business logic
- ✅ **API Endpoints**: All public and protected routes
- ✅ **Authentication**: JWT verification and role-based access
- ✅ **Validation**: Input validation and error handling
- ✅ **Error Handling**: Custom errors and Prisma errors
- ✅ **Middleware**: Auth, validation, and error middleware

## Writing New Tests

### Service Tests
```typescript
describe('ServiceName', () => {
  let prisma: PrismaClient;
  
  beforeAll(() => {
    prisma = global.__PRISMA__;
  });

  it('should perform operation', async () => {
    // Test implementation
  });
});
```

### API Tests
```typescript
describe('API Endpoint', () => {
  let adminToken: string;

  beforeEach(async () => {
    const user = await createTestUser(prisma, { role: 'admin' });
    adminToken = generateJWTToken({ id: user.id, role: user.role });
  });

  it('should handle request', async () => {
    const response = await request(app)
      .post('/api/v1/endpoint')
      .set('Authorization', `Bearer ${adminToken}`)
      .send(testData)
      .expect(200);
  });
});
```

### Middleware Tests
```typescript
describe('Middleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: NextFunction;

  beforeEach(() => {
    req = { /* mock request */ };
    res = { /* mock response */ };
    next = jest.fn();
  });

  it('should process request', () => {
    middleware(req as Request, res as Response, next);
    expect(next).toHaveBeenCalled();
  });
});
```

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure Prisma schema is up to date
2. **Authentication**: Check JWT_SECRET is set in test environment
3. **Timeouts**: Increase timeout in Jest config for slow operations
4. **Memory Leaks**: Use `forceExit: true` in Jest config

### Debug Commands
```bash
# Run with debug output
DEBUG=* npm test

# Run single test file with verbose logging
npx jest tests/unit/services/productService.test.ts --verbose

# Check test database
npx prisma studio --schema=prisma/schema.prisma
```