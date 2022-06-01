export default function useSelectedGuild(): [
  null | string,
  (newGuild: null | string) => void
] {
  return [null, () => {}];
}
