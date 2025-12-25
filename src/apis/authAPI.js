// src/apis/authAPI.js 
import axios from "axios";
import apiRoutes from "../contants/api";


const userAPI = {
  login: (credentials) => axios.post(`${apiRoutes.employees}/login`, credentials),
};

export default userAPI;
