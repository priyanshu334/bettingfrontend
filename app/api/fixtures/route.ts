// If you're using the App Router
import { NextResponse } from "next/server";

export async function GET() {
  const apiToken = process.env.SPORTMONKS_API_KEY; // keep your token safe
  const url = `https://cricket.sportmonks.com/api/v2.0/fixtures?filter[season_id]=1689&filter[starts_between]=2025-04-07,2025-05-31&sort=starting_at&api_token=7ydZeBOwpdTkfuxh81RcwQluHlL2V1sAeNUn6XWlkd5o6lsIWmKFcp3XZ01n&include=localteam,visitorteam,venue
`;

  try {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
      },
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error("Error in proxy:", err);
    return NextResponse.json({ error: "Failed to fetch data" }, { status: 500 });
  }
}
