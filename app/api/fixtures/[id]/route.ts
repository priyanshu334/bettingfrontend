// app/api/fixtures/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  req: NextRequest,
  context: { params: any } // 👈 key fix: don't destructure here, and use `any` or let it infer
) {
  const fixtureId = context.params.id;
  const apiToken = process.env.SPORTMONKS_API_KEY;

  if (!apiToken) {
    return NextResponse.json({ error: "API token is missing" }, { status: 500 });
  }

  const url = `https://cricket.sportmonks.com/api/v2.0/fixtures/${fixtureId}?api_token=${apiToken}&include=localteam,visitorteam,venue,lineup,batting,bowling,runs`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to fetch fixture data from SportMonks" },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error fetching fixture:", err);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
