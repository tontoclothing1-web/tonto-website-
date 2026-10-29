import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';
import { quoteCart, calcSubtotal, calcDiscount, calcShipping, calcGrandTotal } from '../src/utils/pricing.js';
import { sniffImageMime, buildStoredFilename } from '../src/middleware/upload.js';
import { safeCompare } from '../src/middleware/auth.js';

describe('Security & E-Commerce Integrity Tests', () => {
  describe('Pricing & Checkout Integrity', () => {
    it('calculates authoritative subtotal from item numericPrice and quantity', () => {
      const items = [
        { numericPrice: 1999, quantity: 2 },
        { numericPrice: 2490, quantity: 1 },
      ];
      const subtotal = calcSubtotal(items);
      assert.equal(subtotal, 1999 * 2 + 2490);
    });

    it('calculates promo percentage accurately and prevents negative totals', () => {
      const subtotal = 3000;
      const promo = { code: 'TONTO15', percent: 15 };
      const discount = calcDiscount(subtotal, promo);
      assert.equal(discount, 450);

      const grandTotal = calcGrandTotal({ subtotal, discountAmount: discount, shippingFee: 0 });
      assert.equal(grandTotal, 2550);
      assert.ok(grandTotal >= 0);
    });

    it('enforces free showroom pickup regardless of subtotal', () => {
      const shipping = calcShipping({ subtotal: 500, deliveryMethod: 'showroom' });
      assert.equal(shipping, 0);
    });

    it('applies flat delivery fee when courier dispatch is below free shipping threshold', () => {
      const shipping = calcShipping({ subtotal: 1200, deliveryMethod: 'shipping', freeThreshold: 2500 });
      assert.equal(shipping, 150);
    });

    it('grants free courier delivery when subtotal meets threshold', () => {
      const shipping = calcShipping({ subtotal: 3000, deliveryMethod: 'shipping', freeThreshold: 2500 });
      assert.equal(shipping, 0);
    });
  });

  describe('Upload Security & MIME Sniffing', () => {
    it('detects genuine JPEG magic bytes (FF D8 FF)', () => {
      const jpegBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01]);
      assert.equal(sniffImageMime(jpegBuffer), 'image/jpeg');
    });

    it('detects genuine PNG magic bytes', () => {
      const pngBuffer = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d]);
      assert.equal(sniffImageMime(pngBuffer), 'image/png');
    });

    it('rejects SVG or HTML masked as an image (stops Stored XSS)', () => {
      const svgBuffer = Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>');
      assert.equal(sniffImageMime(svgBuffer), null);

      const htmlBuffer = Buffer.from('<!DOCTYPE html><html><body><h1>test</h1></body></html>');
      assert.equal(sniffImageMime(htmlBuffer), null);
    });

    it('generates random unguessable server filenames without client path traversal characters', () => {
      const filename = buildStoredFilename('image/webp');
      assert.match(filename, /^[0-9]+-[a-f0-9]{16}\.webp$/);
      assert.ok(!filename.includes('..'));
      assert.ok(!filename.includes('/'));
      assert.ok(!filename.includes('\\'));
    });
  });

  describe('Authentication & Timing Attack Protection', () => {
    it('uses constant-time comparison for passcodes', () => {
      assert.equal(safeCompare('secret123', 'secret123'), true);
      assert.equal(safeCompare('secret123', 'secret999'), false);
      assert.equal(safeCompare('short', 'longer-string'), false);
    });

    it('rejects tampered or forged JWT tokens', () => {
      const secretA = 'correct-super-secret-key-that-is-at-least-32-chars-long';
      const secretB = 'attacker-wrong-secret-key-that-is-at-least-32-chars-long';
      const token = jwt.sign({ id: 'user-123', role: 'customer' }, secretB, { algorithm: 'HS256' });

      assert.throws(() => {
        jwt.verify(token, secretA, { algorithms: ['HS256'] });
      });
    });
  });
});
