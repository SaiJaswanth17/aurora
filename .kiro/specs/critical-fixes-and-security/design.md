# Design Document: Critical Fixes and Security

## Overview

This design addresses five critical categories of issues in the Aurora chat application:

1. **TypeScript Configuration Error**: Invalid ES2023 library target causing build failures
2. **Security Vulnerabilities**: Exposed credentials in version control
3. **Port Configuration Mismatch**: Inconsistent port settings preventing WebSocket connections
4. **Missing Environment Variables**: Incomplete environment configuration
5. **Suppressed Build Errors**: Hidden TypeScript and ESLint errors

The solution involves configuration file updates, credential management improvements, and build system fixes. No application logic changes are required - all fixes are configuration-based.

## Architecture

### Configuration Layer Changes

The fixes operate at the configuration layer and affect three main areas:

1. **Build Configuration**
   - TypeScript compiler settings (tsconfig.json)
   - Next.js build settings (next.config.js)

2. **Environment Configuration**
   - Environment variable files (.env, .env.example)
   - Git ignore rules (.gitignore)

3. **Runtime Configuration**
   - WebSocket server port binding
   - Next.js proxy configuration

### Dependency Flow

```
tsconfig.json (ES2022) → TypeScript Compiler → Valid Build
                                                      ↓
.env.example (templates) → Developer Setup → .env (local, gitignored)
                                                      ↓
.env (WS_PORT=3002) → WebSocket Server (port 3002)
                                                      ↓
next.config.js (proxy to 3002) → Next.js App → WebSocket Connection
```

## Components and Interfaces

### 1. TypeScript Configuration (tsconfig.json)

**Current State:**
```json
{
  "compilerOptions": {
    "lib": ["ES2023"],  // INVALID - causes build error
    "target": "es2022"
  }
}
```

**Fixed State:**
```json
{
  "compilerOptions": {
    "lib": ["ES2022"],  // VALID - matches target
    "target": "es2022"
  }
}
```

**Rationale:** ES2023 is not a valid TypeScript library target. ES2022 provides all necessary features for the application while being a valid, stable target.

### 2. Git Ignore Configuration (.gitignore)

**Current State:**
```
.env
*.local
```

**Issues:**
- Root .env is gitignored but already tracked (Git continues tracking)
- apps/server/.env is NOT gitignored and contains real credentials

**Fixed State:**
```
# Environment files with credentials
.env
.env.local
*.env.local
apps/server/.env
apps/web/.env
apps/web/.env.local

# Keep example files
!.env.example
!apps/server/.env.example
!apps/web/.env.example
```

**Additional Actions Required:**
- Remove tracked credential files from Git history: `git rm --cached .env apps/server/.env`
- Commit the removal to stop tracking these files

### 3. Environment Configuration Files

**Structure:**

```
Root Level:
  .env.example          (template with placeholders)
  .env                  (local, gitignored, not in repo)

apps/server/:
  .env.example          (template with placeholders)
  .env                  (local, gitignored, not in repo)

apps/web/:
  .env.example          (template with placeholders)
  .env.local            (local, gitignored, not in repo)
```

**Environment Variable Schema:**

```typescript
interface EnvironmentVariables {
  // Supabase Configuration
  NEXT_PUBLIC_SUPABASE_URL: string;           // Public Supabase project URL
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string;      // Public anonymous key
  SUPABASE_SERVICE_ROLE_KEY: string;          // SENSITIVE: Service role key
  
  // WebSocket Server
  WS_PORT: number;                             // Port 3002 (standardized)
  WS_HOST: string;                             // localhost or 0.0.0.0
  
  // Next.js App
  NEXT_PUBLIC_APP_URL: string;                 // http://localhost:3000
  NEXT_PUBLIC_WS_URL: string;                  // ws://localhost:3002
  
  // Authentication
  JWT_SECRET: string;                          // SENSITIVE: Min 32 chars
  
  // File Upload
  MAX_FILE_SIZE: number;                       // Bytes
  UPLOAD_CHUNK_SIZE: number;                   // Bytes
}
```

**Port Standardization:**
- All references to port 3001 → 3002
- WS_PORT=3002
- NEXT_PUBLIC_WS_URL=ws://localhost:3002
- next.config.js proxy destination: http://localhost:3002

### 4. Next.js Configuration (next.config.js)

