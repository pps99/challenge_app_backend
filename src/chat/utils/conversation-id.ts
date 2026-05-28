export function makeConversationId(a: string, b: string): string {
    return [a, b].sort().join('_');
}