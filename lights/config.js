export const { 
    port = 8000, 
    host = '0.0.0.0',
    iters = 10000,
    repeat = 3
} = argv

export const wsApi = `ws://${host}:${port}/greeting`