**Current State:**
```javascript
const nextConfig = {
  eslint: { ignoreDuringBuilds: true },      // PROBLEM: Hides errors
  typescript: { ignoreBuildErrors: true },    // PROBLEM: Hides errors
  async rewrites() {
    return [{
      source: '/api/socket',
      destination: 'http://localhost:3002/',  // Port mismatch with .env
    }];
  },
};
```

**Fixed State:**
```javascript
const nextConfig = {
  eslint: { ignoreDuringBuilds: false },     // Enable error checking
  typescript: { ignoreBuildErrors: false },   // Enable error checking
  async rewrites() {
    return [{
      source: '/api/socket',
      destination: 'http://localhost:3002/',  // Matches WS_PORT
    }];
  },
};
```

**Rationale:** 
- Enabling error checking catches issues during development
- Port 3002 matches the standardized WebSocket server port
- Build failures are preferable to runtime errors

### 5. Example File Templates

**Root .env.example:**
```bash
# Supabase Configuration
# Get these from your Supabase project settings
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# WebSocket Server Configuration
WS_PORT=3002
WS_HOST=localhost

# Next.js App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_WS_URL=ws://localhost:3002

# JWT Secret for WebSocket Authentication
# Generate a secure random string (min 32 characters)
JWT_SECRET=your_secure_jwt_secret_min_32_chars

# File Upload Configuration
MAX_FILE_SIZE=5368709120
UPLOAD_CHUNK_SIZE=5242880
```

**apps/server/.env.example:**
```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# WebSocket Server
WS_PORT=3002
WS_HOST=localhost

# JWT Secret
JWT_SECRET=your_secure_jwt_secret_min_32_chars

# File Upload
MAX_FILE_SIZE=5368709120
UPLOAD_CHUNK_SIZE=5242880
```

## Data Models

No data model changes are required. This specification only modifies configuration files.


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Valid TypeScript Library Target

*For any* tsconfig.json file in the project, the "lib" compiler option values should only contain entries from the TypeScript-allowed library targets (ES5, ES6, ES2015-ES2022, ESNext, DOM, etc.), and should not contain invalid values like "ES2023".

**Validates: Requirements 1.1**

### Property 2: Build Completes Without Configuration Errors

*For any* TypeScript compilation of the project, when the compiler processes the configuration files, the build should complete with exit code 0 and produce no TypeScript configuration validation errors.

**Validates: Requirements 1.2, 6.1**

### Property 3: Credential Files Are Gitignored

*For any* file in the project that contains real credentials (matching patterns for Supabase keys, JWT secrets, or service role keys), that file path should match at least one pattern in the .gitignore file.

**Validates: Requirements 2.1, 2.5**

### Property 4: Example Files Contain Required Variables

*For any* .env.example file in the project, it should contain all required environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY, WS_PORT, WS_HOST, NEXT_PUBLIC_APP_URL, NEXT_PUBLIC_WS_URL, JWT_SECRET, MAX_FILE_SIZE, UPLOAD_CHUNK_SIZE) with placeholder values that do not match real credential patterns.

**Validates: Requirements 2.2, 2.4, 4.1, 4.2, 4.3, 6.5**

### Property 5: Tracked Files Contain No Real Credentials

*For any* file tracked by Git in the repository, the file content should not contain strings matching real Supabase key patterns (eyJ... JWT tokens), real Supabase URLs with project identifiers, or real JWT secrets.

**Validates: Requirements 2.3**

### Property 6: Port Configuration Consistency

*For all* configuration files that specify WebSocket port values (WS_PORT in .env files, NEXT_PUBLIC_WS_URL in .env files, and rewrite destination in next.config.js), the port number should be 3002 consistently across all locations.

**Validates: Requirements 3.1, 3.2, 3.3**

### Property 7: Build Error Checking Enabled

*For the* next.config.js file, both the eslint.ignoreDuringBuilds and typescript.ignoreBuildErrors configuration options should be set to false (or omitted, as false is the default).

**Validates: Requirements 5.1, 5.2**

### Property 8: Build Produces Executable Bundles

*For any* build execution of the project, when the build completes successfully, the output directories (.next/ for Next.js, dist/ for server) should exist and contain the compiled JavaScript bundle files.

**Validates: Requirements 6.4**

### Property 9: Environment Variables Have Documentation

