import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { UploadService } from './upload.service';
import { AuthGuard } from '@nestjs/passport';
// import { RolesGuard } from '../auth/roles.guard'; // Assuming you have roles
// import { Roles } from '../auth/roles.decorator';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @UseGuards(AuthGuard('jwt')) // Protect endpoint
  // @Roles('SHOP_OWNER') // Uncomment if you have role-based access control
  @Post('presigned-url')
  async getPresignedUrl(
    @Body('filename') filename: string,
    @Body('contentType') contentType: string,
  ) {
    return this.uploadService.getPresignedUrl(filename, contentType);
  }
}
