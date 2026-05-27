// 추가_종현 AI 표지 생성 스타일 프리셋 공유 모듈
// AiThumbnailGenerator와 ManualAddBookModal에서 공통으로 사용

export interface StylePreset {
  id: string;
  name: string;
  promptPart: string;
}

export const STYLE_PRESETS: StylePreset[] = [
  {
    id: 'modern_typography',
    name: '모던 타이포그래피 (자기계발/에세이)',
    // 설명: 깔끔한 배경에 굵고 임팩트 있는 글씨체 위주. 최근 한국 서점가의 베스트셀러 트렌드.
    promptPart: 'modern minimalist book cover design, bold sans-serif typography centered, solid pastel or monochrome background, clean layout, high-end editorial style, no clutter, professional graphic design'
  },
  {
    id: 'literary_fiction',
    name: '문학적 감성 (소설/문학)',
    // 설명: 추상적인 일러스트나 은유적인 이미지, 여백의 미를 강조. 톤다운된 색상 사용.
    promptPart: 'literary fiction book cover, abstract symbolic illustration, muted earth tones, textured paper background, elegant serif font, artistic composition, sophisticated and contemplative vibe, soft lighting'
  },
  {
    id: 'thriller_noir',
    name: '스릴러/미스터리 (범죄/추리)',
    // 설명: 강렬한 대비, 그림자, 붉은색/검정색 계열. 긴장감을 주는 시각 요소.
    promptPart: 'psychological thriller book cover, dark noir atmosphere, high contrast shadows, silhouette of a figure, red and black color scheme, gritty texture, suspenseful mood, cinematic lighting, mysterious elements'
  },
  {
    id: 'fantasy_epic',
    name: '판타지/무협 (대서사시)',
    // 설명: 디테일한 캐릭터나 배경 묘사, 마법진, 웅장한 스케일. 디지털 페인팅 느낌.
    promptPart: 'epic fantasy book cover art, highly detailed digital painting, magical glowing artifacts, dramatic sky, heroic character pose, intricate details, vibrant colors, cinematic composition, unreal engine render style'
  },
  {
    id: 'romance_webtoon',
    name: '로맨스/웹툰 스타일 (청춘/연애)',
    // 설명: 부드러운 색감, 인물 중심의 일러스트, 꽃이나 빛나는 효과. 웹툰 커버 같은 감성.
    promptPart: 'romantic novel book cover, soft webtoon art style, cute couple illustration or single attractive character, pastel pink and blue gradients, floral elements, dreamy atmosphere, sparkling lights, emotional and sweet vibe'
  },
  {
    id: 'business_infographic',
    name: '비즈니스/경제 (실용서)',
    // 설명: 신뢰감을 주는 네이비/화이트 계열, 그래프나 아이콘 등 기하학적 요소 활용.
    promptPart: 'professional business book cover, clean infographic elements, geometric shapes, navy blue and white color palette, trustworthy and authoritative look, modern corporate style, sharp vectors, minimal icons'
  },
  {
    id: 'retro_vintage',
    name: '레트로/빈티지 (취미/문화)',
    // 설명: 70-90년대 감성, 낡은 질감, 레터링 폰트. 힙한 감성을 원할 때 유용.
    promptPart: 'vintage retro book cover design, 1970s aesthetic, grainy texture, warm orange and brown tones, retro typography, collage art style, nostalgic mood, analog feel, worn paper effect'
  }
];
