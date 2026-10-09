import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import {RequestCookies} from "next/dist/compiled/@edge-runtime/cookies";
import {API_TOKEN_COOKIE_NAME, INSTANCE_ID_COOKIE_NAME} from "@/hooks/credentials";

export function middleware(request: NextRequest): NextResponse {
    const cookies: RequestCookies = request.cookies;
    const hasCredentials = cookies.has(INSTANCE_ID_COOKIE_NAME) && cookies.has(API_TOKEN_COOKIE_NAME);
    if (!hasCredentials && request.nextUrl.pathname !== '/login') {
        return NextResponse.redirect(new URL('/login', request.url))
    }

    return NextResponse.next();
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico|logos).*)"],
};