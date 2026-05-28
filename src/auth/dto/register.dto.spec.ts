import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { PASSWORD_MIN_LENGTH, RegisterDto } from "./register.dto";

describe("RegisterDto", () => {
  function buildDto(password: string) {
    return plainToInstance(RegisterDto, {
      email: "john@test.com",
      username: "john",
      password,
    });
  }

  it("rejects passwords shorter than the minimum length", async () => {
    const dto = buildDto("1234");

    const errors = await validate(dto);

    expect(errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          property: "password",
          constraints: expect.objectContaining({
            minLength: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
          }),
        }),
      ]),
    );
  });

  it("accepts passwords that meet the minimum length", async () => {
    const dto = buildDto("12345678");

    const errors = await validate(dto);

    expect(errors).toHaveLength(0);
  });
});
