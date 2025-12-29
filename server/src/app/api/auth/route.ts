import { NextResponse } from 'next/server';

// 빌드 에러 방지용 임시 핸들러
export async function GET() {
  return NextResponse.json({ message: "Auth route is working" });
}
