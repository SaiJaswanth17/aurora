# Implementation Plan: Critical Fixes and Security

## Overview

This implementation plan addresses critical configuration errors, security vulnerabilities, and build issues in the Aurora chat application. All tasks involve configuration file modifications - no application logic changes are required. The fixes are organized to address security issues first, followed by configuration corrections, and finally validation.

## Tasks

- [ ] 1. Fix TypeScript configuration error
  - Update tsconfig.json to change "lib" from ["ES2023"] to ["ES2022"]
  - Verify the change resolves the TypeScript configuration validation error
  - _Requirements: 1.1, 1.2_

- [ ]* 1.1 Write property test for TypeScript lib target validation
  - **Property 1: Valid TypeScript Library Target**
  - **Validates: Requirements 1.1**

- [ ] 2. Secure credential management - Update .gitignore
  - Add explicit patterns for all credential files to .gitignore
  - Add patterns: apps/server/.env, apps/web/.env, apps/web/.env.local
  - Add negation patterns to keep example files: !.env.example, !apps/server/.env.example, !apps/web/.env.example
  - _Requirements: 2.1, 2.5, 7.4_

- [ ]* 2.1 Write property test for gitignore credential file patterns
  - **Property 10: Gitignore Rules Exist**
  - **Validates: Requirements 7.4**

- [ ] 3. Remove tracked credential files from Git
  - Run: git rm --cached .env apps/server/.env
  - Commit the removal to stop tracking these files
  - Verify with git status that files are no longer tracked
  - _Requirements: 2.1, 2.3_

- [ ]* 3.1 Write property test for credential detection in tracked files
  - **Property 5: Tracked Files Contain No Real Credentials**
  - **Validates: Requirements 2.3**

- [ ]* 3.2 Write property test for credential file gitignore matching
  - **Property 3: Credential Files Are Gitignored**
  - **Validates: Requirements 2.1, 2.5**

- [ ] 4. Create comprehensive .env.example files
  - [ ] 4.1 Update root .env.example with all required variables and documentation comments
    - Include: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
    - Include: WS_PORT=3002, WS_HOST, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_WS_URL=ws://localhost:3002
    - Include: JWT_SECRET, MAX_FILE_SIZE, UPLOAD_CHUNK_SIZE
    - Add comments explaining each variable's purpose
    - Mark sensitive variables (KEY, SECRET) with security warnings
    - _Requirements: 2.2, 2.4, 4.1, 4.2, 4.3, 4.5, 7.2_
  
  - [ ] 4.2 Create apps/server/.env.example with server-specific variables
    - Include all Supabase credentials with placeholders
    - Include WS_PORT=3002, WS_HOST, JWT_SECRET
    - Include file upload configuration
    - Add documentation comments
    - _Requirements: 2.2, 2.4, 4.1, 4.2, 4.3, 4.5_
  
  - [ ] 4.3 Create apps/web/.env.example with web-specific variables
    - Include public Supabase credentials with placeholders
    - Include NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_WS_URL=ws://localhost:3002
    - Add documentation comments
    - _Requirements: 2.2, 2.4_

- [ ]* 4.4 Write property test for required variables in example files
  - **Property 4: Example Files Contain Required Variables**
  - **Validates: Requirements 2.2, 2.4, 4.1, 4.2, 4.3, 6.5**

- [ ]* 4.5 Write property test for environment variable documentation
  - **Property 9: Environment Variables Have Documentation**
  - **Validates: Requirements 4.5, 7.2**

- [ ] 5. Standardize port configuration to 3002
  - [ ] 5.1 Update root .env.example to set WS_PORT=3002 and NEXT_PUBLIC_WS_URL=ws://localhost:3002
    - Change WS_PORT from 3001 to 3002
    - Change NEXT_PUBLIC_WS_URL from ws://localhost:3001 to ws://localhost:3002
    - _Requirements: 3.1, 3.3_
  
  - [ ] 5.2 Update apps/server/.env.example to set WS_PORT=3002
    - Change WS_PORT from 3001 to 3002
    - _Requirements: 3.1, 3.3_
  
  - [ ] 5.3 Verify next.config.js proxy destination is http://localhost:3002
    - Confirm the rewrite destination already uses port 3002
    - _Requirements: 3.2, 3.3_

- [ ]* 5.4 Write property test for port configuration consistency
  - **Property 6: Port Configuration Consistency**
  - **Validates: Requirements 3.1, 3.2, 3.3**

- [ ] 6. Enable build error checking in Next.js
  - Update apps/web/next.config.js to set eslint.ignoreDuringBuilds to false
  - Update apps/web/next.config.js to set typescript.ignoreBuildErrors to false
  - _Requirements: 5.1, 5.2_

- [ ]* 6.1 Write unit test for build error checking configuration
  - Test that next.config.js has eslint.ignoreDuringBuilds === false
  - Test that next.config.js has typescript.ignoreBuildErrors === false
  - **Property 7: Build Error Checking Enabled**
  - **Validates: Requirements 5.1, 5.2**

- [ ] 7. Checkpoint - Verify all configuration changes
  - Run TypeScript compiler to verify no configuration errors
  - Check git status to confirm credential files are not tracked
  - Verify all .env.example files exist with correct content
  - Ensure all tests pass, ask the user if questions arise

- [ ]* 7.1 Write property test for build completion
  - **Property 2: Build Completes Without Configuration Errors**
  - **Validates: Requirements 1.2, 6.1**

- [ ]* 7.2 Write integration test for build output
  - **Property 8: Build Produces Executable Bundles**
  - **Validates: Requirements 6.4**

- [ ] 8. Create setup documentation
  - Add README section or SETUP.md explaining how to configure environment variables
  - Document the process: copy .env.example to .env, fill in real credentials
  - Warn about not committing .env files with real credentials
  - _Requirements: 7.3_

- [ ] 9. Final checkpoint - Complete validation
  - Run full build: npm run build
  - Verify build completes without TypeScript or ESLint errors
  - Start WebSocket server and verify it binds to port 3002
  - Start Next.js app and verify WebSocket connection works
  - Ensure all tests pass, ask the user if questions arise

## Notes

- Tasks marked with `*` are optional and can be skipped for faster implementation
- Security tasks (2-3) should be completed first to prevent credential exposure
- Port standardization (task 5) must be completed before testing WebSocket connections
- All configuration changes are non-breaking and can be applied incrementally
- Property tests validate configuration correctness across all files
- Integration tests (7.1, 7.2) verify the build system works end-to-end
