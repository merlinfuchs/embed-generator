export function colorIntToHex(color: number) {
  return "#" + color.toString(16).padStart(6, "0");
}

export function colorHexToInt(color: string) {
  return parseInt(color.replace("#", ""), 16);
}
