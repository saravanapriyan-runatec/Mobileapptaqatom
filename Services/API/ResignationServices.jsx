import APIService from "../APIService";
let API_URL = "https://api-dev-mvp.hr-ms.com"



const ResignationService = {
  updateStatus(options) {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/v1/resign/reverse_resign_emp/`,
          method: "POST",
          data: options,
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        }
      );
    });
  },

  getConfig() {
    return new Promise((resolve, reject) => {
      APIService.request(
        {
          url: `${API_URL}/tenant/t1/configuration/`,
          method: "GET",
        },
        (error, data) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(data);
        }
      );
    });
  },
};

export default ResignationService;

