let lastUniqueId = Date.now();

export function getUniqueId() {
  return lastUniqueId++;
}

export function classNames(...classes: any) {
  return classes.filter(Boolean).join(" ");
}
