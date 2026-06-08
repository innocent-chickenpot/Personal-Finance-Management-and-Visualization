import request from './request'

export const getCategoryMappings = source => request.get('/category-mappings', { params: { source } })
export const saveCategoryMappings = mappings => request.put('/category-mappings', { mappings })
