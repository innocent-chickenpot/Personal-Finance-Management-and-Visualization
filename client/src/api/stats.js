import request from './request'

export const getSummary = params => request.get('/stats/summary', { params })
export const getByCategory = params => request.get('/stats/by-category', { params })
export const getMonthlyTrend = params => request.get('/stats/monthly-trend', { params })
