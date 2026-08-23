export function tabIndexForKey(key: string, currentIndex: number, tabCount: number): number | null {
  if (tabCount <= 0 || currentIndex < 0 || currentIndex >= tabCount) return null;
  if (key === "Home") return 0;
  if (key === "End") return tabCount - 1;
  if (key === "ArrowRight" || key === "ArrowDown") return (currentIndex + 1) % tabCount;
  if (key === "ArrowLeft" || key === "ArrowUp") return (currentIndex - 1 + tabCount) % tabCount;
  return null;
}
