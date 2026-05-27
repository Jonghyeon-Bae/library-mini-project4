import axios from "axios";

// 알라딘 키워드 검색 함수
export const searchBookFromAladin = async (query: string) => {
  const { data } = await axios.get("/api/aladin", {
    params: { q: query },
  });
  return data.item || []; // 검색된 아이템 배열 반환
};

// 알라딘 ISBN 기반 평점/판매지수 상세 조회 함수
export const lookupBookMetricsFromAladin = async (isbn13: string) => {
  const { data } = await axios.post("/api/aladin", { isbn13 });
  return data; // { isRecommended, customerReviewRank, salesPoint, categoryName } 반환
};
