import { NextResponse } from 'next/server';
export declare function GET(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    channels: any;
}>>;
export declare function POST(request: Request): Promise<NextResponse<{
    error: any;
}> | NextResponse<{
    channel: any;
}>>;
//# sourceMappingURL=route.d.ts.map