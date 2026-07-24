import { describe, it, expect } from 'vitest'
import crypto from 'crypto'
import { getPackedWeight, TARE_WEIGHT } from '../src/lib/weight'

// 1. Safe Cookie Parsing Test
describe('Base64 Token Cookie Parsing Logic', () => {
  function parseTokenFromCookie(cookieHeader: string): string {
    const cookies: Record<string, string> = {};
    for (const pair of cookieHeader.split(";")) {
      const idx = pair.indexOf("=");
      if (idx === -1) continue;
      const key = pair.substring(0, idx).trim();
      const value = pair.substring(idx + 1).trim();
      cookies[key] = value;
    }
    return cookies["admin-token"] ? decodeURIComponent(cookies["admin-token"]) : "";
  }

  it('correctly extracts token with single equal sign', () => {
    const cookie = "admin-token=token_value_abc"
    expect(parseTokenFromCookie(cookie)).toBe("token_value_abc")
  })

  it('preserves base64 equal padding characters at the end of the token', () => {
    const cookie = "admin-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.padding_test=="
    expect(parseTokenFromCookie(cookie)).toBe("eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.padding_test==")
  })

  it('handles multiple cookies correctly', () => {
    const cookie = "other-cookie=hello; admin-token=token_with_padding==; another-cookie=world"
    expect(parseTokenFromCookie(cookie)).toBe("token_with_padding==")
  })
})

// 2. Razorpay Signature Verification Logic
describe('Razorpay Signature Verification', () => {
  const WEBHOOK_SECRET = 'secure_test_secret_123'

  function verifySignature(bodyText: string, signature: string): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', WEBHOOK_SECRET)
      .update(bodyText)
      .digest('hex')
    return expectedSignature === signature
  }

  it('verifies valid signature successfully', () => {
    const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123' } } } })
    const validSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex')
    
    expect(verifySignature(payload, validSig)).toBe(true)
  })

  it('rejects tampered signature', () => {
    const payload = JSON.stringify({ event: 'payment.captured', payload: { payment: { entity: { id: 'pay_123' } } } })
    const validSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(payload).digest('hex')
    const tamperedSig = validSig.replace(/a/g, 'b') // modify characters
    
    expect(verifySignature(payload, tamperedSig)).toBe(false)
  })
})

// 3. Packaging weight parsing logic tests
describe('Delhivery weight & Tare utilities', () => {
  it('correctly maps direct variant labels to weights', () => {
    expect(getPackedWeight('100ml')).toBe(160)
    expect(getPackedWeight('500g')).toBe(580)
    expect(getPackedWeight('1kg')).toBe(1150)
  })

  it('extracts weight from non-standard variant labels', () => {
    expect(getPackedWeight('250ml Bottle')).toBe(320)
    expect(getPackedWeight('50g jar')).toBe(100)
  })

  it('falls back to default weight for unrecognized variant labels', () => {
    expect(getPackedWeight('Premium Pack')).toBe(250)
  })

  it('correctly includes tare weight', () => {
    expect(TARE_WEIGHT).toBe(50)
  })
})
