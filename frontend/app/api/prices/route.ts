import { NextRequest, NextResponse } from 'next/server';

const TWELVEDATA_API_KEY = process.env.TWELVEDATA_API_KEY;

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const symbols = searchParams.get('symbols');

  if (!symbols) {
    return NextResponse.json(
      { error: 'Missing symbols parameter' },
      { status: 400 }
    );
  }

  if (!TWELVEDATA_API_KEY) {
    return NextResponse.json(
      { error: 'TwelveData API key not configured' },
      { status: 500 }
    );
  }

  try {
    const response = await fetch(
      `https://api.twelvedata.com/price?symbol=${symbols}&apikey=${TWELVEDATA_API_KEY}`
    );

    if (!response.ok) {
      throw new Error('Failed to fetch prices');
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching prices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch prices' },
      { status: 500 }
    );
  }
}
