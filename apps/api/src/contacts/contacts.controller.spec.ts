import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ContactsController } from './contacts.controller';
import { ContactsService } from './contacts.service';

describe('ContactsController', () => {
  let controller: ContactsController;
  let contactsService: ContactsService;

  const mockVcfResult = {
    vcf: 'BEGIN:VCARD\r\nVERSION:4.0\r\nFN:John Doe\r\nN:Doe;John;;;\r\nEND:VCARD\r\n',
    filename: 'John Doe.vcf',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ContactsController],
      providers: [
        {
          provide: ContactsService,
          useValue: {
            generateVCard: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<ContactsController>(ContactsController);
    contactsService = module.get<ContactsService>(ContactsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getVCard', () => {
    it('should return vCard content with correct headers', async () => {
      (contactsService.generateVCard as jest.Mock).mockResolvedValue(mockVcfResult);

      const mockRes = {
        set: jest.fn(),
        send: jest.fn(),
      };

      await controller.getVCard('john-doe', mockRes as any);

      expect(contactsService.generateVCard).toHaveBeenCalledWith('john-doe');
      expect(mockRes.set).toHaveBeenCalledWith({
        'Content-Type': 'text/vcard',
        'Content-Disposition': 'attachment; filename="John Doe.vcf"',
      });
      expect(mockRes.send).toHaveBeenCalledWith(mockVcfResult.vcf);
    });

    it('should propagate NotFoundException for non-existent slug', async () => {
      (contactsService.generateVCard as jest.Mock).mockRejectedValue(
        new NotFoundException('Card not found'),
      );

      const mockRes = {
        set: jest.fn(),
        send: jest.fn(),
      };

      await expect(controller.getVCard('nonexistent', mockRes as any)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
