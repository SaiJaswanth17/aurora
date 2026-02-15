# Implementation Plan: WebSocket Enhancements

## Overview

This implementation plan breaks down the WebSocket enhancements into discrete coding tasks that build incrementally. The approach prioritizes authentication and core infrastructure first, then adds features layer by layer, with property-based tests integrated throughout to catch errors early.

## Tasks

- [ ] 1. Set up authentication layer and connection security
  - [ ] 1.1 Implement AuthenticationLayer interface with token validation
    - Create `AuthenticationLayer` class with `validateToken()`, `isTokenExpired()`, and `requireAuth()` methods
    - Integrate with existing auth token verification system
    - Define `AuthError` types for invalid, expired, and missing tokens
    - _Requirements: 1.1, 1.2, 1.4, 1.5_
  
  - [ ]* 1.2 Write property test for authentication enforcement
    - **Property 1: Unauthenticated connections are rejected**
    - **Validates: Requirements 1.1, 1.3**
  
  - [ ]* 1.3 Write property test for auth error handling
    - **Property 2: Auth failures send error before closing**
    - **Validates: Requirements 1.2, 1.4**
  
  - [ ]* 1.4 Write property test for auth validation order
    - **Property 3: Auth validation precedes message processing**
    - **Validates: Requirements 1.5**
  
  - [ ]* 1.5 Write unit tests for authentication edge cases
    - Test specific token formats (JWT, opaque tokens)
    - Test error message content
    - Test connection close timing
    - _Requirements: 1.1, 1.2, 1.4_

- [ ] 2. Implement rate limiting with sliding window algorithm
  - [ ] 2.1 Create RateLimiter class with sliding window tracking
    - Implement `checkLimit()`, `recordMessage()`, and `getRetryAfter()` methods
    - Use in-memory store with timestamp arrays per user
    - Support configurable limits via `RateLimitConfig`
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_
  
  - [ ]* 2.2 Write property test for rate limit enforcement
    - **Property 17: Sliding window rate limit enforcement**
    - **Validates: Requirements 6.2, 6.3**
  
  - [ ]* 2.3 Write property test for retry-after accuracy
    - **Property 18: Rate limit error includes retry-after**
    - **Validates: Requirements 6.4**
  
  - [ ]* 2.4 Write property test for rate limit configuration
    - **Property 19: Rate limit configuration override**
    - **Validates: Requirements 6.5**
  
  - [ ]* 2.5 Write unit tests for rate limiting boundaries
    - Test exact 10th vs 11th message boundary
    - Test retry-after calculation accuracy
    - Test window expiration
    - _Requirements: 6.1, 6.2, 6.4_

- [ ] 3. Build connection manager with subscription tracking
  - [ ] 3.1 Implement ConnectionManager with subscription indexes
    - Create `SubscriptionIndex` data structure with bidirectional maps
    - Implement `registerConnection()`, `removeConnection()`, `joinChannel()`, `leaveChannel()`, `joinConversation()`, `leaveConversation()`
    - Implement `getConnectionsInScope()` for broadcast scope resolution
    - Support multiple connections per user
    - _Requirements: 3.4, 3.5, 5.1, 5.2, 5.4_
  
  - [ ]* 3.2 Write property test for subscription index consistency
    - **Property 8: Subscription index consistency**
    - **Validates: Requirements 3.4, 3.5**
  
  - [ ]* 3.3 Write property test for join functionality
    - **Property 14: Join enables message receipt**
    - **Validates: Requirements 5.1, 5.3**
  
  - [ ]* 3.4 Write property test for leave functionality
    - **Property 15: Leave and disconnect prevent message receipt**
    - **Validates: Requirements 5.2, 5.4**
  
  - [ ]* 3.5 Write unit tests for connection manager edge cases
    - Test multiple connections per user
    - Test cleanup on disconnect
    - Test empty subscriber lists
    - _Requirements: 5.1, 5.2, 5.4_

- [ ] 4. Checkpoint - Ensure core infrastructure tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 5. Implement message router with scoped broadcasting
  - [ ] 5.1 Create MessageRouter class with scope resolution
    - Implement `routeMessage()`, `routePresenceUpdate()`, `routeMessageEdit()`, `routeMessageDelete()`
    - Implement `resolveBroadcastScope()` using ConnectionManager indexes
    - Define message type interfaces: `ChannelMessage`, `ConversationMessage`, `MessageEdit`, `MessageDelete`
    - Ensure deduplication when users share multiple contexts
    - _Requirements: 3.1, 3.2, 3.3, 7.2, 7.4, 7.5_
  
  - [ ]* 5.2 Write property test for scoped delivery
    - **Property 7: Presence updates use scoped delivery**
    - **Validates: Requirements 3.1, 3.2, 3.3**
  
  - [ ]* 5.3 Write property test for message mutation broadcast
    - **Property 21: Message mutation broadcast completeness**
    - **Validates: Requirements 7.2, 7.4, 7.5**
  
  - [ ]* 5.4 Write unit tests for message routing scenarios
    - Test specific channel/conversation scenarios
    - Test empty subscriber lists
    - Test message ID inclusion in mutations
    - _Requirements: 3.1, 3.2, 7.5_

