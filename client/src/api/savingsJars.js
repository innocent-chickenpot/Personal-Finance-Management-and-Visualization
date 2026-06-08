import request from './request'

export const getSavingsJars = () => request.get('/savings-jars')
export const createSavingsJar = data => request.post('/savings-jars', data)
export const updateSavingsJar = (id, data) => request.put(`/savings-jars/${id}`, data)
export const deleteSavingsJar = id => request.delete(`/savings-jars/${id}`)
export const depositSavingsJar = (id, data) => request.post(`/savings-jars/${id}/deposit`, data)
