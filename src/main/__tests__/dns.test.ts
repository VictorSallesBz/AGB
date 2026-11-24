import { describe, it, expect } from "vitest"

describe("DNS ping parser logic", () => {
  it("parses Portuguese Windows ping output with tempo=6ms", () => {
    const stdout = `
Disparando 1.1.1.1 com 32 bytes de dados:
Resposta de 1.1.1.1: bytes=32 tempo=6ms TTL=57

Estatísticas do Ping para 1.1.1.1:
    Pacotes: Enviados = 1, Recebidos = 1, Perdidos = 0 (0% de perda),
Aproximar um número redondo de vezes em milissegundos:
    Mínimo = 6ms, Máximo = 6ms, Média = 6ms
`
    const timeMatch = stdout.match(/(?:time|tempo)[=<]\s*(\d+)\s*ms/i)
    expect(timeMatch).not.toBeNull()
    expect(parseInt(timeMatch![1], 10)).toBe(6)
  })

  it("parses English Windows ping output with time=12ms and Average = 12ms", () => {
    const stdout = `
Pinging 8.8.8.8 with 32 bytes of data:
Reply from 8.8.8.8: bytes=32 time=12ms TTL=116

Ping statistics for 8.8.8.8:
    Packets: Sent = 1, Received = 1, Lost = 0 (0% loss),
Approximate round trip times in milli-seconds:
    Minimum = 12ms, Maximum = 12ms, Average = 12ms
`
    const timeMatch = stdout.match(/(?:time|tempo)[=<]\s*(\d+)\s*ms/i)
    expect(timeMatch).not.toBeNull()
    expect(parseInt(timeMatch![1], 10)).toBe(12)
  })

  it("detects sub-millisecond pings tempo<1ms", () => {
    const stdout = `Resposta de 127.0.0.1: bytes=32 tempo<1ms TTL=128`
    expect(/time<1ms|tempo<1ms/i.test(stdout)).toBe(true)
  })

  it("detects timeout strings in Portuguese and English", () => {
    const ptTimeout = `Esgotado o tempo limite do pedido.`
    const enTimeout = `Request timed out.`
    const ptCheck = ptTimeout.includes("tempo limite") || ptTimeout.includes("Esgotado")
    const enCheck = enTimeout.includes("timed out")
    expect(ptCheck).toBe(true)
    expect(enCheck).toBe(true)
  })
})
