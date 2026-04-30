import APIService, { getUrlForHeaders } from "./APIService";
import { API_URL, APP_URL } from "../src/utils/config";

export const fetchDomain = (data) => {
  return new Promise(async (resolve, reject) => {
    const hostname = await getUrlForHeaders(data.email || data.domain);
    APIService.fetch(
      `${API_URL}/tenant/t1/domain/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "hostname": hostname
        },
        body: JSON.stringify(data),
      },
      (error, response) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(response);
      }
    );
  });
};