import axios from 'axios';

const BASE_URL = import.meta.env.VITE_BASE_API || 'http://localhost:5000';
const API_PREFIX = import.meta.env.VITE_API_PREFIX || 'api';

const getAuthHeader = () => {
  const token = localStorage.getItem('hrms-token');
  return {
    Authorization: `Bearer ${token}`,
  };
};

const hrAnalyticsAPI = {
  getHRAnalytics: () =>
    axios.get(`${BASE_URL}/${API_PREFIX}/hr-analytics/dashboard`, {
      headers: getAuthHeader(),
    }),
};

export default hrAnalyticsAPI;