import axios from "axios";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q");

    //const ALADIN_TTB_KEY = process.env.ALADIN_TTB_KEY;
        
    const ALADIN_TTB_KEY = "ttbwgj21801108001";
    try {
        const res = await axios.get(
        "https://www.aladin.co.kr/ttb/api/ItemSearch.aspx",
        {
        params: {
            ttbkey: ALADIN_TTB_KEY,
            Query: query,
            QueryType: "Title",
            MaxResults: 0,
            start: 1,
            SearchTarget: "Book",
            output: "js",
        },
        }
    );

    return NextResponse.json(res.data);
    } catch (err) {
    return NextResponse.json(
        { message: "Aladin API error" },
        { status: 500 }
    );
    }
}