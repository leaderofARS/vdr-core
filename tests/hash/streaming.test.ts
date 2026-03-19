import { hashDocument, hashFileStream, hashFileWithProgress } from '../../src/hash'
import fs from 'fs'
import path from 'path'
import os from 'os'

describe('Streaming Hash Methods', () => {
  let tmpFilePath: string
  let testBuffer: Buffer

  beforeAll(() => {
    // Create a 1MB file for testing
    tmpFilePath = path.join(os.tmpdir(), `vdr_test_${Date.now()}.bin`)
    testBuffer = Buffer.alloc(1024 * 1024)
    // Fill it with some pseudo-random data
    for (let i = 0; i < testBuffer.length; i++) {
      testBuffer[i] = i % 256
    }
    fs.writeFileSync(tmpFilePath, testBuffer)
  })

  afterAll(() => {
    if (fs.existsSync(tmpFilePath)) {
      fs.unlinkSync(tmpFilePath)
    }
  })

  it('hashFileStream matches hashDocument exactly', async () => {
    const expectedHash = await hashDocument(testBuffer)
    const streamHash = await hashFileStream(tmpFilePath)
    expect(streamHash).toBe(expectedHash)
  })

  it('hashFileWithProgress matches hashDocument and reports progress', async () => {
    const expectedHash = await hashDocument(testBuffer)
    let finalProcessed = 0
    let finalTotal = 0
    let callbackCount = 0
    
    const streamHash = await hashFileWithProgress(tmpFilePath, (processed, total) => {
      finalProcessed = processed
      finalTotal = total
      callbackCount++
    })
    
    expect(streamHash).toBe(expectedHash)
    expect(finalProcessed).toBe(1024 * 1024)
    expect(finalTotal).toBe(1024 * 1024)
    expect(callbackCount).toBeGreaterThan(0)
  })
})
