export const BACKSPACE_KEY = "Backspace";
export const ENTER_KEY = "Enter";
export const SHIFT_KEY = "Shift";

export const BASE_GEORGIAN_KEYBOARD_ROWS = [
  ["ქ", "წ", "ე", "რ", "ტ", "ყ", "უ", "ი", "ო", "პ"],
  ["ა", "ს", "დ", "ფ", "გ", "ჰ", "ჯ", "კ", "ლ"],
  ["ზ", "ხ", "ც", "ვ", "ბ", "ნ", "მ", BACKSPACE_KEY]
] as const;

export const QWERTY_TO_GEORGIAN: Record<string, string> = {
  a: "ა",
  b: "ბ",
  c: "ც",
  d: "დ",
  e: "ე",
  f: "ფ",
  g: "გ",
  h: "ჰ",
  i: "ი",
  j: "ჯ",
  k: "კ",
  l: "ლ",
  m: "მ",
  n: "ნ",
  o: "ო",
  p: "პ",
  q: "ქ",
  r: "რ",
  s: "ს",
  t: "ტ",
  u: "უ",
  v: "ვ",
  w: "წ",
  x: "ხ",
  y: "ყ",
  z: "ზ"
};

export const SHIFTED_QWERTY_TO_GEORGIAN: Record<string, string> = {
  C: "ჩ",
  J: "ჟ",
  R: "ღ",
  S: "შ",
  T: "თ",
  W: "ჭ",
  Z: "ძ"
};

export const SHIFTED_GEORGIAN_KEYS: Record<string, string> = {
  ც: "ჩ",
  ჯ: "ჟ",
  რ: "ღ",
  ს: "შ",
  ტ: "თ",
  წ: "ჭ",
  ზ: "ძ"
};

export const GEORGIAN_LETTERS = new Set([
  ...BASE_GEORGIAN_KEYBOARD_ROWS.flat().filter((key) => key.length === 1),
  ...Object.values(SHIFTED_GEORGIAN_KEYS)
]);