- [ ] 6. Implement presence handler with configurable timeouts
  - [ ] 6.1 Create PresenceHandler class with timeout management
    - Implement `recordTyping()`, `clearTyping()`, `getTypingUsers()`
    - Use timeout mechanism to auto-clear typing indicators
    - Support configurable timeout via `PresenceConfig`
    - Reset timeout on subsequent typing events
    - Broadcast typing_stop when timeout expires
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_
  
  - [ ]* 6.2 Write property test for typing indicator persistence
    - **Property 4: Typing indicators persist for configured duration**
    - **Validates: Requirements 2.1, 2.5**
  
  - [ ]* 6.3 Write property test for timeout reset
    - **Property 5: Typing indicator timeout reset**
    - **Validates: Requirements 2.3**
  
  - [ ]* 6.4 Write property test for stop event broadcast
    - **Property 6: Typing timeout expiration broadcasts stop event**
    - **Validates: Requirements 2.4**
  
  - [ ]* 6.5 Write unit tests for presence handler specifics
    - Test default 10-second timeout
    - Test concurrent typing from multiple users
    - Test typing state per user per channel
    - _Requirements: 2.2, 2.3, 2.4_

- [ ] 7. Build pagination service with cursor-based navigation
  - [ ] 7.1 Implement PaginationService with cursor logic
    - Create `getChannelMessages()` and `getConversationMessages()` methods
    - Implement cursor-based queries with 50-message page size
    - Support forward and backward pagination
    - Return `PaginatedMessages` with `nextCursor` and `hasMore` flag
    - Use indexed queries on (channelId/conversationId, timestamp)
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_
  
  - [ ]* 7.2 Write property test for page size enforcement
    - **Property 9: Page size limit enforcement**
    - **Validates: Requirements 4.1**
  
  - [ ]* 7.3 Write property test for cursor presence
    - **Property 10: Cursor presence in paginated responses**
    - **Validates: Requirements 4.2**
  
  - [ ]* 7.4 Write property test for pagination continuity
    - **Property 11: Pagination continuity**
    - **Validates: Requirements 4.3**
  
  - [ ]* 7.5 Write property test for end-of-pagination signaling
    - **Property 12: End-of-pagination signaling**
    - **Validates: Requirements 4.4**
  
  - [ ]* 7.6 Write property test for bidirectional pagination
    - **Property 13: Bidirectional pagination support**
    - **Validates: Requirements 4.5**
  
  - [ ]* 7.7 Write unit tests for pagination edge cases
    - Test empty message history
    - Test single page of messages
    - Test last page detection
    - _Requirements: 4.1, 4.4_

- [ ] 8. Add message mutation handlers with authorization
  - [ ] 8.1 Implement message edit and delete handlers in MessageRouter
    - Add ownership validation for edits
    - Add ownership/moderator validation for deletes
    - Integrate with MessageRouter for broadcasting
    - Include original message ID in all mutation events
    - _Requirements: 7.1, 7.3, 7.5_
  
  - [ ]* 8.2 Write property test for mutation authorization
    - **Property 20: Message mutation authorization**
    - **Validates: Requirements 7.1, 7.3**
  
  - [ ]* 8.3 Write unit tests for mutation authorization scenarios
    - Test non-owner edit rejection
    - Test non-owner/non-moderator delete rejection
    - Test moderator delete permission
    - _Requirements: 7.1, 7.3_

- [ ] 9. Implement conversation join authorization
  - [ ] 9.1 Add permission validation to ConnectionManager.joinConversation()
    - Check user permissions before adding to subscriber list
    - Return authorization error for unauthorized joins
    - _Requirements: 5.5_
  
  - [ ]* 9.2 Write property test for join authorization
    - **Property 16: Join authorization enforcement**
    - **Validates: Requirements 5.5**
  
  - [ ]* 9.3 Write unit tests for authorization edge cases
    - Test unauthorized join rejection
    - Test authorized join success
    - Test permission changes during active subscription
    - _Requirements: 5.5_

