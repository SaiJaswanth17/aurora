import { NextResponse } from 'next/server';
export declare function GET(): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    servers: any;
}>>;
export declare function POST(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    server: any;
}>>;
//# sourceMappingURL=route.d.ts.map