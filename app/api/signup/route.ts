// app/api/signup/route.ts
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const SIGNUPS_FILE = path.join(process.cwd(), 'signups.json');

// Helper to read signups from file
async function getSignups() {
  try {
    const data = await fs.readFile(SIGNUPS_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return empty array
    return [];
  }
}

// Helper to save signups to file
async function saveSignups(signups: any[]) {
  await fs.writeFile(SIGNUPS_FILE, JSON.stringify(signups, null, 2));
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phone, timestamp } = body;

    // Validate required fields
    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    // Get existing signups
    const signups = await getSignups();

    // Check if email already exists
    const existingSignup = signups.find((s: any) => s.email === email);
    if (existingSignup) {
      // Update existing signup
      Object.assign(existingSignup, {
        name,
        phone: phone || '',
        lastUpdated: timestamp || new Date().toISOString()
      });
    } else {
      // Add new signup
      signups.push({
        id: Date.now().toString(),
        name,
        email,
        phone: phone || '',
        signedUpAt: timestamp || new Date().toISOString(),
        lastUpdated: timestamp || new Date().toISOString()
      });
    }

    // Save to file
    await saveSignups(signups);

    return NextResponse.json({ 
      success: true, 
      message: 'Signup successful!',
      count: signups.length 
    });
  } catch (error) {
    console.error('Signup POST error:', error);
    return NextResponse.json(
      { error: 'Failed to process signup' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format');

    // Get all signups
    const signups = await getSignups();

    // Return JSON count
    if (format === 'json' || !format) {
      return NextResponse.json({
        count: signups.length,
        signups: signups
      });
    }

    // Return CSV for download
    if (format === 'csv') {
      // Create CSV content
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Signed Up At', 'Last Updated'];
      const csvRows = [headers.join(',')];

      signups.forEach((signup: any) => {
        const row = [
          signup.id || '',
          `"${(signup.name || '').replace(/"/g, '""')}"`,
          `"${(signup.email || '').replace(/"/g, '""')}"`,
          `"${(signup.phone || '').replace(/"/g, '""')}"`,
          signup.signedUpAt || '',
          signup.lastUpdated || ''
        ];
        csvRows.push(row.join(','));
      });

      const csvContent = csvRows.join('\n');

      // Return CSV with proper headers
      return new NextResponse(csvContent, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="signups_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    return NextResponse.json({ 
      error: 'Invalid format parameter. Use ?format=csv or ?format=json' 
    }, { status: 400 });

  } catch (error) {
    console.error('Signup GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve signups' },
      { status: 500 }
    );
  }
}