- [ ] 10. Checkpoint - Ensure all server-side tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 11. Implement WebSocket client with reconnection strategy
  - [ ] 11.1 Create WebSocketClient class with connection management
    - Implement `connect()`, `send()`, `disconnect()`, `handleDisconnect()`
    - Track connection state and metadata
    - Store active channels and conversations for state recovery
    - _Requirements: 8.1, 8.4_
  
  - [ ] 11.2 Implement ReconnectionStrategy with exponential backoff
    - Create `reconnect()`, `getNextDelay()`, `resetBackoff()` methods
    - Use exponential backoff: delay = baseDelay × (multiplier ^ attemptNumber)
    - Support configurable max attempts (default 5)
    - Track connection duration for backoff reset (30 seconds)
    - _Requirements: 8.1, 8.2, 8.3, 8.6_
  
  - [ ] 11.3 Implement state recovery on successful reconnection
    - Re-authenticate with stored auth token
    - Rejoin all previous channels
    - Rejoin all previous conversations
    - _Requirements: 8.4_
  
  - [ ] 11.4 Add failure notification and manual reconnect
    - Emit `reconnection_failed` event after max attempts
    - Provide manual reconnect method
    - Display user notification with reconnect button
    - _Requirements: 8.5_
  
  - [ ]* 11.5 Write property test for automatic reconnection
    - **Property 22: Automatic reconnection on disconnect**
    - **Validates: Requirements 8.1**
  
  - [ ]* 11.6 Write property test for exponential backoff
    - **Property 23: Exponential backoff progression**
    - **Validates: Requirements 8.2**
  
  - [ ]* 11.7 Write property test for state recovery
    - **Property 24: State recovery on successful reconnection**
    - **Validates: Requirements 8.4**
  
  - [ ]* 11.8 Write property test for failure notification
    - **Property 25: Failure notification after exhausted attempts**
    - **Validates: Requirements 8.5**
  
  - [ ]* 11.9 Write property test for backoff reset
    - **Property 26: Backoff reset after stable connection**
    - **Validates: Requirements 8.6**
  
  - [ ]* 11.10 Write unit tests for reconnection specifics
    - Test max 5 attempts
    - Test 30-second stability threshold
    - Test manual reconnect UI
    - _Requirements: 8.3, 8.5, 8.6_

- [ ] 12. Wire all components together in WebSocket server
  - [ ] 12.1 Integrate authentication layer into WebSocket connection handler
    - Validate auth token on connection handshake
    - Store userId with connection metadata
    - Require auth before processing any message
    - _Requirements: 1.1, 1.5_
  
  - [ ] 12.2 Integrate rate limiter into message processing pipeline
    - Check rate limit before routing messages
    - Return rate limit errors with retry-after
    - _Requirements: 6.2, 6.4_
  
  - [ ] 12.3 Wire ConnectionManager, MessageRouter, and PresenceHandler
    - Route all messages through MessageRouter
    - Use ConnectionManager for scope resolution
    - Integrate PresenceHandler for typing indicators
    - _Requirements: 3.1, 3.2, 2.1_
  
  - [ ] 12.4 Add WebSocket event handlers for all message types
    - Handle channel messages, conversation messages
    - Handle join/leave channel events
    - Handle join/leave conversation events
    - Handle typing indicator events
    - Handle message edit/delete events
    - Handle pagination requests
    - _Requirements: 4.1, 5.1, 5.2, 7.1, 7.3_
  
  - [ ]* 12.5 Write integration tests for end-to-end flows
    - Test complete message flow: auth → rate limit → route → deliver
    - Test join → message → receive flow
    - Test edit/delete → broadcast flow
    - Test pagination → cursor → next page flow
    - _Requirements: 1.5, 4.3, 5.1, 7.2_

- [ ] 13. Add error handling for all failure scenarios
  - [ ] 13.1 Implement error response formatting
    - Create error response types for all error codes
    - Include appropriate error details (retry-after, message, code)
    - _Requirements: 1.2, 6.4_
  
  - [ ] 13.2 Add error handlers for authentication failures
    - Handle INVALID_TOKEN, EXPIRED_TOKEN, MISSING_TOKEN
    - Send error before closing connection
    - _Requirements: 1.2, 1.4_
  
  - [ ] 13.3 Add error handlers for authorization failures
    - Handle UNAUTHORIZED, NOT_OWNER, NOT_OWNER_OR_MODERATOR
    - Keep connection open for authorization errors
    - _Requirements: 5.5, 7.1, 7.3_
  
  - [ ] 13.4 Add error handlers for pagination failures
    - Handle INVALID_CURSOR, CHANNEL_NOT_FOUND, CONVERSATION_NOT_FOUND
    - Return descriptive error messages
    - _Requirements: 4.3_
  
  - [ ]* 13.5 Write unit tests for error handling
    - Test error message formats
    - Test error codes
    - Test connection close vs keep-alive behavior
    - _Requirements: 1.2, 6.4, 7.1_

- [ ] 14. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property tests validate universal correctness properties with 100+ iterations
- Unit tests validate specific examples and edge cases
- Integration tests verify component interactions
- The implementation builds incrementally: auth → rate limiting → connection management → routing → presence → pagination → mutations → reconnection → integration
