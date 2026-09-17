let currentPath = '';

export function setCurrentRoutePath(path: string): void {
  currentPath = path;
}

export function getCurrentRoutePath(): string {
  return currentPath;
}

export function isCameraRoute(path = currentPath): boolean {
  return path.includes('camera') || path.includes('preview') || path.includes('first-capture');
}
