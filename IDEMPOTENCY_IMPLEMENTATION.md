# Idempotency Implementation

## Problem
Users were creating duplicate orders by clicking "GET TOKEN" multiple times when they didn't see their token immediately, causing spam orders in the admin panel.

## Solution
Implemented an idempotency system using a unique key that ensures the same request can be retried multiple times without creating duplicate orders.

## How It Works

### 1. Frontend (Queue Page)
- When user clicks "Get My Token", a unique idempotency key is generated: `idem_${timestamp}_${random}`
- This key is stored in `localStorage` as `idempotencyKey`
- The key is sent with every join request in the `X-Idempotency-Key` header
- The same key is reused for retries until the user successfully joins or explicitly exits

### 2. Backend (Join API)
- Receives the idempotency key from request headers
- Checks if a ticket with this key already exists in the database
- If existing ticket found AND status is "waiting":
  - Returns the existing ticket (no duplicate created)
- If no ticket found OR existing ticket status is not "waiting":
  - Creates a new ticket and stores the idempotency key with it

### 3. Cleanup
The idempotency key is cleared from localStorage when:
- User's order status becomes "ready" (automatically redirects to served page)
- User manually exits the queue
- Admin deletes the ticket (detected by status page, which then clears the key)
- Ticket is not found (404 response)

## Benefits

1. **Prevents Duplicate Orders**: Multiple clicks on "Get My Token" won't create multiple tickets
2. **Network Resilience**: If the response is lost due to network issues, retrying with the same key returns the existing ticket
3. **User-Friendly**: Users can safely retry if they don't see immediate confirmation
4. **Admin Panel Clean**: No more spam orders from impatient users

## Example Scenarios

### Scenario 1: User Clicks Multiple Times
1. User clicks "Get My Token"
2. Request sent with key `idem_123_abc`
3. User clicks again (impatient)
4. Second request sent with same key `idem_123_abc`
5. First request creates ticket
6. Second request finds existing ticket and returns it
7. Result: Only ONE ticket created ✓

### Scenario 2: Network Timeout
1. User submits order
2. Backend creates ticket successfully
3. Network fails before response reaches user
4. User sees error, tries again
5. Same idempotency key sent
6. Backend finds existing ticket and returns it
7. User gets their ticket ID ✓

### Scenario 3: Admin Deletes Ticket
1. Admin deletes user's ticket
2. User still has idempotency key in localStorage
3. User tries to rejoin queue
4. Backend finds no ticket with that key (was deleted)
5. Creates new ticket (this is expected behavior)
6. Result: User can successfully rejoin ✓

## Implementation Files

- **Frontend**: `src/app/queue/page.jsx` - Generates and manages idempotency key
- **Backend**: `src/app/api/join/route.js` - Validates and enforces idempotency
- **Status Page**: `src/app/status/[id]/page.jsx` - Clears idempotency key when appropriate

## Technical Details

### Idempotency Key Format
```
idem_${Date.now()}_${Math.random().toString(36).substring(2, 15)}
```

### Storage
- **Client**: `localStorage.idempotencyKey`
- **Server**: Firestore ticket document field `idempotencyKey`

### Header
```
X-Idempotency-Key: idem_1234567890_abc123def456
```

### Database Query
```javascript
query(ticketsCol, where("idempotencyKey", "==", idempotencyKey))
```

## Testing Checklist

- [ ] Single submission creates one ticket
- [ ] Multiple rapid clicks create only one ticket
- [ ] Network retry returns existing ticket
- [ ] Admin deletion allows user to rejoin
- [ ] Order ready clears idempotency key
- [ ] Manual exit clears idempotency key
- [ ] Different users get different keys
- [ ] Same user on different days gets different keys (if desired)

