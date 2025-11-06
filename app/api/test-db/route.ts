import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    // Test environment
    const envCheck = {
      hasDatabase: !!process.env.DATABASE_URL,
      hasDirect: !!process.env.DIRECT_URL,
      hasPT: !!process.env.PARTYTYME_MERCHANT,
      ptValue: process.env.PARTYTYME_MERCHANT,
      dbProvider: process.env.DB_PROVIDER
    };
    
    // Test database connection
    const count = await prisma.track.count();
    
    return NextResponse.json({ 
      status: 'success',
      env: envCheck,
      dbConnected: true,
      trackCount: count
    });
  } catch (error: any) {
    return NextResponse.json({ 
      status: 'error',
      error: error.message,
      env: {
        hasDatabase: !!process.env.DATABASE_URL,
        dbProvider: process.env.DB_PROVIDER
      }
    }, { status: 500 });
  }
}