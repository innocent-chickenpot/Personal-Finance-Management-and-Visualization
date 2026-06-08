import request from './request'

export const getTransactions = params => request.get('/transactions', { params })
export const createTransaction = data => request.post('/transactions', data)
export const updateTransaction = (id, data) => request.put(`/transactions/${id}`, data)
export const deleteTransaction = id => request.delete(`/transactions/${id}`)
export const parseBill = formData => request.post('/transactions/parse-bill', formData, {
  headers: { 'Content-Type': 'multipart/form-data' }
})
export const importParsed = records => request.post('/transactions/import-parsed', { records })
