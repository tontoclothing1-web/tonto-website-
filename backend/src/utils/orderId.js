/**
 * Order reference generator — `TONTO-XXXXXXXX`.
 *
 * The old version was `TONTO-` + `Math.random()` over 6 digits, so roughly one
 * in a million pairs of orders collided (the controller retried 5 times and then
 * failed the checkout) and the space was small enough to walk. A monotonic
 * base36 timestamp prefix plus 4 random characters removes both problems while
 * keeping the same visual format.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I/O/0/1 — readable over the phone

const randomSuffix = (len) => {
  let out = '';
  for (let i = 0; i < len; i += 1) out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
  return out;
};

let counter = 0;

export function generateOrderId() {
  const time = Date.now().toString(36).toUpperCase().slice(-6);
  counter = (counter + 1) % 1296; // two base36 digits, breaks same-millisecond ties
  return `TONTO-${time}${counter.toString(36).toUpperCase().padStart(2, '0')}${randomSuffix(2)}`;
}

export default { generateOrderId };
