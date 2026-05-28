import { makeConversationId } from "./conversation-id";

describe("makeConversationId", () => {
  it("produces the same ID regardless of argument order", () => {
    const a = "507f1f77bcf86cd799439011";
    const b = "507f1f77bcf86cd799439012";
    expect(makeConversationId(a, b)).toBe(makeConversationId(b, a));
  });

  it("joins sorted IDs with an underscore", () => {
    expect(makeConversationId("b", "a")).toBe("a_b");
  });
});
