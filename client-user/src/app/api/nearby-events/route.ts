import { NextRequest, NextResponse } from 'next/server';
import { getNearbyEvents } from '@/services/ticketUserService';
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const latitude = searchParams.get('latitude');
  const longitude = searchParams.get('longitude');
  const location = searchParams.get('location');
  const radius = searchParams.get('radius');

  try {
    const response = await getNearbyEvents({
      latitude: latitude ? Number(latitude) : undefined,
      longitude: longitude ? Number(longitude) : undefined,
      location: location || undefined,
      radius: radius ? Number(radius) : 30,
    });
    return NextResponse.json(response);
  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}
