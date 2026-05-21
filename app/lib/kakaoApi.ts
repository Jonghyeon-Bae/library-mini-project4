import axios from 'axios';

export const searchBookFromKakao = async (query) => {
  const KAKAO_API_KEY = "멘토님의_API_키를_여기에_넣어주세요";
  const { data } = await axios.get(
    `https://dapi.kakao.com/v3/search/book?query=${query}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } }
  );
  return data.documents;
};