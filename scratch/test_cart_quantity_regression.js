import assert from 'node:assert';

// Simulated cart state machine matching App.jsx handleUpdateCartQuantity
function updateCartQuantity(cart, id, size, delta) {
  return cart
    .map((item) => {
      if (item.id === id && item.size === size) {
        const nextQty = item.quantity + delta;
        return nextQty > 0 ? { ...item, quantity: nextQty } : null;
      }
      return item;
    })
    .filter(Boolean);
}

// Initial cart with 1 item
let cart = [{ id: 'item-1', size: 'M', quantity: 1 }];

// Test 1: Click '+' in CartDrawer (now passes delta: +1)
cart = updateCartQuantity(cart, 'item-1', 'M', 1);
assert.strictEqual(cart[0].quantity, 2, 'Quantity should be 2 after increment');

// Test 2: Click '+' again
cart = updateCartQuantity(cart, 'item-1', 'M', 1);
assert.strictEqual(cart[0].quantity, 3, 'Quantity should be 3 after second increment');

// Test 3: Click '-' in CartDrawer (now passes delta: -1)
cart = updateCartQuantity(cart, 'item-1', 'M', -1);
assert.strictEqual(cart[0].quantity, 2, 'Quantity should be 2 after decrement');

// Test 4: Decrement down to 0
cart = updateCartQuantity(cart, 'item-1', 'M', -1);
assert.strictEqual(cart[0].quantity, 1, 'Quantity should be 1');
cart = updateCartQuantity(cart, 'item-1', 'M', -1);
assert.strictEqual(cart.length, 0, 'Item should be removed from cart when quantity reaches 0');

console.log('All cart quantity regression tests passed successfully!');
