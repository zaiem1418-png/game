// كتالوج المتجر — باقات الألماس والكوينز القابلة للشراء بالفيزا.
// السعر بالدولار (USD). يمكن تعديل الأسعار/الكميات هنا بسهولة.

export const DIAMOND_PACKAGES = [
  { id: "d1", diamonds: 100,   bonus: 0,    price: 0.99,  popular: false },
  { id: "d2", diamonds: 500,   bonus: 25,   price: 4.99,  popular: false },
  { id: "d3", diamonds: 1200,  bonus: 120,  price: 9.99,  popular: true  },
  { id: "d4", diamonds: 2500,  bonus: 375,  price: 19.99, popular: false },
  { id: "d5", diamonds: 6500,  bonus: 1300, price: 49.99, popular: false },
  { id: "d6", diamonds: 14000, bonus: 4000, price: 99.99, popular: false },
];

export const COIN_PACKAGES = [
  { id: "c1", coins: 10000,   bonus: 0,      price: 0.99,  popular: false },
  { id: "c2", coins: 60000,   bonus: 5000,   price: 4.99,  popular: false },
  { id: "c3", coins: 150000,  bonus: 20000,  price: 9.99,  popular: true  },
  { id: "c4", coins: 350000,  bonus: 60000,  price: 19.99, popular: false },
  { id: "c5", coins: 1000000, bonus: 250000, price: 49.99, popular: false },
];

// يجد الباقة حسب النوع والمعرّف، ويُرجع ما يُضاف للرصيد فعلياً (الكمية + المكافأة).
export function resolvePackage(kind, id) {
  if (kind === "diamonds") {
    const p = DIAMOND_PACKAGES.find((x) => x.id === id);
    if (!p) return null;
    return { kind, price: p.price, credit: { diamonds: p.diamonds + p.bonus, coins: 0 } };
  }
  if (kind === "coins") {
    const p = COIN_PACKAGES.find((x) => x.id === id);
    if (!p) return null;
    return { kind, price: p.price, credit: { coins: p.coins + p.bonus, diamonds: 0 } };
  }
  return null;
}

export const storeCatalog = {
  diamonds: DIAMOND_PACKAGES,
  coins: COIN_PACKAGES,
};
