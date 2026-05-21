import axios from 'axios';

export const searchBookFromKakao = async (query:string) => {
  const KAKAO_API_KEY = "704cbb07d0d423e22cd58f5d1deaab9c";
  const { data } = await axios.get(
    `https://dapi.kakao.com/v3/search/book?query=${query}`,
    { headers: { Authorization: `KakaoAK ${KAKAO_API_KEY}` } }
  );
  return data.documents;
};