*For any* required environment variable in .env.example files, there should be an associated comment within 2 lines above the variable that explains its purpose, and sensitive variables (containing "KEY" or "SECRET" in the name) should have comments indicating they are sensitive.

**Validates: Requirements 4.5, 7.2**

### Property 10: Gitignore Rules Exist

*For the* .gitignore file, it should contain patterns that match .env files in the root and apps subdirectories (specifically: .env, .env.local, *.env.local, apps/server/.env, apps/web/.env, apps/web/.env.local).

**Validates: Requirements 7.4**

## Error Handling

### Configuration Validation Errors

**TypeScript Configuration Errors:**
- Invalid lib target → Build fails with clear error message indicating the invalid value
- Missing required compiler options → TypeScript uses defaults, may cause unexpected behavior

**Environment Configuration Errors:**
- Missing required environment variables → Server fails to start with error indicating which variable is missing
- Invalid port values → Server fails to bind with error indicating port conflict or invalid value
- Malformed credential values → Supabase client initialization fails with authentication error

**Git Configuration Errors:**
- Missing .gitignore rules → Credentials may be accidentally committed (detected by pre-commit hooks if configured)
- Already-tracked credential files → Must be manually removed with `git rm --cached`

### Error Prevention

1. **Pre-commit Validation:** Consider adding pre-commit hooks to scan for credential patterns
2. **Environment Validation:** Add startup validation in server code to check for required environment variables
3. **Build Validation:** Enable strict TypeScript and ESLint checking to catch errors early

## Testing Strategy

### Dual Testing Approach

This specification requires both unit tests and property-based tests to ensure comprehensive coverage:

- **Unit tests**: Verify specific configuration values, file existence, and edge cases
- **Property tests**: Verify universal properties across all configuration files and build scenarios

### Unit Testing Focus

Unit tests should focus on:
- Specific configuration file values (e.g., "tsconfig.json lib is ES2022")
- File existence checks (e.g., ".env.example files exist in expected locations")
- Specific gitignore patterns (e.g., ".gitignore contains '.env' pattern")
- Edge cases (e.g., "empty .env.example file", "malformed JSON in tsconfig")

### Property-Based Testing Focus

Property tests should focus on:
- Configuration consistency across multiple files (Property 6: port consistency)
- Credential detection across any file content (Property 3, 5: credential patterns)
- Required variable presence across any .env.example file (Property 4)
- Build success across different valid configurations (Property 2, 8)

### Property-Based Testing Configuration

**Library Selection:** Use `fast-check` for JavaScript/TypeScript property-based testing

**Test Configuration:**
- Minimum 100 iterations per property test
- Each test must reference its design document property
- Tag format: `Feature: critical-fixes-and-security, Property {number}: {property_text}`

**Example Property Test Structure:**

```typescript
import fc from 'fast-check';

// Feature: critical-fixes-and-security, Property 6: Port Configuration Consistency
test('all WebSocket port configurations use port 3002', () => {
  fc.assert(
    fc.property(
      fc.constantFrom('root', 'server', 'web'),
      (location) => {
        const port = extractPortFromConfig(location);
        return port === 3002;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Testing Priorities

**Critical (Must Test):**
1. Property 3: Credential files are gitignored
2. Property 5: Tracked files contain no real credentials
3. Property 6: Port configuration consistency
4. Property 7: Build error checking enabled

**Important (Should Test):**
5. Property 1: Valid TypeScript library target
6. Property 4: Example files contain required variables
7. Property 10: Gitignore rules exist

**Nice to Have (Optional):**
8. Property 2: Build completes without errors (integration test)
9. Property 8: Build produces bundles (integration test)
10. Property 9: Environment variables have documentation

### Test Execution Strategy

1. **Configuration Validation Tests**: Run before any build or deployment
2. **Credential Scanning Tests**: Run as part of CI/CD pipeline and pre-commit hooks
3. **Build Tests**: Run as part of standard build process
4. **Integration Tests**: Run after configuration changes to verify runtime behavior

### Manual Verification Steps

After applying fixes, manually verify:
1. `git status` shows no tracked .env files with credentials
2. `npm run build` completes without TypeScript/ESLint errors
3. WebSocket server starts on port 3002
4. Next.js app connects to WebSocket server successfully
5. All example files have placeholder values, not real credentials
