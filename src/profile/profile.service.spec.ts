import { Test, TestingModule } from '@nestjs/testing';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { Profile } from './schemas/profile.schema';

describe('ProfileService', () => {
  let service: ProfileService;
  let profileModel: any;

  beforeEach(async () => {
    profileModel = {
      findOne: jest.fn(),
      create: jest.fn(),
      findOneAndUpdate: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProfileService,
        { provide: getModelToken(Profile.name), useValue: profileModel },
      ],
    }).compile();

    service = module.get<ProfileService>(ProfileService);
  });

  describe('create', () => {
    it('creates a profile and computes horoscope + zodiac from birthday', async () => {
      profileModel.findOne.mockResolvedValue(null);
      profileModel.create.mockImplementation((doc) => Promise.resolve(doc));

      const result = await service.create('507f1f77bcf86cd799439011', {
        displayName: 'John Doe',
        birthday: '1995-08-28',
      });

      expect(result).toMatchObject({
        displayName: 'John Doe',
        horoscope: 'Virgo',
        zodiac: 'Pig',
      });
    });

    it('throws ConflictException when a profile already exists for the user', async () => {
      profileModel.findOne.mockResolvedValue({ _id: 'existing' });

      await expect(
        service.create('507f1f77bcf86cd799439011', { displayName: 'John' }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findByUserId', () => {
    it('returns the profile when found', async () => {
      profileModel.findOne.mockResolvedValue({ displayName: 'John' });
      const result = await service.findByUserId('507f1f77bcf86cd799439011');
      expect(result).toEqual({ displayName: 'John' });
    });

    it('throws NotFoundException when no profile exists', async () => {
      profileModel.findOne.mockResolvedValue(null);
      await expect(
        service.findByUserId('507f1f77bcf86cd799439011'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates the profile and recomputes horoscope/zodiac if birthday changes', async () => {
      profileModel.findOneAndUpdate.mockResolvedValue({
        displayName: 'John Doe',
        horoscope: 'Virgo',
        zodiac: 'Pig',
      });

      const result = await service.update('507f1f77bcf86cd799439011', {
        birthday: '1995-08-28',
      });

      const setPayload = profileModel.findOneAndUpdate.mock.calls[0][1].$set;
      expect(setPayload.horoscope).toBe('Virgo');
      expect(setPayload.zodiac).toBe('Pig');
      expect(result).toMatchObject({ horoscope: 'Virgo', zodiac: 'Pig' });
    });

    it('throws NotFoundException when the profile does not exist', async () => {
      profileModel.findOneAndUpdate.mockResolvedValue(null);
      await expect(
        service.update('507f1f77bcf86cd799439011', { displayName: 'X' }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});