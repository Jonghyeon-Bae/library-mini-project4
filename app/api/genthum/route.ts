import { NextResponse } from 'next/server';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

// 추가_최승헌_7-1 OpenAI DALL-E 이미지 생성 API 라우트 추가
export async function POST(request: Request) {
  try {
    const { prompt, bookId } = await request.json();

    if (!prompt || !bookId) {
      return NextResponse.json({ error: 'Prompt and bookId are required' }, { status: 400 });
    }

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENAI_API_KEY가 환경 변수(.env)에 설정되어 있지 않습니다.' }, { status: 500 });
    }

    // 1. OpenAI DALL-E 2 API 호출 (gpt image-1)
    const response = await axios.post(
      'https://api.openai.com/v1/images/generations',
      {
        model: 'dall-e-2',
        prompt: prompt,
        n: 1,
        size: '1024x1024', // DALL-E 2 지원 사이즈
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      }
    );

    const tempImageUrl = response.data?.data?.[0]?.url;
    if (!tempImageUrl) {
      return NextResponse.json({ error: 'OpenAI로부터 이미지를 생성하지 못했습니다.' }, { status: 500 });
    }

    // 2. 생성된 임시 이미지 다운로드 (OpenAI URL은 1시간 뒤 만료되므로 로컬에 영구 저장)
    const imageResponse = await axios.get(tempImageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(imageResponse.data);

    // public/covers 폴더 생성
    const publicCoversDir = path.join(process.cwd(), 'public', 'covers');
    if (!fs.existsSync(publicCoversDir)) {
      fs.mkdirSync(publicCoversDir, { recursive: true });
    }

    // 도서 고유 ID를 파일명으로 사용하여 저장 (기존 이미지 덮어쓰기하여 파일 누적 방지)
    const fileName = `${bookId}.png`;
    const filePath = path.join(publicCoversDir, fileName);
    fs.writeFileSync(filePath, buffer);

    // 브라우저 캐싱 방지를 위해 타임스탬프를 쿼리스트링으로 추가하여 반환
    const savedUrl = `/covers/${fileName}?t=${Date.now()}`;

    return NextResponse.json({ url: savedUrl });
  } catch (error: unknown) {
    let errorMessage = '알 수 없는 오류가 발생했습니다.';
    if (axios.isAxiosError(error)) {
      console.error('OpenAI 이미지 생성 오류:', error.response?.data || error.message);
      errorMessage = error.response?.data?.error?.message || error.message;
    } else if (error instanceof Error) {
      console.error('이미지 처리 오류:', error.message);
      errorMessage = error.message;
    }
    return NextResponse.json(
      { error: `AI 이미지 생성 실패: ${errorMessage}` },
      { status: 500 }
    );
  }
}
