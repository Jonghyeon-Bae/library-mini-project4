// app/api/recommend/route.ts
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export async function POST(req: Request) {
  try {
    //API 키가 없으면 JSON 에러를 프론트로 보냄
    if (!process.env.OPENAI_API_KEY) {
      console.error("환경변수 에러: OPENAI_API_KEY가 설정되지 않았습니다.");
      return NextResponse.json({ error: 'API 키 누락' }, { status: 500 });
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { keywords } = await req.json();

    if (!keywords || keywords.length === 0) {
      return NextResponse.json({ recommendations: [] });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      response_format: { type: "json_object" }, 
      messages: [
        {
          role: "system",
          content: `당신은 탁월한 도서 추천 AI 큐레이터입니다.
            제공된 검색어 리스트는 사용자가 가장 최근에 검색한 순서대로 나열되어 있습니다. 

            이 검색어들의 맥락과 흐름을 분석하여, 사용자가 깊게 흥미를 가질 만한 새롭고 구체적인 연관 도서 검색어 3개를 추천해 주세요.

            [제약 조건]
            1. 사용자가 이미 검색한 단어는 절대 추천하지 마세요.
            2. '소설', '컴퓨터' 같은 지나치게 포괄적인 단어 대신, 구체적인 도서명이나 세부 기술/주제를 추천하세요.
            3. 응답은 반드시 아래 JSON 형식을 엄격하게 지켜주세요:
            {
              "recommendations": ["추천어1", "추천어2", "추천어3"]
            }`
        },
        {
          role: "user",
          content: `최근 검색어 리스트: ${keywords.join(', ')}`
        }
      ],
      temperature: 0.6,
    });

    const resultText = response.choices[0].message.content;
    const resultJson = JSON.parse(resultText || '{"recommendations": []}');

    return NextResponse.json(resultJson);

  } catch (error) {
    console.error('OpenAI API Error 상세 로그:', error);
    return NextResponse.json({ error: '추천을 가져오는데 실패했습니다.' }, { status: 500 });
  }
}