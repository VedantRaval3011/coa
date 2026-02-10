import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { key } = await request.json();
    const adminKey = process.env.ADMIN_PROVISION_KEY;

    if (!adminKey) {
      return NextResponse.json(
        { message: 'Server misconfiguration: ADMIN_PROVISION_KEY not set' },
        { status: 500 }
      );
    }

    if (key === adminKey) {
      // Create the response
      const response = NextResponse.json(
        { success: true, message: 'Device authorized' },
        { status: 200 }
      );

      // Set the cookie
      // Max age: 10 years (effectively permanent for the device's lifetime)
      const oneYear = 365 * 24 * 60 * 60;
      const tenYears = oneYear * 10;
      
      (await cookies()).set({
        name: 'device_authorized',
        value: 'true',
        httpOnly: true, // Not accessible via client-side JS
        secure: process.env.NODE_ENV === 'production', // Only send over HTTPS in production
        sameSite: 'strict',
        maxAge: tenYears,
        path: '/',
      });

      return response;
    }

    return NextResponse.json(
      { success: false, message: 'Invalid Admin Key' },
      { status: 401 }
    );
  } catch (error) {
    console.error('Provisioning error:', error);
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    );
  }
}
