# DevotionalService Test Suite

## Overview
Comprehensive unit tests for the DevotionalService, covering all CRUD operations, engagement features, filtering, and statistics.

## Coverage
- **Statements**: 98.51%
- **Branches**: 96.34%
- **Functions**: 93.93%
- **Lines**: 98.44%

## Test Structure

### CRUD Operations
- ✅ Create devotionals with validation
- ✅ Update devotionals with timestamp conversion
- ✅ Delete devotionals
- ✅ Get single devotional by ID
- ✅ Get devotionals list with filtering
- ✅ Get today's devotional

### Filtering & Search
- ✅ Filter by published status
- ✅ Filter by category
- ✅ Filter by author
- ✅ Filter by date range
- ✅ Pagination support

### Engagement Features
- ✅ Increment view count
- ✅ Toggle likes (add/remove)
- ✅ Toggle bookmarks (add/remove)

### Categories
- ✅ Create devotional categories
- ✅ Get active categories

### Comments
- ✅ Create comments (auto-unapproved)
- ✅ Get comments (approved/all)
- ✅ Approve comments

### User Progress
- ✅ Mark devotional as read
- ✅ Create/update progress documents
- ✅ Get user progress by devotional

### Plans
- ✅ Create devotional plans
- ✅ Subscribe users to plans
- ✅ Get active/all plans

### Statistics
- ✅ Calculate comprehensive devotional stats
- ✅ Top categories by usage
- ✅ Recent devotionals

### Error Handling
- ✅ Firebase operation failures
- ✅ Not found scenarios
- ✅ Invalid data handling

## Test Files
- `DevotionalService.test.ts` - Main test suite (58 tests)

## Running Tests

### Run all tests
```bash
npm test -- src/modules/church-management/devotionals/application/services/__tests__/DevotionalService.test.ts --watchAll=false
```

### Run with coverage
```bash
npm test -- src/modules/church-management/devotionals/application/services/__tests__/DevotionalService.test.ts --watchAll=false --coverage
```

### Run in watch mode
```bash
npm test -- src/modules/church-management/devotionals/application/services/__tests__/DevotionalService.test.ts
```

## Test Approach

### Mocking Strategy
- Firebase Firestore functions are mocked using Jest
- Mock data factories for consistent test data
- Timestamp conversion handled in mocks

### Test Data Factories
- `createTestCategory()` - Creates sample category
- `createTestDevotional()` - Creates sample devotional
- `createTestComment()` - Creates sample comment
- `createTestProgress()` - Creates sample user progress
- `createTestPlan()` - Creates sample devotional plan

### Helper Functions
- `mockFirestoreDoc()` - Mocks Firestore document
- `mockFirestoreSnapshot()` - Mocks Firestore query snapshot

## Key Testing Patterns

### 1. Service Method Testing
Each service method is tested for:
- Success scenarios
- Error scenarios
- Edge cases
- Data validation

### 2. Firebase Mock Verification
Tests verify:
- Correct Firebase functions are called
- Proper arguments are passed
- Timestamps are converted correctly
- Server-side values are used

### 3. Business Logic Validation
Tests ensure:
- Default values are set (viewCount, likes, bookmarks)
- Status fields are initialized correctly
- Relationships are maintained

## Notes

### Uncovered Lines
- Line 159: Edge case in query building
- Line 465: Rare category count scenario
- Line 471: Edge case in recent devotionals sorting

These lines represent edge cases that would require complex integration test scenarios.

### Test Isolation
- Each test is isolated with `beforeEach()` clearing mocks
- Console methods are mocked to reduce test noise
- No shared state between tests

### Future Improvements
- Add integration tests with Firebase emulator
- Add performance tests for large datasets
- Add concurrent operation tests
- Test rate limiting scenarios
