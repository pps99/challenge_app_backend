import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "@nestjs/mongoose";
import { JwtService } from "@nestjs/jwt";
import { ConflictException, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcrypt";
import { AuthService } from "./auth.service";
import { User } from "./schemas/user.schema";

describe("AuthService", () => {
  let service: AuthService;
  let userModel: any;
  let jwtService: { signAsync: jest.Mock };

  beforeEach(async () => {
    userModel = {
      findOne: jest.fn(),
      create: jest.fn(),
    };
    jwtService = { signAsync: jest.fn() };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: getModelToken(User.name), useValue: userModel },
        { provide: JwtService, useValue: jwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe("register", () => {
    it("creates a user with a hashed password", async () => {
      userModel.findOne.mockResolvedValue(null);
      userModel.create.mockResolvedValue({
        _id: "abc123",
        email: "john@test.com",
        username: "john",
      });

      const result = await service.register({
        email: "john@test.com",
        username: "john",
        password: "password123",
      });

      expect(userModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "john@test.com",
          username: "john",
          password: expect.not.stringMatching("password123"),
        }),
      );
      expect(result).toEqual({
        id: "abc123",
        email: "john@test.com",
        username: "john",
      });
    });

    it("throws ConflictException when email or username is taken", async () => {
      userModel.findOne.mockResolvedValue({ _id: "existing" });

      await expect(
        service.register({
          email: "john@test.com",
          username: "john",
          password: "password123",
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe("login", () => {
    it("returns an access token on valid credentials", async () => {
      const hash = await bcrypt.hash("password123", 10);
      userModel.findOne.mockResolvedValue({
        _id: { toString: () => "abc123" },
        email: "john@test.com",
        username: "john",
        password: hash,
      });
      jwtService.signAsync.mockResolvedValue("fake.jwt.token");

      const result = await service.login({
        identifier: "john@test.com",
        password: "password123",
      });

      expect(result).toEqual({ access_token: "fake.jwt.token" });
    });

    it("throws UnauthorizedException when user does not exist", async () => {
      userModel.findOne.mockResolvedValue(null);

      await expect(
        service.login({ identifier: "ghost", password: "pw" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("throws UnauthorizedException when password is wrong", async () => {
      const hash = await bcrypt.hash("correct-password", 10);
      userModel.findOne.mockResolvedValue({
        _id: { toString: () => "abc123" },
        email: "john@test.com",
        username: "john",
        password: hash,
      });

      await expect(
        service.login({
          identifier: "john@test.com",
          password: "wrong-password",
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
