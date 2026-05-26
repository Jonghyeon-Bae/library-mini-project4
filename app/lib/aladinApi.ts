import axios from "axios";

export const searchBookFromAladin = async (query: string) => {
  const { data } = await axios.get("/api/aladin", {
    params: { q: query },
  });

  return data;
}
/*
import axios from "axios";

export const searchBookFromAladin = async (query: string) => {
  const ALADIN_TTB_KEY = "ttbwgj21801108001";

  const { data } = await axios.get(
    "https://www.aladin.co.kr/ttb/api/ItemSearch.aspx",
    {
      params: {
        ttbkey: ALADIN_TTB_KEY,
        Query: query,
        QueryType: "title",         //keyword  title  author publisher 검색 기준  keyword : 제목 + 저자 설명 title 제목만 author 저자 검색 Publisher 출판사
        MaxResults: 5,
        start: 1,                      //검색 시작위지 --> 페이지가 아닌 offset
        SearchTarget: "Book",           
        output: "js",
        Version: "20131101",
      },
    }
  );

  return data.item;
};

*/