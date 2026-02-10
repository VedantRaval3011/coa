import { NextResponse } from 'next/server';
import { verifyMachine, getMachineInfo } from '@/lib/machineId';

export async function GET() {
  try {
    const verification = verifyMachine();
    const machineInfo = getMachineInfo();

    return NextResponse.json({
      ...verification,
      machineInfo,
    });
  } catch (error) {
    console.error('Machine verification error:', error);
    return NextResponse.json(
      {
        authorized: false,
        message: 'Error during machine verification',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
